'use strict';

const apiKeyService = require('../../services/apiKeyService');
const db = require('../../database/db');

async function createApiKey(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { name, environment = 'live' } = req.body;

  if (!name) {
    return res.status(400).json({
      error: { code: 'invalid_request', message: 'API key name is required' },
      request_id: requestId,
    });
  }

  try {
    const key = await apiKeyService.createApiKey({
      businessId,
      name,
      environment,
    });

    res.status(201).json({
      data: key,
      request_id: requestId,
    });
  } catch (err) {
    res.status(400).json({
      error: { code: 'invalid_request', message: err.message },
      request_id: requestId,
    });
  }
}

async function listApiKeys(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;

  try {
    const keys = await apiKeyService.listApiKeys(businessId);
    res.status(200).json({
      data: keys,
      request_id: requestId,
    });
  } catch (err) {
    res.status(500).json({
      error: { code: 'internal_error', message: err.message },
      request_id: requestId,
    });
  }
}

async function revokeApiKey(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { id } = req.params;

  try {
    const revoked = await apiKeyService.revokeApiKey(id, businessId);
    res.status(200).json({
      data: revoked,
      request_id: requestId,
    });
  } catch (err) {
    res.status(404).json({
      error: { code: 'not_found', message: err.message },
      request_id: requestId,
    });
  }
}

async function getLeads(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);

  try {
    const result = await db.query(
      `SELECT * FROM leads WHERE business_id = $1 OR user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [businessId, limit]
    );

    res.status(200).json({
      data: result.rows,
      request_id: requestId,
    });
  } catch (err) {
    res.status(500).json({
      error: { code: 'internal_error', message: err.message },
      request_id: requestId,
    });
  }
}

async function getUsage(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;

  try {
    const bizRes = await db.query(
      `SELECT id, name, plan, minutes_used, monthly_minute_limit FROM businesses WHERE id = $1`,
      [businessId]
    );

    const callsCountRes = await db.query(
      `SELECT COUNT(*) as total_calls, COALESCE(SUM(duration_seconds), 0) as total_seconds FROM calls WHERE business_id = $1 OR user_id = $1`,
      [businessId]
    );

    const biz = bizRes.rows[0] || {};
    const calls = callsCountRes.rows[0] || {};

    res.status(200).json({
      data: {
        business_id: businessId,
        plan: biz.plan || 'pro',
        minutes_used: biz.minutes_used || 0,
        monthly_minute_limit: biz.monthly_minute_limit || 1000,
        total_calls: parseInt(calls.total_calls || 0, 10),
        total_seconds: parseInt(calls.total_seconds || 0, 10),
      },
      request_id: requestId,
    });
  } catch (err) {
    res.status(500).json({
      error: { code: 'internal_error', message: err.message },
      request_id: requestId,
    });
  }
}

module.exports = {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  getLeads,
  getUsage,
};
