-- ══════════════════════════════════════════════════════════════════════
-- Migration: Add Monitoring & Analytics Support
-- Description: Creates daily_metrics and system_alerts tables.
-- ══════════════════════════════════════════════════════════════════════

-- 1. Daily Metrics Table
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    
    -- JSONB fields for regional metrics breakdown
    customers_by_country JSONB NOT NULL DEFAULT '{}'::jsonb,
    mrr_by_country JSONB NOT NULL DEFAULT '{}'::jsonb,
    calls_by_country JSONB NOT NULL DEFAULT '{}'::jsonb,
    churn_by_country JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Globally aggregated metrics
    total_customers INT NOT NULL DEFAULT 0,
    total_mrr_usd DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_calls INT NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for auto-updating updated_at on daily_metrics
DROP TRIGGER IF EXISTS update_daily_metrics_updated_at ON daily_metrics;
CREATE TRIGGER update_daily_metrics_updated_at 
    BEFORE UPDATE ON daily_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(metric_date);

-- 2. System Alerts Incident Log Table
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity VARCHAR(20) NOT NULL, -- 'INFO', 'WARNING', 'CRITICAL'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action VARCHAR(255),
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' -- 'active', 'resolved'
);

CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_triggered ON system_alerts(triggered_at DESC);
