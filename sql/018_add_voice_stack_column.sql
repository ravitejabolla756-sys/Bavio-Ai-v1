-- ── Migration 018: Add voice_stack column to calls table ──────────────────
-- Stores which voice pipeline processed each call for auditing and rollback.
-- Values: 'current_openai' (default) | 'modular_v1'
-- Applied in callStream.js and ModularVoiceSession.js on every call INSERT.

ALTER TABLE calls
  ADD COLUMN IF NOT EXISTS voice_stack VARCHAR(50) DEFAULT 'current_openai';

-- Index for auditing / filtering by stack version
CREATE INDEX IF NOT EXISTS idx_calls_voice_stack ON calls(voice_stack);

-- Backfill: mark all existing calls as current_openai
UPDATE calls
  SET voice_stack = 'current_openai'
  WHERE voice_stack IS NULL;

-- Verify
SELECT voice_stack, COUNT(*) AS cnt
  FROM calls
  GROUP BY voice_stack
  ORDER BY cnt DESC;
