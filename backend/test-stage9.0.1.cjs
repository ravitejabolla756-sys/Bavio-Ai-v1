'use strict';

const assert = require('node:assert/strict');
const {
  recordConversationCompletedEvent,
  reconcileConversationCompletedEvent,
  mapConversationToLeadInput,
} = require('./services/businessEventService');

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const CALL_A = 'call-a';

function createFakeDb() {
  const calls = [{ id: CALL_A, business_id: TENANT_A, assistant_id: 'assistant-a', phone_number_id: 'phone-a', call_sid: 'CA-1', provider_call_id: 'CA-1', status: 'completed', call_status: 'completed', started_at: '2026-09-09T10:00:00.000Z', ended_at: '2026-09-09T10:05:00.000Z', created_at: '2026-09-09T10:00:00.000Z' }];
  const events = [];
  let nextId = 1;
  return {
    events,
    async query(sql, params) {
      if (sql.includes('FROM calls c')) {
        const candidate = params[0];
        const tenant = params[1];
        const rows = calls.filter(row => (row.id === candidate || row.call_sid === candidate || row.provider_call_id === candidate) && (!tenant || row.business_id === tenant));
        return { rows: rows.slice(0, 2) };
      }
      if (sql.includes('INSERT INTO business_events')) {
        const [, eventType, aggregateType, aggregateKey, sourceType, sourceId, occurredAt, payload] = params;
        const existing = events.find(event => event.business_id === params[0] && event.event_type === eventType && event.aggregate_key === aggregateKey);
        if (existing) return { rows: [] };
        const event = { id: `event-${nextId++}`, business_id: params[0], event_type: eventType, aggregate_type: aggregateType, aggregate_key: aggregateKey, source_type: sourceType, source_id: sourceId, schema_version: 1, occurred_at: occurredAt, recorded_at: new Date().toISOString(), payload: JSON.parse(payload), created_at: new Date().toISOString() };
        events.push(event);
        return { rows: [event] };
      }
      if (sql.includes('FROM business_events') && sql.includes('aggregate_key')) {
        return { rows: events.filter(event => event.business_id === params[0] && event.event_type === params[1] && event.aggregate_key === params[2]) };
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };
}

async function main() {
  const db = createFakeDb();
  const first = await recordConversationCompletedEvent({ db, sourceType: 'twilio_callback', sourceId: 'CA-1', businessId: TENANT_A, conversationId: CALL_A });
  assert.equal(first.duplicate, false);
  assert.equal(db.events.length, 1);
  const duplicate = await recordConversationCompletedEvent({ db, sourceType: 'websocket_session', sourceId: 'CA-1', businessId: TENANT_A, conversationId: CALL_A });
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.event.id, first.event.id);
  const concurrent = await Promise.all(Array.from({ length: 5 }, (_, index) => recordConversationCompletedEvent({ db, sourceType: `source_${index}`, sourceId: `CA-1-${index}`, businessId: TENANT_A, conversationId: CALL_A })));
  assert.equal(db.events.length, 1);
  assert.ok(concurrent.every(result => result.event.id === first.event.id));
  await assert.rejects(() => recordConversationCompletedEvent({ db, sourceType: 'twilio_callback', sourceId: 'CA-1', businessId: TENANT_B, conversationId: CALL_A }), error => error.code === 'CONVERSATION_NOT_FOUND');
  await assert.rejects(() => recordConversationCompletedEvent({ db, sourceType: 'twilio_callback', sourceId: 'unknown', businessId: TENANT_A }), error => error.code === 'CONVERSATION_NOT_FOUND');
  const reconciled = await reconcileConversationCompletedEvent({ db, businessId: TENANT_A, conversationId: CALL_A });
  assert.equal(reconciled.duplicate, true);
  assert.equal(db.events.length, 1);
  const missingPhone = mapConversationToLeadInput({ id: CALL_A });
  assert.equal(missingPhone.available, false);
  assert.equal(missingPhone.reason, 'LEAD_PHONE_UNAVAILABLE');
  const mapped = mapConversationToLeadInput({ id: CALL_A, caller_number: '+15550001', caller_name: 'A' });
  assert.equal(mapped.available, true);
  assert.equal(mapped.lead.phone, '+15550001');
  console.log('Stage 9.0.1 canonical event foundation tests passed.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
