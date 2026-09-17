'use strict';

const assert = require('node:assert/strict');
const { createBavioLead } = require('./services/bavioLeadAction');

function createFakeDb({ failLead = false } = {}) {
  const executions = new Map();
  const leads = new Map();
  let failNextLead = failLead;

  function keyOf(businessId, idempotencyKey) {
    return `${businessId}:bavio.lead.create:${idempotencyKey}`;
  }

  function query(text, params = []) {
    if (text.startsWith('SELECT id, status, lead_id')) {
      const row = executions.get(keyOf(params[0], params[2]));
      return Promise.resolve({ rows: row ? [row] : [] });
    }
    if (text.startsWith('SELECT id FROM action_executions')) {
      const row = executions.get(keyOf(params[0], params[2]));
      return Promise.resolve({ rows: row ? [{ id: row.id }] : [] });
    }
    if (text.startsWith('INSERT INTO action_executions')) {
      const key = keyOf(params[0], params[5]);
      if (executions.has(key)) return Promise.reject(Object.assign(new Error('duplicate key'), { code: '23505' }));
      const row = { id: `execution-${executions.size + 1}`, status: 'failed', lead_id: null, error_code: params[6], error_message: params[7] };
      executions.set(key, row);
      return Promise.resolve({ rows: [{ id: row.id }] });
    }
    return Promise.resolve({ rows: [] });
  }

  let nextClientId = 0;
  const pool = {
    connect: async () => {
      const clientId = ++nextClientId;
      let transactionKey = null;
      return {
        query: async (text, params = []) => {
          if (text === 'BEGIN') return { rows: [] };
          if (text === 'ROLLBACK') {
            if (transactionKey) {
              const row = executions.get(transactionKey);
              if (row?.owner === clientId && row.status === 'started') executions.delete(transactionKey);
              const lead = leads.get(transactionKey);
              if (lead?.owner === clientId) leads.delete(transactionKey);
            }
            return { rows: [] };
          }
          if (text === 'COMMIT') return { rows: [] };
          if (text.startsWith('SELECT id, status, lead_id')) {
            const row = executions.get(keyOf(params[0], params[2]));
            transactionKey = keyOf(params[0], params[2]);
            return { rows: row ? [row] : [] };
          }
          if (text.startsWith('INSERT INTO action_executions')) {
            const key = keyOf(params[0], params[5]);
            transactionKey = key;
            if (executions.has(key)) throw Object.assign(new Error('duplicate key'), { code: '23505' });
            executions.set(key, { id: `execution-${executions.size + 1}`, status: 'started', lead_id: null, owner: clientId });
            return { rows: [{ id: executions.get(key).id }] };
          }
          if (text.startsWith('INSERT INTO leads')) {
            if (failNextLead) { failNextLead = false; throw Object.assign(new Error('database detail'), { code: '23505' }); }
            const lead = { id: `lead-${leads.size + 1}`, created_at: '2026-09-08T00:00:00.000Z', owner: clientId };
            leads.set(transactionKey, lead);
            return { rows: [lead] };
          }
          if (text.startsWith('UPDATE action_executions')) {
            const row = executions.get(transactionKey);
            row.status = 'succeeded';
            row.lead_id = params[1];
            return { rows: [] };
          }
          return { rows: [] };
        },
        release: () => {},
      };
    },
  };
  return { pool, query };
}

const lead = { phone: '+911234567890', name: 'Ada', intent: 'demo' };

async function run() {
  const db = createFakeDb();
  const first = await createBavioLead({ db, businessId: 'tenant-a', idempotencyKey: 'same-key', lead });
  const duplicate = await createBavioLead({ db, businessId: 'tenant-a', idempotencyKey: 'same-key', lead: { ...lead, name: 'Changed' } });
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.leadId, first.leadId);

  const concurrentDb = createFakeDb();
  const concurrent = await Promise.all([
    createBavioLead({ db: concurrentDb, businessId: 'tenant-a', idempotencyKey: 'concurrent', lead }),
    createBavioLead({ db: concurrentDb, businessId: 'tenant-a', idempotencyKey: 'concurrent', lead }),
  ]);
  assert.equal(new Set(concurrent.map((result) => result.leadId)).size, 1);

  const tenantDb = createFakeDb();
  const tenantResults = await Promise.all([
    createBavioLead({ db: tenantDb, businessId: 'tenant-a', idempotencyKey: 'same-key', lead }),
    createBavioLead({ db: tenantDb, businessId: 'tenant-b', idempotencyKey: 'same-key', lead }),
  ]);
  assert.notEqual(tenantResults[0].leadId, tenantResults[1].leadId);

  await assert.rejects(createBavioLead({ db: createFakeDb(), businessId: 'tenant-a', lead }), /idempotency key is required/i);
  await assert.rejects(createBavioLead({ db: createFakeDb(), businessId: 'tenant-a', idempotencyKey: '\u0000bad', lead }), /idempotency key is invalid/i);

  const failureDb = createFakeDb({ failLead: true });
  await assert.rejects(createBavioLead({ db: failureDb, businessId: 'tenant-a', idempotencyKey: 'failed-key', lead }), /Lead creation failed/);
  await assert.rejects(createBavioLead({ db: failureDb, businessId: 'tenant-a', idempotencyKey: 'failed-key', lead }), (error) => error.duplicate === true);

  console.log('Stage 7.2.6 local idempotency tests passed: sequential, concurrent, tenant-scoped, missing/invalid, and failed-key replay.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
