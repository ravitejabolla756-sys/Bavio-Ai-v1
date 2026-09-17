-- Bavio canonical fresh-install baseline for the current UUID tenant/runtime model.
-- This is additive and non-destructive: it is safe to run on an empty database
-- and does not replace the historical production schema.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE business_status AS ENUM ('pending_verification', 'active', 'inactive', 'suspended', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE plan_type AS ENUM ('free', 'starter', 'pro', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  password_hash TEXT,
  api_key TEXT UNIQUE,
  status business_status NOT NULL DEFAULT 'pending_verification',
  country TEXT,
  country_code VARCHAR(2) DEFAULT 'IN',
  website TEXT,
  business_description TEXT,
  industry TEXT,
  language VARCHAR(20) DEFAULT 'en-US',
  whatsapp_number TEXT,
  minutes_limit INTEGER NOT NULL DEFAULT 30,
  minutes_used INTEGER NOT NULL DEFAULT 0,
  onboarding_step INTEGER NOT NULL DEFAULT 0,
  onboarding_status TEXT NOT NULL DEFAULT 'pre_payment',
  plan plan_type NOT NULL DEFAULT 'free',
  plan_name TEXT NOT NULL DEFAULT 'free_trial',
  current_period_end TIMESTAMPTZ,
  subscription_status TEXT NOT NULL DEFAULT 'inactive',
  subscription_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);

CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT,
  agent_name VARCHAR(100),
  greeting TEXT,
  first_message TEXT,
  system_prompt TEXT,
  vapi_assistant_id VARCHAR(100),
  sarvam_config JSONB,
  voice_id VARCHAR(100),
  voice VARCHAR(100),
  language VARCHAR(20) DEFAULT 'en-US',
  faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistants_business ON assistants(business_id);

CREATE TABLE IF NOT EXISTS phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  assistant_id UUID REFERENCES assistants(id) ON DELETE SET NULL,
  phone_number VARCHAR(30) UNIQUE,
  number VARCHAR(30),
  provider VARCHAR(50),
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  type VARCHAR(30) NOT NULL DEFAULT 'dedicated',
  country_code VARCHAR(2) DEFAULT 'IN',
  twilio_sid VARCHAR(100),
  webhook_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_business ON phone_numbers(business_id);

CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID,
  assistant_id UUID REFERENCES assistants(id) ON DELETE SET NULL,
  call_sid VARCHAR(100) UNIQUE,
  provider_call_id VARCHAR(100) UNIQUE,
  caller_number VARCHAR(30),
  call_status VARCHAR(30) NOT NULL DEFAULT 'started',
  status VARCHAR(30) NOT NULL DEFAULT 'started',
  provider VARCHAR(50),
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  recording_url TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  cost NUMERIC(10,4) NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calls_business_created ON calls(business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  phone VARCHAR(64) NOT NULL,
  caller_number VARCHAR(64),
  name TEXT,
  intent TEXT,
  budget TEXT,
  location TEXT,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  caller_name VARCHAR(255),
  appointment_time TIMESTAMPTZ,
  full_transcript TEXT,
  summary TEXT,
  call_duration INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_business_created ON leads(business_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_leads_business_call ON leads(business_id, call_id);

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS assistant_id UUID REFERENCES assistants(id) ON DELETE SET NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL;
