const db = require('./db');

async function migrate() {
  console.log('🔄 Running model tiers & cost tracking migration...');
  try {
    // 1. Update assistants table with model tier & routing fields
    await db.query(`
      ALTER TABLE assistants 
      ADD COLUMN IF NOT EXISTS intelligence_tier VARCHAR(50) DEFAULT 'core',
      ADD COLUMN IF NOT EXISTS intelligence_mode VARCHAR(50) DEFAULT 'automatic',
      ADD COLUMN IF NOT EXISTS intelligence_provider VARCHAR(50) DEFAULT 'automatic',
      ADD COLUMN IF NOT EXISTS intelligence_model VARCHAR(100) DEFAULT 'automatic',
      ADD COLUMN IF NOT EXISTS stt_provider VARCHAR(50) DEFAULT 'automatic',
      ADD COLUMN IF NOT EXISTS stt_model VARCHAR(100) DEFAULT 'automatic',
      ADD COLUMN IF NOT EXISTS tts_provider VARCHAR(50) DEFAULT 'automatic',
      ADD COLUMN IF NOT EXISTS tts_model VARCHAR(100) DEFAULT 'automatic',
      ADD COLUMN IF NOT EXISTS model_routing_config JSONB DEFAULT '{}'::jsonb;
    `);

    // 2. Create call_cost_logs table for granular telemetry and margin tracking
    await db.query(`
      CREATE TABLE IF NOT EXISTS call_cost_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID,
        business_id UUID,
        ai_employee_id UUID,
        call_id VARCHAR(255),
        tier VARCHAR(50) DEFAULT 'core',
        language VARCHAR(50) DEFAULT 'en',
        provider VARCHAR(50),
        model VARCHAR(100),
        stt_provider VARCHAR(50),
        stt_model VARCHAR(100),
        tts_provider VARCHAR(50),
        tts_model VARCHAR(100),
        duration_seconds NUMERIC(10,2) DEFAULT 0,
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        tts_characters INTEGER DEFAULT 0,
        stt_cost_usd NUMERIC(10,6) DEFAULT 0,
        tts_cost_usd NUMERIC(10,6) DEFAULT 0,
        llm_cost_usd NUMERIC(10,6) DEFAULT 0,
        telephony_cost_usd NUMERIC(10,6) DEFAULT 0,
        estimated_cost_usd NUMERIC(10,6) DEFAULT 0,
        estimated_cost_inr NUMERIC(10,4) DEFAULT 0,
        customer_price_inr NUMERIC(10,4) DEFAULT 0,
        gross_margin_percent NUMERIC(5,2) DEFAULT 0,
        stt_latency_ms INTEGER,
        llm_first_token_ms INTEGER,
        tts_first_audio_ms INTEGER,
        total_ttfb_ms INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create index for fast telemetry queries
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_call_cost_logs_biz ON call_cost_logs (business_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_call_cost_logs_tier ON call_cost_logs (tier);
    `);

    console.log('✅ Model tiers & cost tracking database schema successfully applied.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    process.exit(0);
  }
}

migrate();
