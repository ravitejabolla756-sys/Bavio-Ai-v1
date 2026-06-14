-- ══════════════════════════════════════════════════════════════════════
-- File: Multi-Country Scaling Query Optimizations
-- Description: Contains query examples, explain plans, and caching hooks for
--              fast multi-country SaaS operations at scale.
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. INDEXING FOR FAST FILTERING ──

-- Optimized composite index for user-specific calls filtered by country
-- Ensures user dashboard operations are sub-second by isolating country and sorting chronologically
CREATE INDEX IF NOT EXISTS idx_calls_user_country 
ON calls(user_id, country_code, created_at DESC);

-- Index for payment checks and subscription billing dates
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_country
ON subscriptions(payment_status, country_code, next_billing_date);

-- Index for provisioning virtual numbers by country
CREATE INDEX IF NOT EXISTS idx_virtual_numbers_country
ON virtual_numbers(country_code, status);

-- Index for country aware signup verification and active counts
CREATE INDEX IF NOT EXISTS idx_users_country_status
ON users(country_code, status, created_at DESC);


-- ── 2. PARTITION PRUNING PATTERNS ──

-- Partitioning the calls table by list ensures that queries targeting a specific country
-- only scan the relevant child partition.
-- To verify partition pruning is active, run:
-- EXPLAIN ANALYZE SELECT * FROM calls WHERE country_code = 'IN';


-- ── 3. MATERIALIZED VIEW FOR DASHBOARD SCALING ──

-- pre-calculates and caches metrics to avoid full table scans on users/calls/subscriptions
CREATE MATERIALIZED VIEW IF NOT EXISTS metrics_by_country AS
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

-- A unique index on the country_code column is required for concurrent refreshes
CREATE UNIQUE INDEX IF NOT EXISTS idx_metrics_by_country_code ON metrics_by_country(country_code);

-- Concurrent refresh command (prevents blocking reads during updates)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY metrics_by_country;


-- ── 4. QUERY EXAMPLES ──

-- Query 1: Get all users for a country (Uses index: idx_users_country_status)
SELECT id, email, business_name, subscription_plan
FROM users
WHERE country_code = 'IN'
  AND status = 'active'
ORDER BY created_at DESC;

-- Query 2: Get active subscriptions by country (Uses index: idx_subscriptions_status_country)
SELECT u.email, s.plan_name, s.price_amount, s.next_billing_date
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.country_code = 'IN'
  AND s.payment_status = 'active'
ORDER BY s.next_billing_date ASC;

-- Query 3: Get call volume for user in last 7 days (Uses index: idx_calls_user_country and partition pruning)
SELECT COUNT(*) as calls_count, COALESCE(SUM(duration_seconds), 0) as total_seconds
FROM calls
WHERE user_id = $1
  AND country_code = $2
  AND created_at > NOW() - INTERVAL '7 days';
