-- Stage 6 read indexes. NOT applied by this task.
-- Operator preflight: verify the reconciled UUID/business_id schema and
-- created_at TIMESTAMPTZ. Run individually outside a transaction because these
-- are concurrent builds. Check pg_index.indisvalid after any interrupted build;
-- IF NOT EXISTS alone does not repair an invalid index. Review EXPLAIN ANALYZE
-- on representative tenant sizes before launch. No lead rows are modified.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_context_page
  ON leads (business_id, (COALESCE(created_at, '-infinity'::timestamptz)) DESC, (id::text) DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_context_status_page
  ON leads (business_id, status, (COALESCE(created_at, '-infinity'::timestamptz)) DESC, (id::text) DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_context_identity
  ON leads (business_id, (id::text));
