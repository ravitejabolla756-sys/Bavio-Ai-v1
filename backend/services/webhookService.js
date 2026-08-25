'use strict';

const crypto = require('crypto');
const axios = require('axios');
const db = require('../database/db');

function generateSigningSecret() {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

function computeSignature(payloadString, secret, timestamp) {
  const toSign = `${timestamp}.${payloadString}`;
  return crypto.createHmac('sha256', secret).update(toSign).digest('hex');
}

function isUrlSafe(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('169.254.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function registerWebhook(businessId, url, events = ['*']) {
  if (!isUrlSafe(url)) {
    throw new Error('Invalid or unsafe webhook URL');
  }

  const secret = generateSigningSecret();
  const result = await db.query(
    `INSERT INTO webhooks (business_id, url, events, signing_secret, status)
     VALUES ($1, $2, $3, $4, 'active')
     RETURNING id, business_id, url, events, signing_secret, status, created_at`,
    [businessId, url, JSON.stringify(events), secret]
  );
  return result.rows[0];
}

async function listWebhooks(businessId) {
  const result = await db.query(
    `SELECT id, business_id, url, events, status, created_at, updated_at
     FROM webhooks
     WHERE business_id = $1 AND status = 'active'
     ORDER BY created_at DESC`,
    [businessId]
  );
  return result.rows;
}

async function deleteWebhook(webhookId, businessId) {
  const result = await db.query(
    `UPDATE webhooks SET status = 'deleted', updated_at = NOW()
     WHERE id = $1 AND business_id = $2 AND status != 'deleted'
     RETURNING id`,
    [webhookId, businessId]
  );
  if (result.rows.length === 0) throw new Error('Webhook not found');
  return true;
}

async function dispatchWebhook(businessId, eventType, data) {
  const webhooksRes = await db.query(
    `SELECT * FROM webhooks WHERE business_id = $1 AND status = 'active'`,
    [businessId]
  );

  if (webhooksRes.rows.length === 0) return;

  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const eventPayload = {
    id: eventId,
    type: eventType,
    created_at: new Date().toISOString(),
    data,
  };

  const payloadString = JSON.stringify(eventPayload);

  for (const hook of webhooksRes.rows) {
    const subscribedEvents = Array.isArray(hook.events) ? hook.events : [];
    if (!subscribedEvents.includes('*') && !subscribedEvents.includes(eventType)) {
      continue;
    }

    const signature = computeSignature(payloadString, hook.signing_secret, timestamp);
    const signatureHeader = `t=${timestamp},v1=${signature}`;

    // Async attempt delivery with up to 3 retries
    deliverPayloadWithRetry(hook, eventId, eventType, eventPayload, payloadString, signatureHeader, 1);
  }
}

async function deliverPayloadWithRetry(hook, eventId, eventType, eventPayload, payloadString, signatureHeader, attempt = 1) {
  const maxAttempts = 3;
  let responseStatus = null;
  let responseBody = null;
  let errorMessage = null;

  try {
    const response = await axios.post(hook.url, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Bavio-Webhook/2.0',
        'X-Bavio-Signature': signatureHeader,
      },
      timeout: 5000,
    });

    responseStatus = response.status;
    responseBody = typeof response.data === 'string' ? response.data.slice(0, 500) : JSON.stringify(response.data).slice(0, 500);

    await db.query(
      `INSERT INTO webhook_deliveries (webhook_id, business_id, event_id, event_type, payload, response_status, response_body, attempt_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [hook.id, hook.business_id, eventId, eventType, JSON.stringify(eventPayload), responseStatus, responseBody, attempt]
    );

  } catch (err) {
    errorMessage = err.message;
    responseStatus = err.response ? err.response.status : 0;
    responseBody = err.response ? JSON.stringify(err.response.data).slice(0, 500) : null;

    if (attempt < maxAttempts) {
      const delayMs = Math.pow(2, attempt) * 1000;
      setTimeout(() => {
        deliverPayloadWithRetry(hook, eventId, eventType, eventPayload, payloadString, signatureHeader, attempt + 1);
      }, delayMs);
    } else {
      await db.query(
        `INSERT INTO webhook_deliveries (webhook_id, business_id, event_id, event_type, payload, response_status, response_body, attempt_count, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [hook.id, hook.business_id, eventId, eventType, JSON.stringify(eventPayload), responseStatus, responseBody, attempt, errorMessage]
      ).catch(e => console.error('[WEBHOOK] Save delivery log error:', e.message));
    }
  }
}

module.exports = {
  registerWebhook,
  listWebhooks,
  deleteWebhook,
  dispatchWebhook,
  computeSignature,
  isUrlSafe,
};
