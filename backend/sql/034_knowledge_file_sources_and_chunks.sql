-- Migration 034: Knowledge Source File Uploads and Searchable Chunks
-- Purpose: Support file-based knowledge ingestion (PDF, DOC/DOCX, XLSX, CSV, images),
-- track processing lifecycle (uploading, processing, ready, failed), and store chunks.

-- 1. Add file upload and processing status fields to knowledge_base_docs
ALTER TABLE knowledge_base_docs
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'text',
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ready',
ADD COLUMN IF NOT EXISTS processing_error TEXT,
ADD COLUMN IF NOT EXISTS original_filename TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

ALTER TABLE knowledge_base_docs ALTER COLUMN content DROP NOT NULL;
ALTER TABLE knowledge_base_docs ALTER COLUMN content SET DEFAULT '';

-- 2. Create knowledge_chunks table for granular document chunking and retrieval
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES knowledge_base_docs(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for fast retrieval and workspace isolation
CREATE INDEX IF NOT EXISTS idx_kb_docs_business_status ON knowledge_base_docs(business_id, status);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_doc_id ON knowledge_chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_business_id ON knowledge_chunks(business_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_content_search ON knowledge_chunks USING gin(to_tsvector('english', content));
