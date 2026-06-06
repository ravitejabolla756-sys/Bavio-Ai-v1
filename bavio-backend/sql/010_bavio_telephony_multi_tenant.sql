-- ══════════════════════════════════════════════════════════════════════
-- Migration: Multi-Tenant Telephony Routing Architecture
-- ══════════════════════════════════════════════════════════════════════

-- 1. Ensure businesses table has the required columns
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_name TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_phone TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_email TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS system_prompt TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS first_message TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS call_handling_type TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT NULL;

-- 2. Populate columns from existing data if empty
UPDATE businesses SET business_name = name WHERE business_name IS NULL AND name IS NOT NULL;
UPDATE businesses SET owner_name = full_name WHERE owner_name IS NULL AND full_name IS NOT NULL;
UPDATE businesses SET owner_phone = phone WHERE owner_phone IS NULL AND phone IS NOT NULL;
UPDATE businesses SET owner_email = email WHERE owner_email IS NULL AND email IS NOT NULL;
UPDATE businesses SET subscription_plan = plan::text WHERE subscription_plan IS NULL AND plan IS NOT NULL;

-- 3. Create business_phone_mapping table
CREATE TABLE IF NOT EXISTS business_phone_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    business_number TEXT NOT NULL,
    exotel_number TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create caller_whitelist table
CREATE TABLE IF NOT EXISTS caller_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    caller_phone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, caller_phone)
);

-- 5. Create call_sessions table
CREATE TABLE IF NOT EXISTS call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_sid TEXT UNIQUE NOT NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    caller_phone TEXT NOT NULL,
    exotel_number TEXT NOT NULL,
    session_status VARCHAR(20) DEFAULT 'in-progress',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- 6. Create call_logs table
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_sid TEXT UNIQUE NOT NULL REFERENCES call_sessions(call_sid) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    duration INTEGER DEFAULT 0,
    cost DECIMAL(10,4) DEFAULT 0,
    recording_url TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    recipient TEXT NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Alter transcripts, leads, and usage_logs to add call_sid reference
ALTER TABLE transcripts ADD COLUMN IF NOT EXISTS call_sid TEXT REFERENCES call_sessions(call_sid) ON DELETE CASCADE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS call_sid TEXT REFERENCES call_sessions(call_sid) ON DELETE CASCADE;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS call_sid TEXT REFERENCES call_sessions(call_sid) ON DELETE CASCADE;

-- 9. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_phone_mapping_exotel ON business_phone_mapping(exotel_number);
CREATE INDEX IF NOT EXISTS idx_caller_whitelist_phone ON caller_whitelist(caller_phone);
CREATE INDEX IF NOT EXISTS idx_call_sessions_sid ON call_sessions(call_sid);
CREATE INDEX IF NOT EXISTS idx_call_logs_sid ON call_logs(call_sid);
CREATE INDEX IF NOT EXISTS idx_transcripts_call_sid ON transcripts(call_sid);
CREATE INDEX IF NOT EXISTS idx_leads_call_sid ON leads(call_sid);
CREATE INDEX IF NOT EXISTS idx_usage_logs_call_sid ON usage_logs(call_sid);
