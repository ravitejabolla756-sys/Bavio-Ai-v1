'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { resolveSignedLeadTenant } = require('./services/signedLeadTenant');
const { createBavioLead } = require('./services/bavioLeadAction');

async function testTenantResolution() {
  const calls = [];
  const db = { query: async (text, params) => {
    calls.push(text);
    if (text.includes('phone_numbers')) return { rows: [{ business_id: 'biz-a', country_code: 'IN' }] };
    if (text.includes('businesses')) return { rows: [{ id: 'biz-a', country_code: 'IN' }] };
    return { rows: [] };
  }};
  const resolved = await resolveSignedLeadTenant({ db, toNumber: '+9111', fromNumber: 'Unknown' });
  assert.deepEqual(resolved, { businessId: 'biz-a', countryCode: 'IN' });
  assert.equal(calls.some((query) => query.includes('LIMIT 1')), false);

  await assert.rejects(
    resolveSignedLeadTenant({ db: { query: async () => ({ rows: [] }) }, toNumber: 'Unknown', fromNumber: 'Unknown' }),
    (error) => error.code === 'TENANT_NOT_FOUND'
  );

  await assert.rejects(
    resolveSignedLeadTenant({
      db: { query: async (text) => text.includes('businesses') ? { rows: [{ id: 'biz-a', country_code: 'IN' }] } : { rows: [{ business_id: 'biz-a' }, { business_id: 'biz-b' }] } },
      toNumber: '+9111',
      fromNumber: '+9122',
    }),
    (error) => error.code === 'TENANT_AMBIGUOUS'
  );
}

function createTransactionalDb({ failAt } = {}) {
  const statements = [];
  let actionId = 0;
  const client = {
    query: async (text, params) => {
      statements.push({ text, params });
      if (failAt && text.includes(failAt)) throw Object.assign(new Error('secret database detail'), { code: '23505' });
      if (text.startsWith('INSERT INTO action_executions')) return { rows: [{ id: `execution-${++actionId}` }] };
      if (text.startsWith('INSERT INTO leads')) return { rows: [{ id: 'lead-123', created_at: '2026-09-08T00:00:00.000Z' }] };
      return { rows: [] };
    },
    release: () => { statements.push({ text: 'RELEASE' }); },
  };
  return {
    statements,
    pool: { connect: async () => client },
    query: async (text) => {
      statements.push({ text, outsideTransaction: true });
      return { rows: [{ id: 'failed-execution' }] };
    },
  };
}

async function testActionTransaction() {
  const db = createTransactionalDb();
  const result = await createBavioLead({
    db,
    businessId: 'biz-a',
    idempotencyKey: 'stage7.1-success',
    lead: { phone: '+911234', name: 'Ada', intent: 'demo', notes: 'internal', status: 'new' },
    sourceType: 'signed_ingestion',
    sourceId: 'CA123',
  });
  assert.equal(result.actionType, 'bavio.lead.create');
  assert.equal(result.status, 'succeeded');
  assert.equal(result.leadId, 'lead-123');
  assert.deepEqual(result.evidence, { type: 'internal_record', entity: 'lead', recordId: 'lead-123' });
  assert.equal(db.statements.some(({ text }) => text === 'COMMIT'), true);
  assert.equal(db.statements.some(({ text }) => text.includes('INSERT INTO execution_evidence')), true);

  const failedDb = createTransactionalDb({ failAt: 'INSERT INTO leads' });
  await assert.rejects(
    createBavioLead({ db: failedDb, businessId: 'biz-a', idempotencyKey: 'stage7.1-failure', lead: { phone: '+911234' } }),
    (error) => error.code === '23505' && error.message === 'Lead creation failed.' && !error.message.includes('secret')
  );
  assert.equal(failedDb.statements.some(({ text }) => text === 'ROLLBACK'), true);
  assert.equal(failedDb.statements.some(({ text }) => text === 'COMMIT'), false);
  assert.equal(failedDb.statements.some(({ text, outsideTransaction }) => outsideTransaction && text.includes("status, source_type")), true);
}

async function testValidationAndSecuritySurface() {
  const db = createTransactionalDb();
  await assert.rejects(createBavioLead({ db, businessId: 'biz-a', idempotencyKey: 'stage7.1-invalid-status', lead: { phone: '+1', status: 'admin' } }), (error) => error.code === 'LEAD_INPUT_INVALID');
  await assert.rejects(createBavioLead({ db, businessId: 'biz-a', idempotencyKey: 'stage7.1-invalid-notes', lead: { phone: '+1', notes: { secret: true } } }), (error) => error.code === 'LEAD_INPUT_INVALID');
  await assert.rejects(createBavioLead({ db, businessId: 'biz-a', lead: { phone: '+1' } }), (error) => error.code === 'LEAD_IDEMPOTENCY_KEY_REQUIRED');

  const controller = fs.readFileSync(path.join(__dirname, 'controllers/twilioCallController.js'), 'utf8');
  assert.equal(controller.includes('SELECT id, country_code FROM businesses LIMIT 1'), false);
  assert.equal(controller.includes('firstBiz'), false);
}

async function testStrictTwilioAuth() {
  const twilio = require('twilio');
  const original = twilio.validateRequest;
  const middlewarePath = require.resolve('./middleware/twilioAuth');
  const originalEnv = { NODE_ENV: process.env.NODE_ENV, TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN };
  try {
    process.env.NODE_ENV = 'test';
    process.env.TWILIO_AUTH_TOKEN = 'test-token';
    const { validateTwilioSignature } = require(middlewarePath);
    const response = () => {
      const result = {};
      result.status = (code) => { result.code = code; return result; };
      result.json = (body) => { result.body = body; return result; };
      return result;
    };
    let nextCalled = false;
    let res = response();
    validateTwilioSignature({ headers: {}, protocol: 'https', originalUrl: '/save-lead', body: {} }, res, () => { nextCalled = true; }, { strict: true });
    assert.equal(res.code, 403);
    assert.equal(nextCalled, false);

    twilio.validateRequest = () => false;
    res = response();
    validateTwilioSignature({ headers: { 'x-twilio-signature': 'bad' }, protocol: 'https', originalUrl: '/save-lead', body: {} }, res, () => {}, { strict: true });
    assert.equal(res.code, 403);

    twilio.validateRequest = () => true;
    res = response();
    nextCalled = false;
    validateTwilioSignature({ headers: { 'x-twilio-signature': 'valid' }, protocol: 'https', originalUrl: '/save-lead', body: {} }, res, () => { nextCalled = true; }, { strict: true });
    assert.equal(nextCalled, true);
  } finally {
    twilio.validateRequest = original;
    if (originalEnv.NODE_ENV === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalEnv.NODE_ENV;
    if (originalEnv.TWILIO_AUTH_TOKEN === undefined) delete process.env.TWILIO_AUTH_TOKEN; else process.env.TWILIO_AUTH_TOKEN = originalEnv.TWILIO_AUTH_TOKEN;
  }
}

(async () => {
  await testTenantResolution();
  await testActionTransaction();
  await testValidationAndSecuritySurface();
  await testStrictTwilioAuth();
  console.log('Stage 7.1 tests passed: tenant fail-closed, strict signature, transaction/evidence, validation, no first-business fallback.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
