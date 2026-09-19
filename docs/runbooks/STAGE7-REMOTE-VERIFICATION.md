# Stage 7 operator migration bundle

TARGET PROJECT: **bavio-verification**

PROJECT REF: **qninimnubfjmyriafdgj**

NEVER RUN AGAINST: **Bavio.ai production**

Prepared locally only. Codex has not executed this bundle remotely. SQL cannot authenticate the project reference: checking the selected dashboard project or connection host is mandatory. Do not infer identity from a database name such as `postgres`.

## Exact operator order

1. Confirm the project name and exact reference above in the dashboard or connection configuration. Stop on any mismatch. Use the database owner for this isolated test; never put its credentials in a browser client or report.
2. Inspect public relations using the read-only query below. Expect zero rows. Existing public types `business_status` and `plan_type` also block bootstrap. Never delete existing objects to make the guard pass.
3. Execute the entire `supabase/verification/stage7-verification-bootstrap.sql` in one SQL editor execution/session. Expect a successful COMMIT. With psql use `-X -v ON_ERROR_STOP=1 -f supabase/verification/stage7-verification-bootstrap.sql` and an independently verified connection. Never run individual source blocks.
4. Execute `supabase/verification/stage7-verification-audit.sql`. Compare all result sets with the expectations below; missing objects may cause the audit to error and require stopping.
5. Only after a matching audit, execute the entire `supabase/verification/stage7-verification-seed.sql` once.
6. Inspect the two returned tenants. Rerun the audit: businesses count must be 2; leads, webhooks, action_executions and execution_evidence remain 0. All other tables remain empty.
7. Stop if anything differs. On SQL error issue ROLLBACK in that session, retain the error, and return for diagnosis. Do not reset, partially replay, or edit around a guard.
8. Return to Codex with audit results and errors, if any, for real application service verification. Do not share connection strings, passwords, signing secrets, or encryption keys. This operation does not authorize Stage 7.3.

```sql
SELECT c.relname,c.relkind FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','S','f');
```

## Canonical derivation

Order: `000_canonical_fresh_schema.sql` in full; `023_developer_platform_and_campaigns.sql` sections 2 and 3 (webhooks and webhook_deliveries) verbatim; `028_bavio_lead_action_execution.sql`, `029_webhook_action_execution_fields.sql`, `030_webhook_secret_encryption.sql` in full. Each source boundary has a SHA-256 of its LF-normalized selected text.

The broader Stage 7.2.6 runner also includes unrelated platform/auth objects. This narrower dependency closure excludes 023 campaigns, providers/catalog seeds and API keys; 024 email verification; 026 password resets. 025 is redundant because 000 already defines pending_verification. 027 is a lead-read optimization, not a Stage 7 action dependency. Historical serial clients schema and destructive reconcile_schema are excluded. No canonical source migration or application service was changed for this bundle.

Regenerate locally with `node supabase/verification/generate-stage7-bundle.cjs`; check exact source parity with the same command plus `--check`. Generated output intentionally exceeds the usual source-file line guideline because it contains verbatim migration boundaries.

## Expected objects

Exactly nine public application tables, all initially empty: businesses, assistants, phone_numbers, calls, leads, webhooks, webhook_deliveries, action_executions, execution_evidence. Each has a UUID primary key. Tenant business_id/client_id columns are UUID. Two public enums: business_status (pending_verification, active, inactive, suspended, cancelled), plan_type (free, starter, pro, enterprise). pgcrypto exists, potentially already installed outside public. No application functions, views, sequences or triggers are created.

There are 22 canonical foreign keys: assistants 2; phone_numbers 3; calls 4; leads 3; businesses 2; webhooks 1; webhook_deliveries 2; action_executions 1; execution_evidence 4. Every business_id/client_id FK references businesses(id). Evidence references action_executions, webhooks and webhook_deliveries. Canonical action_executions lead_id/conversation_id have no FK; the bundle does not invent one. Tenant-consistent cross-record ownership still requires service verification.

`idx_action_executions_idempotency` is UNIQUE on `(business_id, action_type, idempotency_key)` WHERE `idempotency_key IS NOT NULL`; indisunique, indisvalid and indisready must all be true. NULL keys are schema-permitted; the lead service is responsible for rejecting missing/invalid keys. This is not the unrelated API idempotency_records table.

webhooks has nullable signing_secret (varchar 255), signing_secret_encrypted (text), signing_secret_version (varchar 20). action_executions has idempotency_key (text), attempt_count and duration_ms (integer). Evidence has webhook_configuration_id/delivery_id (UUID), http_status (integer), metadata (JSONB). The audit lists all primary/unique/supporting indexes; expected total is 30, including nine PKs, five baseline unique indexes and sixteen named supporting indexes.

## Security and verification limits

The bundle adds a clearly marked verification access envelope enabling RLS on all nine tables with no client policies. Domain DDL is otherwise verbatim. Use owner/backend access for later service checks; client-role access is intentionally unavailable. This follows [Supabase Data API security guidance](https://supabase.com/docs/guides/api/securing-your-api). No Auth users or credentials are created. Seeds contain only two synthetic tenants; no lead/action/evidence/delivery results are fabricated.

Static source parity, table inventory, ordering and FK dependency checks passed. Native PostgreSQL/psql and a running Docker engine were unavailable, so no PostgreSQL parser or actual migration execution was performed locally. SQL assumes PostgreSQL with PL/pgSQL, pgcrypto installation privileges and an empty public schema. Atomic bootstrap includes preflight and security envelope in one transaction. The guard cannot prevent an operator selecting the wrong empty project; confirm the project externally. No remote actions, commit, push or deployment were performed.
