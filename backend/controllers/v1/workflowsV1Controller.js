'use strict';

const db = require('../../database/db');

const ACTIONS = {
  'bavio.lead.create': { name: 'Create lead', system: 'Bavio', kind: 'Internal' },
  'bavio.webhook.deliver': { name: 'Send webhook', system: 'Custom webhook', kind: 'External' },
};

function tenantId(req) { return req.business_id || req.user?.id || req.client?.id || null; }
function limitValue(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 50) : 20;
}
function encodeStep(step) {
  const action = ACTIONS[step.action_type] || { name: step.action_type, system: 'Unknown', kind: 'Internal' };
  return { id: step.id, position: step.position, action_type: step.action_type, name: action.name, system: action.system, kind: action.kind, configuration: step.configuration || {} };
}
function encodeExecution(row) {
  return {
    id: row.id, workflow_definition_id: row.workflow_definition_id, workflow_version_id: row.workflow_version_id,
    version: row.version, status: row.status, source_type: row.source_type, source_id: row.source_id,
    conversation_id: row.conversation_id, started_at: row.started_at, completed_at: row.completed_at,
    created_at: row.created_at, failure_code: row.failure_code, failure_message: row.failure_message, failure_step: row.failure_step || null,
  };
}
function encodeStepExecution(row) {
  const action = ACTIONS[row.action_type] || { name: row.action_type, system: 'Unknown', kind: 'Internal' };
  return {
    id: row.id, workflow_step_id: row.workflow_step_id, position: row.position, status: row.status,
    action_type: row.action_type, name: action.name, system: action.system, kind: action.kind,
    action_execution_id: row.action_execution_id, started_at: row.started_at, completed_at: row.completed_at,
    failure_code: row.failure_code, failure_message: row.failure_message,
    action_status: row.action_status, action_error_code: row.action_error_code,
    action_error_message: row.action_error_message, lead_id: row.lead_id,
    evidence: row.evidence_record_id ? { type: row.evidence_type, record_id: row.evidence_record_id, http_status: row.http_status, outcome: row.evidence_outcome } : null,
  };
}

const workflowSelect = `
  SELECT d.id, d.workflow_key, d.name, d.enabled, d.created_at, d.updated_at,
         v.id AS version_id, v.version,
         COALESCE((SELECT json_agg(json_build_object('id', s.id, 'position', s.position, 'action_type', s.action_type, 'configuration', s.configuration) ORDER BY s.position)
                   FROM workflow_steps s WHERE s.business_id = d.business_id AND s.workflow_version_id = v.id), '[]'::json) AS steps,
         latest.id AS last_execution_id, latest.status AS last_execution_status,
         latest.started_at AS last_execution_started_at, latest.completed_at AS last_execution_completed_at
  FROM workflow_definitions d
  JOIN LATERAL (SELECT id, version FROM workflow_versions WHERE business_id = d.business_id AND workflow_definition_id = d.id ORDER BY version DESC LIMIT 1) v ON TRUE
  LEFT JOIN LATERAL (SELECT id, status, started_at, completed_at FROM workflow_executions WHERE business_id = d.business_id AND workflow_definition_id = d.id ORDER BY created_at DESC, id DESC LIMIT 1) latest ON TRUE
  WHERE d.business_id = $1`;

function encodeWorkflow(row) {
  return {
    id: row.id, key: row.workflow_key, name: row.name, enabled: row.enabled, created_at: row.created_at, updated_at: row.updated_at,
    version: row.version, version_id: row.version_id, trigger: null, steps: (row.steps || []).map(encodeStep),
    last_run: row.last_execution_id ? { id: row.last_execution_id, status: row.last_execution_status, started_at: row.last_execution_started_at, completed_at: row.last_execution_completed_at } : null,
  };
}

async function listWorkflows(req, res) {
  const businessId = tenantId(req);
  if (!businessId) return res.status(401).json({ error: 'Workspace identity is required.' });
  try { const result = await db.query(`${workflowSelect} ORDER BY d.created_at DESC, d.id DESC LIMIT 100`, [businessId]); return res.json({ data: { workflows: result.rows.map(encodeWorkflow) } }); }
  catch (error) { console.error('[WORKFLOWS] List failed:', error.message); return res.status(500).json({ error: 'Workflow data is unavailable.' }); }
}

async function getWorkflow(req, res) {
  const businessId = tenantId(req);
  if (!businessId) return res.status(401).json({ error: 'Workspace identity is required.' });
  try {
    const result = await db.query(`${workflowSelect} AND d.id = $2`, [businessId, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Workflow not found.' });
    return res.json({ data: { workflow: encodeWorkflow(result.rows[0]) } });
  } catch (error) { console.error('[WORKFLOWS] Detail failed:', error.message); return res.status(500).json({ error: 'Workflow detail is unavailable.' }); }
}

async function listWorkflowExecutions(req, res) {
  const businessId = tenantId(req); const limit = limitValue(req.query.limit); const offset = Math.max(Number.parseInt(req.query.offset, 10) || 0, 0);
  if (!businessId) return res.status(401).json({ error: 'Workspace identity is required.' });
  try {
    const result = await db.query(`SELECT e.id, e.workflow_definition_id, e.workflow_version_id, v.version, e.status, e.source_type, e.source_id, e.conversation_id, e.started_at, e.completed_at, e.created_at, e.failure_code, e.failure_message, failed_step.name AS failure_step
      FROM workflow_executions e JOIN workflow_versions v ON v.id = e.workflow_version_id AND v.business_id = e.business_id
      LEFT JOIN LATERAL (SELECT CASE WHEN s.status = 'failed' THEN ws.action_type ELSE NULL END AS name FROM workflow_step_executions s JOIN workflow_steps ws ON ws.id = s.workflow_step_id AND ws.business_id = s.business_id WHERE s.workflow_execution_id = e.id AND s.status = 'failed' ORDER BY s.position LIMIT 1) failed_step ON TRUE
      WHERE e.business_id = $1 AND e.workflow_definition_id = $2 ORDER BY e.created_at DESC, e.id DESC LIMIT $3 OFFSET $4`, [businessId, req.params.id, limit + 1, offset]);
    const rows = result.rows.slice(0, limit); return res.json({ data: { executions: rows.map(encodeExecution), pagination: { limit, offset, has_more: result.rows.length > limit, next_offset: result.rows.length > limit ? offset + limit : null } } });
  } catch (error) { console.error('[WORKFLOWS] Runs failed:', error.message); return res.status(500).json({ error: 'Workflow runs are unavailable.' }); }
}

async function getWorkflowExecution(req, res) {
  const businessId = tenantId(req);
  if (!businessId) return res.status(401).json({ error: 'Workspace identity is required.' });
  try {
    const execution = await db.query(`SELECT e.id, e.workflow_definition_id, e.workflow_version_id, d.workflow_key, d.name, v.version, e.status, e.source_type, e.source_id, e.conversation_id, e.started_at, e.completed_at, e.created_at, e.failure_code, e.failure_message
      FROM workflow_executions e JOIN workflow_definitions d ON d.id = e.workflow_definition_id AND d.business_id = e.business_id JOIN workflow_versions v ON v.id = e.workflow_version_id AND v.business_id = e.business_id
      WHERE e.id = $1 AND e.business_id = $2`, [req.params.id, businessId]);
    if (!execution.rows.length) return res.status(404).json({ error: 'Workflow execution not found.' });
    const steps = await db.query(`SELECT s.id, s.workflow_step_id, s.position, s.status, s.action_execution_id, s.started_at, s.completed_at, s.failure_code, s.failure_message, ws.action_type,
      a.status AS action_status, a.error_code AS action_error_code, a.error_message AS action_error_message, a.lead_id,
      ev.evidence_type, ev.record_id AS evidence_record_id, ev.http_status, ev.metadata->>'outcome' AS evidence_outcome
      FROM workflow_step_executions s JOIN workflow_steps ws ON ws.id = s.workflow_step_id AND ws.business_id = s.business_id
      LEFT JOIN action_executions a ON a.id = s.action_execution_id AND a.business_id = s.business_id
      LEFT JOIN LATERAL (SELECT evidence_type, record_id, http_status, metadata FROM execution_evidence WHERE execution_id = a.id AND business_id = a.business_id ORDER BY recorded_at DESC, id DESC LIMIT 1) ev ON TRUE
      WHERE s.workflow_execution_id = $1 AND s.business_id = $2 ORDER BY s.position`, [req.params.id, businessId]);
    return res.json({ data: { execution: encodeExecution(execution.rows[0]), steps: steps.rows.map(encodeStepExecution) } });
  } catch (error) { console.error('[WORKFLOWS] Run detail failed:', error.message); return res.status(500).json({ error: 'Workflow execution is unavailable.' }); }
}

module.exports = { listWorkflows, getWorkflow, listWorkflowExecutions, getWorkflowExecution };
