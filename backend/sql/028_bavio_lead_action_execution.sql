-- Stage 7.1: minimal internal Create Bavio Lead execution/evidence contract.
-- Backward-safe additive migration. No existing Lead rows are changed.

CREATE TABLE IF NOT EXISTS action_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'succeeded', 'failed')),
  source_type VARCHAR(40) NOT NULL,
  source_id TEXT,
  conversation_id UUID,
  lead_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_code VARCHAR(80),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_action_executions_business_created ON action_executions (business_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_action_executions_source ON action_executions (business_id, source_type, source_id);

CREATE TABLE IF NOT EXISTS execution_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES action_executions(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  evidence_type VARCHAR(40) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  record_id TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_execution_evidence_business ON execution_evidence (business_id, recorded_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_execution_evidence_execution ON execution_evidence (execution_id, business_id);
