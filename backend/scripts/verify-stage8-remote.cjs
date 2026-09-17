'use strict';

const { Pool } = require('pg');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../../.env.verification.local');
const env = dotenv.parse(fs.readFileSync(envPath));

const EXPECTED_PROJECT = 'qninimnubfjmyriafdgj';
const expectedSupabaseHost = `${EXPECTED_PROJECT}.supabase.co`;
const expectedDatabaseHost = `db.${EXPECTED_PROJECT}.supabase.co`;
const supabaseHost = new URL(env.SUPABASE_URL || '').hostname;
const databaseUrl = new URL(env.DATABASE_URL || '');
const databaseHost = databaseUrl.hostname;
if (supabaseHost !== expectedSupabaseHost || databaseHost !== expectedDatabaseHost) {
  throw new Error(`TARGET_MISMATCH: expected ${expectedSupabaseHost} and ${expectedDatabaseHost}, got ${supabaseHost} and ${databaseHost}`);
}

const pool = new Pool({
  host: 'aws-0-ap-south-1.pooler.supabase.com',
  port: 5432,
  user: `postgres.${EXPECTED_PROJECT}`,
  password: decodeURIComponent(databaseUrl.password),
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});
const requiredTables = ['businesses', 'leads', 'webhooks', 'action_executions', 'execution_evidence', 'workflow_definitions', 'workflow_versions', 'workflow_steps', 'workflow_executions', 'workflow_step_executions'];

async function run() {
  const tables = await pool.query(`SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ANY($1::text[])
    ORDER BY table_name`, [requiredTables]);
  const rls = await pool.query(`SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = ANY($1::text[])
    ORDER BY c.relname`, [requiredTables]);
  const presentWorkflowTables = tables.rows.map(row => row.table_name).filter(name => name.startsWith('workflow_'));
  const constraints = presentWorkflowTables.length === 5 ? await pool.query(`SELECT conrelid::regclass::text AS table_name, conname,
      pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid IN (
      'public.workflow_definitions'::regclass,
      'public.workflow_versions'::regclass,
      'public.workflow_steps'::regclass,
      'public.workflow_executions'::regclass,
      'public.workflow_step_executions'::regclass
    ) ORDER BY 1, 2`) : { rows: [] };
  const indexes = await pool.query(`SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = ANY($1::text[])
    ORDER BY tablename, indexname`, [['workflow_definitions', 'workflow_versions', 'workflow_steps', 'workflow_executions', 'workflow_step_executions']]);
  const seed = presentWorkflowTables.length === 5 ? await pool.query(`SELECT d.business_id, d.workflow_key, d.name, d.enabled,
      v.version, s.position, s.action_type, s.configuration
    FROM workflow_definitions d
    JOIN workflow_versions v ON v.workflow_definition_id = d.id AND v.business_id = d.business_id
    JOIN workflow_steps s ON s.workflow_version_id = v.id AND s.business_id = v.business_id
    WHERE d.workflow_key = 'customer_opportunity'
    ORDER BY d.business_id, s.position`) : { rows: [] };
  const syntheticTenants = await pool.query(`SELECT id, name
    FROM businesses
    WHERE id = ANY($1::uuid[])
    ORDER BY id`, [[
      '00000000-0000-4000-8000-00000000000a',
      '00000000-0000-4000-8000-00000000000b',
    ]]);
  const workflowInventory = presentWorkflowTables.length === 5 ? await pool.query(`SELECT d.business_id, d.workflow_key, d.name,
      v.version, s.position, s.action_type
    FROM workflow_definitions d
    LEFT JOIN workflow_versions v ON v.workflow_definition_id = d.id AND v.business_id = d.business_id
    LEFT JOIN workflow_steps s ON s.workflow_version_id = v.id AND s.business_id = v.business_id
    ORDER BY d.business_id, d.workflow_key, v.version, s.position`) : { rows: [] };
  const counts = presentWorkflowTables.length === 5 ? await pool.query(`SELECT
    (SELECT count(*)::int FROM workflow_executions) AS workflow_executions,
    (SELECT count(*)::int FROM workflow_step_executions) AS workflow_step_executions`) : { rows: [] };
  const verificationRuns = presentWorkflowTables.length === 5 ? await pool.query(`SELECT e.business_id, e.id AS workflow_execution_id,
      e.idempotency_key, e.status AS workflow_status, e.failure_code AS workflow_failure_code,
      s.position, s.status AS step_status, s.failure_code AS step_failure_code,
      a.id AS action_execution_id, a.action_type, a.status AS action_status,
      a.error_code AS action_error_code, a.attempt_count
    FROM workflow_executions e
    JOIN workflow_step_executions s ON s.workflow_execution_id = e.id AND s.business_id = e.business_id
    LEFT JOIN action_executions a ON a.id = s.action_execution_id AND a.business_id = s.business_id
    WHERE e.idempotency_key LIKE 'stage81-real-final-v2-%'
    ORDER BY e.created_at, e.business_id, s.position`) : { rows: [] };
  const verificationAggregates = presentWorkflowTables.length === 5 ? await pool.query(`SELECT e.business_id, e.idempotency_key,
      COUNT(DISTINCT e.id)::int AS workflow_executions,
      COUNT(DISTINCT s.id)::int AS step_executions,
      COUNT(DISTINCT a.id)::int AS linked_actions,
      COUNT(DISTINCT ev.id)::int AS linked_evidence,
      COUNT(DISTINCT a.lead_id) FILTER (WHERE a.action_type = 'bavio.lead.create')::int AS leads
    FROM workflow_executions e
    JOIN workflow_step_executions s ON s.workflow_execution_id = e.id AND s.business_id = e.business_id
    LEFT JOIN action_executions a ON a.id = s.action_execution_id AND a.business_id = s.business_id
    LEFT JOIN execution_evidence ev ON ev.execution_id = a.id AND ev.business_id = a.business_id
    WHERE e.idempotency_key LIKE 'stage81-real-final-v2-%'
    GROUP BY e.business_id, e.idempotency_key
    ORDER BY e.idempotency_key, e.business_id`) : { rows: [] };
  const output = process.argv.includes('--verification-summary')
    ? { project: EXPECTED_PROJECT, counts: counts.rows, verificationRuns: verificationRuns.rows, verificationAggregates: verificationAggregates.rows }
    : { project: EXPECTED_PROJECT, tables: tables.rows, rls: rls.rows, constraints: constraints.rows, indexes: indexes.rows, syntheticTenants: syntheticTenants.rows, workflowInventory: workflowInventory.rows, seed: seed.rows, counts: counts.rows, verificationRuns: verificationRuns.rows, verificationAggregates: verificationAggregates.rows };
  console.log(JSON.stringify(output, null, 2));
}

run().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
