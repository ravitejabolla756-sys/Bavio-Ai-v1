-- Stage 8.1: deterministic Customer Opportunity workflow runtime foundation.
-- Additive only. No workflow executions or synthetic outcomes are inserted.

CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  workflow_key VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, workflow_key),
  UNIQUE (id, business_id)
);

CREATE TABLE IF NOT EXISTS workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  workflow_definition_id UUID NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workflow_definition_id, version),
  UNIQUE (id, business_id),
  UNIQUE (id, business_id, workflow_definition_id),
  FOREIGN KEY (workflow_definition_id, business_id)
    REFERENCES workflow_definitions(id, business_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  workflow_version_id UUID NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  action_type VARCHAR(100) NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workflow_version_id, position),
  UNIQUE (id, business_id),
  FOREIGN KEY (workflow_version_id, business_id)
    REFERENCES workflow_versions(id, business_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  workflow_definition_id UUID NOT NULL,
  workflow_version_id UUID NOT NULL,
  idempotency_key TEXT NOT NULL,
  source_type VARCHAR(80) NOT NULL,
  source_id TEXT,
  conversation_id UUID,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'succeeded', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failure_code VARCHAR(80),
  failure_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, workflow_definition_id, idempotency_key),
  UNIQUE (id, business_id),
  FOREIGN KEY (workflow_definition_id, business_id)
    REFERENCES workflow_definitions(id, business_id) ON DELETE RESTRICT,
  FOREIGN KEY (workflow_version_id, business_id)
    REFERENCES workflow_versions(id, business_id) ON DELETE RESTRICT,
  FOREIGN KEY (workflow_version_id, business_id, workflow_definition_id)
    REFERENCES workflow_versions(id, business_id, workflow_definition_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS workflow_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  workflow_execution_id UUID NOT NULL,
  workflow_step_id UUID NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'succeeded', 'failed', 'skipped')),
  action_execution_id UUID REFERENCES action_executions(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failure_code VARCHAR(80),
  failure_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workflow_execution_id, workflow_step_id),
  UNIQUE (id, business_id),
  FOREIGN KEY (workflow_execution_id, business_id)
    REFERENCES workflow_executions(id, business_id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_step_id, business_id)
    REFERENCES workflow_steps(id, business_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_business
  ON workflow_definitions (business_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_versions_definition
  ON workflow_versions (business_id, workflow_definition_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_version
  ON workflow_steps (business_id, workflow_version_id, position);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_business_created
  ON workflow_executions (business_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status
  ON workflow_executions (business_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_execution
  ON workflow_step_executions (business_id, workflow_execution_id, position);
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_action
  ON workflow_step_executions (business_id, action_execution_id);

-- Backend owner access is the current verification envelope. RLS remains enabled
-- as defense in depth; no public workflow Data API is exposed in Stage 8.1.
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_executions ENABLE ROW LEVEL SECURITY;
