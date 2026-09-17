'use strict';

const crypto = require('node:crypto');
const webhookService = require('./webhookService');

const ACTION_TYPE = 'bavio.webhook.deliver';

function getDb() {
  return require('../database/db');
}

function safeActionError(error) {
  if (error?.code === 'WEBHOOK_DESTINATION_BLOCKED') return { code: error.code, message: 'Webhook destination blocked.' };
  if (error?.code === 'WEBHOOK_DNS_FAILED') return { code: error.code, message: 'Webhook destination could not be resolved.' };
  if (error?.code === 'WEBHOOK_TIMEOUT') return { code: error.code, message: 'Webhook delivery timed out.' };
  if (error?.code === 'WEBHOOK_HTTP_401' || error?.code === 'WEBHOOK_HTTP_403') return { code: error.code, message: 'Webhook endpoint rejected the request.' };
  if (error?.code === 'WEBHOOK_HTTP_400') return { code: error.code, message: 'Webhook endpoint rejected the payload.' };
  if (error?.code === 'ACTION_FINALIZATION_FAILED') return { code: error.code, message: 'Webhook was delivered but Bavio could not finalize execution evidence.' };
  return { code: error?.code || 'WEBHOOK_DELIVERY_FAILED', message: 'Webhook delivery failed.' };
}

function safePayload(eventType, executionId, data) {
  if (typeof eventType !== 'string' || !eventType || eventType.length > 100) throw Object.assign(new Error('Webhook event type is invalid.'), { code: 'WEBHOOK_INPUT_INVALID' });
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Object.assign(new Error('Webhook payload is invalid.'), { code: 'WEBHOOK_INPUT_INVALID' });
  return { id: executionId, type: eventType, execution_id: executionId, created_at: new Date().toISOString(), data };
}

async function executeBavioWebhook({
  db: database = getDb(),
  transport,
  businessId,
  webhookConfigurationId,
  eventType,
  data,
  conversationId = null,
  leadId = null,
  invocationId = crypto.randomUUID(),
  lookup,
} = {}) {
  if (!businessId || !webhookConfigurationId) throw Object.assign(new Error('Tenant and webhook configuration are required.'), { code: 'WEBHOOK_CONTEXT_REQUIRED' });
  safePayload(eventType, invocationId, data);
  const configured = await database.query(
    `SELECT id, business_id, url, events, signing_secret, signing_secret_encrypted, signing_secret_version
     FROM webhooks WHERE id = $1 AND business_id = $2 AND status = 'active'`,
    [webhookConfigurationId, businessId]
  );
  if (configured.rows.length !== 1) throw Object.assign(new Error('Webhook configuration not found.'), { code: 'WEBHOOK_NOT_FOUND' });
  const hook = configured.rows[0];
  const subscribedEvents = Array.isArray(hook.events) ? hook.events : [];
  if (!subscribedEvents.includes('*') && !subscribedEvents.includes(eventType)) throw Object.assign(new Error('Webhook configuration is not subscribed to this event.'), { code: 'WEBHOOK_EVENT_NOT_SUBSCRIBED' });

  const existing = await database.query(
    `SELECT id, status, lead_id FROM action_executions
     WHERE business_id = $1 AND action_type = $2 AND idempotency_key = $3`,
    [businessId, ACTION_TYPE, invocationId]
  );
  if (existing.rows.length > 0) {
    const prior = existing.rows[0];
    return { executionId: prior.id, status: prior.status, duplicate: true, leadId: prior.lead_id || null };
  }

  let started;
  try {
    started = await database.query(
      `INSERT INTO action_executions
        (business_id, action_type, status, source_type, source_id, conversation_id, lead_id, idempotency_key, started_at)
       VALUES ($1, $2, 'started', 'webhook_configuration', $3, $4, $5, $6, NOW())
       RETURNING id, started_at`,
      [businessId, ACTION_TYPE, webhookConfigurationId, conversationId, leadId, invocationId]
    );
  } catch (error) {
    if (error?.code !== '23505') throw error;
    const concurrent = await database.query(
      `SELECT id, status, lead_id FROM action_executions
       WHERE business_id = $1 AND action_type = $2 AND idempotency_key = $3`,
      [businessId, ACTION_TYPE, invocationId]
    );
    if (concurrent.rows.length === 1) return { executionId: concurrent.rows[0].id, status: concurrent.rows[0].status, duplicate: true, leadId: concurrent.rows[0].lead_id || null };
    throw Object.assign(new Error('Webhook execution could not be started.'), { code: 'WEBHOOK_EXECUTION_START_FAILED' });
  }
  const executionId = started.rows[0].id;
  const payload = safePayload(eventType, executionId, data);
  const payloadString = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const startedAt = Date.now();
  let delivery;
  let deliveryError = null;

  try {
    const signature = `t=${timestamp},v1=${webhookService.computeSignature(payloadString, webhookService.resolveSigningSecret(hook), timestamp)}`;
    delivery = await webhookService.sendWebhookOnce(hook, payloadString, signature, { transport, lookup });
  } catch (error) {
    const safeDelivery = webhookService.safeDeliveryError(error);
    const preservedCode = typeof error.code === 'string' && error.code.startsWith('WEBHOOK_') ? error.code : safeDelivery.code;
    deliveryError = safeActionError({ ...safeDelivery, code: preservedCode });
    delivery = { status: error?.response?.status || null, accepted: false };
  }

  let deliveryLog;
  try {
    deliveryLog = await database.query(
      `INSERT INTO webhook_deliveries
        (webhook_id, business_id, event_id, event_type, payload, response_status, response_body, attempt_count, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, NULL, 1, $7)
       RETURNING id`,
      [webhookConfigurationId, businessId, executionId, eventType, JSON.stringify({ id: executionId, type: eventType, execution_id: executionId }), delivery.status, deliveryError?.message || null]
    );
  } catch (error) {
    console.error('[ACTION] Webhook delivery finalization could not start:', { code: error.code || 'DELIVERY_RECORD_FAILED', executionId, businessId, delivered: delivery.accepted });
    throw Object.assign(new Error('Webhook was delivered but Bavio could not finalize execution evidence.'), { code: 'ACTION_FINALIZATION_FAILED', executionId, delivered: delivery.accepted });
  }
  const deliveryId = deliveryLog.rows[0].id;
  const durationMs = Date.now() - startedAt;
  const finalStatus = delivery.accepted && !deliveryError ? 'succeeded' : 'failed';
  const outcome = finalStatus === 'succeeded' ? 'Webhook accepted by configured endpoint.' : (deliveryError?.message || `Webhook endpoint returned HTTP ${delivery.status || 'unknown'}.`);

  try {
    await database.query(
      `INSERT INTO execution_evidence
        (execution_id, business_id, evidence_type, entity_type, record_id, webhook_configuration_id, delivery_id, http_status, metadata, recorded_at)
       VALUES ($1, $2, 'external_webhook_delivery', 'webhook_delivery', $3, $4, $5, $6, $7, NOW())`,
      [executionId, businessId, String(deliveryId), webhookConfigurationId, deliveryId, delivery.status, JSON.stringify({ outcome, durationMs, attemptCount: 1 })]
    );
    await database.query(
      `UPDATE action_executions SET status = $2, completed_at = NOW(), error_code = $3, error_message = $4, attempt_count = 1, duration_ms = $5
       WHERE id = $1 AND business_id = $6`,
      [executionId, finalStatus, deliveryError?.code || null, deliveryError?.message || null, durationMs, businessId]
    );
  } catch (finalizationError) {
    console.error('[ACTION] Webhook finalization failed:', { code: finalizationError.code || 'ACTION_FINALIZATION_FAILED', executionId, businessId });
    throw Object.assign(new Error('Webhook was delivered but Bavio could not finalize execution evidence.'), { code: 'ACTION_FINALIZATION_FAILED', executionId, delivered: delivery.accepted });
  }

  if (finalStatus === 'failed') throw Object.assign(new Error(outcome), { code: deliveryError?.code || `WEBHOOK_HTTP_${delivery.status || 'UNKNOWN'}`, executionId, deliveryId });
  return {
    executionId,
    deliveryId: String(deliveryId),
    actionType: ACTION_TYPE,
    status: 'succeeded',
    outcome: 'Webhook accepted by configured endpoint.',
    evidence: { type: 'external_webhook_delivery', entity: 'webhook_delivery', recordId: String(deliveryId), httpStatus: delivery.status },
  };
}

module.exports = { ACTION_TYPE, executeBavioWebhook, safeActionError };
