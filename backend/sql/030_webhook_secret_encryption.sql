-- Stage 7.2.1: explicit versioned storage for authenticated webhook secret encryption.
-- Existing signing_secret values are retained only for explicit, operator-run migration.
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS signing_secret_encrypted TEXT;
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS signing_secret_version VARCHAR(20);
ALTER TABLE webhooks ALTER COLUMN signing_secret DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_webhooks_secret_migration
  ON webhooks (id) WHERE signing_secret_encrypted IS NULL AND signing_secret IS NOT NULL;
