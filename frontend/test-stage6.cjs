const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('typescript');
function compile(path, dependencies = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, TextEncoder, URLSearchParams, require: name => dependencies[name] }); return module.exports;
}
const model = compile('./src/features/leads/model.ts');
function load(response) { return compile('./src/features/leads/service.ts', { './model': model, '@/lib/api-transport': { getClientId: () => 'tenant', apiFetch: async () => response } }); }
const row = { id: 'lead', name: 'Person', phone: '+14155550100', notes: null, status: 'qualified', has_recorded_conversation: false, conversation_id: null };
test('contact identity removes known placeholders but never merges or reformats identifiers', () => {
  assert.equal(model.contactOf({ name: 'Anonymous Caller', phone: 'unknown' }).label, 'Contact not recorded');
  assert.equal(model.contactOf({ name: null, phone: '  +91 999-123  ' }).phone, '+91 999-123');
  assert.equal(model.contactOf({ name: 'Actual name', phone: null }).label, 'Actual name');
});
test('unknown dates/status are not fabricated', () => {
  assert.equal(model.leadDate('bad'), 'Date not recorded'); assert.equal(model.statusLabel(null), 'Status not recorded'); assert.equal(model.statusLabel('legacy'), 'Legacy');
});
test('unlinked or inaccessible conversations do not expose a guessed default agent', () => {
  const api = load(null); const context = api.adaptLeadContext({ ...row, has_recorded_conversation: true, agent_name: 'Untrusted' });
  assert.equal(context.conversation, null); assert.equal(context.conversationState, 'unavailable'); assert.equal('score' in context, false);
});
test('linked context retains individual identity and recorded values without semantic coercion', () => {
  const context = load(null).adaptLeadContext({ ...row, budget: 'Thursday', conversation_id: 'call', has_recorded_conversation: true, agent_name: 'Sales' });
  assert.equal(context.record.budget, 'Thursday'); assert.equal(context.conversation.id, 'call'); assert.equal(context.record.id, 'lead');
});
test('detail rejects ID mismatch and malformed relationship data', async () => {
  await assert.rejects(load({ data: row }).getLead('other')); assert.throws(() => load(null).adaptLeadContext({ id: 'lead' }));
});
test('pagination rejects malformed success envelopes', async () => {
  for (const response of [[], { data: [], pagination: {} }, { data: [], pagination: { has_more: true, next_cursor: null } }]) await assert.rejects(load(response).listLeads({ q: '', status: '', cursor: null }));
});
test('save requires backend-confirmed fields, including explicit empty notes', async () => {
  const draft = { name: 'Person', status: 'new', notes: '' };
  await load({ id: 'lead', ...draft }).saveLead('lead', draft);
  await assert.rejects(load({ id: 'lead', ...draft, notes: 'unchanged' }).saveLead('lead', draft));
  await assert.rejects(load(null).saveLead('lead', { ...draft, notes: 'ह'.repeat(50000) }), /request limit/);
});
