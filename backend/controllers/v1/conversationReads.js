'use strict';
const db = require('../../database/db');
const { buildListQuery, cursorOf } = require('../../services/conversationReadQuery');

async function listCalls(req, res) {
  const businessId = req.business_id || req.user?.id;
  if (!businessId) return res.status(401).json({ error: { code: 'unauthorized' } });
  let query;
  try { query = buildListQuery(businessId, req.query); }
  catch (error) { return res.status(400).json({ error: { code: 'invalid_request', message: error.message } }); }
  try {
    const { rows } = await db.query(query.sql, query.params);
    const hasMore = rows.length > query.limit;
    const selected = rows.slice(0, query.limit);
    return res.json({
      data: selected.map(({ cursor_time, assistant_id, ...row }) => ({ ...row, agent_id: assistant_id })),
      pagination: { has_more: hasMore, next_cursor: hasMore ? cursorOf(selected[selected.length - 1]) : null },
      request_id: req.requestId,
    });
  } catch (error) {
    console.error('[CONVERSATION READ] List failed:', error.message);
    return res.status(500).json({ error: { code: 'internal_error', message: 'Unable to retrieve conversations' } });
  }
}
async function getCallById(req, res) {
  const businessId = req.business_id || req.user?.id;
  if (!businessId) return res.status(401).json({ error: { code: 'unauthorized' } });
  if (typeof req.params.id !== 'string' || req.params.id.length > 160) return res.status(400).json({ error: { code: 'invalid_request' } });
  try {
    const { rows } = await db.query(`SELECT c.*, a.name AS assistant_name
      FROM calls c LEFT JOIN assistants a ON a.id = c.assistant_id AND (a.business_id = $2 OR a.client_id = $2)
      WHERE c.id::text = $1 AND (c.business_id = $2 OR c.user_id = $2)`, [req.params.id, businessId]);
    if (!rows.length) return res.status(404).json({ error: { code: 'not_found', message: 'Conversation not found' } });
    const c = rows[0];
    return res.json({ data: {
      id: c.id, agent_id: c.assistant_id, assistant_name: c.assistant_name,
      caller_number: c.caller_number, status: c.status || c.call_status || null,
      duration_seconds: c.duration_seconds ?? c.duration ?? null,
      transcript: c.transcript ?? null, recording_url: c.recording_url ?? null,
      started_at: c.started_at ?? null, ended_at: c.ended_at ?? null, created_at: c.created_at,
      processing_state: c.processing_state ?? null,
    }, request_id: req.requestId });
  } catch (error) {
    console.error('[CONVERSATION READ] Detail failed:', error.message);
    return res.status(500).json({ error: { code: 'internal_error', message: 'Unable to retrieve conversation' } });
  }
}
module.exports = { listCalls, getCallById };
