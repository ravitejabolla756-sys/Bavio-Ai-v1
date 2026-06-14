-- ═══════════════════════════════════════════════════════════════════
-- Bavio AI — Call Forwarding Schema Migration
-- Run this entire file in the Supabase SQL editor.
-- All statements use IF NOT EXISTS so it is safe to re-run.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Add columns to calls table ──────────────────────────────────────
ALTER TABLE calls
ADD COLUMN IF NOT EXISTS bavio_number TEXT DEFAULT NULL;

ALTER TABLE calls
ADD COLUMN IF NOT EXISTS routing_method TEXT DEFAULT NULL
  CHECK (routing_method IN ('caller_id', 'direct', 'sip') OR routing_method IS NULL);

ALTER TABLE calls
ADD COLUMN IF NOT EXISTS user_original_number TEXT DEFAULT NULL;

-- ── 2. Add columns to businesses table ─────────────────────────────────
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS number_setup_type TEXT DEFAULT NULL
  CHECK (number_setup_type IN ('forwarding', 'dedicated', 'pending')
         OR number_setup_type IS NULL);

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS original_phone_number TEXT DEFAULT NULL;

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS forwarding_activated_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS phone_number_verified BOOLEAN DEFAULT FALSE;

-- ── 3. Add columns to phone_numbers table ──────────────────────────────
ALTER TABLE phone_numbers
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'pool'
  CHECK (type IN ('pool', 'forwarding', 'dedicated', 'sip_trunk'));

ALTER TABLE phone_numbers
ADD COLUMN IF NOT EXISTS user_original_number TEXT DEFAULT NULL;

ALTER TABLE phone_numbers
ADD COLUMN IF NOT EXISTS forwarding_status TEXT DEFAULT 'pending'
  CHECK (forwarding_status IN ('pending', 'active', 'failed', 'disabled'));

ALTER TABLE phone_numbers
ADD COLUMN IF NOT EXISTS call_routing_method TEXT DEFAULT 'caller_id'
  CHECK (call_routing_method IN ('caller_id', 'direct', 'sip'));

ALTER TABLE phone_numbers
ADD COLUMN IF NOT EXISTS pool_user_count INTEGER DEFAULT 0;

ALTER TABLE phone_numbers
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 50;

ALTER TABLE phone_numbers
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'exotel'
  CHECK (provider IN ('exotel', 'twilio'));

ALTER TABLE phone_numbers
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'IN';

-- ── 4. Create pool_assignments table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS pool_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_number_id UUID NOT NULL REFERENCES phone_numbers(id),
  business_id UUID NOT NULL REFERENCES businesses(id),
  user_original_number TEXT NOT NULL,
  forwarding_code TEXT NOT NULL,
  forwarding_status TEXT DEFAULT 'pending'
    CHECK (forwarding_status IN ('pending', 'active', 'failed', 'disabled')),
  activated_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id)
);

-- ── 5. Create call_routing table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS call_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bavio_number TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id),
  routing_method TEXT NOT NULL
    CHECK (routing_method IN ('caller_id', 'direct', 'sip')),
  user_original_number TEXT DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_routing_bavio_number
  ON call_routing(bavio_number);

CREATE INDEX IF NOT EXISTS idx_pool_assignments_business
  ON pool_assignments(business_id);

-- ── 6. Stored procedures ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_pool_user_count(
  pool_number_id UUID,
  amount INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE phone_numbers
  SET pool_user_count = pool_user_count + amount,
      updated_at = NOW()
  WHERE id = pool_number_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_pool_user_count(
  pool_number_id UUID,
  amount INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE phone_numbers
  SET pool_user_count = GREATEST(0, pool_user_count - amount),
      updated_at = NOW()
  WHERE id = pool_number_id;
END;
$$ LANGUAGE plpgsql;

-- ── 7. Seed pool numbers ───────────────────────────────────────────────
-- IMPORTANT: Replace these with your actual Exotel numbers after purchase
INSERT INTO phone_numbers
  (phone_number, type, provider, country_code,
   status, pool_user_count, max_users, call_routing_method)
VALUES
  ('+919513888383', 'pool', 'exotel', 'IN', 'active', 0, 50, 'caller_id'),
  ('+914041893150', 'pool', 'exotel', 'IN', 'active', 0, 50, 'caller_id'),
  ('+918080810003', 'pool', 'exotel', 'IN', 'active', 0, 50, 'caller_id'),
  ('+918080810004', 'pool', 'exotel', 'IN', 'active', 0, 50, 'caller_id'),
  ('+918080810005', 'pool', 'exotel', 'IN', 'active', 0, 50, 'caller_id')
ON CONFLICT DO NOTHING;
