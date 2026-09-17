'use strict';

const assert = require('node:assert/strict');
const {
  executeCustomerOpportunityWorkflow,
  WORKFLOW_KEY,
} = require('./services/customerOpportunityWorkflow');

let nextId = 0;
function id(prefix) { nextId += 1; return `${prefix}-${nextId}`; }

function createFakeDb() {
  const definitions = new Map();
  const versions = new Map();
  const steps = new Map();
  const executions = new Map();
  const stepExecutions = new Map();
  const actions = new Map();
  let lockTail = Promise.resolve();

  function actionKey(businessId, actionType, key) { return `${businessId}:${actionType}:${key}`; }
  function executionRows(executionId) {
    const execution = [...executions.values()].find(row => row.id === executionId);
    return [...stepExecutions.values()].filter(row => row.workflow_execution_id === executionId).sort((a, b) => a.position - b.position).map(step => ({
      workflow_execution_id: execution.id,
      workflow_status: execution.status,
      failure_code: execution.failure_code,
      failure_message: execution.failure_message,
      step_execution_id: step.id,
      position: step.position,
      step_status: step.status,
      action_execution_id: step.action_execution_id,
      step_failure_code: step.failure_code,
    }));
  }

  async function query(text, params = []) {
    if (text.startsWith('SELECT pg_advisory')) return { rows: [] };
    if (text.includes('INSERT INTO workflow_definitions')) {
      const key = `${params[0]}:${params[1]}`;
      if (definitions.has(key)) return { rows: [] };
      const row = { id: id('definition'), business_id: params[0], workflow_key: params[1], name: params[2], enabled: true };
      definitions.set(key, row); return { rows: [row] };
    }
    if (text.includes('FROM workflow_definitions')) {
      return { rows: [...definitions.values()].filter(row => row.business_id === params[0] && row.workflow_key === params[1]) };
    }
    if (text.includes('INSERT INTO workflow_versions')) {
      const key = `${params[1]}:${params[2]}`;
      if (versions.has(key)) return { rows: [] };
      const row = { id: id('version'), business_id: params[0], workflow_definition_id: params[1], version: params[2] };
      versions.set(key, row); return { rows: [row] };
    }
    if (text.includes('FROM workflow_versions')) {
      return { rows: [...versions.values()].filter(row => row.business_id === params[0] && row.workflow_definition_id === params[1] && row.version === params[2]) };
    }
    if (text.includes('INSERT INTO workflow_steps')) {
      const key = `${params[1]}:${params[2]}`;
      if (!steps.has(key)) steps.set(key, { id: id('step'), business_id: params[0], workflow_version_id: params[1], position: params[2], action_type: params[3], configuration: JSON.parse(params[4]) });
      return { rows: [] };
    }
    if (text.includes('FROM workflow_steps')) {
      return { rows: [...steps.values()].filter(row => row.business_id === params[0] && row.workflow_version_id === params[1]).sort((a, b) => a.position - b.position) };
    }
    if (text.includes('INSERT INTO workflow_executions')) {
      const key = `${params[0]}:${params[1]}:${params[3]}`;
      if (executions.has(key)) return { rows: [] };
      const row = { id: id('workflow'), business_id: params[0], workflow_definition_id: params[1], workflow_version_id: params[2], idempotency_key: params[3], status: 'pending', conversation_id: params[6], failure_code: null, failure_message: null };
      executions.set(key, row); return { rows: [row] };
    }
    if (text.includes('SELECT e.id AS workflow_execution_id')) return { rows: executionRows(params[1]) };
    if (text.includes('FROM workflow_executions')) {
      return { rows: [...executions.values()].filter(row => row.business_id === params[0] && row.workflow_definition_id === params[1] && row.idempotency_key === params[2]) };
    }
    if (text.includes('INSERT INTO workflow_step_executions')) {
      const key = `${params[1]}:${params[2]}`;
      if (!stepExecutions.has(key)) stepExecutions.set(key, { id: id('step-execution'), business_id: params[0], workflow_execution_id: params[1], workflow_step_id: params[2], position: params[3], status: 'pending', action_execution_id: null, failure_code: null, failure_message: null });
      return { rows: [] };
    }
    if (text.includes('FROM workflow_step_executions')) return { rows: [...stepExecutions.values()].filter(row => row.business_id === params[0] && row.workflow_execution_id === params[1]).sort((a, b) => a.position - b.position) };
    if (text.includes('FROM action_executions a')) {
      const row = actions.get(actionKey(params[0], params[1], params[2]));
      return { rows: row ? [row] : [] };
    }
    if (text.startsWith('UPDATE workflow_step_executions')) {
      const row = [...stepExecutions.values()].find(item => item.business_id === params[4] && item.id === params[5]);
      row.status = params[0]; row.action_execution_id = params[1] || row.action_execution_id; row.failure_code = params[2]; row.failure_message = params[3]; return { rows: [] };
    }
    if (text.startsWith('UPDATE workflow_executions SET status = \'running\'')) { const row = [...executions.values()].find(item => item.business_id === params[0] && item.id === params[1]); if (row.status === 'pending') row.status = 'running'; return { rows: [] }; }
    if (text.startsWith('UPDATE workflow_executions')) { const row = [...executions.values()].find(item => item.business_id === params[3] && item.id === params[4]); row.status = params[0]; row.failure_code = params[1]; row.failure_message = params[2]; return { rows: [] }; }
    return { rows: [] };
  }

  const db = {
    query,
    pool: { connect: async () => {
      let releaseLock = null;
      return {
        query: async (text, params) => {
          if (text.startsWith('SELECT pg_advisory_lock')) {
            const previous = lockTail;
            lockTail = new Promise(resolve => { releaseLock = resolve; });
            await previous;
            return { rows: [] };
          }
          if (text.startsWith('SELECT pg_advisory_unlock')) {
            releaseLock?.(); releaseLock = null;
            return { rows: [] };
          }
          return query(text, params);
        },
        release() {},
      };
    } },
    state: { actions, executions, stepExecutions, actionKey },
  };
  return db;
}

function actionsFor(db, { failLead = false, failWebhook = false } = {}) {
  const calls = { lead: 0, webhook: 0 };
  const leadAction = async ({ db: database, businessId, idempotencyKey }) => {
    calls.lead += 1;
    const key = db.state.actionKey(businessId, 'bavio.lead.create', idempotencyKey);
    if (failLead) {
      db.state.actions.set(key, { id: id('action'), status: 'failed', error_code: 'LEAD_INPUT_INVALID', error_message: 'Lead input is invalid.', record_id: 'failure-receipt' });
      throw Object.assign(new Error('Lead input is invalid.'), { code: 'LEAD_INPUT_INVALID', executionId: db.state.actions.get(key).id });
    }
    const row = { id: id('lead-action'), status: 'succeeded', lead_id: id('lead'), record_id: id('lead-evidence') };
    db.state.actions.set(key, row);
    return { executionId: row.id, leadId: row.lead_id, status: 'succeeded' };
  };
  const webhookAction = async ({ db: database, businessId, invocationId }) => {
    calls.webhook += 1;
    const key = db.state.actionKey(businessId, 'bavio.webhook.deliver', invocationId);
    const row = { id: id('webhook-action'), status: failWebhook ? 'failed' : 'succeeded', error_code: failWebhook ? 'WEBHOOK_HTTP_500' : null, error_message: failWebhook ? 'Webhook endpoint returned HTTP 500.' : null, record_id: id('delivery-evidence'), http_status: failWebhook ? 500 : 204 };
    db.state.actions.set(key, row);
    if (failWebhook) throw Object.assign(new Error(row.error_message), { code: row.error_code, executionId: row.id });
    return { executionId: row.id, status: 'succeeded' };
  };
  return { leadAction, webhookAction, calls };
}

async function run() {
  const input = { phone: '+911234567890', name: 'Ada', intent: 'demo' };
  const db = createFakeDb(); const actions = actionsFor(db);
  const success = await executeCustomerOpportunityWorkflow({ db, businessId: 'tenant-a', workflowInvocationId: 'success-1', leadInput: input, webhookConfigurationId: 'hook-a', ...actions });
  assert.equal(success.status, 'succeeded'); assert.deepEqual(success.steps.map(step => step.status), ['succeeded', 'succeeded']); assert.equal(actions.calls.lead, 1); assert.equal(actions.calls.webhook, 1);
  const duplicate = await executeCustomerOpportunityWorkflow({ db, businessId: 'tenant-a', workflowInvocationId: 'success-1', leadInput: input, webhookConfigurationId: 'hook-a', ...actions });
  assert.equal(duplicate.workflowExecutionId, success.workflowExecutionId); assert.equal(actions.calls.lead, 1); assert.equal(actions.calls.webhook, 1);

  const failedLeadDb = createFakeDb(); const failedLead = actionsFor(failedLeadDb, { failLead: true });
  const leadFailure = await executeCustomerOpportunityWorkflow({ db: failedLeadDb, businessId: 'tenant-a', workflowInvocationId: 'lead-fail', leadInput: input, webhookConfigurationId: 'hook-a', ...failedLead });
  assert.equal(leadFailure.status, 'failed'); assert.deepEqual(leadFailure.steps.map(step => step.status), ['failed', 'skipped']); assert.equal(failedLead.calls.webhook, 0);

  const failedWebhookDb = createFakeDb(); const failedWebhook = actionsFor(failedWebhookDb, { failWebhook: true });
  const webhookFailure = await executeCustomerOpportunityWorkflow({ db: failedWebhookDb, businessId: 'tenant-a', workflowInvocationId: 'webhook-fail', leadInput: input, webhookConfigurationId: 'hook-a', ...failedWebhook });
  assert.equal(webhookFailure.status, 'failed'); assert.deepEqual(webhookFailure.steps.map(step => step.status), ['succeeded', 'failed']); assert.equal(failedWebhook.calls.lead, 1); assert.equal(failedWebhook.calls.webhook, 1);

  const concurrentDb = createFakeDb(); const concurrent = actionsFor(concurrentDb); const requests = [1, 2].map(() => executeCustomerOpportunityWorkflow({ db: concurrentDb, businessId: 'tenant-a', workflowInvocationId: 'concurrent', leadInput: input, webhookConfigurationId: 'hook-a', ...concurrent }));
  const concurrentResults = await Promise.all(requests); assert.equal(new Set(concurrentResults.map(result => result.workflowExecutionId)).size, 1); assert.equal(concurrent.calls.lead, 1); assert.equal(concurrent.calls.webhook, 1);

  const tenantDb = createFakeDb(); const tenantActions = actionsFor(tenantDb); const [tenantA, tenantB] = await Promise.all(['tenant-a', 'tenant-b'].map(businessId => executeCustomerOpportunityWorkflow({ db: tenantDb, businessId, workflowInvocationId: 'same-key', leadInput: input, webhookConfigurationId: 'hook-a', ...tenantActions })));
  assert.notEqual(tenantA.workflowExecutionId, tenantB.workflowExecutionId);

  const recoveryDb = createFakeDb(); const recoveryActions = actionsFor(recoveryDb); let interrupted = false;
  await assert.rejects(executeCustomerOpportunityWorkflow({ db: recoveryDb, businessId: 'tenant-a', workflowInvocationId: 'resume-1', leadInput: input, webhookConfigurationId: 'hook-a', ...recoveryActions, hooks: { afterActionBeforeStepFinalize: ({ step }) => { if (step.position === 1 && !interrupted) { interrupted = true; throw Object.assign(new Error('simulated interruption'), { code: 'WORKFLOW_PROCESS_INTERRUPTED' }); } } } }), /simulated interruption/);
  const resumed = await executeCustomerOpportunityWorkflow({ db: recoveryDb, businessId: 'tenant-a', workflowInvocationId: 'resume-1', leadInput: input, webhookConfigurationId: 'hook-a', ...recoveryActions });
  assert.equal(resumed.status, 'succeeded'); assert.equal(recoveryActions.calls.lead, 1); assert.equal(recoveryActions.calls.webhook, 1);

  const noResendDb = createFakeDb(); const noResendActions = actionsFor(noResendDb); let interruptStepTwo = true;
  await assert.rejects(executeCustomerOpportunityWorkflow({ db: noResendDb, businessId: 'tenant-a', workflowInvocationId: 'no-resend', leadInput: input, webhookConfigurationId: 'hook-a', ...noResendActions, hooks: { afterActionBeforeStepFinalize: ({ step }) => { if (step.position === 2 && interruptStepTwo) { interruptStepTwo = false; throw Object.assign(new Error('simulated finalization interruption'), { code: 'WORKFLOW_PROCESS_INTERRUPTED' }); } } } }), /simulated finalization interruption/);
  const reconciled = await executeCustomerOpportunityWorkflow({ db: noResendDb, businessId: 'tenant-a', workflowInvocationId: 'no-resend', leadInput: input, webhookConfigurationId: 'hook-a', ...noResendActions });
  assert.equal(reconciled.status, 'succeeded'); assert.equal(noResendActions.calls.webhook, 1);
  assert.equal(WORKFLOW_KEY, 'customer_opportunity');
  console.log('Stage 8.1 tests passed: success, fail-fast, partial effects, duplicate/concurrent identity, tenant separation, crash resume, and webhook no-resend reconciliation.');
}

run().catch(error => { console.error(error); process.exitCode = 1; });
