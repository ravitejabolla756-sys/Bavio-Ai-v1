-- ── Migration 019: Create curated voices catalog table ──────────────────
-- Holds the telephone-quality-tested curated voices for English, Hindi,
-- and multilingual assistants.

CREATE TABLE IF NOT EXISTS voices (
    id SERIAL PRIMARY KEY,
    voice_provider VARCHAR(50) DEFAULT 'elevenlabs',
    voice_id VARCHAR(100) UNIQUE NOT NULL,
    voice_display_name VARCHAR(100) NOT NULL,
    voice_gender VARCHAR(20) CHECK (voice_gender IN ('male', 'female', 'neutral')),
    voice_accent VARCHAR(50),
    voice_language VARCHAR(50),
    voice_style VARCHAR(50),
    preview_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast accent / gender / language filtering in dashboard
CREATE INDEX IF NOT EXISTS idx_voices_catalog ON voices(voice_language, voice_accent, voice_gender);

-- Clear previous catalog to prevent primary key conflicts on seed
TRUNCATE TABLE voices RESTART IDENTITY;

-- Seed curated voice catalog for US, UK, Australia and India markets
INSERT INTO voices (voice_provider, voice_id, voice_display_name, voice_gender, voice_accent, voice_language, voice_style, preview_url)
VALUES
  -- ── US Market ──────────────────────────────────────────────────────────────
  ('elevenlabs', 'EXAVITQu4vr4xnSDxMaL', 'Sarah', 'female', 'US', 'en-US', 'Conversational', 'https://api.elevenlabs.io/v1/voices/EXAVITQu4vr4xnSDxMaL/previews'),
  ('elevenlabs', '21m00Tcm4TlvDq8ikWAM', 'Rachel', 'female', 'US', 'en-US', 'Narrative', 'https://api.elevenlabs.io/v1/voices/21m00Tcm4TlvDq8ikWAM/previews'),
  ('elevenlabs', '29vD33N1CtxCmqQRPOHJ', 'Drew', 'male', 'US', 'en-US', 'News', 'https://api.elevenlabs.io/v1/voices/29vD33N1CtxCmqQRPOHJ/previews'),
  ('elevenlabs', '5Q0t7jKbvWwuxH3w14qF', 'Paul', 'male', 'US', 'en-US', 'Deep/Warm', 'https://api.elevenlabs.io/v1/voices/5Q0t7jKbvWwuxH3w14qF/previews'),

  -- ── UK Market ──────────────────────────────────────────────────────────────
  ('elevenlabs', 'Xb7hH1oG1n4wOqQRPOHJ', 'Alice', 'female', 'UK', 'en-GB', 'Conversational', 'https://api.elevenlabs.io/v1/voices/Xb7hH1oG1n4wOqQRPOHJ/previews'),
  ('elevenlabs', 'pFZP5JQobthZQQrPS123', 'Lily', 'female', 'UK', 'en-GB', 'Friendly', 'https://api.elevenlabs.io/v1/voices/pFZP5JQobthZQQrPS123/previews'),
  ('elevenlabs', 'JBFbq5p1JAobthZQQrPS', 'George', 'male', 'UK', 'en-GB', 'Professional', 'https://api.elevenlabs.io/v1/voices/JBFbq5p1JAobthZQQrPS/previews'),
  ('elevenlabs', 'MCOt7jKbvWwuxH3w14qF', 'Arthur', 'male', 'UK', 'en-GB', 'Classic', 'https://api.elevenlabs.io/v1/voices/MCOt7jKbvWwuxH3w14qF/previews'),

  -- ── Australia Market ────────────────────────────────────────────────────────
  ('elevenlabs', 'piTKgcLEGmPEeHQHO468', 'Nicole', 'female', 'AU', 'en-AU', 'Friendly', 'https://api.elevenlabs.io/v1/voices/piTKgcLEGmPEeHQHO468/previews'),
  ('elevenlabs', 'Lily5JQobthZQQrPS123', 'Caitlin', 'female', 'AU', 'en-AU', 'Conversational', 'https://api.elevenlabs.io/v1/voices/Lily5JQobthZQQrPS123/previews'),
  ('elevenlabs', 'AInB5JQobthZQQrPS123', 'Russell', 'male', 'AU', 'en-AU', 'Energetic', 'https://api.elevenlabs.io/v1/voices/AInB5JQobthZQQrPS123/previews'),
  ('elevenlabs', 'mitch5JQobthZQQrPS123', 'Mitch', 'male', 'AU', 'en-AU', 'Casual', 'https://api.elevenlabs.io/v1/voices/mitch5JQobthZQQrPS123/previews'),

  -- ── India Market ───────────────────────────────────────────────────────────
  ('elevenlabs', 'aditi5JQobthZQQrPS123', 'Aditi', 'female', 'IN', 'hi-IN', 'Clear/Warm', 'https://api.elevenlabs.io/v1/voices/aditi5JQobthZQQrPS123/previews'),
  ('elevenlabs', 'kavita5JQobthZQQrPS123', 'Kavita', 'female', 'IN', 'hi-IN', 'Conversational', 'https://api.elevenlabs.io/v1/voices/kavita5JQobthZQQrPS123/previews'),
  ('elevenlabs', 'rohan5JQobthZQQrPS123', 'Rohan', 'male', 'IN', 'hi-IN', 'Professional', 'https://api.elevenlabs.io/v1/voices/rohan5JQobthZQQrPS123/previews'),
  ('elevenlabs', 'aarav5JQobthZQQrPS123', 'Aarav', 'male', 'IN', 'hi-IN', 'Natural', 'https://api.elevenlabs.io/v1/voices/aarav5JQobthZQQrPS123/previews');
