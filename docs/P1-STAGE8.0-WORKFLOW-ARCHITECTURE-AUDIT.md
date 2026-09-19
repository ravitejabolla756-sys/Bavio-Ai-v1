# BAVIO P1 Stage 8.0 — Workflow Architecture + Runtime Readiness Audit

Date: 2026-09-09
Canonical repository: `C:\Startup\bavio-backend`
Frontend: `C:\Startup\bavio-backend\frontend`
Backend: `C:\Startup\bavio-backend\backend`

## Executive decision

**STAGE 8.1 WORKFLOW RUNTIME: BLOCKED — the repository has verified individual Actions but no persisted workflow definition/version/execution/step model, no deterministic workflow trigger contract, no workflow-to-ActionExecution linkage, and no crash-safe workflow recovery protocol.**

This is an architecture/readiness decision, not a rejection of the Stage 7 action substrate. The existing canonical actions are suitable building blocks after a small, explicit orchestration layer is designed and verified. No workflow runtime, migration, UI, remote database mutation, commit, push, deployment, or tunnel was created in Stage 8.0.

## 1. Existing workflow/orchestration code found

The repository search covered backend and frontend terms for workflow, automation, sequence, pipeline, orchestration, trigger, condition, job, queue, task, planner, follow-up, post-call, action chains, and related lifecycle terms.

Observed implementation categories:

| Area | Classification | Finding |
| --- | --- | --- |
| `backend/services/bavioLeadAction.js` | C — single-action logic | Canonical transactional `bavio.lead.create`; creates one ActionExecution, Lead, and ExecutionEvidence, with tenant-scoped idempotency. |
| `backend/services/bavioWebhookAction.js` | C — single-action logic | Canonical one-attempt `bavio.webhook.deliver`; validates tenant-owned configuration, performs HTTPS delivery, and persists delivery/evidence. |
| `backend/services/webhookService.js` | C / partial orchestration | `dispatchWebhook` fans out subscribed webhooks for an event. It is event delivery, not a workflow runtime: no workflow identity, ordered steps, workflow state, or durable resume state. |
| `backend/services/outcomeExtractionService.js` | B — partial orchestration | Persists call answers/outcome, may create a Lead, and asynchronously dispatches `lead.created` and `call.completed` webhooks. These are independent side effects without workflow-level state or ordered step semantics. |
| `backend/services/campaignWorker.js` | B — partial job orchestration | Polls running campaigns, dispatches outbound calls, updates contact attempts, and marks campaigns complete. It is campaign processing, not reusable deterministic Action orchestration; it has no WorkflowExecution model. |
| `backend/voice/sessions/VoiceWorkerSession.js` and Twilio handlers | B / C | Voice/call lifecycle processing and direct legacy Lead inserts. They do not create workflow executions and several paths bypass canonical `createBavioLead`. |
| `frontend/src/components/landing/ActionTraceWorkflow.tsx` | E — frontend-only concept | Animated marketing visualization with CRM/calendar/email/SMS-style claims; not a runtime or verified product contract. |
| `frontend/src/app/product/page.tsx`, industry workflow components, changelog, developer examples | E / D — frontend/demo concepts | Workflow language and examples exist in marketing/demo surfaces, but they do not prove a runtime. Some examples mention unverified integrations and must not be used as Stage 8 contracts. |
| `backend/sql` | F — not implemented | No `workflow_definitions`, `workflow_steps`, `workflow_executions`, or `workflow_step_executions` tables were found. |

Conclusion: no category A real workflow runtime exists.

## 2. Current action invocation architecture

### `bavio.lead.create`

The verified canonical caller is `handleSaveLeadTool` in `backend/controllers/twilioCallController.js`, reached through `backend/routes/twilioRoutes.js` at `POST /save-lead` behind strict Twilio signature validation. The controller derives a stable key from the trusted Twilio `CallSid` and tool-call ID, resolves trusted tenant context, and calls `createBavioLead`.

`createBavioLead`:

1. Requires a trusted `businessId` and validated idempotency key.
2. Opens a database transaction.
3. Locks/reads an existing tenant + action + key record.
4. Inserts `action_executions` as `started`.
5. Inserts the Lead with the trusted tenant ID.
6. Inserts matching `execution_evidence` with the persisted Lead ID.
7. Updates the ActionExecution to `succeeded` and commits.
8. Rolls back Lead/evidence work on failure and records a safe failed execution outside the rolled-back transaction.

The action returns a narrow result containing `executionId`, `leadId`, status, and typed evidence. It does not return an unrestricted variable bag.

There are also legacy/direct Lead inserts in `twilioCallController.js`, `VoiceWorkerSession.js`, and `outcomeExtractionService.js`. Those paths can create Leads without the canonical Stage 7 ActionExecution/Evidence chain. They must not silently become workflow step callers; the first workflow must use the canonical service only, and any trigger path must be explicitly selected and normalized.

### `bavio.webhook.deliver`

The canonical service is `executeBavioWebhook` in `backend/services/bavioWebhookAction.js`. Existing `webhookService.dispatchWebhook` invokes it for subscribed event notifications with a random invocation ID. The v1 webhook controller creates/list/deletes tenant-owned configurations; it does not execute arbitrary workflow steps.

The verified service:

1. Requires `businessId` and `webhookConfigurationId`.
2. Selects the configuration by both ID and tenant, and checks active status/subscription.
3. Creates one `action_executions` row with the invocation idempotency key.
4. Resolves the encrypted tenant-owned secret only after ownership validation.
5. Sends one signed HTTPS request with SSRF, redirect, timeout, and signature protections.
6. Persists the delivery record and external evidence, including HTTP status.
7. Finalizes the ActionExecution as succeeded or failed.

The service accepts explicit `conversationId` and `leadId` linkage fields, but those are currently action-level references, not workflow-step references. The webhook input is an explicit event type plus JSON object; there is no safe typed workflow output mapping yet.

## 3. Workflow domain model recommendation

The smallest safe future model separates immutable definitions from executions and keeps Actions as the source of factual evidence.

### 3.1 `WorkflowDefinition`

Conceptual fields:

| Field | Rule |
| --- | --- |
| `id` | UUID primary key. |
| `business_id` | Required tenant scope; foreign key to `businesses`. |
| `name` | Human-readable name; not execution identity. |
| `status` | Minimal `active` / `disabled`; do not add speculative lifecycle states. |
| `version` | Monotonically increasing integer for definition revisions. |
| `trigger_type` | Explicit internal trigger identifier, not free-form model text. |
| `created_at`, `updated_at` | Audit timestamps. |

Definition identity and version must be unique within a tenant. A definition must not store secrets or arbitrary executable expressions.

### 3.2 `WorkflowStepDefinition`

Conceptual fields:

| Field | Rule |
| --- | --- |
| `id` | UUID primary key. |
| `business_id` | Required tenant scope, even with a parent foreign key, for defense in depth. |
| `workflow_definition_id` | Parent definition. |
| `position` | Positive sequential position; unique per definition version. |
| `action_type` | Allowlisted verified type, initially only the two Stage 7 actions. |
| `configuration` | Typed JSON configuration validated by action-specific code; webhook uses `webhook_configuration_id`, never a secret or raw unrestricted URL. |

A versioned definition should own an immutable step set. Editing creates a new version rather than mutating a definition used by a run.

### 3.3 `WorkflowExecution`

Conceptual fields:

| Field | Rule |
| --- | --- |
| `id` | UUID workflow run identity. |
| `business_id` | Required tenant scope. |
| `workflow_definition_id` | Parent definition. |
| `workflow_version` | Immutable snapshot of the selected definition version. |
| `source_type`, `source_id` | Trusted invocation source; no model-invented source IDs. |
| `conversation_id` | Optional tenant-owned relationship. |
| `status` | `pending`, `running`, `succeeded`, `failed`; `cancelled` is deferred because cancellation does not exist. |
| `idempotency_key` | Trusted logical invocation key. |
| `started_at`, `completed_at` | Lifecycle timestamps. |
| `failure_reason` | Safe normalized failure code/message, not secrets or raw payloads. |

Unique identity: `(business_id, workflow_definition_id, idempotency_key)`. Historical runs retain `workflow_version` even after a definition changes.

### 3.4 `WorkflowStepExecution`

Conceptual fields:

| Field | Rule |
| --- | --- |
| `id` | UUID primary key. |
| `business_id` | Required tenant scope. |
| `workflow_execution_id` | Parent run. |
| `workflow_step_definition_id` | Immutable selected step. |
| `position` | Snapshotted position for audit/read convenience. |
| `action_execution_id` | Nullable until canonical action creation; foreign key to actual ActionExecution. |
| `status` | `pending`, `running`, `succeeded`, `failed`, `skipped`. |
| `started_at`, `completed_at` | Step lifecycle. |
| `failure_reason` | Safe normalized step failure. |

Unique identity should include `(workflow_execution_id, workflow_step_definition_id)` so recovery cannot create a second logical step execution.

## 4. Versioning and immutability

Definitions and runs are separate. A workflow run pins one integer version at start. Step definitions for that version are copied or made immutable through a database constraint and application rule. A later edit creates version `N+1`; it cannot change the step set observed by a historical or running execution.

The smallest acceptable strategy is immutable version rows, not Git-like branching. A workflow execution must never re-read a mutable “current” definition halfway through a run.

## 5. First workflow definition

The only proposed Stage 8.1 workflow is `Customer opportunity workflow`:

1. `bavio.lead.create`
2. `bavio.webhook.deliver`

No calendar, CRM, SMS, WhatsApp, email, payments, conditions, branches, loops, delays, schedules, approvals, or marketplace capabilities are part of this design.

## 6. Step input/output contract

The orchestrator must use typed action adapters rather than arbitrary template expressions.

`bavio.lead.create` output:

```text
{ actionExecutionId, leadId }
```

The `leadId` is the only workflow-readable business output initially. Evidence remains in `ExecutionEvidence`; raw ActionExecution rows are not exposed as arbitrary variables.

`bavio.webhook.deliver` input should be:

```text
{ webhookConfigurationId, eventType, data: { leadId } }
```

The mapping from Step 1 to Step 2 must be explicit and typed: `data.leadId = step1.leadId`. Do not introduce `{{ step1.output.anything }}` or a general expression evaluator in Stage 8.1. The webhook configuration ID must be tenant-owned and checked again at execution time.

Webhook output is a narrow delivery result such as:

```text
{ actionExecutionId, deliveryId, httpStatus }
```

The external evidence row remains the factual source for HTTP status and delivery identity.

## 7. Execution semantics

### Sequential policy

Strict sequential execution only:

1. Create the WorkflowExecution as `pending`, then atomically claim it as `running`.
2. Start Step 1 and invoke the canonical lead service.
3. Start Step 2 only after Step 1 returns a persisted successful ActionExecution/evidence result.
4. Never run later steps in parallel.

### Fail-fast policy

Any step failure marks the workflow `failed`; later steps remain `skipped` or `pending` according to the implemented state transition, but an unstarted step must not be marked failed. No automatic retry of either mutating action is allowed in the first runtime.

### Partial effects

If Create Lead succeeds and Webhook fails:

- Step 1 is `succeeded` and retains its Lead evidence.
- Step 2 is `failed` and retains HTTP/error evidence where available.
- Workflow is `failed`.
- The persisted Lead is not deleted or rolled back.

### Compensation

No compensating transaction is implemented or implied. Lead deletion, external reversal, and webhook undo remain future capabilities requiring explicit product and security design.

## 8. Idempotency and recovery requirements

### Workflow idempotency

The trusted invocation contract must provide an event/invocation ID. The unique logical run is:

```text
business_id + workflow_definition_id + workflow_idempotency_key
```

Do not derive it from names, phone numbers, email, transcript text, or rounded timestamps. A duplicate request returns or resumes the existing run according to its durable status; it must not create a second run.

### Step idempotency

Each step derives a stable action key from the immutable run and step identity, for example:

```text
workflow:<workflowExecutionId>:step:<workflowStepDefinitionId>
```

The adapter passes that key to the canonical action service. The action service remains the authority for ActionExecution uniqueness; the workflow layer does not create duplicate action rows or duplicate evidence.

### Crash after Step 1

Recovery must read the WorkflowStepExecution and its linked ActionExecution before invoking anything. If Step 1 is already successful, it must not call Create Lead again; it should advance to Step 2. If a step is `running` with a linked ActionExecution, recovery must inspect the ActionExecution/evidence and use the canonical idempotency key rather than blindly restarting.

The current Stage 7 services are not by themselves sufficient for this protocol: a webhook duplicate can observe a `started` ActionExecution, and there is no workflow recovery state that distinguishes “network not attempted” from “external delivery succeeded before finalization.” Stage 8.1 must define conservative reconciliation before authorization.

### Distributed finalization

If a webhook succeeds externally but database finalization fails, the orchestrator must not resend automatically. It must locate the existing ActionExecution and delivery/evidence record by tenant + action idempotency identity and reconcile the known state. If no durable evidence proves delivery, the result must remain uncertain/blocked for an explicit operator/recovery policy; it must not silently claim success or resend a mutating delivery.

## 9. ActionExecution linkage and evidence

The required factual chain is:

```text
WorkflowExecution
  -> WorkflowStepExecution
    -> ActionExecution
      -> ExecutionEvidence
```

Workflow tables must store foreign-key references and normalized status only. They must not copy Lead IDs, HTTP statuses, or invented evidence into a parallel evidence system. Workflow UI, when later authorized, should join/read the Stage 7 chain.

## 10. Trigger audit and recommendation

No trustworthy generic workflow trigger currently exists. `call.completed` and `lead.created` are used as webhook event labels and are dispatched asynchronously, but there is no durable internal event/outbox contract that guarantees one deterministic workflow invocation, trusted event identity, tenant scope, and replay semantics.

Transcript/LLM inference such as “high intent detected” is not a permitted trigger. Marketing language and demo flows are not triggers.

Recommended first trigger for Stage 8.1: an explicit internal invocation from a deterministic, authenticated application event adapter that supplies a trusted invocation ID, tenant ID, conversation ID where applicable, and the pinned workflow definition. Do not expose a generic public `POST /workflows/:id/run` or a frontend Run button yet.

If the team later chooses conversation completion, it must first define and persist a deterministic event identity and delivery/outbox guarantee. The current fire-and-forget webhook dispatch is insufficient as that contract.

## 11. Conditions and branching boundary

Stage 8.1 must not implement conditions, branches, loops, parallel execution, scheduling, delays, approvals, or a general workflow expression language. The first runtime is a two-step linear executor with an allowlisted action adapter registry.

## 12. Parameter and security model

- Action types are allowlisted server-side; the client/model cannot select arbitrary services.
- Workflow step configuration is validated by action-specific schemas.
- Webhook steps store only `webhook_configuration_id`; they never store raw secrets or a secret-bearing payload.
- At execution time, the selected webhook must be looked up by `(business_id, webhook_configuration_id, active)` and rejected before secret resolution if ownership fails.
- Source IDs, conversation IDs, lead IDs, and invocation IDs must be derived from trusted authenticated/event context, not accepted as tenant selectors from model payloads.
- No arbitrary URL, arbitrary action type, arbitrary webhook ID, or raw expression evaluator is permitted.
- Safe error codes/messages must avoid credentials, secrets, customer payloads, or encryption material.

## 13. Tenant isolation and authorization

Every proposed workflow table must carry `business_id`, use tenant-scoped foreign keys/unique indexes, and be queried with explicit `business_id` predicates in backend services. Tenant A must not read, execute, or reference Tenant B definitions, runs, steps, actions, leads, conversations, or webhook configurations.

The verification bootstrap enables RLS on the Stage 7 tables but defines no client policies; the Stage 7 report explicitly treats backend owner access as trusted and does not claim positive tenant RLS reads. This is acceptable only for the current backend-owner access envelope, not as proof that a future exposed workflow API is safe.

For Stage 8.1, document and test both layers:

1. Database: RLS enabled on any exposed workflow tables, appropriate tenant policies, no broad `TO authenticated`-only policy, and no unsafe `SECURITY DEFINER` shortcut.
2. Application: authenticated session/API-key resolution, explicit tenant predicates, ownership checks on definition/version/step/configuration relationships, and fail-closed missing/ambiguous identity.

The workflow executor must never use a first-business fallback or accept a tenant ID from workflow parameters.

## 14. Proposed database migration design

No migration was created or executed in Stage 8.0. When Stage 8.1 is authorized, add one migration after the existing Stage 7 migrations (`028`, `029`, `030`) and before any future workflow read/UI work. It should create only:

- `workflow_definitions`
- `workflow_step_definitions` or `workflow_steps`
- `workflow_executions`
- `workflow_step_executions`

The migration must use UUID IDs and the canonical fresh UUID `businesses` schema, add tenant-first indexes, unique workflow/step idempotency constraints, foreign keys to actual Stage 7 tables, and RLS/policies consistent with the approved access model. It must not assume legacy integer tenant IDs. Migration design must be reviewed before execution against `bavio-verification`; production remains off limits.

## 15. Invocation/API recommendation

No public workflow execution endpoint should be exposed in Stage 8.0 or the initial Stage 8.1 runtime. The first invocation should be an internal service boundary with a typed command, for example an internal `startCustomerOpportunityWorkflow` adapter, protected by trusted application context and a required invocation ID.

If an HTTP boundary becomes necessary later, it must be authenticated, permission-checked, tenant-scoped, idempotent, rate-limited, and incapable of selecting another tenant’s definition/configuration. It must not be an unauthenticated generic run endpoint.

## 16. Observability

Structured logs should include only operational identifiers:

```text
workflowExecutionId
workflowDefinitionId
workflowVersion
businessId
stepDefinitionId / position
actionExecutionId
status
duration
```

Do not log transcript/customer payloads unnecessarily, webhook secrets, encryption keys, credentials, or raw signed payloads. Log state transitions and failure codes so recovery can reconstruct the chain without duplicating mutations.

## 17. Evidence and outcome semantics

Workflow evidence is derived, never invented:

```text
01 Create lead
   Succeeded
   Evidence: persisted Lead ID

02 Send webhook
   Succeeded or Failed
   Evidence: persisted delivery ID / HTTP status

Workflow
   Succeeded or Failed
   Outcome: summary of the verified step outcomes
```

Allowed outcome language includes “Lead created in Bavio” and “Webhook accepted by configured endpoint.” It must not claim CRM synchronization, onboarding, appointment booking, or conversion without independently verified actions.

No workflow metrics, success percentages, ROI, or analytics are part of this stage.

## 18. Security risk register

| Risk | Current status | Required Stage 8.1 control |
| --- | --- | --- |
| Arbitrary action invocation | No workflow API exists | Allowlisted adapter registry and server-side action type validation. |
| Arbitrary webhook ID injection | Stage 7 service checks tenant + ID | Repeat ownership check inside workflow adapter at execution time. |
| Cross-tenant definition/step access | No workflow tables/runtime | Tenant column, explicit predicates, RLS, ownership tests. |
| Definition mutation during run | Not applicable yet | Immutable version pinning. |
| Replay/duplicate runs | Stage 7 action idempotency exists | Workflow-level unique idempotency identity. |
| Duplicate step runs | Not implemented | Unique WorkflowStepExecution and derived action key. |
| Unsafe retry | Stage 7 webhook is one-attempt | No automatic retry in first workflow; explicit uncertain-state policy. |
| Secret leakage | Stage 7 API boundary passes | Never persist/return secrets in workflow config or logs. |
| Forged source IDs | Existing action callers use trusted context in verified path | Typed internal trigger context; reject model-supplied tenant/source selectors. |
| Unauthorized invocation | No workflow endpoint | Internal-only first trigger; auth, permission, rate, and tenant checks later. |
| Crash after external side effect | Not solved at workflow level | Reconcile ActionExecution/evidence before any resend. |

## 19. Stage 8.1 test matrix

The future smallest runtime must pass these tests in the isolated `bavio-verification` project before any production consideration:

| Test | Expected result |
| --- | --- |
| Workflow success | Lead step succeeds, webhook step succeeds, one workflow run succeeds, both step rows reference actual ActionExecutions/evidence. |
| Step 1 failure | Lead fails, webhook is not invoked, workflow fails, Step 2 is skipped/pending rather than failed. |
| Step 2 failure | Lead remains persisted and succeeded; webhook fails with evidence; workflow fails. |
| Duplicate workflow invocation | Same tenant/definition/idempotency key returns one logical workflow execution. |
| Concurrent duplicate workflow invocation | Two concurrent calls produce one run and one execution per step. |
| Crash/resume after Step 1 | Resume does not create another Lead; it advances from existing ActionExecution/evidence. |
| Crash before Step 1 finalization | Recovery uses the action idempotency key and does not blindly duplicate a mutating action. |
| External success before finalization failure | Recovery does not automatically resend; it reconciles durable evidence or remains explicitly uncertain. |
| Tenant isolation | Tenant A cannot read or execute Tenant B’s definition, run, step, action, lead, or conversation. |
| Webhook cross-tenant | Tenant A workflow cannot use Tenant B webhook configuration, and no network call or secret resolution occurs. |
| Definition version pinning | Editing a definition creates a new version; an existing run continues using its original version. |
| Failed-key replay | Replaying a failed logical workflow key follows the documented conservative policy and does not silently mutate again. |
| Invalid parameters | Unsupported action, webhook ID, event type, secret-bearing field, or expression is rejected before action invocation. |
| Trigger authenticity | Missing/ambiguous/forged source context fails closed. |
| Evidence chain | Workflow step status is derived from linked ActionExecution/Evidence, never duplicated fake evidence. |

## 20. Current validation and limitations

The repository audit was read-only. No production or `bavio-verification` remote mutation was performed.

Passed local Stage 7 regression checks:

- `node backend/test-stage7.1.cjs`
- `node backend/test-stage7.2.cjs`
- `node backend/test-stage7.2.1.cjs`
- `node backend/test-stage7.2.6-idempotency.cjs`
- `node --check` for the canonical Stage 7 action/webhook services

The tests confirm the existing action substrate, not workflow readiness. No workflow code or type/model additions were made, so no workflow runtime test or migration test exists to claim.

## 21. Remaining blockers

1. Define and approve the workflow tables and migration ordering.
2. Define immutable definition/version semantics.
3. Define the trusted internal trigger/event identity.
4. Build a typed adapter that invokes the canonical actions without duplicating them.
5. Persist WorkflowExecution and WorkflowStepExecution state with crash-safe transitions.
6. Define conservative recovery for `started` actions and distributed webhook finalization uncertainty.
7. Add tenant/RLS/application authorization tests for all workflow objects and webhook references.
8. Add the Stage 8.1 matrix against the isolated verification project.

## 22. Final authorization decision

**STAGE 8.1 WORKFLOW RUNTIME: BLOCKED — existing verified Actions are reusable, but the required workflow state model, version pinning, deterministic trigger, typed step mapping, recovery semantics, and workflow-level tenant/idempotency controls do not yet exist.**

Stop after Stage 8.0. Do not implement Workflow runtime, Workflow UI, migrations, public run APIs, or Stage 8.1 automatically. Wait for architecture review and explicit authorization.
