CREATE TABLE IF NOT EXISTS api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    service_name VARCHAR(50) NOT NULL, -- 'deepgram' | 'openai' | 'elevenlabs'
    api_key_encrypted TEXT NOT NULL,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_tested_at TIMESTAMP WITH TIME ZONE,
    test_status VARCHAR(50) DEFAULT 'pending', -- 'success' | 'failed' | 'pending'
    usage_limit NUMERIC DEFAULT 0,
    usage_current NUMERIC DEFAULT 0,
    selected_model VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (business_id, service_name)
);
