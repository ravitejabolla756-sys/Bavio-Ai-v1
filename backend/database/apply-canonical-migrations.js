'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const VERIFICATION_REFERENCE = 'qninimnubfjmyriafdgj';
const MIGRATIONS = [
  '000_canonical_fresh_schema.sql',
  '023_developer_platform_and_campaigns.sql',
  '024_hash_email_verifications.sql',
  '025_add_pending_verification_enum.sql',
  '026_create_password_reset_tokens.sql',
  '028_bavio_lead_action_execution.sql',
  '029_webhook_action_execution_fields.sql',
  '030_webhook_secret_encryption.sql',
];

function assertVerificationDatabase(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('DATABASE_URL is required.');
  const url = new URL(connectionString);
  if (!url.hostname.includes(VERIFICATION_REFERENCE)) {
    throw new Error('Refusing migration: DATABASE_URL is not the dedicated verification project.');
  }
}

async function applyCanonicalMigrations({ connectionString = process.env.DATABASE_URL } = {}) {
  assertVerificationDatabase(connectionString);
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  const applied = [];
  try {
    for (const filename of MIGRATIONS) {
      const migrationPath = path.join(__dirname, '..', 'sql', filename);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
        applied.push(filename);
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw Object.assign(new Error(`Migration ${filename} failed: ${error.message}`), { cause: error, migration: filename });
      }
    }
    return applied;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  applyCanonicalMigrations()
    .then((applied) => {
      console.log(`Canonical migrations applied: ${applied.join(', ')}`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

module.exports = { MIGRATIONS, VERIFICATION_REFERENCE, assertVerificationDatabase, applyCanonicalMigrations };
