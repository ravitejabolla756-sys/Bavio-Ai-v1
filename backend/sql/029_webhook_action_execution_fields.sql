-- Stage 7.2: additive fields for one-attempt external webhook action evidence.
ALTER TABLE action_executions ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE action_executions ADD COLUMN IF NOT EXISTS attempt_count INTEGER;
ALTER TABLE action_executions ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS idx_action_executions_idempotency
  ON action_executions (business_id, action_type, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE execution_evidence ADD COLUMN IF NOT EXISTS webhook_configuration_id UUID REFERENCES webhooks(id) ON DELETE SET NULL;
ALTER TABLE execution_evidence ADD COLUMN IF NOT EXISTS delivery_id UUID REFERENCES webhook_deliveries(id) ON DELETE SET NULL;
ALTER TABLE execution_evidence ADD COLUMN IF NOT EXISTS http_status INTEGER;
ALTER TABLE execution_evidence ADD COLUMN IF NOT EXISTS metadata JSONB;
CREATE INDEX IF NOT EXISTS idx_execution_evidence_webhook_config
  ON execution_evidence (business_id, webhook_configuration_id, recorded_at DESC);
