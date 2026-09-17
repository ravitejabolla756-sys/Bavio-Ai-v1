'use strict';

const STATUS_SQL = `CASE lower(COALESCE(NULLIF(c.status, ''), NULLIF(c.call_status, ''), 'unknown'))
  WHEN 'started' THEN 'in-progress' ELSE lower(COALESCE(NULLIF(c.status, ''), NULLIF(c.call_status, ''), 'unknown')) END`;
const STATUSES = new Set(['queued', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled', 'processing', 'unknown']);
function scalar(value, max = 160) {
  if (value === undefined || value === '') return null;
  if (typeof value !== 'string' || value.length > max) throw new Error('Invalid query parameter');
  return value;
}
function cursorOf(row) {
  return Buffer.from(JSON.stringify({ t: row.cursor_time, id: row.id })).toString('base64url');
}
/** Parameterized, bounded keyset read. Tenant scope applies to every predicate. */
function buildListQuery(businessId, query) {
  const rawLimit = scalar(query.limit, 3) || '25';
  if (!/^\d+$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 100) throw new Error('Limit must be between 1 and 100');
  const limit = Number(rawLimit);
  const params = [businessId];
  const where = ['(c.business_id = $1 OR c.user_id = $1)'];
  const bind = value => { params.push(value); return `$${params.length}`; };
  const status = scalar(query.status);
  if (status) {
    if (!STATUSES.has(status)) throw new Error('Invalid status');
    where.push(`${STATUS_SQL} = ${bind(status)}`);
  }
  const agent = scalar(query.agent_id);
  if (agent) where.push(`c.assistant_id::text = ${bind(agent)}`);
  const search = scalar(query.q);
  if (search) where.push(`(position(${bind(search.toLowerCase())} in lower(COALESCE(c.caller_number, '') || ' ' || c.id::text)) > 0)`);
  const since = scalar(query.since);
  if (since) {
    if (!/^\d{4}-\d{2}-\d{2}T/.test(since) || !Number.isFinite(Date.parse(since))) throw new Error('Invalid date');
    where.push(`c.started_at >= ${bind(since)}`);
  }
  const cursor = scalar(query.cursor, 512);
  if (cursor) {
    // Accept existing ISO cursors, while newly emitted cursors also resolve timestamp ties.
    if (/^\d{4}-\d{2}-\d{2}T/.test(cursor) && Number.isFinite(Date.parse(cursor))) {
      where.push(`c.created_at < ${bind(cursor)}`);
    } else {
      let decoded;
      try { decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')); } catch { throw new Error('Invalid cursor'); }
      if (!decoded || typeof decoded.t !== 'string' || !Number.isFinite(Date.parse(decoded.t)) || typeof decoded.id !== 'string' || decoded.id.length > 160) throw new Error('Invalid cursor');
      where.push(`(c.created_at, c.id::text) < (${bind(decoded.t)}::timestamptz, ${bind(decoded.id)})`);
    }
  }
  const sql = `SELECT c.id, c.assistant_id, a.name AS assistant_name, c.caller_number,
    ${STATUS_SQL} AS status, COALESCE(c.duration_seconds, c.duration) AS duration_seconds,
    c.started_at, c.ended_at, c.created_at, c.created_at::text AS cursor_time
    FROM calls c LEFT JOIN assistants a ON a.id = c.assistant_id AND (a.business_id = $1 OR a.client_id = $1)
    WHERE ${where.join(' AND ')} ORDER BY c.created_at DESC, c.id::text DESC LIMIT ${bind(limit + 1)}`;
  return { sql, params, limit };
}
module.exports = { buildListQuery, cursorOf };
