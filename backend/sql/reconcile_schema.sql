-- ── DROP EMPTY TABLES ────────────────────────────────────────────────
DROP TABLE IF EXISTS transcripts CASCADE;
DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS phone_numbers CASCADE;
DROP TABLE IF EXISTS assistants CASCADE;
DROP TABLE IF EXISTS pool_assignments CASCADE;
DROP TABLE IF EXISTS call_routing CASCADE;

-- ── 1. Create assistants table ──────────────────────────────────────
CREATE TABLE assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT,
    system_prompt TEXT,
    sarvam_config JSONB,
    welcome_message TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    agent_name VARCHAR(100),
    greeting TEXT,
    voice_id VARCHAR(50) DEFAULT 'meera',
    faqs JSONB DEFAULT '[]',
    industry VARCHAR(50),
    language VARCHAR(20) DEFAULT 'hi-IN',
    first_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to keep client_id and business_id in sync
CREATE OR REPLACE FUNCTION sync_assistant_ids()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.business_id IS NULL AND NEW.client_id IS NOT NULL THEN
        NEW.business_id := NEW.client_id;
    ELSIF NEW.client_id IS NULL AND NEW.business_id IS NOT NULL THEN
        NEW.client_id := NEW.business_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_sync_assistant_ids
BEFORE INSERT OR UPDATE ON assistants
FOR EACH ROW EXECUTE FUNCTION sync_assistant_ids();


-- ── 2. Create phone_numbers table ───────────────────────────────────
CREATE TABLE phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    assistant_id UUID REFERENCES assistants(id) ON DELETE SET NULL,
    phone_number VARCHAR(30) UNIQUE NOT NULL,
    number VARCHAR(30),
    provider VARCHAR(50) DEFAULT 'exotel',
    status VARCHAR(20) DEFAULT 'active',
    type TEXT DEFAULT 'pool' CHECK (type IN ('pool', 'forwarding', 'dedicated', 'sip_trunk')),
    user_original_number TEXT DEFAULT NULL,
    forwarding_status TEXT DEFAULT 'pending' CHECK (forwarding_status IN ('pending', 'active', 'failed', 'disabled')),
    call_routing_method TEXT DEFAULT 'caller_id' CHECK (call_routing_method IN ('caller_id', 'direct', 'sip')),
    pool_user_count INTEGER DEFAULT 0,
    max_users INTEGER DEFAULT 50,
    country_code TEXT DEFAULT 'IN',
    is_active BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION sync_phone_number_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync business_id / client_id
    IF NEW.business_id IS NULL AND NEW.client_id IS NOT NULL THEN
        NEW.business_id := NEW.client_id;
    ELSIF NEW.client_id IS NULL AND NEW.business_id IS NOT NULL THEN
        NEW.client_id := NEW.business_id;
    END IF;
    -- Sync phone_number / number
    IF NEW.number IS NULL AND NEW.phone_number IS NOT NULL THEN
        NEW.number := NEW.phone_number;
    ELSIF NEW.phone_number IS NULL AND NEW.number IS NOT NULL THEN
        NEW.phone_number := NEW.number;
    END IF;
    -- Sync status / is_active
    IF NEW.status = 'active' THEN
        NEW.is_active := TRUE;
    ELSE
        NEW.is_active := FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_sync_phone_number_fields
BEFORE INSERT OR UPDATE ON phone_numbers
FOR EACH ROW EXECUTE FUNCTION sync_phone_number_fields();


-- ── 3. Create calls table ───────────────────────────────────────────
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    caller_number VARCHAR(30) NOT NULL,
    provider_call_id VARCHAR(100) UNIQUE,
    call_status VARCHAR(20) DEFAULT 'started',
    status TEXT DEFAULT 'started',
    provider VARCHAR(50) DEFAULT 'exotel',
    duration INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    cost DECIMAL(10,4) DEFAULT 0,
    recording_url TEXT,
    transcript JSONB DEFAULT '[]',
    bavio_number TEXT DEFAULT NULL,
    routing_method TEXT DEFAULT NULL CHECK (routing_method IN ('caller_id', 'direct', 'sip') OR routing_method IS NULL),
    user_original_number TEXT DEFAULT NULL,
    direction TEXT DEFAULT 'inbound',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION sync_call_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync business_id / client_id
    IF NEW.business_id IS NULL AND NEW.client_id IS NOT NULL THEN
        NEW.business_id := NEW.client_id;
    ELSIF NEW.client_id IS NULL AND NEW.business_id IS NOT NULL THEN
        NEW.client_id := NEW.business_id;
    END IF;
    -- Sync call_status / status
    IF NEW.status IS NULL AND NEW.call_status IS NOT NULL THEN
        NEW.status := NEW.call_status;
    ELSIF NEW.call_status IS NULL AND NEW.status IS NOT NULL THEN
        NEW.call_status := NEW.status;
    END IF;
    -- Sync duration / duration_seconds
    IF NEW.duration_seconds = 0 AND NEW.duration > 0 THEN
        NEW.duration_seconds := NEW.duration;
    ELSIF NEW.duration = 0 AND NEW.duration_seconds > 0 THEN
        NEW.duration := NEW.duration_seconds;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_sync_call_fields
BEFORE INSERT OR UPDATE ON calls
FOR EACH ROW EXECUTE FUNCTION sync_call_fields();


-- ── 4. Create leads table ───────────────────────────────────────────
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
    phone VARCHAR(30) NOT NULL,
    caller_number VARCHAR(30),
    name TEXT,
    intent TEXT,
    budget TEXT,
    location TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    caller_name VARCHAR(255),
    appointment_time TIMESTAMPTZ,
    full_transcript TEXT,
    summary TEXT,
    call_duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION sync_lead_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync business_id / client_id
    IF NEW.business_id IS NULL AND NEW.client_id IS NOT NULL THEN
        NEW.business_id := NEW.client_id;
    ELSIF NEW.client_id IS NULL AND NEW.business_id IS NOT NULL THEN
        NEW.client_id := NEW.business_id;
    END IF;
    -- Sync phone / caller_number
    IF NEW.caller_number IS NULL AND NEW.phone IS NOT NULL THEN
        NEW.caller_number := NEW.phone;
    ELSIF NEW.phone IS NULL AND NEW.caller_number IS NOT NULL THEN
        NEW.phone := NEW.caller_number;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_sync_lead_fields
BEFORE INSERT OR UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION sync_lead_fields();


-- ── 5. Create pool_assignments table ─────────────────────────────────
CREATE TABLE pool_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_number_id UUID NOT NULL REFERENCES phone_numbers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_original_number TEXT NOT NULL,
  forwarding_code TEXT NOT NULL,
  forwarding_status TEXT DEFAULT 'pending' CHECK (forwarding_status IN ('pending', 'active', 'failed', 'disabled')),
  activated_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id)
);

CREATE OR REPLACE TRIGGER trigger_sync_pool_assignments
BEFORE INSERT OR UPDATE ON pool_assignments
FOR EACH ROW EXECUTE FUNCTION sync_assistant_ids();


-- ── 6. Create call_routing table ─────────────────────────────────────
CREATE TABLE call_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bavio_number TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  routing_method TEXT NOT NULL CHECK (routing_method IN ('caller_id', 'direct', 'sip')),
  user_original_number TEXT DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trigger_sync_call_routing
BEFORE INSERT OR UPDATE ON call_routing
FOR EACH ROW EXECUTE FUNCTION sync_assistant_ids();

CREATE INDEX IF NOT EXISTS idx_call_routing_bavio_number ON call_routing(bavio_number);
CREATE INDEX IF NOT EXISTS idx_pool_assignments_business ON pool_assignments(business_id);


-- ── 7. Create transcripts table ──────────────────────────────────────
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    transcript JSONB DEFAULT '[]',
    summary TEXT,
    role TEXT,
    content TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    language_detected TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trigger_sync_transcripts
BEFORE INSERT OR UPDATE ON transcripts
FOR EACH ROW EXECUTE FUNCTION sync_assistant_ids();


-- ── 8. Create usage_logs table ───────────────────────────────────────
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    client_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
    minutes_used INTEGER DEFAULT 0,
    cost DECIMAL(10,4) DEFAULT 0,
    cost_stt DECIMAL(10,4) DEFAULT 0,
    cost_tts DECIMAL(10,4) DEFAULT 0,
    cost_telephony DECIMAL(10,4) DEFAULT 0,
    cost_total DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trigger_sync_usage_logs
BEFORE INSERT OR UPDATE ON usage_logs
FOR EACH ROW EXECUTE FUNCTION sync_assistant_ids();


-- ── 9. Create payment_logs table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dodo_payment_id VARCHAR(100),
    dodo_customer_id VARCHAR(100),
    amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ── 10. ALTER TABLE businesses to add forwarding setup columns ──────
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS number_setup_type TEXT DEFAULT NULL CHECK (number_setup_type IN ('forwarding', 'dedicated', 'pending') OR number_setup_type IS NULL);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS original_phone_number TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS forwarding_activated_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone_number_verified BOOLEAN DEFAULT FALSE;


-- ── 11. Stored procedures for pool management ────────────────────────
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


-- ── 12. Seed pool numbers ───────────────────────────────────────────
INSERT INTO phone_numbers
  (phone_number, type, provider, country_code,
   status, pool_user_count, max_users, call_routing_method)
VALUES
  ('+918080810001', 'pool', 'exotel', 'IN', 'active', 0, 50, 'caller_id'),
  ('+918080810002', 'pool', 'exotel', 'IN', 'active', 0, 50, 'caller_id'),
  ('+918080810003', 'pool', 'exotel', 'IN', 'active', 0, 50, 'caller_id'),
  ('+918080810004', 'pool', 'exotel', 'IN', 'active', 0, 50, 'caller_id'),
  ('+918080810005', 'pool', 'exotel', 'IN', 'active', 0, 50, 'caller_id')
ON CONFLICT DO NOTHING;
