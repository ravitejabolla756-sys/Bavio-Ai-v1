-- ── Migration 023: Bavio Developer Platform, Multi-Provider & Outbound Campaigns ────────

-- Ensure calls table has required columns and constraints for developer platform & campaigns
ALTER TABLE calls ADD COLUMN IF NOT EXISTS business_id UUID;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS campaign_id UUID;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS caller_number VARCHAR(30);
ALTER TABLE calls ADD COLUMN IF NOT EXISTS from_number VARCHAR(30);
ALTER TABLE calls ADD COLUMN IF NOT EXISTS virtual_number VARCHAR(30);
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_status VARCHAR(30);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'calls' AND constraint_type IN ('PRIMARY KEY', 'UNIQUE')
    ) THEN
        ALTER TABLE calls ADD CONSTRAINT calls_id_key UNIQUE (id);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 1. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100),
    key_prefix VARCHAR(30),
    hashed_secret VARCHAR(255),
    environment VARCHAR(20) DEFAULT 'live',
    permissions JSONB DEFAULT '["*"]',
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_prefix VARCHAR(30);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS hashed_secret VARCHAR(255);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_hash VARCHAR(255);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS environment VARCHAR(20) DEFAULT 'live';
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '["*"]';
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE api_keys ALTER COLUMN key_hash DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_api_keys_hashed_secret ON api_keys(hashed_secret) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_business ON api_keys(business_id);

-- 2. Webhooks Table
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events JSONB DEFAULT '["*"]',
    signing_secret VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_business ON webhooks(business_id);

-- 3. Webhook Deliveries Table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    event_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    attempt_count INTEGER DEFAULT 1,
    delivered_at TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_business ON webhook_deliveries(business_id);

-- 4. Provider & Model Configurations Table
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    capability VARCHAR(20) NOT NULL CHECK (capability IN ('stt', 'llm', 'tts')),
    model VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, capability, model)
);

CREATE TABLE IF NOT EXISTS model_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'Default Config',
    preset_name VARCHAR(50) DEFAULT 'bavio-indian',
    stt_provider VARCHAR(50) DEFAULT 'sarvam',
    stt_model VARCHAR(100) DEFAULT 'saaras-v3',
    llm_provider VARCHAR(50) DEFAULT 'openai',
    llm_model VARCHAR(100) DEFAULT 'gpt-5.4-mini',
    tts_provider VARCHAR(50) DEFAULT 'elevenlabs',
    tts_model VARCHAR(100) DEFAULT 'flash-v2.5',
    tts_voice VARCHAR(100) DEFAULT 'Sarah',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_configs_business ON model_configs(business_id);

-- 5. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES assistants(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    objective TEXT,
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'running', 'paused', 'completed', 'cancelled', 'failed')),
    calling_hours JSONB DEFAULT '{"start": "09:00", "end": "20:00", "timezone": "Asia/Kolkata"}',
    max_attempts INTEGER DEFAULT 3,
    retry_delay_minutes INTEGER DEFAULT 30,
    concurrency INTEGER DEFAULT 5,
    from_number VARCHAR(30),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_business ON campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- 6. Campaign Contacts Table
CREATE TABLE IF NOT EXISTS campaign_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255),
    phone_number VARCHAR(30) NOT NULL,
    external_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'calling', 'answered', 'no_answer', 'busy', 'failed', 'completed', 'do_not_call')),
    attempt_count INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign ON campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_business ON campaign_contacts(business_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_status ON campaign_contacts(status);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_phone ON campaign_contacts(phone_number);

-- 7. Campaign Attempts & Runs
CREATE TABLE IF NOT EXISTS campaign_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES campaign_contacts(id) ON DELETE CASCADE,
    call_id UUID,
    attempt_number INTEGER DEFAULT 1,
    status VARCHAR(30),
    duration_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_campaign_attempts_campaign ON campaign_attempts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_attempts_contact ON campaign_attempts(contact_id);

CREATE TABLE IF NOT EXISTS campaign_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    status VARCHAR(30),
    total_contacts INTEGER DEFAULT 0,
    completed_contacts INTEGER DEFAULT 0,
    failed_contacts INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- 8. Structured Call Outcomes & Extracted Answers
CREATE TABLE IF NOT EXISTS call_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL UNIQUE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    interested BOOLEAN DEFAULT false,
    lead_score INTEGER DEFAULT 0,
    budget VARCHAR(100),
    location VARCHAR(255),
    property_type VARCHAR(100),
    purchase_timeline VARCHAR(100),
    callback_required BOOLEAN DEFAULT false,
    summary TEXT,
    raw_outcome JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_outcomes_call ON call_outcomes(call_id);
CREATE INDEX IF NOT EXISTS idx_call_outcomes_business ON call_outcomes(business_id);

CREATE TABLE IF NOT EXISTS extracted_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL,
    question_key VARCHAR(100) NOT NULL,
    answer_value TEXT,
    confidence NUMERIC(3, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extracted_answers_call ON extracted_answers(call_id);

-- 9. Idempotency Records Table
CREATE TABLE IF NOT EXISTS idempotency_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(255) NOT NULL,
    request_path VARCHAR(255) NOT NULL,
    response_code INTEGER NOT NULL,
    response_body JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT unique_business_idempotency UNIQUE(business_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_lookup ON idempotency_records(business_id, idempotency_key);

-- Seed Providers Catalog
INSERT INTO providers (name, capability, model, display_name, status)
VALUES
    ('deepgram', 'stt', 'nova-2', 'Deepgram Nova-2', 'active'),
    ('sarvam', 'stt', 'saaras-v3', 'Sarvam Saaras v3', 'active'),
    ('openai', 'stt', 'whisper-1', 'OpenAI Whisper-1', 'active'),
    ('openai', 'llm', 'gpt-5.4-mini', 'OpenAI GPT-5.4 Mini', 'active'),
    ('openai', 'llm', 'gpt-5.4', 'OpenAI GPT-5.4', 'active'),
    ('openai', 'llm', 'gpt-5.5', 'OpenAI GPT-5.5', 'active'),
    ('sarvam', 'llm', 'sarvam-30b', 'Sarvam 30B Indic', 'active'),
    ('sarvam', 'llm', 'sarvam-105b', 'Sarvam 105B Indic', 'active'),
    ('elevenlabs', 'tts', 'flash-v2.5', 'ElevenLabs Flash v2.5', 'active'),
    ('elevenlabs', 'tts', 'multilingual-v2', 'ElevenLabs Multilingual v2', 'active'),
    ('sarvam', 'tts', 'bulbul-v3', 'Sarvam Bulbul v3', 'active'),
    ('openai', 'tts', 'tts-1-hd', 'OpenAI TTS-1 HD', 'active')
ON CONFLICT (name, capability, model) DO NOTHING;
