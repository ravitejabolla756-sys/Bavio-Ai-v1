const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { validateInsight } = require('./services/conversationInsight');

function loadService(filename, dependencies, env = {}) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve(filename), 'utf8'), {
    process: { env }, module, exports: module.exports, console: { log() {}, warn() {}, error() {} },
    require: name => { if (!(name in dependencies)) throw new Error('Unexpected dependency ' + name); return dependencies[name]; },
  });
  return module.exports;
}
test('invalid insight values are rejected without coercion', () => {
  assert.throws(() => validateInsight({ interested: 'false' }));
  assert.throws(() => validateInsight({ interested: true, callback_required: false, lead_score: 101 }));
});
test('LLM failure cannot write synthetic outcomes, answers, or leads', async () => {
  const writes = [];
  const service = loadService('./services/outcomeExtractionService.js', {
    '../database/db': { query: async (...args) => { writes.push(args); return { rows: [] }; } },
    './openAIService': { chatCompletion: async () => { throw new Error('provider offline'); } },
    './webhookService': { dispatchWebhook: async () => { throw new Error('must not dispatch'); } },
    './conversationInsight': { validateInsight },
  });
  assert.equal(await service.extractCallOutcome('call', 'tenant', 'Hello'), null);
  assert.equal(writes.length, 0);
});
test('validated extraction stores interpretation provenance and never manufactures a caller', async () => {
  const queries = [];
  const insight = { interested: true, callback_required: false, lead_score: 75, budget: null, location: null, property_type: null, purchase_timeline: null, summary: 'Caller requested information.' };
  const service = loadService('./services/outcomeExtractionService.js', {
    '../database/db': { query: async (sql, params) => { queries.push([sql, params]); return { rows: [{ id: 'record' }] }; } },
    './openAIService': { chatCompletion: async () => JSON.stringify(insight) },
    './webhookService': { dispatchWebhook: async () => {} },
    './conversationInsight': { validateInsight },
  });
  await service.extractCallOutcome('call', 'tenant', 'Hello', null);
  assert.equal(queries.length, 1);
  assert.equal(queries[0][1][4], null);
  const stored = JSON.parse(queries[0][1][10]);
  assert.equal(stored.provenance.kind, 'conversation_insight');
  assert.equal(stored.provenance.executionEvidence, null);
});
test('knowledge update enforces tenant ownership and rejects invalid content', async () => {
  let query;
  const controller = loadService('./controllers/knowledgeBaseController.js', {
    '../database/db': { query: async (...args) => { query = args; return { rows: [] }; } }, axios: {},
    '../services/knowledgeSummarizer': {},
  });
  const response = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await controller.updateDoc({ body: { name: 'Source', content: 'Text' }, params: { id: 'other-doc' }, user: { id: 'tenant' } }, response);
  assert.equal(response.code, 404);
  assert.match(query[0], /id = \$3 AND business_id = \$4/);
  assert.equal(query[1][3], 'tenant');
  query = null;
  await controller.updateDoc({ body: { name: 'Source', content: '' } }, response);
  assert.equal(response.code, 400);
  assert.equal(query, null);
});
test('unconfigured telephony rejects inventory and provisioning without database writes', async () => {
  let writes = 0;
  const service = loadService('./services/twilioPhoneNumberService.js', {
    '../database/db': { query: async () => { writes++; throw new Error('Unexpected query'); } },
    twilio: () => { throw new Error('Unexpected provider call'); },
  });
  await assert.rejects(service.searchAvailableNumbers({ countryCode: 'US' }), /not configured/);
  await assert.rejects(service.provisionPhoneNumber({ businessId: 'tenant', phoneNumber: '+12025550101' }), /not configured/);
  assert.equal(writes, 0);
});
test('billing transport failures never fabricate checkout receipts even in development', async () => {
  const service = loadService('./services/dodoBillingService.js', {
    axios: { post: async () => { throw new Error('Network unavailable'); } },
    '../config/plans': { PLANS_CONFIG: { test: { name: 'Test' } }, getPlanProductId: () => 'product' },
    '../config/topups': { TOPUPS_CONFIG: { test: { minutes: 1, seconds: 60 } }, getTopupProductId: () => 'product' },
  }, { NODE_ENV: 'development' });
  await assert.rejects(service.createSubscription('tenant', 'test', 'test@example.invalid'), /Failed to create subscription/);
  await assert.rejects(service.createTopupCheckout('tenant', 'test', 'test@example.invalid'), /Failed to create top-up/);
});
test('conversation query is tenant-scoped, bounded, and validates cursors', () => {
  const { buildListQuery } = require('./services/conversationReadQuery');
  const result = buildListQuery('tenant', { limit: '25', status: 'completed', q: '+1', since: '2026-01-01T00:00:00.000Z' });
  assert.match(result.sql, /\(c\.business_id = \$1 OR c\.user_id = \$1\)/);
  assert.match(result.sql, /ORDER BY c\.created_at DESC, c\.id::text DESC LIMIT/);
  assert.equal(result.limit, 25);
  assert.throws(() => buildListQuery('tenant', { limit: '101' }), /between 1 and 100/);
  assert.throws(() => buildListQuery('tenant', { status: 'booked' }), /Invalid status/);
  assert.throws(() => buildListQuery('tenant', { cursor: 'not-a-cursor' }), /Invalid cursor/);
});
