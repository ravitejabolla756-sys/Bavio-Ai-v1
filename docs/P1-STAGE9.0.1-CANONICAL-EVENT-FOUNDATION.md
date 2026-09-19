# BAVIO — P1 Stage 9.0.1 Canonical Conversation Completion Event Foundation

**Date:** 2026-09-10  
**Repository:** `C:\Startup\bavio-backend`  
**Scope:** canonical event foundation only  
**Production:** not accessed or modified  
**Remote verification project:** `bavio-verification` / `qninimnubfjmyriafdgj`

## 1. Completion entry points

The repository contains these legitimate completion paths:

| Source | Authentication | Tenant/internal record | Provider/source ID | State written | Duplicate/late/order behavior |
|---|---|---|---|---|---|
| Twilio `/calls/twilio/status` | `validateTwilioSignature` | `calls` lookup by `call_sid`; tenant prefers `business_id`, then compatibility keys | `CallSid` | `status=completed`, duration, `ended_at` | Twilio may retry, duplicate, arrive late, or arrive after media teardown |
| WebSocket/call-stream summary | WebSocket/provider session context | inserts `calls` with supplied business | `callSid` when present | inserts completed call | may race with Twilio status; source has no exactly-once guarantee by itself |
| `VoiceWorkerSession` teardown | authenticated internal voice session/provider stream | inserts `calls` with worker business | `callSid` | inserts completed call, transcript, optional Lead | provider end and callback can be duplicated or reordered |
| `ModularVoiceSession` teardown | authenticated internal voice session/provider stream | inserts `calls` with worker business | `_callSid` | inserts completed call and transcript | same race class as other teardown paths |
| Telephony sync end-of-call report | Twilio-signed route | resolves signed assistant/number context, inserts `calls` | report call ID | inserts completed call, transcript, structured data | report can be late or duplicated |

All implemented completion persistence paths now call `recordConversationCompletedEvent`. The event recorder is the only event boundary; it never runs a workflow.

## 2. Canonical completion semantics

`conversation.completed` means the canonical `calls` record has reached the persisted `completed` lifecycle state. It does not mean transcript analysis, summary generation, Lead detection, recording upload, or model inference completed. Teardown and provider callbacks are observations; the event is recorded only after the canonical call row is completed and a stable internal UUID is available.

The current precedence is: a trusted provider/session path persists or updates the canonical call, then the event adapter validates the resulting state. If multiple sources observe the same call, the first successful insert wins and later sources reconcile to that event. There is no workflow or action execution in this stage.

## 3. Parallel model handling and identity

No broad call-stack rewrite was performed. The adapter uses the existing fresh-schema `calls.id` UUID as the canonical conversation reference and accepts provider `call_sid`, `provider_call_id`, or the canonical UUID as lookup inputs. Tenant resolution is derived from the matched record (`business_id`, then explicitly supported compatibility keys) and may be checked against a supplied tenant. Unknown, ambiguous, or cross-tenant resolution fails closed.

Legacy `call_sessions`, `call_logs`, and historical conversation records are not silently selected. A source must first have an exact canonical `calls` row. Phone numbers, timestamps, display names, transcript text, and status labels are never used as identity.

## 4. Implemented BusinessEvent schema

Migration: `backend/sql/032_canonical_business_events.sql`.

`business_events` contains:

- UUID `id` primary key;
- UUID `business_id` FK to `businesses`;
- constrained `event_type`, currently only `conversation.completed`;
- constrained `aggregate_type=conversation`;
- `aggregate_key` (`call:<canonical calls.id>`);
- `source_type` and optional `source_id`;
- `schema_version`;
- `occurred_at`, `recorded_at`, and `created_at`;
- minimal JSONB payload.

The table is append-only by service contract, has RLS enabled, and has tenant/event, aggregate, and recorded-time indexes. No public frontend API is exposed.

## 5. Payload and immutability

The payload contains only the canonical conversation UUID, real assistant/phone-number UUIDs when present, real start/completion timestamps, and provider type when available. It excludes transcript, recording, summary, model output, customer dumps, secrets, and credentials. No update path was added to mutate an event after insertion.

## 6. Idempotency and concurrent writers

The database constraint is:

`UNIQUE (business_id, event_type, aggregate_key)`

The recorder uses `INSERT ... ON CONFLICT DO NOTHING`, then reads the existing row. This handles duplicate Twilio callbacks, teardown/callback races, and concurrent writers without a select-then-insert guarantee. The returned result identifies whether the logical completion was newly recorded or reconciled as a duplicate.

## 7. Canonical recorder and read access

Implemented in `backend/services/businessEventService.js`:

- `resolveCanonicalConversation(...)`;
- `recordConversationCompletedEvent(...)`;
- `reconcileConversationCompletedEvent(...)`;
- `getBusinessEventById(...)`;
- `mapConversationToLeadInput(...)`;
- `resolveAutomationWebhook(...)`.

The resolver validates exact tenant ownership and requires a `completed` call status. The explicit reconciliation helper operates on one caller-supplied canonical conversation only; it does not scan or backfill history. No `TriggerExecution`, `WorkflowExecution`, Lead creation, webhook dispatch, or automatic retry is called.

## 8. Transaction boundary and reconciliation

The existing provider/session architecture persists calls in several separate paths, so this stage does not claim that every provider state transition and event insert are one database transaction. Instead, each path calls the recorder immediately after the completed canonical row is available, and the event uniqueness rule makes late/duplicate paths safe. Controlled reconciliation can create a missing event for an explicitly supplied completed call, using the same logical key. Reconciliation twice returns the same event.

Historical completed calls are never scanned or automatically backfilled.

## 9. Provider signature and cross-tenant protection

The Twilio route continues to use `validateTwilioSignature`. Strict production behavior remains responsible for rejecting missing/invalid signatures; the existing non-production/sandbox bypass is not promoted as production authorization. The recorder itself does not accept a client-created event.

Tenant mismatch, unknown source, ambiguous identity, missing tenant, and non-completed lifecycle state fail closed. The controller’s backward-compatibility mapping was narrowed to prefer the canonical `business_id` and only then use explicit compatibility keys; it no longer overwrites a real business ID with `user_id`.

## 10. Event read and async boundary

Internal bounded event read by tenant and ID is available for future Stage 9.1 processing. No public API or frontend surface was added. The intended future boundary remains:

`trusted completion source → canonical recorder → durable event → provider ACK → future trigger processor`

This stage does not add a worker, queue, replay, trigger matcher, or workflow invocation.

## 11. Explicit webhook automation configuration

Migration `032_canonical_business_events.sql` also adds `workflow_automation_bindings` as a disabled-by-default, tenant-scoped binding. It stores only:

- business UUID;
- workflow definition UUID;
- immutable workflow version UUID;
- webhook configuration UUID;
- enabled/activation timestamps.

It does not copy any signing secret. The service resolver requires exactly one enabled binding, verifies the webhook belongs to the same tenant and is active, and returns `NOT_CONFIGURED`/`UNAVAILABLE` instead of selecting the first, latest, default, or arbitrary webhook. No binding is enabled or inserted by this stage, and no workflow version was changed or created.

This keeps Stage 8 version 1 immutable. If future automation needs a different immutable step configuration, a separately reviewed workflow version may be created in Stage 9.1; this stage does not arbitrarily create version 2.

## 12. Lead input mapping

`mapConversationToLeadInput` is a typed, non-mutating mapper. It maps a real caller phone to Lead `phone`, preserves the canonical conversation ID, and maps optional persisted fields only when present. Missing phone returns `available=false` and `LEAD_PHONE_UNAVAILABLE`; it never fabricates a placeholder. The mapper is not invoked by the event recorder.

## 13. Verification artifacts

Prepared for isolated operator execution only:

- `supabase/verification/stage9-event-migration.sql`;
- `supabase/verification/stage9-event-audit.sql`;
- `supabase/verification/stage9-event-seed.sql`;
- `docs/runbooks/STAGE9-EVENT-REMOTE-VERIFICATION.md`.

The current session did not apply remote SQL or claim remote persistence/RLS evidence. Production remains off limits.

## 14. Local test matrix

`node backend/test-stage9.0.1.cjs` passed:

- normal completion creates exactly one event;
- duplicate source returns the same event;
- concurrent logical completions leave one event;
- cross-tenant and unknown conversations are rejected;
- controlled reconciliation is idempotent;
- missing phone is reported truthfully;
- real phone mapping preserves the canonical conversation reference.

The local test uses a deterministic isolated fake database and does not claim remote Postgres evidence.

## 15. Regression validation

Passed:

- backend syntax checks for the event service, Twilio controller, call stream, voice worker, modular voice session, and telephony controller;
- `node backend/test-stage8.1.cjs`;
- `node backend/test-stage7.2.6-idempotency.cjs`;
- `node backend/test-stage7.2.1.cjs`;
- frontend TypeScript check (`npx tsc --noEmit`);
- frontend production build (`npm run build`).

No frontend files were modified. No Stage 7/8 product surface was redesigned.

## 16. Remaining blockers

Stage 9.1 remains blocked because the required isolated Postgres verification has not been run in this session. Specifically, the following are unproven remotely:

1. actual `business_events` persistence and database uniqueness under concurrent Postgres writers;
2. RLS state and tenant isolation in `bavio-verification`;
3. immutability behavior against the isolated database;
4. explicit automation binding ownership and no-fallback behavior in the isolated database;
5. provider-invalid-signature and cross-tenant callback behavior against the real route/database boundary.

The event foundation is implemented locally, but authorization cannot be granted without those isolated verification gates.

**STAGE 9.1 TRIGGER RUNTIME: BLOCKED — isolated verification database evidence is not yet available for canonical event persistence, concurrency, RLS/tenant isolation, immutable events, and explicit webhook binding ownership.**

