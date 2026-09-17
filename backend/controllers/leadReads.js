'use strict';
const db = require('../database/db');
const { buildLeadQuery, cursorOf } = require('../services/leadReadQuery');
async function listLeadContext(req, res) {
  if (!req.user?.id) return res.status(401).json({ error: 'Please sign in.' });
  let query;
  try { query = buildLeadQuery(req.user.id, req.query); }
  catch (error) { return res.status(400).json({ error: error.message }); }
  try {
    const { rows } = await db.query(query.sql, query.params);
    const more = rows.length > query.limit, selected = rows.slice(0, query.limit);
    return res.json({ data: selected.map(({ cursor_time, ...row }) => row), pagination: { has_more: more, next_cursor: more ? cursorOf(selected[selected.length - 1]) : null } });
  } catch (error) {
    console.error('[LEAD READ] List failed:', error.message);
    return res.status(500).json({ error: 'Unable to load leads. Please retry.' });
  }
}
async function getLeadContext(req, res) {
  if (!req.user?.id) return res.status(401).json({ error: 'Please sign in.' });
  if (typeof req.params.id !== 'string' || !req.params.id || req.params.id.length > 160) return res.status(400).json({ error: 'Invalid lead identifier.' });
  try {
    const { rows } = await db.query(`SELECT l.id, l.name, l.phone, l.intent, l.budget, l.location, l.notes, l.status, l.created_at,
      l.summary, c.id AS conversation_id, c.created_at AS conversation_created_at,
      (l.call_id IS NOT NULL) AS has_recorded_conversation,
      a.name AS agent_name
      FROM leads l LEFT JOIN calls c ON c.id = l.call_id AND (c.business_id = $2 OR c.user_id = $2)
      LEFT JOIN assistants a ON a.id = c.assistant_id AND (a.business_id = $2 OR a.client_id = $2)
      WHERE l.id::text = $1 AND l.business_id = $2`, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Lead not found or unavailable in this workspace.' });
    return res.json({ data: rows[0] });
  } catch (error) {
    console.error('[LEAD READ] Detail failed:', error.message);
    return res.status(500).json({ error: 'Unable to load lead context. Please retry.' });
  }
}
module.exports = { listLeadContext, getLeadContext };
