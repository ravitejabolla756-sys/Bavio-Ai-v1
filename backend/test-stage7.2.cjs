'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { isUrlSafe, validateWebhookUrl } = require('./services/webhookSecurity');
const webhookService = require('./services/webhookService');
const { executeBavioWebhook } = require('./services/bavioWebhookAction');
const { encryptWebhookSecret } = require('./services/webhookSecretEncryption');

process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');

function createActionDb({ hook = { id: 'hook-a', business_id: 'biz-a', url: 'https://hooks.example.test/receive', events: ['lead.created'], signing_secret_encrypted: encryptWebhookSecret('whsec_test', { key: process.env.WEBHOOK_SECRET_ENCRYPTION_KEY }).value, signing_secret_version: 'v1' }, existing = null } = {}) {
  const queries = [];
  let counter = 0;
  return {
    queries,
    async query(text, params) {
      queries.push({ text, params });
      if (text.includes('FROM webhooks')) return { rows: hook ? [hook] : [] };
      if (text.includes('FROM action_executions')) return { rows: existing ? [existing] : [] };
      if (text.includes('INSERT INTO action_executions')) return { rows: [{ id: `execution-${++counter}`, started_at: new Date().toISOString() }] };
      if (text.includes('INSERT INTO webhook_deliveries')) return { rows: [{ id: `delivery-${++counter}` }] };
      return { rows: [] };
    },
  };
}

async function testUrlPolicy() {
  assert.equal(isUrlSafe('file:///etc/passwd'), false);
  assert.equal(isUrlSafe('ftp://example.com/hook'), false);
  assert.equal(isUrlSafe('javascript:alert(1)'), false);
  assert.equal(isUrlSafe('http://localhost:8080/hook'), false);
  assert.equal(isUrlSafe('https://127.0.0.1/hook'), false);
  assert.equal(isUrlSafe('https://169.254.169.254/latest/meta-data'), false);
  assert.equal(isUrlSafe('https://api.external.example/hook'), true);
  await assert.rejects(validateWebhookUrl('https://external.example/hook', { lookup: async () => [{ address: '10.0.0.2', family: 4 }] }), (error) => error.code === 'WEBHOOK_DESTINATION_BLOCKED');
  await assert.rejects(validateWebhookUrl('https://external.example/hook', { lookup: async () => [{ address: 'fd00::2', family: 6 }] }), (error) => error.code === 'WEBHOOK_DESTINATION_BLOCKED');
}

async function testControlledSink() {
  process.env.NODE_ENV = 'test';
  const received = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      received.push({ headers: req.headers, body: Buffer.concat(chunks).toString('utf8') });
      res.statusCode = 204;
      res.end();
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const result = await webhookService.sendWebhookOnce(
    { url: `http://127.0.0.1:${port}/sink` },
    '{"execution_id":"test-execution"}',
    't=1,v1=test',
    { allowTestLoopback: true }
  );
  await new Promise((resolve) => server.close(resolve));
  assert.equal(result.status, 204);
  assert.equal(result.accepted, true);
  assert.equal(received.length, 1);
  assert.equal(received[0].headers['x-bavio-signature'], 't=1,v1=test');
  assert.match(received[0].body, /test-execution/);
}

async function testActionMatrix() {
  const db = createActionDb();
  const result = await executeBavioWebhook({
    db,
    businessId: 'biz-a',
    webhookConfigurationId: 'hook-a',
    eventType: 'lead.created',
    data: { lead_id: 'lead-1' },
    invocationId: 'invocation-1',
    lookup: async () => [{ address: '93.184.216.34', family: 4 }],
    transport: { post: async (_url, _body, options) => { assert.equal(options.maxRedirects, 0); return { status: 204 }; } },
  });
  assert.equal(result.status, 'succeeded');
  assert.equal(result.outcome, 'Webhook accepted by configured endpoint.');
  assert.equal(result.evidence.httpStatus, 204);
  assert.equal(db.queries.some(({ text }) => text.includes('signing_secret') && text.includes('RETURNING')), false);

  for (const status of [400, 401, 403, 500, 302]) {
    const failedDb = createActionDb();
    await assert.rejects(executeBavioWebhook({
      db: failedDb,
      businessId: 'biz-a',
      webhookConfigurationId: 'hook-a',
      eventType: 'lead.created',
      data: { lead_id: 'lead-1' },
      invocationId: `invocation-${status}`,
      lookup: async () => [{ address: '93.184.216.34', family: 4 }],
      transport: { post: async () => ({ status }) },
    }));
    assert.equal(failedDb.queries.some(({ text }) => text.includes('INSERT INTO execution_evidence')), true);
  }

  for (const code of ['ETIMEDOUT', 'ECONNREFUSED']) {
    const networkDb = createActionDb();
    await assert.rejects(executeBavioWebhook({
      db: networkDb,
      businessId: 'biz-a',
      webhookConfigurationId: 'hook-a',
      eventType: 'lead.created',
      data: { lead_id: 'lead-1' },
      invocationId: `network-${code}`,
      lookup: async () => [{ address: '93.184.216.34', family: 4 }],
      transport: { post: async () => { throw Object.assign(new Error('network detail'), { code }); } },
    }), (error) => error.code === (code === 'ETIMEDOUT' ? 'WEBHOOK_TIMEOUT' : 'WEBHOOK_CONNECTION_FAILED'));
  }

  const duplicate = await executeBavioWebhook({
    db: createActionDb({ existing: { id: 'execution-existing', status: 'succeeded', lead_id: null } }),
    businessId: 'biz-a',
    webhookConfigurationId: 'hook-a',
    eventType: 'lead.created',
    data: {},
    invocationId: 'same-invocation',
  });
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.executionId, 'execution-existing');

  const unknownDb = createActionDb({ hook: null });
  await assert.rejects(executeBavioWebhook({ db: unknownDb, businessId: 'biz-a', webhookConfigurationId: 'hook-b', eventType: 'lead.created', data: {} }), (error) => error.code === 'WEBHOOK_NOT_FOUND');
  await assert.rejects(executeBavioWebhook({ db: createActionDb({ hook: null }), businessId: 'biz-b', webhookConfigurationId: 'hook-a', eventType: 'lead.created', data: {} }), (error) => error.code === 'WEBHOOK_NOT_FOUND');
  await assert.rejects(executeBavioWebhook({ db: createActionDb({ hook: { id: 'hook-a', business_id: 'biz-a', url: 'https://hooks.example.test', events: ['other'], signing_secret: 'secret' } }), businessId: 'biz-a', webhookConfigurationId: 'hook-a', eventType: 'lead.created', data: {} }), (error) => error.code === 'WEBHOOK_EVENT_NOT_SUBSCRIBED');
}

(async () => {
  await testUrlPolicy();
  await testControlledSink();
  await testActionMatrix();
  console.log('Stage 7.2 tests passed: SSRF policy, controlled 204 sink, tenant/config isolation, status matrix, redirect blocking, evidence, and secret boundaries.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
