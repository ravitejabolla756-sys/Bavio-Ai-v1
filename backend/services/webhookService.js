'use strict';

const crypto = require('node:crypto');
const http = require('node:http');
const https = require('node:https');
const axios = require('axios');
const { isUrlSafe, validateWebhookUrl, createPinnedLookup } = require('./webhookSecurity');
const { encryptWebhookSecret, decryptWebhookSecret, CURRENT_VERSION } = require('./webhookSecretEncryption');

const WEBHOOK_TIMEOUT_MS = 5000;

function getDb() {
  return require('../database/db');
}

function generateSigningSecret() {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

function computeSignature(payloadString, secret, timestamp) {
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${payloadString}`).digest('hex');
}

function safeDeliveryError(error) {
  if (error?.code === 'WEBHOOK_DESTINATION_BLOCKED') return { code: error.code, message: 'Webhook destination blocked.' };
  if (error?.code === 'WEBHOOK_DNS_FAILED' || error?.code === 'ENOTFOUND') return { code: 'WEBHOOK_DNS_FAILED', message: 'Webhook destination could not be resolved.' };
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') return { code: 'WEBHOOK_TIMEOUT', message: 'Webhook delivery timed out.' };
  if (error?.response?.status) return { code: `WEBHOOK_HTTP_${error.response.status}`, message: `Webhook endpoint returned HTTP ${error.response.status}.` };
  return { code: 'WEBHOOK_CONNECTION_FAILED', message: 'Webhook delivery failed.' };
}

function resolveSigningSecret(hook) {
  if (hook?.signing_secret_encrypted) return decryptWebhookSecret(hook.signing_secret_encrypted, { version: hook.signing_secret_version || CURRENT_VERSION });
  if (hook?.signing_secret) throw Object.assign(new Error('Webhook signing secret requires migration before delivery.'), { code: 'WEBHOOK_SECRET_MIGRATION_REQUIRED' });
  throw Object.assign(new Error('Webhook signing secret is unavailable.'), { code: 'WEBHOOK_SECRET_UNAVAILABLE' });
}

async function sendWebhookOnce(hook, payloadString, signatureHeader, { transport = axios, lookup = undefined, allowTestLoopback = false } = {}) {
  const destination = await validateWebhookUrl(hook.url, { lookup, allowTestLoopback });
  const agentOptions = { keepAlive: false, lookup: createPinnedLookup(destination.addresses) };
  const requestOptions = {
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Bavio-Webhook/2.0', 'X-Bavio-Signature': signatureHeader },
    timeout: WEBHOOK_TIMEOUT_MS,
    maxRedirects: 0,
  };
  if (destination.url.protocol === 'https:') requestOptions.httpsAgent = new https.Agent(agentOptions);
  else requestOptions.httpAgent = new http.Agent(agentOptions);
  const response = await transport.post(hook.url, payloadString, requestOptions);
  return { status: response.status, accepted: response.status >= 200 && response.status < 300 };
}

async function registerWebhook(businessId, url, events = ['*']) {
  await validateWebhookUrl(url);
  const secret = generateSigningSecret();
  const encrypted = encryptWebhookSecret(secret);
  const normalizedEvents = Array.isArray(events) ? events.filter((event) => typeof event === 'string' && event.length <= 100).slice(0, 100) : ['*'];
  const result = await getDb().query(
    `INSERT INTO webhooks (business_id, url, events, signing_secret, signing_secret_encrypted, signing_secret_version, status)
     VALUES ($1, $2, $3, NULL, $4, $5, 'active')
     RETURNING id, business_id, url, events, status, created_at`,
    [businessId, url, JSON.stringify(normalizedEvents.length ? normalizedEvents : ['*']), encrypted.value, encrypted.version]
  );
  return result.rows[0];
}

async function migrateLegacyWebhookSecrets({ database = getDb(), dryRun = false } = {}) {
  const legacy = await database.query(
    `SELECT id, signing_secret FROM webhooks
     WHERE signing_secret_encrypted IS NULL AND signing_secret IS NOT NULL`
  );
  let migrated = 0;
  const candidates = legacy.rows.map((row) => row.id);
  if (dryRun) return { scanned: legacy.rows.length, migrated: 0, candidates };
  for (const row of legacy.rows) {
    const encrypted = encryptWebhookSecret(row.signing_secret);
    await database.query(
      `UPDATE webhooks SET signing_secret_encrypted = $2, signing_secret_version = $3, signing_secret = NULL
       WHERE id = $1 AND signing_secret_encrypted IS NULL`,
      [row.id, encrypted.value, encrypted.version]
    );
    migrated += 1;
  }
  return { scanned: legacy.rows.length, migrated };
}

async function listWebhooks(businessId) {
  const result = await getDb().query(`SELECT id, business_id, url, events, status, created_at, updated_at FROM webhooks WHERE business_id = $1 AND status = 'active' ORDER BY created_at DESC`, [businessId]);
  return result.rows;
}

async function deleteWebhook(webhookId, businessId) {
  const result = await getDb().query(`UPDATE webhooks SET status = 'deleted', updated_at = NOW() WHERE id = $1 AND business_id = $2 AND status != 'deleted' RETURNING id`, [webhookId, businessId]);
  if (result.rows.length === 0) throw new Error('Webhook not found');
  return true;
}

async function dispatchWebhook(businessId, eventType, data) {
  const webhooksRes = await getDb().query("SELECT id, business_id, events FROM webhooks WHERE business_id = $1 AND status = 'active'", [businessId]);
  if (webhooksRes.rows.length === 0) return;
  const { executeBavioWebhook } = require('./bavioWebhookAction');
  for (const hook of webhooksRes.rows) {
    const subscribedEvents = Array.isArray(hook.events) ? hook.events : [];
    if (!subscribedEvents.includes('*') && !subscribedEvents.includes(eventType)) continue;
    executeBavioWebhook({
      businessId,
      webhookConfigurationId: hook.id,
      eventType,
      data,
      invocationId: crypto.randomUUID(),
    }).catch((error) => console.error('[WEBHOOK] Dispatch failed:', { code: error.code || 'WEBHOOK_DELIVERY_FAILED', webhookId: hook.id, businessId }));
  }
}

module.exports = { WEBHOOK_TIMEOUT_MS, registerWebhook, listWebhooks, deleteWebhook, dispatchWebhook, sendWebhookOnce, computeSignature, isUrlSafe, validateWebhookUrl, safeDeliveryError, resolveSigningSecret, migrateLegacyWebhookSecrets };
