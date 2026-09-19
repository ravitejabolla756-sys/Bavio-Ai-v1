# Bavio legal claim audit

**STATUS: Draft for founder and legal review**  
**Audited:** 2026-09-14  
**Scope:** repository evidence only; not legal advice

| Claim or topic | Repository evidence | Confidence | Action |
|---|---|---:|---|
| Tenant checks and selected RLS exist | `backend/sql/000_canonical_fresh_schema.sql`, tenant-aware services, and stage verification scripts | High | KEEP with narrow wording |
| Webhook secrets are encrypted before storage in the canonical path | `backend/services/webhookSecretEncryption.js`, migration `030_webhook_secret_encryption.sql` | High | KEEP with implementation qualifier |
| Provider callbacks use signature validation in supported paths | Twilio/Dodo callback middleware and verification tests | High | KEEP with provider/path qualifier |
| TLS is used by supported HTTPS endpoints | HTTPS URL validation and provider integrations | Medium | REWORD as “where implemented”; do not claim universal TLS version |
| Recording and transcripts exist for every call | Provider/session/storage paths vary | Low | REMOVE universal wording |
| Instant purge of all call records | No single complete deletion path established | Low | REMOVE; use deletion placeholder |
| End-to-end encryption / AES-256 for all data | No complete repository proof | Low | REMOVE |
| ISO, SOC, HIPAA, GDPR certification, or sovereign cloud | No certification or hosting-region proof | None | REMOVE |
| 99.9% or 99.99% uptime SLA | Existing UI text is not a contractual source | None | REMOVE; route to SLA placeholder |
| Monthly billing, overage, top-up expiry, or refund rules | Pricing/UI concepts exist, final commercial policy does not | Medium/low | PLACEHOLDER pending approval |
| Analytics or marketing cookies | No active vendor established in audit | Medium | REWORD as “not established”; re-audit on integration |
| 24-hour cleanup | Targeted TTS cleanup paths exist | High for that path | KEEP only for the observed cleanup path |
| HTTP success proves business outcome | Execution evidence semantics explicitly distinguish technical result from business result | High | KEEP |

## Publication gate

The public routes use a shared structured content source and intentionally preserve unresolved entity, commercial, retention, transfer, and contact decisions as placeholders. Founder and counsel must approve those values before publication.
