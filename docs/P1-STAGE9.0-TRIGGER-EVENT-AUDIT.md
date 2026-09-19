# BAVIO — P1 Stage 9.0 Trigger + Business Event Audit

**Date:** 2026-09-09  
**Scope:** architecture/runtime-readiness audit only  
**Repository:** `C:\Startup\bavio-backend`  
**Verification database:** `bavio-verification` / `qninimnubfjmyriafdgj`  
**Production:** not accessed or modified

## 1. Decision

**STAGE 9.1 TRIGGER RUNTIME: BLOCKED — no single canonical persisted `conversation.completed` business event exists; completion is currently represented by multiple provider/session/callback paths over parallel call models, and no durable event-to-trigger processing model or deterministic automatic webhook configuration contract exists.**

Stage 8 remains frozen. No Stage 9 runtime, migration, UI, automatic invocation, remote database mutation, commit, push, or deployment was performed.

## 2. Existing event-like sources and classification

| Source | Classification | Evidence and finding |
|---|---|---|
| Twilio `POST /calls/twilio/status` with `CallStatus=completed` | **B — provider lifecycle signal** | `backend/routes/twilioRoutes.js:23` routes through `validateTwilioSignature`; `backend/controllers/twilioCallController.js:570-631` only processes `completed`, updates `calls`, billing/usage, and returns 200. It is not a persisted internal event. |
| Twilio media/WebSocket stop/end | **B — provider lifecycle signal** | `backend/voice/sessions/VoiceWorkerSession.js:300-303` receives provider end and calls `end('caller_hangup')`. A WebSocket/provider end is not equivalent to the status callback. |
| Voice session teardown | **C — persisted status/process side effect** | `VoiceWorkerSession.end()` closes streams and calls `_persistCallLogs`; the persistence path inserts a completed call and transcript/lead side effects. It has no business-event identity or atomic event record. |
| Telephony sync `end-of-call-report` | **B/F — provider/legacy ingestion path** | `handleTelephonySync` accepts a signed report, resolves tenant, inserts a completed call, transcript, and optional structured lead. It is a separate completion path and does not deduplicate against the other paths by a business-event key. |
| `conversationReadQuery` status normalization | **E — UI/read interpretation** | It maps `started` to `in-progress` and reads mutable `calls.status`/`call_status`; this is not a lifecycle transition or trigger source. |
| `outcomeExtractionService` / structured analysis | **D — derived/model inference** | Model-derived outcome/lead fields are not a deterministic completion event. They must not trigger Stage 9.1. |
| `campaignWorker` | **F — unrelated background job** | A ten-second polling worker handles outbound campaign contacts and `campaign.completed`; it is not a conversation-completion outbox or trigger processor. |
| `webhookService.dispatchWebhook` | **F — existing outbound delivery side effect** | It selects active tenant webhooks and starts `executeBavioWebhook` asynchronously with a fresh random UUID (`backend/services/webhookService.js:97-109`). It is not a durable business-event queue and does not provide trigger identity. |
| Event emitter/domain event/business event for conversation completion | **G — absent** | Repository search found no append-only `business_events`, `workflow_triggers`, `trigger_executions`, or conversation-completion outbox contract. |

The existing Stage 8 report also records that no automatic workflow trigger was wired and that conversation completion remains out of scope until deterministic event identity and outbox semantics are approved.

## 3. Canonical Conversation/Call model

The intended fresh-schema model is `public.calls` in `backend/sql/000_canonical_fresh_schema.sql:94-114`:

- primary key: UUID `id`;
- tenant keys: `business_id` and compatibility `client_id`, with additional legacy `user_id` usage in runtime paths;
- assistant linkage: nullable `assistant_id`;
- phone linkage: nullable `phone_number_id`;
- provider identity: unique nullable `call_sid` and `provider_call_id`;
- mutable lifecycle fields: `call_status`, `status`, `started_at`, `ended_at`;
- transcript/recording: `transcript` JSONB and `recording_url`;
- duration/cost: `duration`, `duration_seconds`, and `cost`.

This is a Call model, not a separately enforced Conversation aggregate. The repository also contains legacy `call_sessions`, `call_logs`, `call_conversations`, and older call schemas. Runtime code writes both fresh and legacy-shaped records. The internal UUID is therefore stable only after a `calls` row exists; it is not currently the identity used to normalize every provider completion path.

Transcript persistence is separate (`transcripts`) and may be written during session teardown or telephony sync. Recording cleanup is asynchronous in the Twilio status handler. Post-call analysis/lead extraction is not a single completion transaction. No completed/processing/recording/analysis state machine is enforced across these resources.

## 4. Completion semantics

No single canonical transition exists. Current meanings differ:

1. The Twilio callback treats provider `CallStatus=completed` as final and updates `calls.status`, `duration_seconds`, and `ended_at`.
2. The media provider can signal end first, causing voice-session teardown and a completed call insert.
3. The voice worker default `end(reason = 'completed')` is an internal shutdown reason, not proof that the provider callback has been received.
4. Telephony sync can independently insert a completed call and transcript from an end-of-call report.

These are not equivalent and can be duplicated, reordered, late, or missing. `ended_at` is currently written as a database side effect, not as an immutable event occurrence time with one logical identity.

## 5. Provider callback, identity, and security audit

Twilio callbacks can be retried, duplicated, delayed, and observed out of order. The repository exposes deterministic provider identifiers (`CallSid`, `provider_call_id`) and an internal UUID once a canonical `calls` row is found. It does not expose a provider event ID that can replace a logical internal event key.

The signed routes use `validateTwilioSignature`; strict production behavior rejects missing/invalid signatures, while non-production/sandbox behavior intentionally permits a bypass. This is acceptable for existing sandbox behavior but insufficient as the Stage 9 proof boundary unless the automatic event entry point is production-strict and the exact canonical route is used. No unsigned client-submitted event may create a future `business_events` row.

Tenant resolution is not uniform across all historical paths. The hardened signed lead path resolves tenant from signed call context and rejects missing routing, but other call inserts use `user_id`, phone-number lookup, assistant lookup, or older fields. A future event recorder must require the resolved `calls.business_id` and verify the conversation belongs to that tenant; it must never accept a client tenant parameter or first-row fallback.

## 6. Model inference is not a trigger

The following are explicitly rejected as the first Stage 9 trigger source: high intent, lead score, sentiment, budget detection, appointment request, model-qualified output, and summary generation. They are derived/model data and may only become future deterministic conditions under a separately approved contract.

## 7. Minimal proposed business-event model

The smallest compatible future model is:

### `business_events`

| Column | Proposed type/constraint |
|---|---|
| `id` | UUID primary key |
| `business_id` | UUID not null FK to `businesses(id)` |
| `event_type` | text not null; Stage 9.1 exact value `conversation.completed` |
| `aggregate_type` | text not null; `conversation`/`call` according to the chosen canonical name |
| `aggregate_id` | UUID not null FK to `calls(id)` where feasible |
| `source_type` / `source_id` | bounded text and provider/internal source identifier |
| `idempotency_key` | text not null, deterministic |
| `occurred_at` / `recorded_at` | timestamptz not null |
| `payload` | minimal JSONB only: conversation ID, assistant ID, phone-number ID, started/completed timestamps when real |
| `schema_version` | small integer not null |

Use an immutable append-only policy. Enforce `UNIQUE (business_id, event_type, aggregate_id)` (or the equivalent deterministic key) and an index beginning with `business_id`. Do not store full transcripts, secrets, or mutable webhook configuration in the event.

## 8. Trigger and trigger-execution models

### `workflow_triggers`

Proposed columns: UUID `id`, UUID `business_id` FK, UUID `workflow_definition_id` FK, UUID `workflow_version_id` FK, exact `event_type`, `enabled`, `activated_at`, `created_at`, `updated_at`. Require tenant-consistent foreign keys or transaction checks. Do not add conditions, expressions, filters, schedules, or a generic trigger builder.

Pin the trigger to an immutable workflow version. This is safer than resolving “current” at delivery time: historical trigger executions remain explainable and cannot silently change when a new version is enabled.

### `trigger_executions`

Proposed columns: UUID `id`, UUID `business_id`, UUID `business_event_id`, UUID `workflow_trigger_id`, nullable UUID `workflow_execution_id`, status enum/check (`pending`, `processing`, `succeeded`, `failed`), `created_at`, `started_at`, `processed_at`, bounded `failure_code`, bounded `failure_message`, and optional `attempt_count`/`last_error_at`.

Enforce `UNIQUE (business_id, business_event_id, workflow_trigger_id)`. Add tenant-first lookup indexes and foreign keys. RLS must be enabled for all three new tables with policies matching the existing tenant authorization model; authenticated access alone is not sufficient authorization. The event, trigger, and execution tenant must agree, and cross-tenant foreign-key references must be rejected.

## 9. Idempotency, linkage, and matching

The future workflow invocation ID must be deterministic, for example:

`trigger:<businessEventId>:<workflowTriggerId>`

or a stable UUID derived from those IDs. It must not use timestamps or random UUIDs on retry. The existing Stage 8 workflow uniqueness `(business_id, workflow_definition_id, idempotency_key)` can then prevent duplicate workflow creation. `trigger_executions.workflow_execution_id` must link the exact created/reconciled execution, proving why it started.

Matching is exact event-type matching only: `conversation.completed` to an enabled pinned trigger. No regex, JSONPath, SQL, JavaScript, score, intent, or content conditions are in scope.

## 10. Recovery and processing policy

Recommended boundary:

`canonical call transition + business_event insert` in one database transaction where the call row and tenant context are available.

If a provider callback cannot share that transaction, a reconciliation job must identify completed canonical calls missing their event by stable call UUID and insert the same deterministic event; it must not infer from UI state or backfill the historical corpus.

Processing should be asynchronous: acknowledge the provider quickly after durable event recording, then create/reuse one `TriggerExecution`, invoke/reconcile one deterministic `WorkflowExecution`, and finalize the trigger execution. A long workflow must not block the Twilio callback.

Recovery cases:

- crash after event insert: resume the existing event; do not insert another;
- crash after trigger-execution insert: claim/reuse that row;
- crash after workflow creation: find the Stage 8 execution using deterministic invocation identity and finalize the same trigger execution;
- duplicate callbacks: unique event identity yields one event, one trigger execution, one workflow, and Stage 8 action idempotency protects Lead/webhook effects;
- concurrent workers: database uniqueness plus claim/update rules, not process-local locks, provide the guarantee.

Do not add automatic retries that resend mutating actions. Retry only deterministic trigger processing and reconcile existing workflow/action evidence. Distinguish event-recording failure, trigger-match failure, workflow-invocation failure, and workflow-execution failure.

## 11. Outbox/queue findings

No general outbox, business-event queue, or trigger worker exists. `campaignWorker` is a polling interval for outbound campaigns and cannot be relabeled as the trigger processor. `webhookService.dispatchWebhook` is fire-and-forget outbound delivery and generates a fresh random invocation ID; it is not suitable as the source of automatic workflow identity.

The recommended Stage 9.1 implementation is a small database-backed event/trigger processor using the three tables above and bounded polling/claiming, or an existing queue only if it can preserve those durable identities. Kafka/Temporal/Redis is not justified by this audit.

## 12. Lead and webhook prerequisites

`bavio.lead.create` needs a trusted input snapshot. The canonical source can map `calls.caller_number` to Lead `phone`; optional name, intent, budget, location, and notes may be mapped only when persisted and validated. Missing phone must produce a truthful failed workflow/trigger execution, not a fabricated value.

`bavio.webhook.deliver` currently accepts a `webhookConfigurationId`. Automatic invocation cannot select the first active webhook or any arbitrary row. The explicit safe design is to pin a tenant-owned webhook configuration ID into the immutable WorkflowVersion/step configuration (or into an immutable trigger configuration) and validate that it belongs to the same business. A mutable global tenant default would break historical determinism. Missing or deleted configuration must fail truthfully and preserve the Lead result without unsafe fallback.

## 13. Historical and activation boundary

Do not backfill `conversation.completed` events for old calls by default. Enabling a trigger must include an explicit `activated_at` boundary; only newly recorded events with `occurred_at >= activated_at` are eligible. Historical conversations must not unexpectedly create Leads or webhook deliveries.

Future operator replay must be explicit and use a new replay identity. No replay UI or automatic historical catch-up is authorized in Stage 9.0.

## 14. Observability and future UI (audit only)

Future structured logs should include only safe identifiers: `businessEventId`, `eventType`, `conversationId`, `workflowTriggerId`, `triggerExecutionId`, `workflowExecutionId`, `businessId`, and status/error codes. Do not log transcripts, webhook secrets, or full customer payloads.

Once linkage is real, a future read-only surface may show `STARTS WHEN: Conversation completed`, trigger status, `Started by: Conversation completed`, and an activity chain from Conversation to Workflow. This does not authorize UI work now and should never display a relationship that is not persisted.

## 15. Security risks and controls

Required controls before Stage 9.1:

- strict provider signature verification on the canonical completion route;
- no client-created business events;
- canonical UUID-to-tenant ownership checks for every event/trigger/workflow relation;
- database uniqueness for duplicate callbacks and concurrent workers;
- immutable event rows and deterministic replay identities;
- no event payload secrets or full transcript duplication;
- explicit pinned webhook configuration with same-tenant validation;
- no first-row tenant, workflow, conversation, agent, or webhook fallback;
- no historical activation without an explicit boundary;
- RLS and tenant-first indexes on all new tables.

## 16. Fresh-schema and migration plan

When authorized, add one additive migration after the verified Stage 7 and Stage 8 schema, using UUID tenant/business keys and real foreign keys to the canonical fresh schema. Add the three tables, checks, unique constraints, tenant-first indexes, RLS, and tenant-consistent policies. Validate the migration in `bavio-verification` only, run advisors/security review, and then run the Stage 9.1 matrix. Production remains off limits until separately authorized.

No migration was created or applied by this audit.

## 17. Stage 9.1 verification matrix

1. Normal new completion: one event, one trigger execution, one workflow.
2. Duplicate provider callback: one event, one workflow.
3. Concurrent processing: one workflow.
4. Cross-tenant conversation reference: blocked.
5. Invalid signature: no event.
6. Missing lead phone/input: truthful failure, no fabricated Lead.
7. Missing webhook configuration: truthful failure, no fallback.
8. Crash after event: resume without duplicate workflow.
9. Crash after workflow creation: reconcile the same workflow.
10. Failed workflow: trigger execution links accurately to the failed execution.
11. Historical conversation: no automatic trigger.
12. Disabled trigger: event may persist; workflow does not start.
13. Same event key across tenants: independent tenant-scoped records.
14. Version pinning: trigger continues to use its immutable version.
15. Lead/webhook end-to-end: one Lead and one controlled HTTPS delivery with no unsafe resend.

## 18. Remaining blockers

1. There is no canonical persisted `conversation.completed` business event or event identity.
2. Multiple callback/session/telephony-sync paths can create or mutate completed call state and are not reconciled into one transaction.
3. Parallel legacy and fresh call models prevent a single already-proven provider-ID-to-canonical-UUID mapping for every path.
4. `business_events`, `workflow_triggers`, and `trigger_executions` do not exist, so trigger-to-workflow causality, concurrency control, and crash recovery are not implemented.
5. The automatic workflow cannot safely resolve the required tenant-owned webhook configuration without an immutable/versioned configuration contract.
6. Lead input eligibility for every completed call is not guaranteed; missing phone must be handled as a specified truthful failure.
7. The production-vs-sandbox signature boundary must be fixed and tested on the eventual canonical event recorder.

**STAGE 9.1 TRIGGER RUNTIME: BLOCKED — no single canonical persisted `conversation.completed` business event exists; completion is currently represented by multiple provider/session/callback paths over parallel call models, and no durable event-to-trigger processing model or deterministic automatic webhook configuration contract exists.**

