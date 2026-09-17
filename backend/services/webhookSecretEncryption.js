'use strict';

const crypto = require('node:crypto');

const CURRENT_VERSION = 'v1';

function decodeKey(rawKey) {
  if (typeof rawKey !== 'string' || !rawKey) throw Object.assign(new Error('Webhook secret encryption key is not configured.'), { code: 'WEBHOOK_SECRET_KEY_UNAVAILABLE' });
  const key = /^[0-9a-f]{64}$/i.test(rawKey) ? Buffer.from(rawKey, 'hex') : Buffer.from(rawKey, 'base64');
  if (key.length !== 32) throw Object.assign(new Error('Webhook secret encryption key is invalid.'), { code: 'WEBHOOK_SECRET_KEY_INVALID' });
  return key;
}

function keyForVersion(version = CURRENT_VERSION, suppliedKey) {
  if (version !== CURRENT_VERSION) throw Object.assign(new Error('Webhook secret encryption version is unsupported.'), { code: 'WEBHOOK_SECRET_VERSION_UNSUPPORTED' });
  return decodeKey(suppliedKey || process.env.WEBHOOK_SECRET_ENCRYPTION_KEY);
}

function encryptWebhookSecret(plaintext, { version = CURRENT_VERSION, key } = {}) {
  if (typeof plaintext !== 'string' || !plaintext) throw Object.assign(new Error('Webhook signing secret is required.'), { code: 'WEBHOOK_SECRET_INVALID' });
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyForVersion(version, key), nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { version, value: `${nonce.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}` };
}

function decryptWebhookSecret(value, { version = CURRENT_VERSION, key } = {}) {
  if (typeof value !== 'string' || !value) throw Object.assign(new Error('Webhook signing secret is unavailable.'), { code: 'WEBHOOK_SECRET_UNAVAILABLE' });
  const [nonceEncoded, tagEncoded, ciphertextEncoded] = value.split('.');
  if (!nonceEncoded || !tagEncoded || !ciphertextEncoded) throw Object.assign(new Error('Webhook signing secret format is invalid.'), { code: 'WEBHOOK_SECRET_FORMAT_INVALID' });
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyForVersion(version, key), Buffer.from(nonceEncoded, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(ciphertextEncoded, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    throw Object.assign(new Error('Webhook signing secret could not be decrypted.'), { code: 'WEBHOOK_SECRET_DECRYPT_FAILED' });
  }
}

module.exports = { CURRENT_VERSION, encryptWebhookSecret, decryptWebhookSecret, decodeKey };
