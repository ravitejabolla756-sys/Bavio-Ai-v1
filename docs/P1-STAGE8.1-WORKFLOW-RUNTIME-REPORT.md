# BAVIO P1 Stage 8.1 — Workflow Runtime Foundation Report

Date: 2026-09-09
Repository: `C:\Startup\bavio-backend`
Authorized target: `bavio-verification`, Supabase reference `qninimnubfjmyriafdgj`
Production: Bavio.ai remains off limits.

## Final decision

**STAGE 8.2 WORKFLOW PRODUCT SURFACE: AUTHORIZED**

The exact target was verified as `qninimnubfjmyriafdgj` through the authorized verification environment and IPv4 pooler. The schema/seed precheck passed for both synthetic tenants, and the authoritative `stage81-real-final-v2-*` matrix passed against the real database and a controlled signed HTTPS receiver. The temporary receiver and tunnel were stopped. No workflow UI, public run API, automatic trigger, commit, push, deployment, or production operation was created.

## 1. Files modified

- `backend/sql/031_workflow_runtime_foundation.sql`
- `backend/services/customerOpportunityWorkflow.js`
- `backend/database/db.js` — initializes migration 031 in the existing backend bootstrap sequence
- `backend/test-stage8.1.cjs`
- `supabase/verification/stage8-workflow-migration.sql`
- `supabase/verification/stage8-workflow-seed.sql`
- `supabase/verification/stage8-workflow-audit.sql`
- `docs/P1-STAGE8.1-VERIFICATION-RUNBOOK.md`
- `backend/scripts/verify-stage8-remote.cjs` — read-only exact-target inventory/audit helper
- `backend/scripts/verify-stage8-real.cjs` — real service/runtime verification harness with controlled receiver
- this report

No frontend files were changed.

## 2. WorkflowDefinition implementation

`workflow_definitions` stores tenant-scoped logical identity with UUID `id`, `business_id`, `workflow_key`, `name`, `enabled`, and timestamps. The runtime exposes only the fixed `customer_opportunity` key through `ensureCustomerOpportunityWorkflow`; there is no generic end-user definition API.

## 3. WorkflowVersion implementation

`workflow_versions` stores immutable version rows with UUID identity, tenant scope, parent definition, positive integer version, timestamps, and uniqueness on `(workflow_definition_id, version)`. The runtime pins version 1 and never resolves “latest” during a run.

## 4. WorkflowStep implementation

`workflow_steps` stores ordered, tenant-scoped steps with `(workflow_version_id, position)` uniqueness, allowlisted action type, and typed JSON configuration. The fixed version contains exactly:

1. `bavio.lead.create`
2. `bavio.webhook.deliver` with `{ "eventType": "bavio.lead.created" }`

No signing secret is stored.

## 5. WorkflowExecution implementation

`workflow_executions` stores tenant, definition, pinned version, trusted source context, optional conversation ID, status, lifecycle timestamps, safe failure fields, and required invocation identity. The database uniqueness rule is `(business_id, workflow_definition_id, idempotency_key)`.

## 6. WorkflowStepExecution implementation

`workflow_step_executions` stores tenant, workflow execution, workflow step, position, status, timestamps, safe failure fields, and nullable `action_execution_id` referencing the real Stage 7 ActionExecution. It never stores copied/fabricated evidence.

## 7. Migration

`backend/sql/031_workflow_runtime_foundation.sql` creates the five tables, foreign keys, status checks, tenant-first indexes, workflow idempotency uniqueness, step lookup indexes, and RLS enablement. It is additive and inserts no executions or outcomes.

The verification operator files are:

- `supabase/verification/stage8-workflow-migration.sql`
- `supabase/verification/stage8-workflow-seed.sql`
- `supabase/verification/stage8-workflow-audit.sql`

The seed creates only definitions, version 1, and ordered steps for the existing synthetic verification tenants. It creates no Lead, ActionExecution, webhook delivery, or evidence rows.

## 8. Version immutability

The runtime inserts version 1 if absent, verifies its two-step contract, and rejects a mismatch with `WORKFLOW_VERSION_MISMATCH`. Existing version rows and steps are not updated in place. Future edits must create a new version.

## 9. Workflow idempotency

The runtime uses the trusted `workflowInvocationId` directly. It does not derive identity from customer data, transcripts, timestamps, names, phones, or email. Duplicate invocation resolution is enforced by PostgreSQL uniqueness and then read back as the existing WorkflowExecution.

## 10. Concurrent duplicate protection

The database uniqueness rule prevents duplicate WorkflowExecution rows. A PostgreSQL advisory lock keyed by tenant plus workflow invocation serializes logical progression for one run. The local test harness verifies concurrent duplicate calls resolve to one run, one Lead action, and one webhook action.

## 11. Step idempotency

Each step derives a stable key:

`workflow:<workflowExecutionId>:step:<workflowStepId>`

The key remains stable across resume and is passed to the canonical Stage 7 action service. No random action key is generated for workflow steps.

## 12. Canonical Action integration

The orchestrator calls only:

- `createBavioLead` from `bavioLeadAction.js`
- `executeBavioWebhook` from `bavioWebhookAction.js`

It does not insert Leads directly, call HTTP directly, or duplicate action security/evidence logic.

## 13. Create Lead input/output

The trusted invocation supplies the existing Lead action input object. Canonical validation remains authoritative. The only workflow-readable business output is the verified Lead ID from persisted ActionExecution/Evidence.

## 14. Webhook typed mapping

Step 2 receives a trusted tenant-owned `webhookConfigurationId`. The runtime passes the explicit mapping:

```json
{
  "leadId": "<verified step-1 lead id>",
  "conversationId": "<trusted source conversation id when present>"
}
```

The event type is fixed to `bavio.lead.created`. There is no templating engine, JSONPath, JavaScript expression, or arbitrary data mapping.

## 15. Sequential execution

The runtime progresses positions 1 then 2. Step 2 is attempted only after Step 1 has a confirmed persisted successful ActionExecution with evidence.

## 16. Fail-fast

Step 1 failure marks Step 1 failed, Step 2 skipped, and WorkflowExecution failed. Step 2 failure marks Step 2 failed and WorkflowExecution failed. No automatic retry exists.

## 17. Partial effects

If Lead creation succeeds and webhook delivery fails, the Lead remains persisted and Step 1 remains succeeded. Step 2 records failure and the workflow fails. No compensation or Lead deletion is attempted.

## 18. Crash recovery

`executeCustomerOpportunityWorkflow` resumes a pending/running execution by loading each deterministic action identity first. A successful existing ActionExecution/Evidence pair is reconciled into the step without re-invocation. A failed action is recorded as failed without retry. An ambiguous `started` action fails conservatively with `ACTION_EXECUTION_UNCERTAIN` rather than blindly replaying a mutating action.

## 19. Webhook distributed-finalization recovery

If the webhook action has already persisted succeeded ActionExecution/Evidence but the workflow step update was interrupted, resume finds the successful action identity and finalizes the workflow step without sending another webhook. The local test harness verifies the webhook call count remains one.

## 20. Failed replay semantics

A failed WorkflowExecution returns its existing failed summary on the same invocation key. A failed canonical ActionExecution is not automatically retried. A later retry, if ever approved, must use a new explicit workflow invocation policy.

## 21. Tenant isolation

All workflow tables carry `business_id`; composite foreign keys preserve same-tenant parent relationships. Runtime queries include explicit tenant predicates. Webhook ownership remains enforced by the canonical webhook action service using tenant plus configuration ID.

## 22. Direct-ID isolation

There is no public workflow read/resume API. Internal runtime methods require the trusted business ID and query by business plus ID/key. The future verification matrix must attempt Tenant A access to Tenant B definition, execution, step, and webhook IDs and require not-found/blocked behavior without metadata leakage.

## 23. RLS/application scoping

Migration 031 enables RLS on all workflow tables. No public Data API or client policy is introduced. Backend service-role/owner access is still explicitly tenant-scoped; RLS is not treated as a substitute for application authorization.

The verification bootstrap currently uses the backend-owner access envelope. Real positive/negative workflow read checks remain a remote verification blocker until the authorized project is migrated and tested.

## 24. Structured logging

The runtime error paths preserve safe identifiers and codes for structured integration: business ID, workflow execution ID, step ID, ActionExecution ID, action status, and duration can be logged by the caller. It does not log webhook secrets, encryption keys, credentials, or full customer payloads.

## 25. First workflow definition

Only `Customer opportunity workflow`, version 1, is supported. It is a strict two-step linear workflow: Create Lead, then Send Webhook.

## 26. Invocation contract

The internal contract is:

```text
executeCustomerOpportunityWorkflow({
  businessId,
  workflowInvocationId,
  conversationId?,
  leadInput,
  webhookConfigurationId
})
```

The caller must be trusted backend/test context. No generic public run endpoint exists.

## 27. Automatic-trigger status

No automatic trigger was wired. Conversation completion, high intent, Lead detection, post-call, and AI decisions remain out of scope until a deterministic event identity/outbox contract is separately approved.

## 28–35. Local runtime tests

`node backend/test-stage8.1.cjs` passed the following local deterministic cases:

- success chain: both steps succeeded
- Step 1 failure: Step 2 skipped, zero webhook calls
- Step 2 failure: Lead action succeeded and remained persisted in the test state
- sequential duplicate invocation: one workflow and no second action calls
- concurrent duplicate invocation: one workflow, one Lead action, one webhook action
- same invocation ID across two tenants: independent WorkflowExecutions
- crash after Step 1 action success: resume reused the same Lead ActionExecution and completed Step 2
- webhook finalization interruption: resume reused the persisted webhook ActionExecution and did not resend

These are local service-level tests with a deterministic database harness. They are not evidence of remote persistence.

## 36. Real persistence verification

The exact-target precheck confirmed:

- both synthetic tenants exist
- the canonical Stage 7 tables and all five Stage 8 workflow tables exist with RLS enabled
- the workflow idempotency unique constraint and WorkflowStepExecution-to-ActionExecution FK exist
- each tenant has `customer_opportunity`, immutable version 1, and exactly positions 1 and 2 (`bavio.lead.create`, `bavio.webhook.deliver`)
- WorkflowExecution and WorkflowStepExecution counts were zero before application verification

The authoritative real run namespace was `stage81-real-final-v2-*`. Every workflow, step, Lead, ActionExecution, ExecutionEvidence, and WebhookDelivery row was produced through `executeCustomerOpportunityWorkflow` and the canonical Stage 7 action services; none was inserted manually as an execution substitute.

Real results:

- success: one succeeded WorkflowExecution; two succeeded WorkflowStepExecutions; two real linked ActionExecutions and two Evidence rows; one Lead; one signed HTTP 204 request
- Step 1 invalid input: workflow failed, Step 1 failed, Step 2 skipped, zero actions/evidence/Leads, zero network requests
- Step 2 HTTP 500: Step 1 and Lead persisted, Step 2/action failed with `WEBHOOK_HTTP_500`, one evidence row for each real action, one receiver request, `attempt_count = 1`
- sequential duplicate: one workflow, two steps, two actions, two evidence rows, one Lead, one webhook request
- concurrent duplicate: one workflow, two steps, two actions, two evidence rows, one Lead, one webhook request; PostgreSQL uniqueness plus advisory locking reconciled both callers
- cross-tenant same key: one independent succeeded workflow per tenant with separate version/action/evidence/Lead identities
- Tenant A using Tenant B webhook configuration: `WEBHOOK_NOT_FOUND`, no webhook ActionExecution/evidence, and zero outbound requests
- crash after Step 1 action: resume reused the same Lead and Lead ActionExecution/evidence, then sent Step 2 once
- interruption after successful webhook ActionExecution/evidence: resume reused the same webhook action/evidence and receiver count remained exactly one
- failed Step 2 replay: the same failed workflow returned failed without another request
- direct-ID probes for Tenant B definition, execution, step execution, linked action, and linked evidence returned no row under Tenant A-scoped queries
- every authoritative execution remained pinned to its tenant's version 1 row

The receiver recorded eight authoritative HTTPS requests: seven success-path receipts and one intentional failure-path receipt. Every recorded signature validated. Correlation IDs and timestamps were captured without logging secrets.

During the first real attempt PostgreSQL exposed a runtime query defect: reused status parameter `$1` was inferred as both `text` and `varchar` (`42P08`). `setStep` now casts it explicitly to `varchar`; the local Stage 8.1 suite and the complete real matrix passed afterward. A first cross-tenant probe namespace also recorded two `WEBHOOK_TIMEOUT` failures when simultaneous requests exceeded the temporary tunnel's capacity; the authoritative v2 cross-tenant same-key gate was rerun sequentially, as required by that gate, with independent persisted success for both tenants.

The final fresh read-only audit found 17 total WorkflowExecutions and 34 WorkflowStepExecutions, including retained diagnostic attempts. For every authoritative v2 run, aggregate counts matched the expected workflow/step/action/evidence/Lead cardinality. Verification data was intentionally retained as evidence.

No automatic trigger exists: repository search found the runtime invocation only in the workflow service and verification harness, with no conversation-complete, intent, post-call, route, or AI-decision caller.

The temporary Node receiver closed in the verifier's `finally` path and the localtunnel process was terminated after testing.

## 37. Stage 7 regression results

Passed locally after the runtime changes:

- `node backend/test-stage8.1.cjs`
- `node backend/test-stage7.1.cjs`
- `node backend/test-stage7.2.cjs`
- `node backend/test-stage7.2.1.cjs`
- `node backend/test-stage7.2.6-idempotency.cjs`
- `node backend/test-stage6.cjs` — 9/9
- `node --check` for workflow and Stage 7 action services plus database bootstrap

## 38. Frontend build

No frontend files were changed. Stage 8.1 intentionally adds no navigation, routes, Workflow UI, editor, canvas, or Run button. Existing Stage 7 UI remains frozen.

The existing frontend verification also passed `npx tsc --noEmit` and `npm run build` (85 pages). The repository's unrelated pre-existing lint/diff whitespace findings were not changed as part of this stage.

## 39. Remaining blockers

No Stage 8.1 runtime-verification blocker remains. Any future client-visible workflow surface still requires its own authenticated API/RLS authorization design; Stage 8.1 did not expose the workflow tables or create permissive policies.

## 40. Exact Stage 8.2 authorization decision

**STAGE 8.2 WORKFLOW PRODUCT SURFACE: AUTHORIZED**

Stop here. This authorization clears the Stage 8.1 runtime gate only; no Workflow UI, navigation, editor, commit, push, or deployment was performed.
