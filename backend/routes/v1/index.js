'use strict';

const express = require('express');
const router = express.Router();

const { requireApiKey } = require('../../middleware/apiKeyMiddleware');
const { requireAuth } = require('../../middleware/auth');
const { requireIdempotency } = require('../../middleware/idempotencyMiddleware');

const agentsCtrl = require('../../controllers/v1/agentsV1Controller');
const callsCtrl = require('../../controllers/v1/callsV1Controller');
const campaignsCtrl = require('../../controllers/v1/campaignsV1Controller');
const webhooksCtrl = require('../../controllers/v1/webhooksV1Controller');
const devCtrl = require('../../controllers/v1/developersV1Controller');
const actionsCtrl = require('../../controllers/v1/actionsV1Controller');
const workflowsCtrl = require('../../controllers/v1/workflowsV1Controller');

// Flex auth middleware (supports either Bearer API key OR JWT session)
const flexAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authHeader = req.headers.authorization;

  if (apiKey || (authHeader && (authHeader.includes('bavio_live_') || authHeader.includes('bavio_test_')))) {
    return requireApiKey(req, res, next);
  } else {
    return requireAuth(req, res, (err) => {
      if (err) return next(err);
      req.business_id = req.user?.id || req.client?.id;
      next();
    });
  }
};

router.use(flexAuth);

// Evidence-backed action reads. Every query is scoped by flexAuth's tenant.
router.get('/actions', actionsCtrl.listActions);
router.get('/actions/leads/:leadId', actionsCtrl.getLeadExecutions);
router.get('/actions/conversations/:conversationId', actionsCtrl.getConversationExecutions);
router.get('/actions/executions/:id', actionsCtrl.getExecution);
router.get('/actions/:actionType', actionsCtrl.getAction);

// Read-only workflow product surface. All reads inherit the flexAuth tenant.
router.get('/workflows', workflowsCtrl.listWorkflows);
router.get('/workflows/:id/executions', workflowsCtrl.listWorkflowExecutions);
router.get('/workflows/:id', workflowsCtrl.getWorkflow);
router.get('/workflow-executions/:id', workflowsCtrl.getWorkflowExecution);

// ── Agents V1 API ─────────────────────────────────────────────────────────────
router.post('/agents', requireIdempotency, agentsCtrl.createAgent);
router.get('/agents', agentsCtrl.listAgents);
router.get('/agents/:id', agentsCtrl.getAgentById);
router.patch('/agents/:id', requireIdempotency, agentsCtrl.updateAgent);
router.delete('/agents/:id', agentsCtrl.deleteAgent);

// ── Calls V1 API ──────────────────────────────────────────────────────────────
router.post('/calls', requireIdempotency, callsCtrl.createCall);
router.get('/calls', callsCtrl.listCalls);
router.get('/calls/:id', callsCtrl.getCallById);
router.get('/calls/:id/transcript', callsCtrl.getCallTranscript);
router.get('/calls/:id/outcome', callsCtrl.getCallOutcome);

// ── Campaigns V1 API ──────────────────────────────────────────────────────────
router.post('/campaigns', requireIdempotency, campaignsCtrl.createCampaign);
router.get('/campaigns', campaignsCtrl.listCampaigns);
router.get('/campaigns/:id', campaignsCtrl.getCampaignById);
router.patch('/campaigns/:id', requireIdempotency, campaignsCtrl.updateCampaign);
router.post('/campaigns/:id/start', campaignsCtrl.startCampaign);
router.post('/campaigns/:id/pause', campaignsCtrl.pauseCampaign);
router.post('/campaigns/:id/resume', campaignsCtrl.resumeCampaign);
router.post('/campaigns/:id/cancel', campaignsCtrl.cancelCampaign);
router.post('/campaigns/:id/contacts', requireIdempotency, campaignsCtrl.addContacts);
router.get('/campaigns/:id/contacts', campaignsCtrl.listContacts);

// ── Leads & Usage V1 API ──────────────────────────────────────────────────────
router.get('/leads', devCtrl.getLeads);
router.get('/usage', devCtrl.getUsage);

// ── Webhooks V1 API ───────────────────────────────────────────────────────────
router.post('/webhooks', requireIdempotency, webhooksCtrl.createWebhook);
router.get('/webhooks', webhooksCtrl.listWebhooks);
router.delete('/webhooks/:id', webhooksCtrl.deleteWebhook);

// ── API Keys V1 API ───────────────────────────────────────────────────────────
router.post('/api-keys', requireIdempotency, devCtrl.createApiKey);
router.get('/api-keys', devCtrl.listApiKeys);
router.delete('/api-keys/:id', devCtrl.revokeApiKey);

module.exports = router;
