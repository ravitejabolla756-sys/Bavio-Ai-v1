'use strict';

const db = require('../database/db');

const requireIdempotency = async (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

  if (!idempotencyKey || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const businessId = req.business_id || req.user?.id;
  if (!businessId) return next();

  try {
    const existing = await db.query(
      `SELECT response_code, response_body
       FROM idempotency_records
       WHERE business_id = $1 AND idempotency_key = $2 AND expires_at > NOW()`,
      [businessId, idempotencyKey]
    );

    if (existing.rows.length > 0) {
      const record = existing.rows[0];
      return res.status(record.response_code).json(record.response_body);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      res.json = originalJson;

      if (res.statusCode >= 200 && res.statusCode < 500) {
        db.query(
          `INSERT INTO idempotency_records (business_id, idempotency_key, request_path, response_code, response_body, expires_at)
           VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours')
           ON CONFLICT (business_id, idempotency_key) DO NOTHING`,
          [businessId, idempotencyKey, req.originalUrl, res.statusCode, JSON.stringify(body)]
        ).catch(err => console.error('[IDEMPOTENCY] Cache store error:', err.message));
      }

      return originalJson(body);
    };

    next();
  } catch (err) {
    console.error('[IDEMPOTENCY] Error:', err.message);
    next();
  }
};

module.exports = { requireIdempotency };
