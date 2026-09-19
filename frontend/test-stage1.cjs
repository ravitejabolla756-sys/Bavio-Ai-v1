const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Test-only TS loader, no generated application files or dependency installation.
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
};
const { adaptConversation, normalizeTranscript, adaptLegacyInsight } = require('./src/features/conversations/adapter.ts');
const api = require('./src/lib/api.ts');

test('legacy and V1 voice records normalize without invented timestamps or outcomes', () => {
  const legacy = adaptConversation({ id: 'call-1', call_status: 'completed', duration: 0, transcript: 'Customer requested an appointment.' });
  assert.equal(legacy.duration, 0);
  assert.equal(legacy.startedAt, null);
  assert.equal(legacy.agent.id, null);
  assert.equal(legacy.processingState, 'unknown');
  assert.equal(legacy.transcript.entries[0].role, null);
  assert.equal('outcome' in legacy, false);
  const v1 = adaptConversation({ data: { id: 'call-2', status: 'in-progress', duration_seconds: '12', agent_id: 'a1', transcript: '[{"role":"user","content":"Hello"}]' } });
  assert.equal(v1.duration, 12);
  assert.equal(v1.agent.id, 'a1');
  assert.equal(v1.transcript.entries[0].content, 'Hello');
});
test('missing and malformed transcript and duration are explicit', () => {
  assert.equal(normalizeTranscript(null).state, 'unavailable');
  assert.equal(normalizeTranscript('[invalid').state, 'invalid');
  assert.equal(normalizeTranscript([{ role: 'user' }]).state, 'invalid');
  assert.equal(adaptConversation({ id: 'x', duration: -1 }).duration, null);
  assert.throws(() => adaptConversation({ data: {} }));
  assert.equal(adaptConversation({ id: 'x', from_number: 'outbound-business-number' }).caller.phone, null);
});
test('legacy extraction stays an unverified insight, never an execution outcome', () => {
  const insight = adaptLegacyInsight({ data: { budget: '80 Lakhs', appointment_time: 'Thursday', interested: true } });
  assert.equal(insight.source, 'unverified_legacy');
  assert.equal(insight.extractionStatus, 'unknown');
  assert.equal('evidence' in insight, false);
  assert.equal('outcome' in insight, false);
});
test('API failures reject instead of inventing empty/success/financial records', async () => {
  const original = global.fetch;
  global.fetch = async () => new Response(JSON.stringify({ error: 'unavailable' }), { status: 503, headers: { 'content-type': 'application/json' } });
  try {
    for (const invoke of [
      () => api.callsApi.list('tenant'), () => api.leadsApi.list('tenant'),
      () => api.knowledgeBaseApi.list(), () => api.knowledgeBaseApi.update('doc', { name: 'n', content: 'c' }),
      () => api.knowledgeBaseApi.syncToAssistant(), () => api.numbersApi.getAvailable('GB'),
      () => api.numbersApi.buyNumber({ phoneNumber: '+441234', countryCode: 'GB' }),
      () => api.numbersApi.linkNumber({ phoneId: 'n', assistantId: 'a' }),
      () => api.numbersApi.unlinkNumber('n'), () => api.billingApi.getBalance(),
      () => api.billingApi.getStatus('tenant'), () => api.billingApi.getPayments('tenant'),
    ]) await assert.rejects(invoke, /unavailable/);
  } finally { global.fetch = original; }
});
test('document and number envelopes and actual routes are consumed correctly', async () => {
  const original = global.fetch;
  const requests = [];
  global.fetch = async (url, options) => {
    requests.push([url, options]);
    const data = url.includes('/available') ? { success: true, numbers: [] }
      : url === '/api/knowledge-base' && !options.method ? { success: true, data: [] }
      : { success: true, data: { id: 'saved', name: 'Source', number: '+441234' } };
    return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
  };
  try {
    assert.deepEqual(await api.knowledgeBaseApi.list(), []);
    assert.equal((await api.knowledgeBaseApi.create({ name: 'Source', content: 'actual text' })).id, 'saved');
    await api.numbersApi.getAvailable('GB');
    assert.equal(requests.at(-1)[0], '/api/numbers/available?countryCode=GB');
    assert.equal((await api.numbersApi.buyNumber({ phoneNumber: '+441234', countryCode: 'GB' })).id, 'saved');
    await api.numbersApi.linkNumber({ phoneId: 'n', assistantId: 'a' });
    assert.equal(requests.at(-1)[0], '/api/numbers/link');
    await api.numbersApi.unlinkNumber('n');
    assert.equal(requests.at(-1)[0], '/api/numbers/unlink');
    assert.equal(JSON.parse(requests.at(-1)[1].body).phoneId, 'n');
  } finally { global.fetch = original; }
});
test('HTTP 200 failure and malformed collections are not success', async () => {
  const original = global.fetch;
  try {
    global.fetch = async () => new Response('{"success":false,"error":"not saved"}', { headers: { 'content-type': 'application/json' } });
    await assert.rejects(() => api.knowledgeBaseApi.syncToAssistant(), /not saved/);
    global.fetch = async () => new Response('{}', { headers: { 'content-type': 'application/json' } });
    await assert.rejects(() => api.callsApi.list('tenant'), /invalid collection/);
    await assert.rejects(() => api.numbersApi.buyNumber({ phoneNumber: '+123', countryCode: 'US' }), /did not confirm/);
    global.fetch = async () => { throw new Error('network'); };
    await assert.rejects(() => api.numbersApi.buyNumber({ phoneNumber: '+123', countryCode: 'US' }), /before retrying/);
  } finally { global.fetch = original; }
});
