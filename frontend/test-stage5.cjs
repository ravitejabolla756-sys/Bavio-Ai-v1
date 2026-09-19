const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('typescript');
function load(response) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('./src/features/knowledge/service.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, TextEncoder, Intl, Date, require: name => name.endsWith('api-transport') ? { apiFetch: async () => response } : {
    requireRecord: value => { if (!value?.id) throw new Error('Invalid record'); return value; },
    requireArray: value => { if (!Array.isArray(value)) throw new Error('Invalid array'); return value; },
    unwrapData: value => value?.data ?? value,
  } });
  return module.exports;
}
test('metadata envelope does not require a record id', async () => {
  const api = load({ data: [{ id: 'source', name: 'Policy' }], hasMore: false, page: 1 });
  assert.equal((await api.listSources(1)).sources.length, 1);
});
test('malformed metadata and pagination reject', async () => {
  for (const value of [null, {}, { data: [], hasMore: false, page: 2 }, { data: [{ name: 'no id' }], hasMore: false, page: 1 }]) await assert.rejects(load(value).listSources(1));
});
test('delete requires explicit success, not a record id', async () => {
  await load({ success: true }).removeSource('source');
  for (const value of [null, {}, { success: false }]) await assert.rejects(load(value).removeSource('source'));
});
test('save requires matching persisted fields and detail requires matching id', async () => {
  await assert.rejects(load({ data: { id: 's', name: 'Wrong', content: 'Text' } }).saveSource('s', { name: 'Policy', content: 'Text' }));
  await assert.rejects(load({ data: { id: 'other', name: 'Policy', content: 'Text' } }).getSource('s'));
});
test('request size counts multibyte text and rejects oversized requests', async () => {
  const api = load({});
  assert.ok(api.draftBytes({ name: 'Title', content: 'ह'.repeat(40000) }) > api.REQUEST_LIMIT);
  await assert.rejects(api.saveSource(null, { name: 'Title', content: 'x'.repeat(102400) }), /request limit/);
});
