'use strict';

const db = require('../../database/db');

const ACTIONS = [
  {
    type: 'bavio.lead.create',
    name: 'Create lead',
    system: 'Bavio',
    kind: 'Internal',
    description: 'Creates a Lead record inside Bavio from verified action execution.',
  },
  {
    type: 'bavio.webhook.deliver',
    name: 'Send webhook',
    system: 'Custom webhook',
    kind: 'External',
    description: 'Sends a signed HTTPS request to a configured tenant-owned endpoint.',
  },
];

function tenantId(req) {
  return req.business_id || req.user?.id || null;
}

function parseLimit(value) {
  const limit = Number(value || 20);
  return Number.isInteger(limit) && limit >= 1 && limit <= 50 ? limit : 20;
}

function encodeAction(row) {
  return {
    id: row.action_type,
    type: row.action_type,
    name: row.action_type === 'bavio.lead.create' ? 'Create lead' : 'Send webhook',
    system: row.action_type === 'bavio.lead.create' ? 'Bavio' : 'Custom webhook',
    kind: row.action_type === 'bavio.lead.create' ? 'Internal' : 'External',
    status: row.status,
    started_at: row.started_at,
    completed_at: row.completed_at,
    duration_ms: row.duration_ms,
    error_code: row.error_code,
    error_message: row.error_message,
    source_type: row.source_type,
    source_id: row.source_id,
    conversation_id: row.conversation_id,
    lead_id: row.lead_id,
    evidence: row.evidence_type ? {
      type: row.evidence_type,
      record_id: row.record_id,
      http_status: row.http_status,
      outcome: row.outcome,
    } : null,
  };
}

async function listActions(req, res) {
  const businessId = tenantId(req);
  if (!businessId) return res.status(401).json({ error: 'Workspace identity is required.' });
  const limit = parseLimit(req.query.limit);
  try {
    const [webhooks, executions] = await Promise.all([
      db.query(`SELECT count(*)::int AS count FROM webhooks
                WHERE business_id = $1 AND status = 'active'
                  AND signing_secret_encrypted IS NOT NULL
                  AND url IS NOT NULL`, [businessId]),
      db.query(`SELECT a.id, a.action_type, a.status, a.started_at, a.completed_at,
                       a.duration_ms, a.error_code, a.error_message, a.source_type,
                       a.source_id, a.conversation_id, a.lead_id,
                       e.evidence_type, e.record_id, e.http_status,
                       e.metadata->>'outcome' AS outcome
                FROM action_executions a
                LEFT JOIN LATERAL (
                  SELECT evidence_type, record_id, http_status, metadata
                  FROM execution_evidence
                  WHERE execution_id = a.id AND business_id = a.business_id
                  ORDER BY recorded_at DESC, id DESC LIMIT 1
                ) e ON TRUE
                WHERE a.business_id = $1
                ORDER BY a.started_at DESC, a.id DESC
                LIMIT $2`, [businessId, limit + 1]),
    ]);
    const rows = executions.rows.slice(0, limit);
    const hasMore = executions.rows.length > limit;
    const last = rows[rows.length - 1];
    return res.json({
      data: {
        actions: ACTIONS.map(action => ({
          ...action,
          availability: action.type === 'bavio.lead.create' ? 'configured' : (Number(webhooks.rows[0]?.count || 0) > 0 ? 'configured' : 'not_configured'),
          last_execution: rows.find(row => row.action_type === action.type) ? encodeAction(rows.find(row => row.action_type === action.type)) : null,
        })),
        executions: rows.map(encodeAction),
        pagination: { has_more: hasMore, next_cursor: hasMore && last ? last.id : null },
      },
    });
  } catch (error) {
    console.error('[ACTIONS] List failed:', error.message);
    return res.status(500).json({ error: 'Action data is unavailable.' });
  }
}

async function getAction(req, res) {
  const businessId = tenantId(req);
  const action = ACTIONS.find(item => item.type === req.params.actionType);
  if (!businessId) return res.status(401).json({ error: 'Workspace identity is required.' });
  if (!action) return res.status(404).json({ error: 'Action not found.' });
  try {
    const [executions, configs] = await Promise.all([
      db.query(`SELECT a.id, a.action_type, a.status, a.started_at, a.completed_at,
                       a.duration_ms, a.error_code, a.error_message, a.source_type,
                       a.source_id, a.conversation_id, a.lead_id,
                       e.evidence_type, e.record_id, e.http_status,
                       e.metadata->>'outcome' AS outcome
                FROM action_executions a
                LEFT JOIN LATERAL (
                  SELECT evidence_type, record_id, http_status, metadata
                  FROM execution_evidence
                  WHERE execution_id = a.id AND business_id = a.business_id
                  ORDER BY recorded_at DESC, id DESC LIMIT 1
                ) e ON TRUE
                WHERE a.business_id = $1 AND a.action_type = $2
                ORDER BY a.started_at DESC, a.id DESC LIMIT 21`, [businessId, action.type]),
      action.type === 'bavio.webhook.deliver'
        ? db.query(`SELECT id, url, events, status, created_at, updated_at
                    FROM webhooks WHERE business_id = $1 AND status = 'active'
                    ORDER BY created_at DESC LIMIT 50`, [businessId])
        : Promise.resolve({ rows: [] }),
    ]);
    return res.json({ data: {
      action: { ...action, availability: action.type === 'bavio.lead.create' ? 'configured' : (configs.rows.length ? 'configured' : 'not_configured') },
      configurations: configs.rows,
      executions: executions.rows.slice(0, 20).map(encodeAction),
      pagination: { has_more: executions.rows.length > 20 },
    } });
  } catch (error) {
    console.error('[ACTIONS] Detail failed:', error.message);
    return res.status(500).json({ error: 'Action detail is unavailable.' });
  }
}

async function getExecution(req, res) {
  const businessId = tenantId(req);
  if (!businessId) return res.status(401).json({ error: 'Workspace identity is required.' });
  try {
    const result = await db.query(`SELECT a.id, a.action_type, a.status, a.started_at, a.completed_at,
          a.duration_ms, a.error_code, a.error_message, a.source_type, a.source_id,
          a.conversation_id, a.lead_id, e.evidence_type, e.record_id, e.http_status,
          e.metadata->>'outcome' AS outcome, e.recorded_at
        FROM action_executions a
        LEFT JOIN LATERAL (
          SELECT evidence_type, record_id, http_status, metadata, recorded_at
          FROM execution_evidence WHERE execution_id = a.id AND business_id = a.business_id
          ORDER BY recorded_at DESC, id DESC LIMIT 1
        ) e ON TRUE
        WHERE a.id = $1 AND a.business_id = $2`, [req.params.id, businessId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Execution not found.' });
    return res.json({ data: encodeAction(result.rows[0]) });
  } catch (error) {
    console.error('[ACTIONS] Execution failed:', error.message);
    return res.status(500).json({ error: 'Execution detail is unavailable.' });
  }
}

async function getRelatedExecutions(req, res, column, value) {
  const businessId = tenantId(req);
  if (!businessId) return res.status(401).json({ error: 'Workspace identity is required.' });
  try {
    const result = await db.query(`SELECT a.id, a.action_type, a.status, a.started_at, a.completed_at,
          a.duration_ms, a.error_code, a.error_message, a.source_type, a.source_id,
          a.conversation_id, a.lead_id, e.evidence_type, e.record_id, e.http_status,
          e.metadata->>'outcome' AS outcome
        FROM action_executions a LEFT JOIN LATERAL (
          SELECT evidence_type, record_id, http_status, metadata FROM execution_evidence
          WHERE execution_id = a.id AND business_id = a.business_id
          ORDER BY recorded_at DESC, id DESC LIMIT 1
        ) e ON TRUE WHERE a.business_id = $1 AND a.${column} = $2
        ORDER BY a.started_at DESC, a.id DESC LIMIT 20`, [businessId, value]);
    return res.json({ data: result.rows.map(encodeAction) });
  } catch (error) {
    console.error('[ACTIONS] Related execution read failed:', error.message);
    return res.status(500).json({ error: 'Related action data is unavailable.' });
  }
}

function getLeadExecutions(req, res) { return getRelatedExecutions(req, res, 'lead_id', req.params.leadId); }
function getConversationExecutions(req, res) { return getRelatedExecutions(req, res, 'conversation_id', req.params.conversationId); }

module.exports = { listActions, getAction, getExecution, getLeadExecutions, getConversationExecutions };
