'use strict';

const EVENT_TYPE = 'conversation.completed';
const AGGREGATE_TYPE = 'conversation';

function getDb() { return require('../database/db'); }

function requiredText(value, label, max = 255) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) {
    throw Object.assign(new Error(`${label} is invalid.`), { code: 'BUSINESS_EVENT_INPUT_INVALID' });
  }
  return value.trim();
}

function safeSourceType(value) { return requiredText(value, 'Event source type', 80); }

function completedAtFor(row, requested) {
  const value = requested || row.ended_at || row.updated_at || row.created_at;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw Object.assign(new Error('Completion timestamp is unavailable.'), { code: 'COMPLETION_TIMESTAMP_UNAVAILABLE' });
  return date.toISOString();
}

async function resolveCanonicalConversation({ db = getDb(), sourceType, sourceId, businessId, conversationId } = {}) {
  const source = safeSourceType(sourceType);
  const candidate = requiredText(conversationId || sourceId, 'Conversation source', 255);
  const params = [candidate];
  const predicates = ['(c.id::text = $1 OR c.call_sid = $1 OR c.provider_call_id = $1)'];
  if (businessId) {
    params.push(requiredText(businessId, 'Tenant identity', 100));
    predicates.push('(c.business_id = $2 OR c.client_id = $2 OR c.user_id = $2)');
  }
  const result = await db.query(
    `SELECT c.id, c.business_id, c.client_id, c.user_id, c.provider,
            c.call_sid, c.provider_call_id, c.status, c.call_status, c.started_at, c.ended_at, c.created_at
       FROM calls c WHERE ${predicates.join(' AND ')} LIMIT 2`,
    params
  );
  if (result.rows.length !== 1) {
    throw Object.assign(new Error(result.rows.length ? 'Conversation identity is ambiguous.' : 'Conversation identity was not found.'), {
      code: result.rows.length ? 'CONVERSATION_IDENTITY_AMBIGUOUS' : 'CONVERSATION_NOT_FOUND',
      sourceType: source,
    });
  }
  const row = result.rows[0];
  const tenant = row.business_id || row.client_id || row.user_id;
  if (!tenant) throw Object.assign(new Error('Conversation tenant is unavailable.'), { code: 'CONVERSATION_TENANT_UNAVAILABLE' });
  if (businessId && String(tenant) !== String(businessId)) throw Object.assign(new Error('Conversation tenant does not match the supplied tenant.'), { code: 'CROSS_TENANT_CONVERSATION' });
  const lifecycleStatuses = [row.status, row.call_status].filter(Boolean).map(value => String(value).toLowerCase());
  if (!lifecycleStatuses.includes('completed')) throw Object.assign(new Error('Conversation has not reached the canonical completed state.'), { code: 'CONVERSATION_NOT_COMPLETED' });
  return { ...row, business_id: tenant, aggregateKey: `call:${row.id}`, completedAt: completedAtFor(row) };
}

async function recordConversationCompletedEvent({ db = getDb(), sourceType, sourceId, businessId, conversationId, completedAt } = {}) {
  const conversation = await resolveCanonicalConversation({ db, sourceType, sourceId, businessId, conversationId });
  const occurredAt = completedAt ? completedAtFor({ ...conversation, ended_at: completedAt }, completedAt) : conversation.completedAt;
  const payload = {
    conversationId: String(conversation.id),
    ...(conversation.assistant_id ? { assistantId: String(conversation.assistant_id) } : {}),
    ...(conversation.phone_number_id ? { phoneNumberId: String(conversation.phone_number_id) } : {}),
    ...(conversation.started_at ? { startedAt: new Date(conversation.started_at).toISOString() } : {}),
    completedAt: occurredAt,
    provider: conversation.provider || undefined,
  };
  const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
  const inserted = await db.query(
    `INSERT INTO business_events
      (business_id, event_type, aggregate_type, aggregate_key, source_type, source_id,
       schema_version, occurred_at, recorded_at, payload)
     VALUES ($1, $2, $3, $4, $5, $6, 1, $7, NOW(), $8::jsonb)
     ON CONFLICT (business_id, event_type, aggregate_key) DO NOTHING
     RETURNING id, business_id, event_type, aggregate_type, aggregate_key, source_type,
               source_id, schema_version, occurred_at, recorded_at, payload, created_at`,
    [conversation.business_id, EVENT_TYPE, AGGREGATE_TYPE, conversation.aggregateKey, safeSourceType(sourceType), sourceId ? String(sourceId) : null, occurredAt, JSON.stringify(cleanPayload)]
  );
  if (inserted.rows[0]) return { event: inserted.rows[0], duplicate: false, conversation };
  const existing = await db.query(
    `SELECT id, business_id, event_type, aggregate_type, aggregate_key, source_type,
            source_id, schema_version, occurred_at, recorded_at, payload, created_at
       FROM business_events
      WHERE business_id = $1 AND event_type = $2 AND aggregate_key = $3`,
    [conversation.business_id, EVENT_TYPE, AGGREGATE_TYPE === 'conversation' ? conversation.aggregateKey : null]
  );
  if (existing.rows.length !== 1) throw Object.assign(new Error('Canonical completion event could not be reconciled.'), { code: 'BUSINESS_EVENT_RECONCILIATION_FAILED' });
  return { event: existing.rows[0], duplicate: true, conversation };
}

async function reconcileConversationCompletedEvent({ db = getDb(), businessId, conversationId } = {}) {
  return recordConversationCompletedEvent({ db, businessId, conversationId, sourceType: 'controlled_reconciliation', sourceId: conversationId });
}

async function getBusinessEventById({ db = getDb(), businessId, eventId } = {}) {
  const result = await db.query(
    `SELECT id, business_id, event_type, aggregate_type, aggregate_key, source_type,
            source_id, schema_version, occurred_at, recorded_at, payload, created_at
       FROM business_events WHERE business_id = $1 AND id = $2`,
    [requiredText(businessId, 'Tenant identity', 100), requiredText(eventId, 'Event identity', 100)]
  );
  return result.rows[0] || null;
}

function mapConversationToLeadInput(conversation) {
  const phone = conversation?.caller_number || conversation?.phone || null;
  return {
    available: typeof phone === 'string' && phone.trim().length > 0,
    lead: { phone: phone ? phone.trim() : null, ...(conversation?.caller_name ? { name: conversation.caller_name } : {}), ...(conversation?.intent ? { intent: conversation.intent } : {}), ...(conversation?.budget ? { budget: conversation.budget } : {}), ...(conversation?.location ? { location: conversation.location } : {}), ...(conversation?.id ? { conversationId: conversation.id } : {}) },
    reason: phone ? null : 'LEAD_PHONE_UNAVAILABLE',
  };
}

async function resolveAutomationWebhook({ db = getDb(), businessId, workflowDefinitionId, webhookConfigurationId } = {}) {
  const tenant = requiredText(businessId, 'Tenant identity', 100);
  const binding = await db.query(
    `SELECT id, business_id, workflow_definition_id, workflow_version_id, webhook_configuration_id, enabled, activated_at
       FROM workflow_automation_bindings
      WHERE business_id = $1 AND workflow_definition_id = $2 AND enabled = TRUE`,
    [tenant, requiredText(workflowDefinitionId, 'Workflow definition identity', 100)]
  );
  if (binding.rows.length !== 1) return { configured: false, reason: 'WEBHOOK_AUTOMATION_NOT_CONFIGURED' };
  const row = binding.rows[0];
  if (webhookConfigurationId && String(row.webhook_configuration_id) !== String(webhookConfigurationId)) throw Object.assign(new Error('Webhook configuration does not match the automation binding.'), { code: 'WEBHOOK_CONFIGURATION_MISMATCH' });
  const hook = await db.query('SELECT id, business_id, status FROM webhooks WHERE id = $1 AND business_id = $2', [row.webhook_configuration_id, tenant]);
  if (hook.rows.length !== 1 || hook.rows[0].status !== 'active') return { configured: false, reason: 'WEBHOOK_CONFIGURATION_UNAVAILABLE' };
  return { configured: true, binding: row, webhookConfigurationId: row.webhook_configuration_id };
}

module.exports = { EVENT_TYPE, AGGREGATE_TYPE, resolveCanonicalConversation, recordConversationCompletedEvent, reconcileConversationCompletedEvent, getBusinessEventById, mapConversationToLeadInput, resolveAutomationWebhook };
