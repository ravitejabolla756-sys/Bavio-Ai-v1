'use strict';

const webhookService = require('../../services/webhookService');

async function createWebhook(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { url, events } = req.body;

  if (!url) {
    return res.status(400).json({
      error: { code: 'invalid_request', message: 'Webhook url is required' },
      request_id: requestId,
    });
  }

  try {
    const webhook = await webhookService.registerWebhook(businessId, url, events);
    res.status(201).json({
      data: webhook,
      request_id: requestId,
    });
  } catch (err) {
    res.status(400).json({
      error: { code: 'invalid_request', message: err.message },
      request_id: requestId,
    });
  }
}

async function listWebhooks(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;

  try {
    const webhooks = await webhookService.listWebhooks(businessId);
    res.status(200).json({
      data: webhooks,
      request_id: requestId,
    });
  } catch (err) {
    res.status(500).json({
      error: { code: 'internal_error', message: err.message },
      request_id: requestId,
    });
  }
}

async function deleteWebhook(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { id } = req.params;

  try {
    await webhookService.deleteWebhook(id, businessId);
    res.status(200).json({
      data: { id, deleted: true },
      request_id: requestId,
    });
  } catch (err) {
    res.status(404).json({
      error: { code: 'not_found', message: err.message },
      request_id: requestId,
    });
  }
}

module.exports = {
  createWebhook,
  listWebhooks,
  deleteWebhook,
};
