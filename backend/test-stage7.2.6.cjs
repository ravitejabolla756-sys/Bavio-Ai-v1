'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const { applyCanonicalMigrations, assertVerificationDatabase } = require('./database/apply-canonical-migrations');

dotenv.config({ path: path.resolve(__dirname, '..', '.env.verification.local') });
assertVerificationDatabase();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function one(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0];
}

async function run() {
  const before = await one("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'");
  assert.equal(before.count, 0, 'Fresh-schema test requires an empty public schema.');

  const applied = await applyCanonicalMigrations();
  assert.deepEqual(applied, [
    '000_canonical_fresh_schema.sql',
    '023_developer_platform_and_campaigns.sql',
    '024_hash_email_verifications.sql',
    '025_add_pending_verification_enum.sql',
    '026_create_password_reset_tokens.sql',
    '028_bavio_lead_action_execution.sql',
    '029_webhook_action_execution_fields.sql',
    '030_webhook_secret_encryption.sql',
  ]);

  const required = ['businesses', 'assistants', 'calls', 'leads', 'webhooks', 'webhook_deliveries', 'action_executions', 'execution_evidence'];
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  const tableNames = new Set(tables.rows.map((row) => row.table_name));
  for (const table of required) assert.equal(tableNames.has(table), true, `Missing required table: ${table}`);

  const businessesId = await one("SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'id'");
  const leadsId = await one("SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'id'");
  const leadsBusinessId = await one("SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'business_id'");
  assert.equal(businessesId.data_type, 'uuid');
  assert.equal(leadsId.data_type, 'uuid');
  assert.equal(leadsBusinessId.data_type, 'uuid');

  const actionColumns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'action_executions'");
  const webhookColumns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'webhooks'");
  const actionColumnNames = new Set(actionColumns.rows.map((row) => row.column_name));
  const webhookColumnNames = new Set(webhookColumns.rows.map((row) => row.column_name));
  for (const column of ['idempotency_key', 'attempt_count', 'duration_ms']) assert.equal(actionColumnNames.has(column), true, `Missing action column: ${column}`);
  for (const column of ['signing_secret_encrypted', 'signing_secret_version']) assert.equal(webhookColumnNames.has(column), true, `Missing webhook column: ${column}`);

  const index = await one("SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_action_executions_idempotency'");
  assert.match(index.indexdef, /business_id/);
  assert.match(index.indexdef, /action_type/);
  assert.match(index.indexdef, /idempotency_key/);

  const foreignKeys = await one(`
    SELECT count(*)::int AS count
    FROM pg_constraint c
    JOIN pg_class child ON child.oid = c.conrelid
    WHERE c.contype = 'f'
      AND child.relname IN ('leads', 'webhooks', 'action_executions', 'execution_evidence')
  `);
  assert.ok(foreignKeys.count >= 6, `Expected tenant/execution foreign keys, found ${foreignKeys.count}`);
  console.log('Stage 7.2.6 fresh-schema test passed: canonical UUID tenant baseline and Stage 7 migrations applied.');
}

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
