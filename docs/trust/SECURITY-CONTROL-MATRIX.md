# Bavio Security Control Matrix

| Control | Implementation evidence | Status | Customer responsibility | Remaining work |
|---|---|---|---|---|
| Tenant query scoping | V1 controllers/services pass tenant IDs in predicates | Implemented in audited paths | Use correct Workspace credentials | Complete legacy-route review |
| PostgreSQL RLS | Stage 7/8/9 SQL enables RLS on platform tables | Implemented on selected tables | Do not bypass service authorization | Audit policies in each deployed DB |
| Webhook secret protection | encrypted secret migration/service and signed delivery | Implemented for current path | Protect endpoint and rotate appropriately | Confirm production key management |
| Provider callback validation | Twilio signature middleware | Implemented on Twilio routes | Configure correct public callback URL | Test every provider path |
| SSRF-aware outbound webhook | URL validation, redirect rejection, timeout/pinning code | Implemented in webhook service | Use trusted destination | Independent security review |
| Action evidence | ActionExecution and ExecutionEvidence tables/services | Implemented for verified actions | Review business result, not only evidence | Expand coverage deliberately |
| Workflow idempotency | tenant/definition/key uniqueness and recovery | Implemented for Stage 8 runtime | Avoid unsafe manual replay | Remote verification evidence |
| Secrets in environment | provider keys read from env | Implemented pattern | Never commit or expose keys | Secret scanning and rotation process |
| Backups | Not proven by repository | Unknown | Define export/retention needs | Provider restore test |
