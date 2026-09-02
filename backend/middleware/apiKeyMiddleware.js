'use strict';

const apiKeyService = require('../services/apiKeyService');

const requireApiKey = async (req, res, next) => {
  try {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    req.requestId = requestId;

    let apiKey = req.headers['x-api-key'];
    const authHeader = req.headers.authorization;

    if (!apiKey && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token.startsWith('bavio_live_') || token.startsWith('bavio_test_')) {
        apiKey = token;
      }
    }

    if (!apiKey) {
      return res.status(401).json({
        error: {
          code: 'unauthorized',
          message: 'Missing or invalid authentication credentials. Provide a valid Bearer key or x-api-key header.',
        },
        request_id: requestId,
      });
    }

    const verified = await apiKeyService.verifyApiKey(apiKey);

    if (!verified) {
      return res.status(401).json({
        error: {
          code: 'invalid_api_key',
          message: 'The API key provided is invalid, expired, or revoked.',
        },
        request_id: requestId,
      });
    }

    req.business_id = verified.businessId;
    req.api_key_id = verified.keyId;
    req.environment = verified.environment;
    req.client = verified.client;
    req.user = {
      id: verified.businessId,
      email: verified.client.email,
    };
    req.permissions = verified.permissions;

    next();
  } catch (err) {
    console.error('[API KEY MIDDLEWARE] Error:', err);
    res.status(500).json({
      error: {
        code: 'internal_error',
        message: 'An unexpected error occurred during API key authentication.',
      },
      request_id: req.requestId || 'req_unknown',
    });
  }
};

module.exports = { requireApiKey };
