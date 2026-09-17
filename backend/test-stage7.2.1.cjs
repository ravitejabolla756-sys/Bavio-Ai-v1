'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { encryptWebhookSecret, decryptWebhookSecret } = require('./services/webhookSecretEncryption');
const { migrateLegacyWebhookSecrets } = require('./services/webhookService');

async function testAuthenticatedEncryption() {
  const key = Buffer.alloc(32, 7).toString('base64');
  const encrypted = encryptWebhookSecret('whsec_test_secret', { key });
  assert.notEqual(encrypted.value, 'whsec_test_secret');
  assert.equal(decryptWebhookSecret(encrypted.value, { version: encrypted.version, key }), 'whsec_test_secret');
  await assert.rejects(async () => decryptWebhookSecret(`${encrypted.value.slice(0, -1)}x`, { key }), (error) => error.code === 'WEBHOOK_SECRET_DECRYPT_FAILED');
  await assert.rejects(async () => decryptWebhookSecret(encrypted.value, { key: Buffer.alloc(32, 8).toString('base64') }), (error) => error.code === 'WEBHOOK_SECRET_DECRYPT_FAILED');
}

async function testExplicitLegacyMigration() {
  const key = Buffer.alloc(32, 9).toString('base64');
  const oldKey = process.env.WEBHOOK_SECRET_ENCRYPTION_KEY;
  process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = key;
  const updates = [];
  let legacySecret = 'legacy-secret';
  const database = {
    async query(text, params) {
      if (text.includes('SELECT id, signing_secret')) return { rows: legacySecret ? [{ id: 'hook-1', signing_secret: legacySecret }] : [] };
      updates.push({ text, params });
      if (text.includes('UPDATE webhooks')) legacySecret = null;
      return { rows: [] };
    },
  };
  const dryRun = await migrateLegacyWebhookSecrets({ database, dryRun: true });
  assert.deepEqual(dryRun, { scanned: 1, migrated: 0, candidates: ['hook-1'] });
  assert.equal(updates.length, 0);
  const result = await migrateLegacyWebhookSecrets({ database });
  assert.deepEqual(result, { scanned: 1, migrated: 1 });
  assert.equal(updates.length, 1);
  assert.equal(updates[0].params[3], undefined);
  assert.notEqual(updates[0].params[1], 'legacy-secret');
  const repeat = await migrateLegacyWebhookSecrets({ database });
  assert.deepEqual(repeat, { scanned: 0, migrated: 0 });
  if (oldKey === undefined) delete process.env.WEBHOOK_SECRET_ENCRYPTION_KEY; else process.env.WEBHOOK_SECRET_ENCRYPTION_KEY = oldKey;
}

function testLegacyRetryRemovedAndSecretNotReturned() {
  const service = fs.readFileSync(path.join(__dirname, 'services/webhookService.js'), 'utf8');
  const controller = fs.readFileSync(path.join(__dirname, 'controllers/v1/webhooksV1Controller.js'), 'utf8');
  assert.equal(service.includes('deliverPayloadWithRetry'), false);
  assert.equal(service.includes('setTimeout'), false);
  assert.match(service, /executeBavioWebhook/);
  assert.match(controller, /const \{ signing_secret: _signingSecret, \.\.\.publicWebhook \} = webhook;/);
}

(async () => {
  await testAuthenticatedEncryption();
  await testExplicitLegacyMigration();
  testLegacyRetryRemovedAndSecretNotReturned();
  console.log('Stage 7.2.1 tests passed: AES-256-GCM, tamper/wrong-key rejection, explicit legacy migration, no legacy retry sender, and API secret boundary.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
