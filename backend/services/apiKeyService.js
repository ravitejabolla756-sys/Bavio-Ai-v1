'use strict';

const crypto = require('crypto');
const db = require('../database/db');

function hashSecret(secret) {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

async function createApiKey({ businessId, name, environment = 'live', permissions = ['*'] }) {
  if (!businessId) throw new Error('businessId is required');
  if (!name) throw new Error('Key name is required');

  const envPrefix = environment === 'test' ? 'bavio_test_' : 'bavio_live_';
  const randomPart = crypto.randomBytes(24).toString('hex');
  const fullSecret = `${envPrefix}${randomPart}`;
  const keyPrefix = fullSecret.slice(0, 16);
  const hashedSecret = hashSecret(fullSecret);

  const result = await db.query(
    `INSERT INTO api_keys (business_id, name, key_prefix, hashed_secret, key_hash, environment, permissions)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, business_id, name, key_prefix, environment, permissions, created_at`,
    [businessId, name, keyPrefix, hashedSecret, hashedSecret, environment, JSON.stringify(permissions)]
  );

  const keyRecord = result.rows[0];
  return {
    ...keyRecord,
    secret: fullSecret, // Secret returned ONCE only at creation
  };
}

async function verifyApiKey(secretKey) {
  if (!secretKey || typeof secretKey !== 'string') return null;

  const hashedSecret = hashSecret(secretKey);

  const result = await db.query(
    `SELECT k.*, b.id as b_id, b.name as business_name, b.email as business_email
     FROM api_keys k
     JOIN businesses b ON k.business_id = b.id
     WHERE (k.hashed_secret = $1 OR k.key_hash = $1) AND k.revoked_at IS NULL`,
    [hashedSecret]
  );

  if (result.rows.length === 0) return null;

  const keyRecord = result.rows[0];

  // Async update last_used_at timestamp
  db.query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [keyRecord.id]).catch(err => {
    console.error('[API KEY] Failed to update last_used_at:', err.message);
  });

  return {
    keyId: keyRecord.id,
    businessId: keyRecord.business_id,
    environment: keyRecord.environment,
    permissions: keyRecord.permissions || ['*'],
    client: {
      id: keyRecord.b_id,
      name: keyRecord.business_name,
      email: keyRecord.business_email,
    },
  };
}

async function revokeApiKey(keyId, businessId) {
  const result = await db.query(
    `UPDATE api_keys
     SET revoked_at = NOW()
     WHERE id = $1 AND business_id = $2 AND revoked_at IS NULL
     RETURNING id, revoked_at`,
    [keyId, businessId]
  );

  if (result.rows.length === 0) {
    throw new Error('API key not found or already revoked');
  }

  return result.rows[0];
}

async function listApiKeys(businessId) {
  const result = await db.query(
    `SELECT id, name, key_prefix, environment, permissions, last_used_at, revoked_at, created_at
     FROM api_keys
     WHERE business_id = $1
     ORDER BY created_at DESC`,
    [businessId]
  );
  return result.rows;
}

module.exports = {
  createApiKey,
  verifyApiKey,
  revokeApiKey,
  listApiKeys,
  hashSecret,
};
