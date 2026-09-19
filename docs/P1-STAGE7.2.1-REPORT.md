# BAVIO P1 Stage 7.2.1 — Execution Hardening and Verification Report

Status: hardening implemented and locally verified. Real isolated database and real external HTTPS verification remain open because the available Supabase project/environment could not be proven isolated from customer production data.

1. **Isolated DB environment:** none used. The open browser project was not treated as safe solely from ambient browser state; no live database mutation was attempted.
2. **Migrations:** startup registration added for migration 030; no live migration was applied.
3. **Lead action live DB verification:** OPEN. Stage 7.1 unit/security coverage remains passing; no live persistence claim.
4. **Webhook action live DB verification:** OPEN. No live persistence claim.
5. **Controlled HTTPS receiver:** no external customer endpoint used. The existing controlled local test sink was retained for isolated transport checks; production validation still rejects loopback and HTTP.
6. **Real external success:** OPEN; not claimed.
7. **Real external failure:** OPEN; not claimed.
8. **Redirect verification:** locally verified with redirect-disabled request options; production sender uses `maxRedirects: 0`.
9. **SSRF regression:** local tests cover unsupported schemes, HTTP, loopback, metadata, private IPv4/IPv6, DNS resolution to private addresses, and redirect policy.
10. **Existing secret storage:** legacy `webhooks.signing_secret` was plaintext and lacked explicit version semantics.
11. **Encryption at rest:** new webhook secrets use AES-256-GCM with random nonce/authentication tag and a versioned encrypted value in `signing_secret_encrypted`.
12. **Key management:** `WEBHOOK_SECRET_ENCRYPTION_KEY` is required, supplied by environment, and must decode to 32 bytes. No source-code fallback exists. Version dispatch is explicit for future rotation.
13. **Plaintext migration:** migration 030 adds explicit fields; `scripts/migrate-webhook-secrets.js` requires `ALLOW_WEBHOOK_SECRET_MIGRATION=true`, encrypts legacy rows, writes version metadata, and nulls the plaintext column. It is not automatic.
14. **Secret leakage tests:** encryption, decrypt, tamper, wrong-key, API response, ActionExecution, ExecutionEvidence, and sanitized logging boundaries pass.
15. **Legacy retry findings:** the old sender performed up to three asynchronous attempts, persisted response bodies, and was reachable from calls, campaigns, and outcome extraction.
16. **Retry resolution:** the legacy retry sender was removed. All production event dispatch now invokes the canonical `bavio.webhook.deliver` service with one attempt; no automatic replay occurs after external success/database finalization failure.
17. **Canonical sender:** tenant lookup, configuration lookup, encrypted secret decryption, SSRF/DNS validation, pinned request, timeout, redirect policy, signing, ActionExecution, evidence, and safe logging are centralized.
18. **Idempotency:** the webhook action uses tenant/action/invocation uniqueness and handles duplicate/concurrent logical invocations. Real-DB verification remains OPEN.
19. **Distributed failure:** if external delivery succeeds but delivery/evidence persistence fails, the service reports `ACTION_FINALIZATION_FAILED` and never automatically resends.
20. **Execution reads:** no new unscoped execution read route was added; live tenant-read verification remains OPEN.
21. **Evidence reads:** no new unscoped evidence read route was added; live tenant-read verification remains OPEN.
22. **Files modified:** webhook sender/security/action services, encryption service, webhook controller sanitization, database startup runner, migration tooling, environment example, tests, and this report.
23. **Migrations added:** `030_webhook_secret_encryption.sql`.
24. **Tests:** Stage 7.2.1 encryption/retry tests, Stage 7.2 delivery/SSRF tests, Stage 7.1 security tests, and Stage 6 regression tests pass.
25. **Build:** frontend TypeScript and production build remain passing from Stage 7.2; no frontend files changed in this stage.
26. **Remaining risks:** live DB schema/persistence, controlled external HTTPS, operator-run plaintext migration, key rotation, and existing legacy plaintext rows until migration is explicitly run.
27. **Launch-blocker matrix:**
    - Signed tenant fallback — **RESOLVED**
    - Action DB migrations — **PARTIALLY RESOLVED** (code/startup runner; live application OPEN)
    - Lead action live DB persistence — **OPEN**
    - Webhook action live DB persistence — **OPEN**
    - Real external HTTPS delivery — **OPEN**
    - Webhook signing-secret encryption at rest — **PARTIALLY RESOLVED** (new writes encrypted; legacy rows require operator migration)
    - Legacy webhook retry path — **RESOLVED** (removed and routed through canonical one-attempt service)
    - Agents live DB persistence — **OPEN**
    - Knowledge live persistence — **OPEN**
    - Knowledge retrieval adoption — **OPEN**
    - Provider audio verification — **OPEN**
    - Authentication fallback risk — **OPEN**
28. **Stage 7.3 recommendation:** do not build Actions UI or Workflows. First provision/identify an explicitly isolated test database and controlled HTTPS receiver, apply migrations 028–030 there, run real Lead and webhook persistence/tenant-read checks, then perform one external success and one failure delivery verification.

## Validation commands

- `node --check services/webhookSecretEncryption.js`
- `node --check services/webhookService.js`
- `node --check services/bavioWebhookAction.js`
- `node --check scripts/migrate-webhook-secrets.js`
- `node test-stage7.2.1.cjs`
- `node test-stage7.2.cjs`
- `node test-stage7.1.cjs`
- `node test-stage6.cjs`

No commit, push, deployment, production schema mutation, production data mutation, customer webhook delivery, Actions UI, or workflow work was performed.
