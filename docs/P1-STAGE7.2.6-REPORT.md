# BAVIO P1 Stage 7.2.6 — Real verification results, 2026-09-09

STAGE 7.3 ACTIONS UI: AUTHORIZED

This gate authorizes the next stage only. No Actions UI was implemented. Results below supersede the historical blocked report retained at the end.

## Target and read-only preflight

Authenticated dashboard confirmed project **bavio-verification**, reference **qninimnubfjmyriafdgj**. Local verification configuration was checked for exact host equality before connection. Direct PostgreSQL is IPv6-only and this machine returned ENETUNREACH. The dashboard-provided IPv4 session pooler was used instead, with project-scoped username, existing verification password and TLS. No credential was printed or changed. The test connection retains the existing rejectUnauthorized:false setting; certificate-chain verification remains an infrastructure limitation, not a production deployment recommendation.

A read-only transaction confirmed exactly the deterministic Tenant A and Tenant B businesses, UUID primary keys, required lead/webhook/delivery/action/evidence tables, Stage 7.2 fields, encrypted-secret fields, and the actual partial unique index on (business_id, action_type, idempotency_key) WHERE idempotency_key IS NOT NULL. Bootstrap was not rerun.

## Real application results

| Gate | Result and evidence |
| --- | --- |
| Lead success | PASS. Actual createBavioLead service persisted lead, bavio.lead.create execution, matching tenant and actual lead evidence ID, started/completed/recorded timestamps. A separate pool/reconnect verified persistence. |
| Invalid input | PASS. Empty phone rejected with LEAD_INPUT_INVALID and safe message; lead count unchanged, no execution for that invalid key, no false success or evidence. Validation failures intentionally occur before execution creation. |
| Lead idempotency | PASS. Sequential replay returned same lead; three concurrent same-key invocations returned one lead; joined database verification found exactly one evidence per execution. Tenant B using the same key produced an independent lead. |
| Tenant isolation | PASS for existing surfaces. Real getLeadContext/updateLead controllers returned 404 for Tenant A accessing Tenant B's lead; tenant-field update injection returned 400; missing identity returned 401. A real createBavioLead call with nested Tenant B fields remained owned by trusted Tenant A. |
| Action/evidence read denial | PASS. A real READ ONLY transaction using authenticated role returned no lead/action/evidence rows or permission denial. There is no action/evidence read API yet; positive tenant read access is not claimed. Backend owner access is trusted, not tenant RLS. |
| Encrypted configuration | PASS. Actual registerWebhook path generated synthetic secrets and persisted null plaintext, ciphertext, 12-byte nonce, 16-byte GCM tag and v1 version. Returned configuration omitted secret fields. |
| HTTPS success/signature | PASS. Actual executeBavioWebhook and default HTTP transport sent POST through localtunnel; receiver independently computed HMAC SHA-256(timestamp + '.' + raw body), validated correct secret and rejected a deliberately wrong secret. Receiver returned 204; execution and evidence persisted success/204. Outcome remains only 'Webhook accepted by configured endpoint.' |
| HTTP 500 | PASS. Receiver received exactly one signed request; execution failed and evidence persisted; no automatic retry. |
| Redirect | PASS. Receiver returned 302; execution failed; no /redirect-target request appeared during the matrix. |
| Timeout | PASS. /slow received one signed request and delayed 6.5 seconds; sender returned WEBHOOK_TIMEOUT with measured action duration below 10 seconds and failed state. |
| Webhook idempotency | PASS. Replaying successful invocation returned duplicate=true without increasing receiver count; one persisted evidence row. |
| Webhook cross-tenant | PASS. Real Tenant B configuration created; Tenant A invocation returned WEBHOOK_NOT_FOUND without network traffic. Code selects by both tenant and ID and rejects before resolveSigningSecret, so Tenant B secret was not decrypted by that invocation. |
| SSRF | PASS local production-validator regression suite: unsupported schemes, HTTPS requirement, loopback/private/link-local/metadata and private DNS answers rejected. Sensitive destinations were not probed. |
| Legacy migration | PASS. One explicitly authorized synthetic plaintext configuration fixture created, without fake action results. Dry run identified exactly that ID; migration encrypted one record and cleared plaintext; repeat found zero. A later fresh query confirmed unchanged ciphertext on another repeat and actual HTTPS signing succeeded. |
| Retry/auth regression | PASS scoped Stage 7 tests and source inspection: no retry scheduler in canonical sender, dispatch uses executeBavioWebhook; signed tenant resolution fails closed and no first-business fallback. |

## Execution details and limitations

Added reproducible verification harnesses under backend/scripts: verify-stage7-real.cjs, verify-stage7-https.cjs, verify-stage7-isolation.cjs. They use a real pg pool. The HTTPS/isolation harnesses bind that real pool at the database module boundary to avoid database/db.js import-time unrelated DDL and missing Supabase service-key initialization. No domain service logic or transport is mocked. General HTTP authentication was covered by the existing signature/tenant regression tests; this was a service/controller integration run, not a deployed API test.

First tunnel attempt had zero receiver requests and a failed timeout execution. Restarting with explicit --local-host 127.0.0.1 passed the four-endpoint matrix. The first legacy signing attempt also timed out; one explicit new invocation subsequently succeeded. These were manual test invocations, not automatic service retries. Failed records remain honestly recorded.

Fresh summary after HTTPS tests: 3 succeeded lead executions; 2 succeeded and 5 failed webhook executions; 10 encrypted configurations, 0 plaintext; 10 evidence rows. The final tenant-payload injection probe subsequently added one more real Tenant A lead/execution/evidence. Expected final totals therefore are 4 leads, 4 succeeded lead executions and 11 evidence rows. All data remains synthetic in the designated project.

## Regression and cleanup

- PASS: Stage 7.1, 7.2, 7.2.1, 7.2.6 local idempotency suite, Stage 6 (9/9), verification script syntax.
- Stage 7.2.2 and 7.2.5 are report/checklist stages with no standalone test scripts in this checkout. Their relevant live persistence/encryption/HTTPS checks are covered above; no nonexistent command is claimed to have passed.
- The empty-schema Stage 7.2.6 test was not rerun on the seeded project; the non-mutating preflight replaced it for this run.
- PASS: frontend npx tsc --noEmit and npm run build (84 pages). Build skips its own type/lint steps; TypeScript was separately executed, lint was not claimed.
- Stage 6 must run from backend cwd. Earlier root-cwd ENOENT failures were invocation errors, not established product defects.
- Both localtunnel processes were stopped; receiver closed in finally; port 18573 had no listener afterward. No public tunnel remains from this verification run.
- No production access, bootstrap mutation, Actions UI implementation, commit, push or deployment.

## Historical report (superseded)

# BAVIO P1 Stage 7.2.6 — Foundation Repair and Verification Gate

Status: **BLOCKED at the dedicated verification-database mutation gate**.

## Scope completed locally

- Added `backend/sql/000_canonical_fresh_schema.sql` as a non-destructive UUID `businesses` baseline with the runtime-required `assistants`, `phone_numbers`, `calls`, and `leads` tables.
- Made the fresh-run `api_keys` definition in `023_developer_platform_and_campaigns.sql` internally consistent by defining `key_hash` before altering its nullability.
- Added a verification-only migration runner that hard-fails unless the database host matches `qninimnubfjmyriafdgj`.
- Added stable lead idempotency-key validation and persistence to `bavio.lead.create`.
- Added fail-closed Twilio save-lead key derivation from `callSid` and `toolCall.id`.
- Added local tests covering sequential replay, concurrent replay, tenant scoping, missing/invalid keys, and failed-key replay.
- Added a fresh-schema verification test that checks UUID types, required tables, action/webhook columns, unique idempotency indexing, and foreign keys.

## Local evidence

The following passed:

- `node backend/test-stage7.1.cjs`
- `node backend/test-stage7.2.6-idempotency.cjs`
- `node backend/test-stage7.2.cjs`
- `node backend/test-stage7.2.1.cjs`
- `node --check` for all Stage 7.2.6 modified JavaScript files

The Stage 6 test command remains pre-existingly incompatible with this checkout's current file layout: it looks for `controllers/leadReads.js` and `controllers/leadsController.js` at the repository root while the files are under `backend/controllers/`. No Stage 6 files were changed for this slice.

## Dedicated verification database

- Intended project: `bavio-verification`
- Exact reference: `qninimnubfjmyriafdgj`
- Production systems were not accessed.
- The first connection attempt could not resolve the Supabase host inside the sandbox (`ENOTFOUND`) before SQL execution.
- The required escalated retry was rejected by the execution policy because it would mutate a remote Supabase database. Therefore no migration, synthetic record, webhook, or HTTPS receiver verification was performed.

## Deferred gates

- Fresh schema applied to the verification project
- Real Tenant A/B lead persistence and idempotency proof
- ActionExecution and ExecutionEvidence proof
- Encrypted webhook persistence and legacy-secret migration proof
- Ephemeral HTTPS receiver and localtunnel delivery proof
- Stage 7.2.5 regression matrix

STAGE 7.3 ACTIONS UI: BLOCKED — remote verification-project migration was not permitted by the execution policy, so the required live schema, persistence, encryption, and HTTPS gates remain unproven.

No Actions UI, production operation, AWS mutation, commit, push, or deployment was performed.
