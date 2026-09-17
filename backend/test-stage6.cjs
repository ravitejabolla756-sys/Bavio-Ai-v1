const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const query = require('./services/leadReadQuery');
function load(path, db) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path, 'utf8'), { module, exports: module.exports, console: { error() {} }, require: name => name === '../database/db' ? { query: db } : query });
  return module.exports;
}
function response() { return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
test('list is bounded and tenant scoped, with no notes or transcript payload', () => {
  const result = query.buildLeadQuery('workspace', { q: "' OR 1=1 --", status: 'qualified' });
  assert.match(result.sql, /l.business_id = \$1/); assert.match(result.sql, /c.business_id = \$1 OR c.user_id = \$1/);
  assert.doesNotMatch(result.sql, /full_transcript|l.notes|SELECT \*/); assert.ok(!result.sql.includes("' OR 1=1 --"));
  assert.equal(result.params.at(-1), 21); assert.equal(result.params[0], 'workspace');
});
test('cursor preserves timestamp precision and ties, including null dates', () => {
  for (const t of ['2026-09-08 12:00:00.123456+00', null]) {
    const cursor = query.cursorOf({ id: 'lead', cursor_time: t }); const result = query.buildLeadQuery('workspace', { cursor });
    assert.ok(result.params.includes(t)); assert.match(result.sql, /l.id::text\) </); assert.match(result.sql, /-infinity/);
  }
});
test('query rejects invalid limits, statuses, cursor and repeated query arrays', () => {
  for (const value of [{ limit: '51' }, { limit: '0' }, { status: 'hot' }, { q: ['a'] }, { cursor: 'malformed' }, { q: 'x'.repeat(161) }]) assert.throws(() => query.buildLeadQuery('workspace', value));
});
test('list lookahead does not overstate workspace totals', async () => {
  const api = load('./controllers/leadReads.js', async () => ({ rows: Array.from({ length: 21 }, (_, i) => ({ id: `l-${i}`, cursor_time: '2026-09-08' })) }));
  const res = response(); await api.listLeadContext({ user: { id: 'tenant' }, query: {} }, res);
  assert.equal(res.body.data.length, 20); assert.equal(res.body.pagination.has_more, true); assert.equal('total' in res.body, false); assert.equal('cursor_time' in res.body.data[0], false);
});
test('detail joins must match both record and conversation tenant and omit raw call ID', async () => {
  let sql, params;
  const api = load('./controllers/leadReads.js', async (s, p) => { sql = s; params = p; return { rows: [] }; });
  const res = response(); await api.getLeadContext({ user: { id: 'tenant-A' }, params: { id: 'tenant-B-lead' } }, res);
  assert.equal(res.code, 404); assert.match(sql, /WHERE l.id::text = \$1 AND l.business_id = \$2/);
  assert.match(sql, /c.business_id = \$2 OR c.user_id = \$2/); assert.match(sql, /a.business_id = \$2 OR a.client_id = \$2/);
  assert.deepEqual(Array.from(params), ['tenant-B-lead', 'tenant-A']); assert.doesNotMatch(sql, /l\.call_id\s*,|transcript/);
});
test('read failure is not empty success; unauthenticated access is rejected', async () => {
  const api = load('./controllers/leadReads.js', async () => { throw new Error('database secret'); });
  const res = response(); await api.listLeadContext({ user: { id: 'tenant' }, query: {} }, res); assert.equal(res.code, 500); assert.ok(!JSON.stringify(res.body).includes('secret'));
  const unauth = response(); await api.getLeadContext({ params: { id: 'lead' } }, unauth); assert.equal(unauth.code, 401);
});
test('update validates statuses and refuses unsupported identity/provenance fields', async () => {
  const api = load('./controllers/leadsController.js', () => { throw new Error('Must not query'); });
  for (const body of [{ status: 'hot' }, { email: 'person@example.test' }, { name: {} }, { notes: 'x'.repeat(50001) }, { business_id: 'other' }, {}]) {
    const res = response(); await api.updateLead({ body, params: { id: 'lead' }, user: { id: 'tenant' } }, res); assert.equal(res.code, 400);
  }
});
test('update is tenant scoped and can explicitly clear shared notes', async () => {
  let call; const api = load('./controllers/leadsController.js', async (...args) => { call = args; return { rows: [{ id: 'lead', notes: '' }] }; });
  const res = response(); await api.updateLead({ body: { notes: '' }, params: { id: 'lead' }, user: { id: 'tenant' } }, res);
  assert.match(call[0], /WHERE id = \$7 AND business_id = \$8/); assert.equal(call[1][3], ''); assert.equal(call[1][7], 'tenant'); assert.equal(res.body.notes, '');
});
test('unknown-tenant update does not return success', async () => {
  const api = load('./controllers/leadsController.js', async () => ({ rows: [] }));
  const res = response(); await api.updateLead({ body: { status: 'new' }, params: { id: 'other' }, user: { id: 'tenant' } }, res); assert.equal(res.code, 404);
});
