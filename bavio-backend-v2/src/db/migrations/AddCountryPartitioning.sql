-- ══════════════════════════════════════════════════════════════════════
-- Migration: Add Country Partitioning & Scaling Optimizations
-- Description: Partitions calls table by country, creates optimized composite indexes,
--              and sets up the metrics materialized view.
-- ══════════════════════════════════════════════════════════════════════

-- 1. Drop dependent tables to recreate calls partitioned
DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS calls CASCADE;

-- 2. Create calls table partitioned by list (country_code)
CREATE TABLE calls (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    country_code CHAR(2) NOT NULL,
    call_sid VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    from_number VARCHAR(20),
    to_number VARCHAR(20),
    virtual_number VARCHAR(20),
    duration_seconds INT DEFAULT 0,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    status call_status_type,
    cost_amount DECIMAL(10, 4) DEFAULT 0.0000,
    cost_currency CHAR(3) DEFAULT 'USD',
    recording_url TEXT,
    transcript TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, country_code),
    CONSTRAINT unique_call_sid_country UNIQUE (call_sid, country_code),
    CONSTRAINT check_calls_country_code CHECK (country_code IN ('IN', 'US', 'GB', 'AU', 'AE')),
    CONSTRAINT check_calls_provider CHECK (provider IN ('exotel', 'twilio'))
) PARTITION BY LIST (country_code);

-- 3. Create partitions by country
CREATE TABLE calls_in PARTITION OF calls FOR VALUES IN ('IN');
CREATE TABLE calls_us PARTITION OF calls FOR VALUES IN ('US');
CREATE TABLE calls_gb PARTITION OF calls FOR VALUES IN ('GB');
CREATE TABLE calls_au PARTITION OF calls FOR VALUES IN ('AU');
CREATE TABLE calls_ae PARTITION OF calls FOR VALUES IN ('AE');
CREATE TABLE calls_default PARTITION OF calls DEFAULT;

-- 4. Recreate usage_logs with composite foreign key referencing partitioned calls table
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    country_code CHAR(2) NOT NULL,
    call_id UUID,
    minutes_used DECIMAL(10, 2) DEFAULT 0.00,
    stt_minutes DECIMAL(10, 2) DEFAULT 0.00,
    tts_characters INT DEFAULT 0,
    cost_stt DECIMAL(10, 4) DEFAULT 0.0000,
    cost_tts DECIMAL(10, 4) DEFAULT 0.0000,
    cost_telephony DECIMAL(10, 4) DEFAULT 0.0000,
    cost_total DECIMAL(10, 4) DEFAULT 0.0000,
    currency_code CHAR(3) DEFAULT 'USD',
    billing_month INT NOT NULL,
    billing_year INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_usage_country_code CHECK (country_code IN ('IN', 'US', 'GB', 'AU', 'AE')),
    CONSTRAINT check_usage_currency_code CHECK (currency_code IN ('INR', 'USD', 'GBP', 'AUD', 'AED')),
    CONSTRAINT check_usage_month CHECK (billing_month BETWEEN 1 AND 12),
    CONSTRAINT check_usage_year CHECK (billing_year >= 2026),
    CONSTRAINT fk_usage_logs_call FOREIGN KEY (call_id, country_code) REFERENCES calls(id, country_code) ON DELETE SET NULL
);

-- 5. Create Indexes for Pruning & Query Optimization
CREATE INDEX idx_calls_user_country 
ON calls(user_id, country_code, created_at DESC);

CREATE INDEX idx_subscriptions_status_country
ON subscriptions(payment_status, country_code, next_billing_date);

CREATE INDEX idx_virtual_numbers_country
ON virtual_numbers(country_code, status);

CREATE INDEX idx_users_country_status
ON users(country_code, status, created_at DESC);

-- Recreate usage_logs indexes
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_billing_period ON usage_logs(billing_month, billing_year);
CREATE INDEX idx_usage_logs_country_code ON usage_logs(country_code);

-- 6. Create Materialized View for Metrics
DROP MATERIALIZED VIEW IF EXISTS metrics_by_country;
CREATE MATERIALIZED VIEW metrics_by_country AS
SELECT 
  u.country_code,
  COUNT(DISTINCT u.id) as total_customers,
  COUNT(DISTINCT cal.id) as total_calls,
  COALESCE(SUM(s.price_amount), 0) as monthly_revenue,
  COALESCE(AVG(s.price_amount), 0) as avg_arpu,
  NOW() as last_calculated_at
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.payment_status = 'active'
LEFT JOIN calls cal ON u.id = cal.user_id AND u.country_code = cal.country_code
GROUP BY u.country_code;

-- Unique index to allow concurrent refreshes
CREATE UNIQUE INDEX idx_metrics_by_country_code ON metrics_by_country(country_code);
