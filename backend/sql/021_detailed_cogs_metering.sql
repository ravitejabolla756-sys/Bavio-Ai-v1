-- ══════════════════════════════════════════════════════════════════════
-- Migration 021: Detailed COGS & Provider Usage Metering
-- ══════════════════════════════════════════════════════════════════════

-- Add unique constraint to call_sid for idempotency protection
ALTER TABLE usage_logs DROP CONSTRAINT IF EXISTS unique_usage_call_sid;
ALTER TABLE usage_logs ADD CONSTRAINT unique_usage_call_sid UNIQUE (call_sid);

-- Telephony Tracking
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS seconds_used INTEGER DEFAULT 0;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS telephony_provider VARCHAR(50) DEFAULT 'twilio';
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS telephony_region VARCHAR(50) DEFAULT 'US';
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS telephony_duration_seconds INTEGER DEFAULT 0;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS telephony_billed_seconds INTEGER DEFAULT 0;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS recording_used BOOLEAN DEFAULT FALSE;

-- Speech-to-Text (STT)
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS stt_seconds DECIMAL(10,2) DEFAULT 0;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS stt_model VARCHAR(50) DEFAULT 'deepgram-flux';
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS stt_cost DECIMAL(10,4) DEFAULT 0;

-- Language Model (LLM)
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS llm_input_tokens INTEGER DEFAULT 0;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS llm_output_tokens INTEGER DEFAULT 0;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS llm_reasoning_tokens INTEGER DEFAULT 0;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(50) DEFAULT 'cerebras';
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS llm_model VARCHAR(100) DEFAULT 'gpt-oss-120b';
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS llm_tool_calls_count INTEGER DEFAULT 0;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS llm_cost DECIMAL(10,4) DEFAULT 0;

-- Text-to-Speech (TTS)
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS tts_characters INTEGER DEFAULT 0;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS tts_duration_seconds DECIMAL(10,2) DEFAULT 0;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS tts_voice_id VARCHAR(50);
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS tts_model VARCHAR(50) DEFAULT 'eleven-flash-2.5';
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS tts_cost DECIMAL(10,4) DEFAULT 0;

-- Infrastructure
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS worker_region VARCHAR(50) DEFAULT 'us-east-1';
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS session_duration_seconds INTEGER DEFAULT 0;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS data_transferred_bytes BIGINT DEFAULT 0;
