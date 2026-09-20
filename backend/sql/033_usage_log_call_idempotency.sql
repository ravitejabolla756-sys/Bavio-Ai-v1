-- Migration 033: Usage Log Call Idempotency Anchor
-- Purpose: Add call_sid column and partial unique index for billing idempotency.
-- Multi-tenant note: Omits session foreign keys to preserve immutable ledger rows.

-- 1. Add call_sid column if it does not already exist
ALTER TABLE usage_logs
ADD COLUMN IF NOT EXISTS call_sid TEXT;

-- 2. Create partial unique index on call_sid for atomic idempotency claims
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_logs_call_sid_unique
ON usage_logs(call_sid)
WHERE call_sid IS NOT NULL;
