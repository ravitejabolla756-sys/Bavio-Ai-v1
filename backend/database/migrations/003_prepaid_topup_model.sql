-- ══════════════════════════════════════════════════════════════════════
-- Migration 003: Prepaid Top-Up Billing Model
-- Switches usage tracking from minutes to seconds.
-- Adds top-up balance and dedicated transaction table.
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. Add second-based usage tracking to businesses ─────────────────
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS monthly_limit_seconds   INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS monthly_usage_seconds   INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS topup_balance_seconds   INTEGER DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS last_renewal_event_id   VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS last_usage_update_at    TIMESTAMPTZ;

-- Backfill monthly_limit_seconds from existing minutes_limit (1 min = 60 sec)
UPDATE businesses
SET monthly_limit_seconds = COALESCE(minutes_limit, 0) * 60
WHERE monthly_limit_seconds = 0 AND minutes_limit IS NOT NULL;

-- Backfill monthly_usage_seconds from existing minutes_used
UPDATE businesses
SET monthly_usage_seconds = COALESCE(minutes_used, 0) * 60
WHERE monthly_usage_seconds = 0 AND minutes_used IS NOT NULL AND minutes_used > 0;

-- ── 2. Create topup_transactions table ───────────────────────────────
CREATE TABLE IF NOT EXISTS topup_transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID REFERENCES businesses(id) ON DELETE CASCADE,
    dodo_payment_id     VARCHAR(255) UNIQUE,
    dodo_product_id     VARCHAR(255),
    topup_type          VARCHAR(50),        -- 'topup_100' or 'topup_250'
    minutes_added       INTEGER NOT NULL DEFAULT 0,
    seconds_added       INTEGER NOT NULL DEFAULT 0,
    amount              DECIMAL(10,2),
    currency            VARCHAR(10) DEFAULT 'USD',
    payment_status      VARCHAR(50) DEFAULT 'pending',
    webhook_event_id    VARCHAR(255) UNIQUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    applied_at          TIMESTAMPTZ
);

-- ── 3. Create blocked_calls log table ────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_calls (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID REFERENCES businesses(id) ON DELETE CASCADE,
    phone_number_id     INTEGER,
    provider_call_sid   VARCHAR(255),
    blocked_reason      VARCHAR(100) DEFAULT 'usage_exhausted',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Indices ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_topup_transactions_business_id   ON topup_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_topup_transactions_dodo_payment  ON topup_transactions(dodo_payment_id);
CREATE INDEX IF NOT EXISTS idx_topup_transactions_webhook_event ON topup_transactions(webhook_event_id);
CREATE INDEX IF NOT EXISTS idx_blocked_calls_business_id        ON blocked_calls(business_id);
CREATE INDEX IF NOT EXISTS idx_blocked_calls_call_sid           ON blocked_calls(provider_call_sid);
CREATE INDEX IF NOT EXISTS idx_businesses_monthly_seconds       ON businesses(monthly_limit_seconds, monthly_usage_seconds);
