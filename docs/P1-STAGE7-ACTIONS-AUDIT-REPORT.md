# P1 Stage 7 — Actions + Execution Evidence audit

Status: **Actions UI blocked; audit-only completion.**

Stage 7 did not add an Actions route, navigation item, manual execute control, execution-history UI, fake screenshots, or synthetic execution records. The repository does not currently expose a sufficiently safe, coherent, tenant-scoped ActionExecution contract for that surface.

Canonical repository: `C:\Startup\bavio-backend`. Existing dirty changes were preserved. Stage 8 / Workflows was not started.

## 1. Existing action/tool capabilities discovered

### Voice model tool schemas

`backend/voice/providers/modular/OpenAiLlm.js` and `CerebraLlm.js` advertise `capture_lead`, `update_lead`, `save_callback_request`, `get_business_hours`, `get_business_service`, `mark_urgent_request`, `send_notification` and `end_call`. `GroqLlm` declares tool-call support but logs that `callTool` is unsupported. `SarvamLlm` does not implement tool execution. These are model-facing schemas, not an authenticated, persisted ActionDefinition registry.

### Lead persistence

`POST /leads` creates an internal Bavio Lead. `POST /twilio/save-lead` accepts signed provider/tool payloads and creates a Lead plus sometimes a temporary call record. Other voice/webhook/session paths insert Leads directly. This is an internal business mutation, not CRM execution and not external evidence.

### Webhooks

V1 `POST /api/v1/webhooks`, `GET`, and `DELETE` register tenant-scoped custom webhook definitions. `webhookService.dispatchWebhook` sends events after internal call/lead/campaign mutations, signs requests, records response/error delivery rows, and retries asynchronously up to three times. This is a real outbound integration subsystem, but it is event-driven rather than a user/agent action execution API. Its delivery record has no ActionExecution ID, idempotency key, causal conversation/lead reference, execution policy or outcome relation.

### Email

`emailService` sends authentication and password-reset emails through Resend. These are account-system operations, not business conversation Actions. They are not presented as Actions.

### Telephony/provider setup

Twilio/telephony and phone-number provisioning can make provider requests and persist provider identifiers/statuses. These are onboarding/integration mutations, not a general business-action runtime. No operator-safe ActionExecution contract was found for them.

### Campaigns

The V1 campaign API creates, updates, starts, pauses, resumes and cancels outbound calling campaigns, with campaign contacts, attempts and runs. It is a separate operational subsystem with provider-facing behavior, but it lacks the Stage 7 common ActionDefinition/ActionExecution/Evidence model and is not safe to promote into a generic Actions page without a separate campaign execution audit.

### Marketing claims

Marketing copy references CRM updates, calendar booking, SMS, webhooks and appointment booking. Repository evidence found no verified Calendar booking or CRM integration execution endpoint, no business SMS/WhatsApp action contract, and no external appointment/CRM receipts. Marketing copy was not treated as capability evidence.

## 2. Classification A/B/C/D/E

| Capability | Classification | Evidence and boundary |
|---|---|---|
| Internal `POST /leads` | B — internal business mutation | Persists a tenant-scoped Lead ID when the authenticated route is used. No external receipt. Existing direct writer paths vary in validation and provenance. |
| Signed `/twilio/save-lead` | B, with D/E risks | It can persist a Lead, but falls back to the first business when tenant resolution fails and can create a temporary call. Not safe as a general Action. |
| `capture_lead` / `update_lead` schemas | D/E — advertised runtime capability, not proven contract | Schemas exist; provider/session execution and persistence/evidence are inconsistent. No ActionExecution receipt. |
| `save_callback_request` | D/E — advertised only | No verified dedicated callback-request action/evidence contract was found. Some failure paths write a Lead with fallback notes. |
| `get_business_hours` / `get_business_service` | D/E — advertised only | No confirmed implementation returning tenant-scoped business-context records from the inspected action path. |
| `mark_urgent_request` | D/E — advertised only | No dedicated persisted execution/evidence record found. |
| `send_notification` | D/E/C boundary | Schema says SMS/email alert, but no verified business notification execution path and receipt tied to the tool call were found. Account email service is unrelated. |
| `end_call` | A-like telephony control, not Stage 7 business Action | Runtime/session termination exists, but no common ActionExecution/evidence record and no operator-safe manual action surface. |
| Custom webhook registration | C — integration connectivity/configuration | Tenant-scoped registration and signing secret exist. Registration is not delivery. |
| Custom webhook delivery | A-ish outbound delivery subsystem, not promotable yet | HTTP response/error and delivery row are recorded, but no unified execution ID, idempotency contract, causal source or outcome relation. |
| Resend auth emails | A for account infrastructure, out of scope | Actual provider message IDs exist in service responses, but these are authentication flows, not business Actions. |
| Twilio/telephony provisioning | A/C integration operation, out of scope | Provider requests and local records exist, but no Stage 7 action history or business evidence semantics. |
| Calendar booking | E — not implemented as verified | No booking creation route/provider receipt found. |
| Salesforce/HubSpot CRM creation | E — not verified | No supported CRM execution contract found. |
| Business SMS/WhatsApp | E/D — not verified as a coherent action | Provider libraries/configuration and model schemas do not establish a safe business message-send contract. |
| Campaign start/call attempts | A-like subsystem, separate product area | Real-looking campaign mutations and attempts exist, but not safe to surface as generic Actions without a dedicated audit. |

## 3. Real executable actions

The only defensible currently executable mutation in the requested domain is internal Lead creation/update under existing APIs. It is not an external action and cannot produce “CRM lead created,” “customer contacted,” “appointment booked,” or similar verified outcomes.

Outbound custom webhook delivery is real enough to require observability and security review, but its current asynchronous `dispatchWebhook` call is not a user/agent-triggerable action API. It has no unified execution receipt contract and must not be presented as a generic Action with a manual Run button.

## 4. Backend contracts

There is no `actions`, `action_definitions`, `action_executions`, `execution_evidence` or unified `outcomes` table/route in the inspected repository. Existing webhook deliveries and campaign attempts are domain-specific records with different semantics. No common input schema, execution state machine, receipt relation or retention policy exists.

## 5. ActionDefinition model

Conceptually required, but **not created** because no safe action registry exists. Future minimum fields should include tenant scope, stable type/version, display name, input schema, availability source, policy, provider connection reference and whether the action is internal or external. Do not infer definitions from LLM tool schemas.

## 6. ActionExecution model

Not present. A future record needs tenant scope, definition/version, causal conversation/lead IDs, idempotency key, validated input snapshot with secret redaction, explicit status, started/completed times, bounded failure code, retry attempt and actor/runtime source. `webhook_deliveries` and `campaign_attempts` cannot be silently relabeled as this model.

## 7. ExecutionEvidence model

Not present as a shared model. Future evidence should distinguish provider, response/accepted state, external ID, recorded time, safe reference and verification strength. Never invent an external ID from an HTTP request, internal Lead ID or model response.

## 8. Outcome semantics

No new outcome behavior. An inferred intent, Lead row, model tool call or HTTP initiation is not an outcome. A verified external outcome requires a linked successful execution plus sufficient provider evidence; current APIs do not establish that for calendar, CRM, SMS or appointment booking.

## 9. Tenant isolation

Existing authenticated Lead routes scope normal reads/updates by `req.user.id`. The Stage 6 detail work added tenant-qualified conversation joins. The custom webhook V1 controllers derive `businessId` from authenticated middleware and webhook deletion uses both ID and business. However, `twilio/save-lead` has a serious fallback: if it cannot resolve the tenant from phone/assistant data, it selects the first business. That path must be blocked or made explicitly tenant-bound before being considered an Action substrate.

## 10. Idempotency findings

V1 webhook registration and campaign mutations use `requireIdempotency`, but the inspected webhook delivery dispatcher generates `evt_<timestamp>_<random>` identifiers and does not expose a caller idempotency key or durable deduplication guarantee. Lead creation has multiple non-atomic paths and no general uniqueness/idempotency key. Do not retry mutating actions from a future UI until provider-safe idempotency is defined.

## 11. Retry findings

Webhook delivery retries asynchronously up to three times with exponential delays, but delivery retry is not the same as safe action retry and has no visible execution attempt relation. Lead and tool mutations do not provide a common retry contract. No manual or automatic retry was added.

## 12. Actions route/UI

**Not created.** The empty state requested by the brief would be honest, but without a real supported action list it would still make an Actions surface look productized without substance. Navigation remains unchanged: no Actions item, no Workflows item.

## 13. Action list / detail

Not created. There are no trustworthy ActionDefinitions to list and no supported action configuration surface to detail.

## 14. Execution history / detail

Not created. No synthetic rows, trace steps, evidence markers or success/failure history were added.

## 15. Conversation Action Trace integration

Not changed. Conversation Activity/Outcome remains truthful. There is no unified execution evidence to upgrade the right rail. Existing tool-call metrics and turn fields are observability details, not verified action history.

## 16. Lead integration

Not changed in Stage 7. Stage 6 continues to distinguish internal Lead records from external CRM outcomes. Lead creation is not shown as an ActionExecution or verified external result.

## 17. Overview integration

Not changed. No reliable tenant-scoped verified-outcome aggregation exists, so no future outcome area was activated.

## 18. Live execution verification

**Live execution unverified.** No authenticated, isolated, non-destructive action with a disposable external target and durable receipt was available. No SMS/email/customer message, appointment, CRM record or production webhook was sent for QA. No production data was mutated.

## 19. External evidence verified

None for business Actions. Webhook delivery code records provider HTTP response/error data for its existing event subsystem, but no live delivery was performed during this audit and it is not a general ActionExecution evidence contract.

## 20. Security findings

- `twilio/save-lead` can choose the first workspace when business resolution fails; this is a cross-tenant mutation risk and a hard blocker.
- Tool schema arguments are not a tenant authorization boundary. Runtime action dispatch must derive tenant and actor from authenticated call context, never model arguments.
- Webhook registration masks local/private hosts but needs broader SSRF/DNS-rebinding review before arbitrary business execution is expanded.
- Webhook signing secrets are returned by `createWebhook`; review whether the secret should be shown only once and whether logs can expose it.
- Webhook delivery stores response bodies and payloads; retention/redaction of contact data and secrets is not defined.
- Raw provider errors are exposed by several legacy routes; a unified safe error taxonomy is needed before UI surfacing.
- Shared authentication still contains the previously documented hardcoded JWT fallback secret.

## 21. Historical-data handling

No ActionExecution backfill or outcome promotion was performed. Legacy Lead/outcome values remain unverified. Existing webhook delivery/campaign rows must not be reclassified as execution evidence without deterministic causal linkage.

## 22. Mobile/browser/build validation

No Actions UI was justified, so the required Actions screenshots were not manufactured. No Stage 7 browser surface exists to validate. Frozen prior surfaces remain unchanged; Stage 6 validation is the relevant current regression baseline.

## 23. Remaining blockers

1. Establish one real, narrow, tenant-scoped action contract—preferably an internal Bavio mutation or isolated test webhook—with explicit input validation and actor context.
2. Add durable ActionDefinition/ActionExecution/Evidence contracts only after selecting that action; do not build a generic registry first.
3. Remove the first-business fallback from signed lead ingestion and prove tenant binding.
4. Define idempotency and retry semantics before any mutating execution button or model retry.
5. Define evidence retention/redaction and safe provider error codes.
6. Separate account emails, provider setup, campaigns and webhooks from business Actions in the domain model.
7. Resolve the authentication fallback and live persistence blockers already recorded in Stages 5–6.

## 24. Recommended next step

Stage 8 should remain blocked until the product owner approves a specific real action and an isolated test target. The recommended first candidate is a tenant-scoped internal action that returns a persisted Bavio record ID, because it can be tested without sending real customer communications or creating an external appointment. Then add the smallest evidence contract and one read-only/operational trace before considering external providers.

## 25. Required screenshots

None. The Stage 7 brief explicitly prohibits manufactured screenshots when the Actions UI is blocked by lack of a real execution substrate.

## 26. Repository changes

Only this audit report was added for Stage 7. No application code, database migration, Actions UI, execution history, external call or production data mutation was performed.
