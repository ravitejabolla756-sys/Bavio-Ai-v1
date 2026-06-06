-- Knowledge Base Documents Table
-- Stores text-based knowledge documents for each business's AI agent
-- Created: 2026-06-04

CREATE TABLE IF NOT EXISTS knowledge_base_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER GENERATED ALWAYS AS (array_length(string_to_array(trim(content), ' '), 1)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by business
CREATE INDEX IF NOT EXISTS idx_kb_docs_business_id ON knowledge_base_docs(business_id);

-- Index for text search
CREATE INDEX IF NOT EXISTS idx_kb_docs_content_search ON knowledge_base_docs USING gin(to_tsvector('english', name || ' ' || content));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_kb_docs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_kb_docs_updated_at ON knowledge_base_docs;
CREATE TRIGGER trg_kb_docs_updated_at
  BEFORE UPDATE ON knowledge_base_docs
  FOR EACH ROW EXECUTE FUNCTION update_kb_docs_updated_at();
