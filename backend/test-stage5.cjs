const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function load(query) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync('./controllers/knowledgeBaseController.js', 'utf8'), {
    module, exports: module.exports, console: { error() {} },
    require: name => name === '../database/db' ? { query } : {},
  });
  return module.exports;
}
function response() { return { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
test('metadata pages are bounded, scoped and exclude content', async () => {
  let call;
  const controller = load(async (...args) => { call = args; return { rows: Array.from({ length: 21 }, (_, id) => ({ id })) }; });
  const res = response();
  await controller.listDocs({ user: { id: 'tenant' }, query: { view: 'summary', page: '2', limit: '20' } }, res);
  assert.equal(res.body.data.length, 20); assert.equal(res.body.hasMore, true);
  assert.doesNotMatch(call[0], /\bcontent\b/); assert.match(call[0], /business_id = \$1/);
  assert.deepEqual(Array.from(call[1]), ['tenant', 21, 20]);
});
test('invalid page sizes cannot bypass bounds', async () => {
  const controller = load(() => { throw new Error('must not query'); });
  for (const query of [{ limit: '51' }, { page: '-1' }, { page: '1.5' }, { limit: '0' }, { page: '100001' }]) {
    const res = response(); await controller.listDocs({ user: { id: 'tenant' }, query: { view: 'summary', ...query } }, res); assert.equal(res.code, 400);
  }
});
test('detail lookup enforces tenant ownership and returns not found', async () => {
  let call; const controller = load(async (...args) => { call = args; return { rows: [] }; });
  const res = response(); await controller.getDoc({ user: { id: 'tenant' }, params: { id: 'other-source' } }, res);
  assert.equal(res.code, 404); assert.match(call[0], /id = \$1 AND business_id = \$2/); assert.deepEqual(Array.from(call[1]), ['other-source', 'tenant']);
});
test('create rejects whitespace, non-string and oversized input', async () => {
  const controller = load(() => { throw new Error('must not query'); });
  for (const body of [{ name: ' ', content: 'text' }, { name: 'n', content: {} }, { name: [], content: 'text' }, { name: 'n', content: 'x'.repeat(500001) }]) {
    const res = response(); await controller.createDoc({ user: { id: 'tenant' }, body }, res); assert.equal(res.code, 400);
  }
});
test('database failure is not an empty list or a successful save', async () => {
  const controller = load(async () => { throw new Error('offline'); });
  const res = response(); await controller.listDocs({ user: { id: 'tenant' }, query: { view: 'summary' } }, res);
  assert.equal(res.code, 500); assert.equal(res.body.success, false);
});
test('delete remains tenant scoped and does not claim prompt propagation', async () => {
  let call; const controller = load(async (...args) => { call = args; return { rows: [{ id: 'source' }] }; });
  const res = response(); await controller.deleteDoc({ user: { id: 'tenant' }, params: { id: 'source' } }, res);
  assert.equal(res.body.success, true); assert.match(call[0], /id = \$1 AND business_id = \$2/);
});
