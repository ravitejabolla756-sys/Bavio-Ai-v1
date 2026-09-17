'use strict';
const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];
const TIME = "COALESCE(l.created_at, '-infinity'::timestamptz)";
function scalar(value, max = 160) {
  if (value === undefined || value === '') return null;
  if (typeof value !== 'string' || value.length > max) throw new Error('Invalid query parameter');
  return value;
}
function cursorOf(row) {
  return Buffer.from(JSON.stringify({ t: row.cursor_time, id: String(row.id) })).toString('base64url');
}
function buildLeadQuery(businessId, query = {}) {
  const rawLimit = scalar(query.limit, 2) || '20';
  if (!/^\d+$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > 50) throw new Error('Limit must be between 1 and 50');
  const limit = Number(rawLimit), params = [businessId], where = ['l.business_id = $1'];
  const bind = value => { params.push(value); return `$${params.length}`; };
  const status = scalar(query.status);
  if (status) { if (!STATUSES.includes(status)) throw new Error('Invalid lead status'); where.push(`l.status = ${bind(status)}`); }
  const q = scalar(query.q);
  if (q?.trim()) where.push(`position(${bind(q.trim().toLowerCase())} in lower(COALESCE(l.name, '') || ' ' || COALESCE(l.phone, '') || ' ' || l.id::text)) > 0`);
  const cursor = scalar(query.cursor, 512);
  if (cursor) {
    let value;
    try { value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')); } catch { throw new Error('Invalid cursor'); }
    if (!value || (value.t !== null && (typeof value.t !== 'string' || !Number.isFinite(Date.parse(value.t)))) || typeof value.id !== 'string' || !value.id || value.id.length > 160) throw new Error('Invalid cursor');
    where.push(`(${TIME}, l.id::text) < (COALESCE(${bind(value.t)}::timestamptz, '-infinity'::timestamptz), ${bind(value.id)})`);
  }
  return { limit, params, sql: `SELECT l.id, l.name, l.phone, l.status, left(l.intent, 240) AS intent_preview,
    l.created_at, l.created_at::text AS cursor_time,
    EXISTS(SELECT 1 FROM calls c WHERE c.id = l.call_id AND (c.business_id = $1 OR c.user_id = $1)) AS has_conversation
    FROM leads l WHERE ${where.join(' AND ')} ORDER BY ${TIME} DESC, l.id::text DESC LIMIT ${bind(limit + 1)}` };
}
module.exports = { STATUSES, buildLeadQuery, cursorOf };
