'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const http = require('node:http');
const { db, pool, preflight, A, B, env } = require('./verify-stage7-real.cjs');

const dbPath = require.resolve('../database/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: db };
process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = env.WEBHOOK_SECRET_ENCRYPTION_KEY;

const webhookService = require('../services/webhookService');
const { executeCustomerOpportunityWorkflow } = require('../services/customerOpportunityWorkflow');

const base = process.argv[2];
assert(base && new URL(base).protocol === 'https:', 'Expected temporary HTTPS receiver URL');

const PORT = 18574;
const PREFIX = 'stage81-real-final-v2';
const secrets = new Map();
const receipts = [];

const receiver = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 32768) req.destroy();
  });
  req.on('end', () => {
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const signature = req.headers['x-bavio-signature'] || '';
    const match = /^t=(\d+),v1=([a-f0-9]{64})$/.exec(signature);
    const secret = secrets.get(req.url);
    const expected = match && secret
      ? crypto.createHmac('sha256', secret).update(`${match[1]}.${body}`).digest('hex')
      : null;
    const signatureValid = Boolean(match && expected && crypto.timingSafeEqual(Buffer.from(match[2], 'hex'), Buffer.from(expected, 'hex')));
    receipts.push({
      correlationId: payload.execution_id,
      path: req.url,
      timestamp: new Date().toISOString(),
      signatureValid,
    });
    res.writeHead(req.url === '/failure' ? 500 : 204).end();
  });
});

function lead(name, phoneSuffix) {
  return {
    phone: `+1202555${phoneSuffix}`,
    name: `Synthetic Stage 8 ${name}`,
    intent: 'verification',
    notes: 'Synthetic isolated verification data.',
  };
}

async function registerHook(businessId, route) {
  const hook = await webhookService.registerWebhook(businessId, `${base}${route}`);
  const stored = (await db.query(
    'SELECT * FROM webhooks WHERE id = $1 AND business_id = $2',
    [hook.id, businessId]
  )).rows[0];
  assert(stored);
  assert.equal(stored.signing_secret, null);
  secrets.set(route, webhookService.resolveSigningSecret(stored));
  return hook.id;
}

async function invoke({ businessId = A, key, hookId, leadInput, hooks = {} }) {
  return executeCustomerOpportunityWorkflow({
    db,
    businessId,
    workflowInvocationId: key,
    sourceType: 'stage8_real_verification',
    sourceId: key,
    leadInput,
    webhookConfigurationId: hookId,
    hooks,
  });
}

async function runState(businessId, key) {
  const execution = (await db.query(
    `SELECT e.*, v.version
     FROM workflow_executions e
     JOIN workflow_versions v ON v.id = e.workflow_version_id AND v.business_id = e.business_id
     JOIN workflow_definitions d ON d.id = e.workflow_definition_id AND d.business_id = e.business_id
     WHERE e.business_id = $1 AND e.idempotency_key = $2 AND d.workflow_key = 'customer_opportunity'`,
    [businessId, key]
  )).rows[0];
  assert(execution, `Missing workflow execution for ${key}`);
  const steps = (await db.query(
    `SELECT se.*, ws.action_type, a.status AS action_status, a.lead_id,
            a.attempt_count, ev.id AS evidence_id, ev.record_id, ev.http_status
     FROM workflow_step_executions se
     JOIN workflow_steps ws ON ws.id = se.workflow_step_id AND ws.business_id = se.business_id
     LEFT JOIN action_executions a ON a.id = se.action_execution_id AND a.business_id = se.business_id
     LEFT JOIN LATERAL (
       SELECT id, record_id, http_status
       FROM execution_evidence
       WHERE execution_id = a.id AND business_id = a.business_id
       ORDER BY recorded_at DESC, id DESC LIMIT 1
     ) ev ON TRUE
     WHERE se.business_id = $1 AND se.workflow_execution_id = $2
     ORDER BY se.position`,
    [businessId, execution.id]
  )).rows;
  return { execution, steps };
}

async function assertSuccess(businessId, key) {
  const state = await runState(businessId, key);
  assert.equal(state.execution.status, 'succeeded');
  assert.equal(state.execution.version, 1);
  assert.deepEqual(state.steps.map(row => row.status), ['succeeded', 'succeeded']);
  assert.deepEqual(state.steps.map(row => row.action_type), ['bavio.lead.create', 'bavio.webhook.deliver']);
  for (const step of state.steps) {
    assert(step.action_execution_id);
    assert.equal(step.action_status, 'succeeded');
    assert(step.evidence_id);
    assert(step.record_id);
  }
  assert.equal(state.steps[1].attempt_count, 1);
  return state;
}

function requestCount(pathname) {
  return receipts.filter(row => row.path === pathname).length;
}

async function run() {
  await preflight();
  await new Promise(resolve => receiver.listen(PORT, '127.0.0.1', resolve));

  const successHookA = await registerHook(A, '/success');
  const failureHookA = await registerHook(A, '/failure');
  const successHookB = await registerHook(B, '/tenant-b-success');

  const successKey = `${PREFIX}-success`;
  const successBefore = requestCount('/success');
  const success = await invoke({ businessId: A, key: successKey, hookId: successHookA, leadInput: lead('Success', '0101') });
  assert.equal(success.status, 'succeeded');
  const successState = await assertSuccess(A, successKey);
  assert.equal(requestCount('/success'), successBefore + 1);
  assert(receipts.at(-1).signatureValid);
  console.log('PASS real workflow success and persisted Workflow -> Step -> Action -> Evidence chain');

  const invalidKey = `${PREFIX}-step1-failure`;
  const networkBeforeInvalid = receipts.length;
  const invalid = await invoke({ businessId: A, key: invalidKey, hookId: successHookA, leadInput: { phone: '' } });
  assert.equal(invalid.status, 'failed');
  assert.deepEqual(invalid.steps.map(row => row.status), ['failed', 'skipped']);
  assert.equal(receipts.length, networkBeforeInvalid);
  console.log('PASS Step 1 failure skips Step 2 with zero network requests');

  const failureKey = `${PREFIX}-step2-failure`;
  const failureBefore = requestCount('/failure');
  const failed = await invoke({ businessId: A, key: failureKey, hookId: failureHookA, leadInput: lead('Step 2 Failure', '0102') });
  assert.equal(failed.status, 'failed');
  assert.deepEqual(failed.steps.map(row => row.status), ['succeeded', 'failed']);
  const failedState = await runState(A, failureKey);
  assert(failedState.steps[0].lead_id);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM leads WHERE id = $1 AND business_id = $2', [failedState.steps[0].lead_id, A])).rows[0].count, 1);
  assert.equal(failedState.steps[1].attempt_count, 1);
  assert.equal(requestCount('/failure'), failureBefore + 1);
  console.log('PASS Step 2 failure preserves Lead and performs exactly one webhook attempt');

  const sequentialKey = `${PREFIX}-sequential`;
  const sequentialBefore = requestCount('/success');
  const firstSequential = await invoke({ businessId: A, key: sequentialKey, hookId: successHookA, leadInput: lead('Sequential', '0103') });
  const secondSequential = await invoke({ businessId: A, key: sequentialKey, hookId: successHookA, leadInput: lead('Sequential', '0103') });
  assert.equal(firstSequential.workflowExecutionId, secondSequential.workflowExecutionId);
  const sequentialState = await assertSuccess(A, sequentialKey);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM workflow_executions WHERE business_id = $1 AND idempotency_key = $2', [A, sequentialKey])).rows[0].count, 1);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM workflow_step_executions WHERE business_id = $1 AND workflow_execution_id = $2', [A, sequentialState.execution.id])).rows[0].count, 2);
  assert.equal(requestCount('/success'), sequentialBefore + 1);
  console.log('PASS sequential workflow idempotency');

  const concurrentKey = `${PREFIX}-concurrent`;
  const concurrentBefore = requestCount('/success');
  const concurrentResults = await Promise.all([
    invoke({ businessId: A, key: concurrentKey, hookId: successHookA, leadInput: lead('Concurrent', '0104') }),
    invoke({ businessId: A, key: concurrentKey, hookId: successHookA, leadInput: lead('Concurrent', '0104') }),
  ]);
  assert.equal(new Set(concurrentResults.map(row => row.workflowExecutionId)).size, 1);
  const concurrentState = await assertSuccess(A, concurrentKey);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM workflow_executions WHERE business_id = $1 AND idempotency_key = $2', [A, concurrentKey])).rows[0].count, 1);
  assert.equal((await db.query('SELECT count(DISTINCT action_execution_id)::int AS count FROM workflow_step_executions WHERE business_id = $1 AND workflow_execution_id = $2', [A, concurrentState.execution.id])).rows[0].count, 2);
  assert.equal(requestCount('/success'), concurrentBefore + 1);
  console.log('PASS real PostgreSQL concurrent duplicate protection and advisory locking');

  const sharedKey = `${PREFIX}-shared-key`;
  const sharedBefore = receipts.length;
  const tenantAResult = await invoke({ businessId: A, key: sharedKey, hookId: successHookA, leadInput: lead('Tenant A Shared', '0105') });
  const tenantBResult = await invoke({ businessId: B, key: sharedKey, hookId: successHookB, leadInput: lead('Tenant B Shared', '0106') });
  assert.notEqual(tenantAResult.workflowExecutionId, tenantBResult.workflowExecutionId);
  assert.equal(receipts.length, sharedBefore + 2);
  const tenantBState = await assertSuccess(B, sharedKey);
  console.log('PASS cross-tenant same-key isolation');

  const isolationBefore = receipts.length;
  const isolationKey = `${PREFIX}-foreign-webhook`;
  const foreignHook = await invoke({ businessId: A, key: isolationKey, hookId: successHookB, leadInput: lead('Foreign Hook', '0107') });
  assert.equal(foreignHook.status, 'failed');
  assert.deepEqual(foreignHook.steps.map(row => row.status), ['succeeded', 'failed']);
  assert.equal(receipts.length, isolationBefore);
  const foreignState = await runState(A, isolationKey);
  assert.equal(foreignState.steps[1].action_execution_id, null);
  assert.equal(foreignState.steps[1].failure_code, 'WEBHOOK_NOT_FOUND');
  console.log('PASS cross-tenant webhook configuration blocked before action/network');

  const crashKey = `${PREFIX}-crash-step1`;
  let interruptStepOne = true;
  await assert.rejects(
    invoke({ businessId: A, key: crashKey, hookId: successHookA, leadInput: lead('Crash Step 1', '0108'), hooks: {
      afterActionBeforeStepFinalize: ({ step }) => {
        if (step.position === 1 && interruptStepOne) {
          interruptStepOne = false;
          throw Object.assign(new Error('controlled Step 1 interruption'), { code: 'WORKFLOW_PROCESS_INTERRUPTED' });
        }
      },
    }}),
    error => error.code === 'WORKFLOW_PROCESS_INTERRUPTED'
  );
  const beforeResume = await runState(A, crashKey);
  const leadActionId = (await db.query(
    `SELECT id, lead_id FROM action_executions
     WHERE business_id = $1 AND action_type = 'bavio.lead.create'
       AND idempotency_key = $2`,
    [A, `workflow:${beforeResume.execution.id}:step:${beforeResume.steps[0].workflow_step_id}`]
  )).rows[0];
  assert(leadActionId?.lead_id);
  const crashRequestsBefore = requestCount('/success');
  const resumed = await invoke({ businessId: A, key: crashKey, hookId: successHookA, leadInput: lead('Crash Step 1', '0108') });
  assert.equal(resumed.status, 'succeeded');
  const afterResume = await assertSuccess(A, crashKey);
  assert.equal(afterResume.steps[0].action_execution_id, leadActionId.id);
  assert.equal(afterResume.steps[0].lead_id, leadActionId.lead_id);
  assert.equal(requestCount('/success'), crashRequestsBefore + 1);
  console.log('PASS crash-after-Step-1 recovery without duplicate Lead');

  const noResendKey = `${PREFIX}-no-resend`;
  let interruptStepTwo = true;
  const noResendBefore = requestCount('/success');
  await assert.rejects(
    invoke({ businessId: A, key: noResendKey, hookId: successHookA, leadInput: lead('No Resend', '0109'), hooks: {
      afterActionBeforeStepFinalize: ({ step }) => {
        if (step.position === 2 && interruptStepTwo) {
          interruptStepTwo = false;
          throw Object.assign(new Error('controlled webhook finalization interruption'), { code: 'WORKFLOW_PROCESS_INTERRUPTED' });
        }
      },
    }}),
    error => error.code === 'WORKFLOW_PROCESS_INTERRUPTED'
  );
  assert.equal(requestCount('/success'), noResendBefore + 1);
  const noResendInterrupted = await runState(A, noResendKey);
  const webhookActionId = (await db.query(
    `SELECT id FROM action_executions
     WHERE business_id = $1 AND action_type = 'bavio.webhook.deliver'
       AND idempotency_key = $2`,
    [A, `workflow:${noResendInterrupted.execution.id}:step:${noResendInterrupted.steps[1].workflow_step_id}`]
  )).rows[0].id;
  const reconciled = await invoke({ businessId: A, key: noResendKey, hookId: successHookA, leadInput: lead('No Resend', '0109') });
  assert.equal(reconciled.status, 'succeeded');
  const noResendState = await assertSuccess(A, noResendKey);
  assert.equal(noResendState.steps[1].action_execution_id, webhookActionId);
  assert.equal(requestCount('/success'), noResendBefore + 1);
  console.log('PASS webhook finalization recovery reuses evidence and does not resend');

  const replayBefore = requestCount('/failure');
  const replay = await invoke({ businessId: A, key: failureKey, hookId: failureHookA, leadInput: lead('Step 2 Failure', '0102') });
  assert.equal(replay.status, 'failed');
  assert.equal(requestCount('/failure'), replayBefore);
  console.log('PASS failed Action replay does not automatically retry');

  const tenantBDefinition = (await db.query(
    "SELECT id FROM workflow_definitions WHERE business_id = $1 AND workflow_key = 'customer_opportunity'",
    [B]
  )).rows[0].id;
  const bStep = tenantBState.steps[0];
  for (const [table, id] of [
    ['workflow_definitions', tenantBDefinition],
    ['workflow_executions', tenantBState.execution.id],
    ['workflow_step_executions', bStep.id],
    ['action_executions', bStep.action_execution_id],
    ['execution_evidence', bStep.evidence_id],
  ]) {
    assert.equal((await db.query(`SELECT id FROM ${table} WHERE id = $1 AND business_id = $2`, [id, A])).rowCount, 0);
  }
  console.log('PASS direct-ID tenant isolation and version-1 pinning');

  assert(receipts.every(row => row.signatureValid));
  console.log(JSON.stringify({ project: 'qninimnubfjmyriafdgj', receipts, testedKeys: PREFIX }, null, 2));
}

run().catch(error => {
  console.error('FAIL', error.code || error.name, error.message || 'Stage 8 real verification failed', error.detail || '');
  process.exitCode = 1;
}).finally(async () => {
  receiver.closeAllConnections();
  await new Promise(resolve => receiver.close(resolve));
  await pool.end();
});
