-- 035_webcall_observability_and_telemetry.sql
-- Production Observability, Telemetry & Persistence for Bavio WebCall

-- 0. Update provider check constraint on partitioned calls table to allow 'webcall'
DO $$
BEGIN
  ALTER TABLE calls DROP CONSTRAINT IF EXISTS check_calls_provider;
  ALTER TABLE calls ADD CONSTRAINT check_calls_provider CHECK (provider IN ('exotel', 'twilio', 'webcall'));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Constraint check_calls_provider update notice: %', SQLERRM;
END $$;

-- 1. WebCall Sessions Table
CREATE TABLE IF NOT EXISTS webcall_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid VARCHAR(100) UNIQUE NOT NULL,
  call_id UUID,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES assistants(id) ON DELETE SET NULL,
  user_id UUID,
  session_type VARCHAR(50) DEFAULT 'webcall',
  transport VARCHAR(50) DEFAULT 'webrtc',
  status VARCHAR(50) DEFAULT 'requested',
  started_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_ms INTEGER DEFAULT 0,
  end_reason VARCHAR(100),
  browser VARCHAR(100),
  browser_version VARCHAR(50),
  os VARCHAR(100),
  device_type VARCHAR(50),
  language VARCHAR(50),
  voice VARCHAR(50),
  voice_config_snapshot JSONB DEFAULT '{}'::jsonb,
  agent_config_snapshot JSONB DEFAULT '{}'::jsonb,

  -- User speaking metrics (Phase 3)
  user_speech_duration_ms INTEGER DEFAULT 0,
  user_turn_count INTEGER DEFAULT 0,
  user_speech_segment_count INTEGER DEFAULT 0,
  average_user_turn_duration_ms NUMERIC(10,2) DEFAULT 0,
  min_user_turn_duration_ms INTEGER,
  max_user_turn_duration_ms INTEGER,

  -- AI speaking metrics (Phase 4)
  assistant_speech_duration_ms INTEGER DEFAULT 0,
  assistant_turn_count INTEGER DEFAULT 0,
  assistant_audio_segment_count INTEGER DEFAULT 0,
  average_assistant_turn_duration_ms NUMERIC(10,2) DEFAULT 0,
  total_audio_played_ms INTEGER DEFAULT 0,

  -- Latency percentiles (Phase 6)
  avg_latency_ms NUMERIC(10,2),
  p50_latency_ms NUMERIC(10,2),
  p75_latency_ms NUMERIC(10,2),
  p90_latency_ms NUMERIC(10,2),
  p95_latency_ms NUMERIC(10,2),
  min_latency_ms INTEGER,
  max_latency_ms INTEGER,

  -- Interruption metrics (Phase 7)
  interruption_count INTEGER DEFAULT 0,
  interrupted_turn_count INTEGER DEFAULT 0,

  -- WebRTC / Network metrics summary (Phase 8)
  avg_rtt_ms NUMERIC(10,2),
  max_rtt_ms NUMERIC(10,2),
  avg_jitter_ms NUMERIC(10,2),
  max_jitter_ms NUMERIC(10,2),
  packet_loss_percent NUMERIC(5,2) DEFAULT 0,

  -- Error metrics (Phase 15)
  error_count INTEGER DEFAULT 0,
  last_error_code VARCHAR(100),
  last_error_stage VARCHAR(100),
  failure_reason TEXT,

  -- Cost / Usage metrics (Phase 16)
  llm_input_tokens INTEGER DEFAULT 0,
  llm_output_tokens INTEGER DEFAULT 0,
  tts_characters INTEGER DEFAULT 0,
  stt_audio_seconds NUMERIC(10,2) DEFAULT 0,
  knowledge_queries INTEGER DEFAULT 0,
  tool_calls INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. WebCall Turns Table (Phase 5)
CREATE TABLE IF NOT EXISTS webcall_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES webcall_sessions(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  call_sid VARCHAR(100) NOT NULL,
  turn_id VARCHAR(100) UNIQUE NOT NULL,
  turn_number INTEGER NOT NULL,
  user_transcript TEXT,
  assistant_response TEXT,

  -- Exact Turn Event Timestamps
  turn_started_at TIMESTAMPTZ,
  user_speech_started_at TIMESTAMPTZ,
  user_speech_ended_at TIMESTAMPTZ,
  stt_started_at TIMESTAMPTZ,
  stt_completed_at TIMESTAMPTZ,
  transcript_ready_at TIMESTAMPTZ,
  knowledge_started_at TIMESTAMPTZ,
  knowledge_completed_at TIMESTAMPTZ,
  llm_started_at TIMESTAMPTZ,
  llm_first_token_at TIMESTAMPTZ,
  llm_completed_at TIMESTAMPTZ,
  tts_started_at TIMESTAMPTZ,
  tts_first_audio_at TIMESTAMPTZ,
  tts_completed_at TIMESTAMPTZ,
  assistant_audio_started_at TIMESTAMPTZ,
  assistant_audio_completed_at TIMESTAMPTZ,

  -- Exact Turn Latency Metrics
  user_speech_duration_ms INTEGER,
  speech_to_transcript_ms INTEGER,
  stt_latency_ms INTEGER,
  knowledge_latency_ms INTEGER,
  llm_time_to_first_token_ms INTEGER,
  llm_total_latency_ms INTEGER,
  tts_time_to_first_audio_ms INTEGER,
  tts_total_latency_ms INTEGER,
  time_to_first_ai_audio_ms INTEGER,
  end_to_end_response_latency_ms INTEGER,
  assistant_audio_duration_ms INTEGER,

  -- Interruption / Barge-in
  was_interrupted BOOLEAN DEFAULT FALSE,
  interruption_latency_ms INTEGER,
  assistant_audio_played_before_interrupt_ms INTEGER,

  -- Providers & Models
  stt_provider VARCHAR(50),
  stt_model VARCHAR(100),
  llm_provider VARCHAR(50),
  llm_model VARCHAR(100),
  tts_provider VARCHAR(50),
  tts_model VARCHAR(100),
  tts_voice VARCHAR(100),

  -- Knowledge telemetry (Phase 11)
  knowledge_used BOOLEAN DEFAULT FALSE,
  chunks_used INTEGER DEFAULT 0,
  knowledge_metadata JSONB DEFAULT '{}'::jsonb,

  -- Tool / Action telemetry (Phase 12)
  tool_calls_count INTEGER DEFAULT 0,
  tools_invoked JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. WebCall Canonical Event Stream (Phase 14)
CREATE TABLE IF NOT EXISTS webcall_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES webcall_sessions(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  call_sid VARCHAR(100) NOT NULL,
  turn_id VARCHAR(100),
  event_type VARCHAR(100) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. WebCall Network Telemetry (Phase 8)
CREATE TABLE IF NOT EXISTS webcall_network_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES webcall_sessions(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  call_sid VARCHAR(100) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  round_trip_time_ms NUMERIC(10,2),
  jitter_ms NUMERIC(10,2),
  packet_loss_percent NUMERIC(5,2),
  packets_sent INTEGER,
  packets_received INTEGER,
  packets_lost INTEGER,
  audio_level NUMERIC(5,2),
  audio_bytes_sent BIGINT,
  audio_bytes_received BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast workspace queries & telemetry analytics
CREATE INDEX IF NOT EXISTS idx_webcall_sessions_biz ON webcall_sessions (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webcall_sessions_agent ON webcall_sessions (agent_id);
CREATE INDEX IF NOT EXISTS idx_webcall_sessions_sid ON webcall_sessions (call_sid);
CREATE INDEX IF NOT EXISTS idx_webcall_sessions_status ON webcall_sessions (status);

CREATE INDEX IF NOT EXISTS idx_webcall_turns_session ON webcall_turns (session_id, turn_number ASC);
CREATE INDEX IF NOT EXISTS idx_webcall_turns_biz ON webcall_turns (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webcall_turns_tid ON webcall_turns (turn_id);

CREATE INDEX IF NOT EXISTS idx_webcall_events_session ON webcall_events (session_id, occurred_at ASC);
CREATE INDEX IF NOT EXISTS idx_webcall_events_biz ON webcall_events (business_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_webcall_events_type ON webcall_events (event_type);

CREATE INDEX IF NOT EXISTS idx_webcall_net_session ON webcall_network_metrics (session_id, recorded_at ASC);
CREATE INDEX IF NOT EXISTS idx_webcall_net_biz ON webcall_network_metrics (business_id, recorded_at DESC);
