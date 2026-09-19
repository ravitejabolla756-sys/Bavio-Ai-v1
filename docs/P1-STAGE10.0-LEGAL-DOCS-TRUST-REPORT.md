# BAVIO — P1 Stage 10.0 Legal + Documentation + Trust Foundation Report

**Date:** 2026-09-14  
**Repository:** `C:\Startup\bavio-backend`  
**Scope:** documentation-only audit and Markdown drafts  
**Runtime/database/frontend behavior:** unchanged  
**Publication/deployment:** none

## 1. Repository audit

Audited the backend and frontend package manifests, frontend app routes, backend routes, SQL schema/migrations, authentication helpers, billing controllers/components, voice/provider adapters, Supabase configuration/storage service, webhook/action/workflow services, Knowledge and Lead paths, browser storage, existing legal pages, support/contact copy, and documentation history.

The canonical application is a Next.js frontend and Node/Express backend. The backend uses `pg`, Supabase client libraries, WebSockets, Twilio, and provider adapters. The frontend has dashboard surfaces for Overview, Conversations/Calls, Leads, Agents, Knowledge, Actions, Workflows, Analytics, Phone Numbers, Integrations, Settings, and Billing.

## 2. Provider inventory

| Provider/integration | Evidence | Documentation treatment |
|---|---|---|
| Supabase | backend config, `@supabase/supabase-js`, PostgreSQL and Storage calls | Active platform dependency; region remains unknown |
| Twilio | telephony provider, Phone Number, callbacks, WebSocket path | Active/configurable telephony path |
| Deepgram | modular STT adapter and voice config | Configurable STT |
| ElevenLabs | modular TTS adapter and voice config | Configurable TTS |
| Cerebras | primary LLM router/config | Configurable primary LLM |
| Groq | fallback LLM/router/config | Configurable fallback LLM |
| OpenAI | current/modular LLM, STT/TTS service paths | Configurable provider path |
| Sarvam | STT/LLM/TTS adapters | Optional/configurable path |
| Resend | email service | Configured email path; contract/location unknown |
| Dodo | billing webhook/controller path | Billing path; final commercial terms unknown |

Razorpay appears as a retired order path. Several CRM/helpdesk/marketing integrations appear in UI copy but are not documented as active providers because activation was not proven.

## 3. Data inventory

The detailed inventory is [DATA-INVENTORY.md](trust/DATA-INVENTORY.md). The repository supports collection or processing of account/Workspace data, Phone Number and caller metadata, Conversation/call records, transcript and recording references where configured, Agent/Knowledge/prompt content, AI outputs, Leads, ActionExecution, ExecutionEvidence, WorkflowExecution, webhook metadata, usage/billing state, and browser authentication/preferences.

Retention is not one global configured policy. TTS cleanup paths exist, including a 24-hour cleanup routine and call-end cleanup. A complete deletion schedule for all categories is not established.

## 4. Data-flow inventory

The documented high-level flow is [DATA-FLOW.md](trust/DATA-FLOW.md): caller → configured telephony → Bavio voice runtime → STT → LLM → TTS → Conversation persistence → optional understanding → Lead → Action/Evidence → Workflow → configured webhook. Provider paths are optional/configuration-dependent. The Stage 9 canonical event boundary does not automatically start a Workflow.

## 5. Legal documents created

Created under `docs/legal/`:

- `TERMS-OF-SERVICE.md`
- `PRIVACY-POLICY.md`
- `COOKIE-POLICY.md`
- `ACCEPTABLE-USE-POLICY.md`
- `BILLING-SUBSCRIPTION-TERMS.md`
- `REFUND-CANCELLATION-POLICY.md`
- `AI-AUTOMATION-DISCLOSURE.md`
- `CALL-RECORDING-CONSENT.md`
- `TELECOMMUNICATIONS-TERMS.md`
- `DATA-PROCESSING-ADDENDUM.md`
- `SUBPROCESSORS.md`
- `API-TERMS.md`
- `SERVICE-LEVEL-POLICY.md`
- `LEGAL-PLACEHOLDERS.md`
- `README.md`

Every legal draft is marked `Draft for legal review` and contains a review section.

## 6. Trust documents created

Created under `docs/trust/`: `SECURITY.md`, `TRUST-CENTER.md`, `DATA-RETENTION.md`, `INCIDENT-RESPONSE.md`, `VULNERABILITY-DISCLOSURE.md`, `INFRASTRUCTURE.md`, `BACKUP-RECOVERY.md`, `DATA-FLOW.md`, `DATA-INVENTORY.md`, `SECURITY-CONTROL-MATRIX.md`, and `CUSTOMER-RESPONSIBILITIES.md`.

The Trust Center distinguishes observed controls from formal third-party certifications. No certification is claimed.

## 7. Product documents created

Created under `docs/product/`: Getting Started, Agents, Knowledge, Phone Numbers, Provider Connections, Conversations, Leads, Actions, Workflows, Webhooks, Analytics, Billing, and Settings.

The product docs describe Workflows as the currently verified immutable ordered runtime/read surface, list only `bavio.lead.create` and `bavio.webhook.deliver` as verified actions, and avoid documenting a workflow builder, branches, loops, CRM/calendar/SMS actions, or automatic triggers.

## 8. Developer documents created

Created under `docs/developers/`: API Overview, Authentication, Webhooks, Errors, Rate Limits, and Integrations. The API overview is limited to customer/developer-facing V1 categories observed in `backend/routes/v1/index.js`; internal verification and provider callback routes are excluded.

## 9. Support documents created

Created under `docs/support/`: FAQ, Troubleshooting, Support Policy, and Privacy Requests. Contacts remain placeholders.

## 10. Compliance claims intentionally excluded

The generated docs do not claim third-party security certifications, regulated-sector compliance, payment-card certification, availability commitments, data-loss prevention guarantees, zero human access, perfect AI accuracy, or universal legal compliance. The current frontend’s unsupported claims remain untouched because this stage is documentation-only; they must be reviewed before publication.

## 11. Unknown legal/company fields

The repository does not establish the legal entity, registered address, incorporation country, governing law, dispute jurisdiction, effective dates, privacy/legal/support/security emails, payment processor legal entity, hosting region, DPA contact, incident deadline, SLA, support targets, refund rules, or retention periods. These are listed in [LEGAL-PLACEHOLDERS.md](legal/LEGAL-PLACEHOLDERS.md).

## 12. Retention gaps

No universal retention schedule was proven for account, Conversation, transcript, recording, Lead, Knowledge, ActionExecution, ExecutionEvidence, WorkflowExecution, or logs. TTS cleanup is a targeted implementation, not a complete data-retention policy. The drafts use “Retention policy requires product/legal configuration” rather than inventing periods.

## 13. Deletion gaps

Targeted storage and webhook/key deletion functions exist, but a complete tenant-wide account/data deletion or export workflow was not verified. Privacy Requests therefore describe a request process with `[PRIVACY_EMAIL]` and do not claim self-service deletion.

## 14. Consent and telecommunications findings

Customers must determine caller notices, recording consent, opt-outs, DND/DNC obligations, lawful calling basis, caller identification, number ownership, geographic restrictions, and emergency-service limitations. The repository does not make recording lawful or prove that every call is recorded.

## 15. Cookie findings

Observed browser state includes authentication/onboarding cookies, localStorage Bavio token/client/name/theme/auth-message values, and sessionStorage country selection. No analytics or advertising pixel was established by this audit. The existing footer references `/cookie-policy`, while the inspected app routes include `/legal/cookies`; this route mismatch is a publication/readiness issue and was not changed.

## 16. Billing and refund findings

The code contains plan/usage/minute/top-up/subscription concepts, Dodo billing webhook handling, and a retired Razorpay order path. Final prices, taxes, renewal, proration, refund windows, credits, and processor terms are not safely inferable. The billing and refund drafts remain placeholder-driven.

## 17. Subprocessors

The draft list includes Supabase, Twilio, Deepgram, ElevenLabs, Cerebras, Groq, OpenAI, Sarvam, Resend, and Dodo because corresponding code/configuration paths were found. It separates configured/optional use conceptually and marks region/legal-link/activation facts for confirmation. UI-only integrations and retired paths are not presented as active subprocessors.

## 18. Security controls

The audit found tenant predicates, selected RLS, environment-based secrets, encrypted webhook-secret storage, provider signature validation, signed outbound webhooks, URL/SSRF protections, ActionExecution/Evidence, workflow idempotency, and fail-closed paths. Coverage varies across legacy/parallel routes. Backup, monitoring, restore testing, incident operations, and production configuration are not proven by repository code.

## 19. Public-page recommendations

Do not publish these drafts or modify legal routes until founder and counsel review is complete. Before publication, reconcile `/legal/terms`, `/legal/privacy`, `/legal/security`, `/legal/cookies`, `/legal/refund-policy`, and footer links with the approved Markdown; remove unsupported existing claims; choose final contacts and effective dates; and add only verified Subprocessor/Trust Center content.

## 20. Legal-review blockers

Counsel must review entity/contract language, controller/processor roles, regional privacy notices, transfers, recording/AI disclosure, telecommunications duties, acceptable-use enforcement, liability/indemnity, refunds, DPA, incident notification, deletion, subprocessors, SLA, support, and public claims.

## 21. Launch blockers

Before a documentation package can be treated as launch-ready, Bavio needs founder input for all placeholders, provider contracts/regions, a complete retention/deletion decision, verified billing/refund terms, support/security contacts, production route reconciliation, review of current frontend legal claims, and legal approval. This stage does not claim any of those are complete.

## 22. Validation

- Generated-doc internal links were checked; the new documentation links resolve after this report exists.
- Generated-doc unsupported-claim scan is clean for the prohibited phrase list.
- Cross-document terminology uses Bavio, Agent, Conversation, Lead, Action, ActionExecution, ExecutionEvidence, Workflow, WorkflowExecution, Knowledge, Phone Number, Provider Connection, and Workspace.
- No runtime, database, migration, auth, telephony, billing, frontend, deployment, or publication changes were made.

## 23. Files created

Documentation home: `docs/README.md`.  
Legal: 15 files.  
Trust: 11 files.  
Product: 13 files.  
Developers: 6 files.  
Support: 4 files.  
This report: 1 file.

**Stage 10.0 is a documentation foundation draft only. It is not legal approved, compliance approved, or published.**
