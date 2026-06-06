-- ══════════════════════════════════════════════════════════════════════
-- Migration 002: Billing Enhancements
-- Adds missing columns for payment tracking, invoicing, and plan changes
-- ══════════════════════════════════════════════════════════════════════

-- ── 1. Add business_id and plan tracking to payment_logs ─────────────
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS plan_name VARCHAR(50);
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS payment_type VARCHAR(30) DEFAULT 'subscription';
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS period_start TIMESTAMPTZ;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS period_end TIMESTAMPTZ;

-- ── 2. Add billing fields to businesses ──────────────────────────────
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS plan_changed_at TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS previous_plan VARCHAR(20);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMPTZ;

-- ── 3. Indices for performance ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payment_logs_dodo_payment_id ON payment_logs(dodo_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_business_id ON payment_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_dodo_customer_id ON payment_logs(dodo_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_dodo_customer_id ON businesses(dodo_customer_id);
CREATE INDEX IF NOT EXISTS idx_businesses_plan ON businesses(plan);

-- ── 4. Auto-generate invoice number function ─────────────────────────
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := 'BAV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('payment_logs_id_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_generate_invoice_number'
    ) THEN
        CREATE TRIGGER trigger_generate_invoice_number
        BEFORE INSERT ON payment_logs
        FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();
    END IF;
END;
$$;
