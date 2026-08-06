-- ══════════════════════════════════════════════════════════════════════
-- Migration 022: Call Turn Latency Observability Metrics
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS call_turn_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_sid VARCHAR(100) NOT NULL,
    business_id UUID,
    turn_index INTEGER NOT NULL,
    
    -- Epoch timestamps (stored as TIMESTAMPTZ)
    caller_speech_start TIMESTAMPTZ,
    caller_speech_end_estimated TIMESTAMPTZ,
    deepgram_eager_eot TIMESTAMPTZ,
    deepgram_final_eot TIMESTAMPTZ,
    llm_request_start TIMESTAMPTZ,
    llm_first_token TIMESTAMPTZ,
    llm_first_speakable_phrase TIMESTAMPTZ,
    tts_request_start TIMESTAMPTZ,
    tts_first_audio TIMESTAMPTZ,
    telephony_first_audio_sent TIMESTAMPTZ,
    caller_interruption TIMESTAMPTZ,
    audio_clear_sent TIMESTAMPTZ,
    response_complete TIMESTAMPTZ,
    
    -- Calculated durations in milliseconds
    end_to_end_first_audio_ms INTEGER,
    speech_end_to_llm_first_token_ms INTEGER,
    speech_end_to_tts_first_audio_ms INTEGER,
    speech_end_to_telephony_audio_ms INTEGER,
    interruption_clear_ms INTEGER,
    
    -- Segment properties
    region VARCHAR(50),
    country VARCHAR(50),
    language VARCHAR(50),
    voice VARCHAR(50),
    llm_provider VARCHAR(50),
    stt_model VARCHAR(50),
    tts_model VARCHAR(50),
    telephony_provider VARCHAR(50),
    is_tool_response BOOLEAN DEFAULT FALSE,
    is_mobile BOOLEAN DEFAULT FALSE,
    
    -- Text content & status
    user_transcript TEXT,
    ai_response TEXT,
    error TEXT,
    cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_call_turn_metrics_call_sid ON call_turn_metrics(call_sid);
CREATE INDEX IF NOT EXISTS idx_call_turn_metrics_region ON call_turn_metrics(region);
CREATE INDEX IF NOT EXISTS idx_call_turn_metrics_language ON call_turn_metrics(language);
CREATE INDEX IF NOT EXISTS idx_call_turn_metrics_llm_provider ON call_turn_metrics(llm_provider);

-- Backwards compatibility user_id column for planEnforcement
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
