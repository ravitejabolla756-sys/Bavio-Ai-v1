'use strict';

const crypto = require('node:crypto');
const { createBavioLead, ACTION_TYPE: LEAD_ACTION } = require('./bavioLeadAction');
const { executeBavioWebhook, ACTION_TYPE: WEBHOOK_ACTION } = require('./bavioWebhookAction');

const WORKFLOW_KEY = 'customer_opportunity';
const WORKFLOW_NAME = 'Customer opportunity workflow';
const WORKFLOW_VERSION = 1;
const WORKFLOW_STEPS = [
  { position: 1, actionType: LEAD_ACTION, configuration: {} },
  { position: 2, actionType: WEBHOOK_ACTION, configuration: { eventType: 'bavio.lead.created' } },
];

function getDb() {
  return require('../database/db');
}

function requireText(value, label, max = 255) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) {
    throw Object.assign(new Error(`${label} is invalid.`), { code: 'WORKFLOW_INPUT_INVALID' });
  }
  return value.trim();
}

function safeFailure(error, fallback = 'WORKFLOW_FAILED') {
  const code = typeof error?.code === 'string' && /^[A-Z0-9_:-]{1,80}$/.test(error.code) ? error.code : fallback;
  const message = typeof error?.message === 'string' && error.message.length <= 240 ? error.message : 'Workflow execution failed.';
  return { code, message };
}

async function withTransaction(db, work) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function ensureCustomerOpportunityWorkflow({ db = getDb(), businessId } = {}) {
  const tenantId = requireText(businessId, 'Tenant identity', 100);
  return withTransaction(db, async (client) => {
    const definitionResult = await client.query(
      `INSERT INTO workflow_definitions (business_id, workflow_key, name, enabled)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (business_id, workflow_key) DO NOTHING
       RETURNING id, business_id, workflow_key, name, enabled`,
      [tenantId, WORKFLOW_KEY, WORKFLOW_NAME]
    );
    const definition = definitionResult.rows[0] || (await client.query(
      `SELECT id, business_id, workflow_key, name, enabled
       FROM workflow_definitions WHERE business_id = $1 AND workflow_key = $2`,
      [tenantId, WORKFLOW_KEY]
    )).rows[0];
    if (!definition || !definition.enabled) throw Object.assign(new Error('Customer opportunity workflow is unavailable.'), { code: 'WORKFLOW_DISABLED' });

    const versionResult = await client.query(
      `INSERT INTO workflow_versions (business_id, workflow_definition_id, version)
       VALUES ($1, $2, $3)
       ON CONFLICT (workflow_definition_id, version) DO NOTHING
       RETURNING id, business_id, workflow_definition_id, version`,
      [tenantId, definition.id, WORKFLOW_VERSION]
    );
    const version = versionResult.rows[0] || (await client.query(
      `SELECT id, business_id, workflow_definition_id, version
       FROM workflow_versions WHERE business_id = $1 AND workflow_definition_id = $2 AND version = $3`,
      [tenantId, definition.id, WORKFLOW_VERSION]
    )).rows[0];
    if (!version) throw Object.assign(new Error('Customer opportunity workflow version is unavailable.'), { code: 'WORKFLOW_VERSION_UNAVAILABLE' });
    for (const step of WORKFLOW_STEPS) {
      await client.query(
        `INSERT INTO workflow_steps (business_id, workflow_version_id, position, action_type, configuration)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         ON CONFLICT (workflow_version_id, position) DO NOTHING`,
        [tenantId, version.id, step.position, step.actionType, JSON.stringify(step.configuration)]
      );
    }
    const steps = (await client.query(
      `SELECT id, business_id, workflow_version_id, position, action_type, configuration
       FROM workflow_steps WHERE business_id = $1 AND workflow_version_id = $2 ORDER BY position`,
      [tenantId, version.id]
    )).rows;
    if (steps.length !== WORKFLOW_STEPS.length || steps.some((step, index) => {
      const expected = WORKFLOW_STEPS[index];
      const configuration = typeof step.configuration === 'string' ? JSON.parse(step.configuration) : (step.configuration || {});
      return step.position !== expected.position || step.action_type !== expected.actionType || JSON.stringify(configuration) !== JSON.stringify(expected.configuration);
    })) {
      throw Object.assign(new Error('Customer opportunity workflow version is immutable and does not match the canonical step contract.'), { code: 'WORKFLOW_VERSION_MISMATCH' });
    }
    return { definition, version, steps: steps.map(step => ({ ...step, actionType: step.action_type, configuration: typeof step.configuration === 'string' ? JSON.parse(step.configuration) : (step.configuration || {}) })) };
  });
}

async function acquireProgressLock(db, lockKey) {
  if (!db.pool?.connect) return () => {};
  const client = await db.pool.connect();
  await client.query('SELECT pg_advisory_lock(hashtextextended($1, 0))', [lockKey]);
  return async () => {
    await client.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [lockKey]).catch(() => {});
    client.release();
  };
}

async function createOrLoadExecution({ db, workflow, businessId, workflowInvocationId, conversationId, sourceType, sourceId }) {
  return withTransaction(db, async (client) => {
    const inserted = await client.query(
      `INSERT INTO workflow_executions
        (business_id, workflow_definition_id, workflow_version_id, idempotency_key, source_type, source_id, conversation_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       ON CONFLICT (business_id, workflow_definition_id, idempotency_key) DO NOTHING
       RETURNING id, business_id, workflow_definition_id, workflow_version_id, idempotency_key, status, conversation_id`,
      [businessId, workflow.definition.id, workflow.version.id, workflowInvocationId, sourceType, sourceId, conversationId]
    );
    const execution = inserted.rows[0] || (await client.query(
      `SELECT id, business_id, workflow_definition_id, workflow_version_id, idempotency_key, status, conversation_id
       FROM workflow_executions WHERE business_id = $1 AND workflow_definition_id = $2 AND idempotency_key = $3`,
      [businessId, workflow.definition.id, workflowInvocationId]
    )).rows[0];
    for (const step of workflow.steps) {
      await client.query(
        `INSERT INTO workflow_step_executions
          (business_id, workflow_execution_id, workflow_step_id, position, status)
         VALUES ($1, $2, $3, $4, 'pending')
         ON CONFLICT (workflow_execution_id, workflow_step_id) DO NOTHING`,
        [businessId, execution.id, step.id, step.position]
      );
    }
    return execution;
  });
}

async function readActionState(db, { businessId, actionType, idempotencyKey }) {
  const result = await db.query(
    `SELECT a.id, a.status, a.lead_id, a.error_code, a.error_message,
            e.evidence_type, e.record_id, e.http_status, e.metadata
     FROM action_executions a
     LEFT JOIN LATERAL (
       SELECT evidence_type, record_id, http_status, metadata
       FROM execution_evidence WHERE execution_id = a.id AND business_id = a.business_id
       ORDER BY recorded_at DESC, id DESC LIMIT 1
     ) e ON TRUE
     WHERE a.business_id = $1 AND a.action_type = $2 AND a.idempotency_key = $3`,
    [businessId, actionType, idempotencyKey]
  );
  return result.rows[0] || null;
}

function actionKey(executionId, stepId) {
  return `workflow:${executionId}:step:${stepId}`;
}

async function setStep(db, businessId, stepExecutionId, fields) {
  const values = [fields.status, fields.actionExecutionId || null, fields.failureCode || null, fields.failureMessage || null, businessId, stepExecutionId];
  await db.query(
    `UPDATE workflow_step_executions
     SET status = $1::varchar, action_execution_id = COALESCE($2, action_execution_id),
         failure_code = $3, failure_message = $4,
         started_at = CASE WHEN $1::varchar = 'running' AND started_at IS NULL THEN NOW() ELSE started_at END,
         completed_at = CASE WHEN $1::varchar IN ('succeeded', 'failed', 'skipped') THEN NOW() ELSE completed_at END
     WHERE business_id = $5 AND id = $6`,
    values
  );
}

async function finishWorkflow(db, businessId, executionId, status, failure) {
  await db.query(
    `UPDATE workflow_executions
     SET status = $1, completed_at = NOW(), failure_code = $2, failure_message = $3
     WHERE business_id = $4 AND id = $5`,
    [status, failure?.code || null, failure?.message || null, businessId, executionId]
  );
}

async function readWorkflowSummary(db, businessId, executionId) {
  const result = await db.query(
    `SELECT e.id AS workflow_execution_id, e.status AS workflow_status,
            e.failure_code, e.failure_message, s.id AS step_execution_id,
            s.position, s.status AS step_status, s.action_execution_id,
            s.failure_code AS step_failure_code
     FROM workflow_executions e
     JOIN workflow_step_executions s ON s.workflow_execution_id = e.id AND s.business_id = e.business_id
     WHERE e.business_id = $1 AND e.id = $2 ORDER BY s.position`,
    [businessId, executionId]
  );
  const first = result.rows[0];
  return { workflowExecutionId: executionId, status: first?.workflow_status, failureCode: first?.failure_code || null, failureMessage: first?.failure_message || null, steps: result.rows.map(row => ({ id: row.step_execution_id, position: row.position, status: row.step_status, actionExecutionId: row.action_execution_id, failureCode: row.step_failure_code || null })) };
}

async function executeCustomerOpportunityWorkflow({
  db = getDb(),
  businessId,
  workflowInvocationId,
  conversationId = null,
  leadInput,
  webhookConfigurationId,
  sourceType = 'internal_workflow_invocation',
  sourceId = null,
  transport,
  lookup,
  leadAction = createBavioLead,
  webhookAction = executeBavioWebhook,
  hooks = {},
} = {}) {
  const tenantId = requireText(businessId, 'Tenant identity', 100);
  const invocationId = requireText(workflowInvocationId, 'Workflow invocation ID');
  if (!leadInput || typeof leadInput !== 'object' || Array.isArray(leadInput)) throw Object.assign(new Error('Lead input is required.'), { code: 'WORKFLOW_INPUT_INVALID' });
  const workflow = await ensureCustomerOpportunityWorkflow({ db, businessId: tenantId });
  const unlock = await acquireProgressLock(db, `customer-opportunity:${tenantId}:${invocationId}`);
  try {
    const execution = await createOrLoadExecution({ db, workflow, businessId: tenantId, workflowInvocationId: invocationId, conversationId, sourceType, sourceId });
    if (execution.status === 'succeeded' || execution.status === 'failed') return readWorkflowSummary(db, tenantId, execution.id);
    await db.query(`UPDATE workflow_executions SET status = 'running', started_at = COALESCE(started_at, NOW()) WHERE business_id = $1 AND id = $2 AND status = 'pending'`, [tenantId, execution.id]);
    const stepRows = (await db.query(`SELECT id, workflow_step_id, position, status FROM workflow_step_executions WHERE business_id = $1 AND workflow_execution_id = $2 ORDER BY position`, [tenantId, execution.id])).rows;
    let leadId = null;
    for (const step of workflow.steps) {
      const stepExecution = stepRows.find(row => row.workflow_step_id === step.id);
      if (!stepExecution || stepExecution.status === 'skipped') continue;
      if (stepExecution.status === 'succeeded') {
        if (step.actionType === LEAD_ACTION) {
          const prior = await readActionState(db, { businessId: tenantId, actionType: LEAD_ACTION, idempotencyKey: actionKey(execution.id, step.id) });
          leadId = prior?.record_id || prior?.lead_id || leadId;
        }
        continue;
      }
      if (stepExecution.status === 'failed') {
        await finishWorkflow(db, tenantId, execution.id, 'failed', { code: stepExecution.failure_code || 'WORKFLOW_STEP_FAILED', message: 'A workflow step previously failed.' });
        return readWorkflowSummary(db, tenantId, execution.id);
      }
      const key = actionKey(execution.id, step.id);
      await setStep(db, tenantId, stepExecution.id, { status: 'running' });
      let actionResult;
      try {
        const prior = await readActionState(db, { businessId: tenantId, actionType: step.actionType, idempotencyKey: key });
        if (prior?.status === 'failed') throw Object.assign(new Error(prior.error_message || 'Canonical action failed.'), { code: prior.error_code || 'ACTION_FAILED', executionId: prior.id });
        if (prior?.status === 'started') throw Object.assign(new Error('Canonical action state is incomplete; automatic replay is blocked.'), { code: 'ACTION_EXECUTION_UNCERTAIN', executionId: prior.id });
        if (prior?.status === 'succeeded') actionResult = { executionId: prior.id, leadId: prior.lead_id || (step.actionType === LEAD_ACTION ? prior.record_id : null), status: 'succeeded' };
        else if (step.actionType === LEAD_ACTION) {
          actionResult = await leadAction({ db, businessId: tenantId, idempotencyKey: key, lead: leadInput, sourceType, sourceId: sourceId || execution.id, conversationId });
        } else {
          if (typeof webhookConfigurationId !== 'string' || !webhookConfigurationId.trim()) throw Object.assign(new Error('Webhook configuration is required.'), { code: 'WEBHOOK_CONFIGURATION_REQUIRED' });
          actionResult = await webhookAction({ db, businessId: tenantId, webhookConfigurationId: webhookConfigurationId.trim(), eventType: step.configuration.eventType, data: { leadId, ...(conversationId ? { conversationId } : {}) }, conversationId, leadId, invocationId: key, transport, lookup });
        }
        const confirmed = await readActionState(db, { businessId: tenantId, actionType: step.actionType, idempotencyKey: key });
        if (!confirmed || confirmed.status !== 'succeeded' || !confirmed.record_id) throw Object.assign(new Error('Canonical action did not produce persisted success evidence.'), { code: 'ACTION_EVIDENCE_MISSING', executionId: actionResult?.executionId });
        if (step.actionType === LEAD_ACTION) leadId = confirmed.lead_id || confirmed.record_id;
        if (hooks.afterActionBeforeStepFinalize) await hooks.afterActionBeforeStepFinalize({ step, actionExecutionId: confirmed.id });
        await setStep(db, tenantId, stepExecution.id, { status: 'succeeded', actionExecutionId: confirmed.id });
      } catch (error) {
        if (error?.code === 'WORKFLOW_PROCESS_INTERRUPTED') throw error;
        const failure = safeFailure(error, 'WORKFLOW_STEP_FAILED');
        await setStep(db, tenantId, stepExecution.id, { status: 'failed', actionExecutionId: error.executionId, failureCode: failure.code, failureMessage: failure.message });
        for (const later of stepRows.filter(row => row.position > step.position && row.status === 'pending')) await setStep(db, tenantId, later.id, { status: 'skipped' });
        await finishWorkflow(db, tenantId, execution.id, 'failed', failure);
        return readWorkflowSummary(db, tenantId, execution.id);
      }
    }
    await finishWorkflow(db, tenantId, execution.id, 'succeeded');
    return readWorkflowSummary(db, tenantId, execution.id);
  } finally {
    await unlock();
  }
}

module.exports = {
  WORKFLOW_KEY,
  WORKFLOW_NAME,
  WORKFLOW_VERSION,
  WORKFLOW_STEPS,
  ensureCustomerOpportunityWorkflow,
  executeCustomerOpportunityWorkflow,
  readActionState,
};
