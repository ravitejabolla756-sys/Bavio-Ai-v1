-- Stage 9.0.1: immutable canonical completion events and explicit automation binding.
-- Additive only. This migration does not create triggers or execute workflows.

CREATE TABLE IF NOT EXISTS business_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL CHECK (event_type = 'conversation.completed'),
  aggregate_type VARCHAR(80) NOT NULL CHECK (aggregate_type = 'conversation'),
  aggregate_key VARCHAR(255) NOT NULL,
  source_type VARCHAR(80) NOT NULL,
  source_id VARCHAR(255),
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version > 0),
  occurred_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, event_type, aggregate_key)
);

CREATE INDEX IF NOT EXISTS idx_business_events_business_type
  ON business_events (business_id, event_type, occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_business_events_aggregate
  ON business_events (business_id, aggregate_type, aggregate_key);
CREATE INDEX IF NOT EXISTS idx_business_events_recorded
  ON business_events (recorded_at DESC, id DESC);

ALTER TABLE business_events ENABLE ROW LEVEL SECURITY;

-- Only backend owner/service-role execution is currently authorized. No public
-- Data API surface is created in this stage.
CREATE TABLE IF NOT EXISTS workflow_automation_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  workflow_definition_id UUID NOT NULL,
  workflow_version_id UUID NOT NULL,
  webhook_configuration_id UUID NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, workflow_definition_id),
  UNIQUE (id, business_id),
  FOREIGN KEY (workflow_definition_id, business_id)
    REFERENCES workflow_definitions(id, business_id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_version_id, business_id)
    REFERENCES workflow_versions(id, business_id) ON DELETE RESTRICT,
  FOREIGN KEY (webhook_configuration_id)
    REFERENCES webhooks(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_workflow_automation_bindings_lookup
  ON workflow_automation_bindings (business_id, workflow_definition_id, enabled);

ALTER TABLE workflow_automation_bindings ENABLE ROW LEVEL SECURITY;
