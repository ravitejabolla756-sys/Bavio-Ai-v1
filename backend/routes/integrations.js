const express = require('express');
const router = express.Router();
const integrationsController = require('../controllers/integrationsController');
const { requireAuth } = require('../middleware/auth');

// GET / - Public or optional auth integration fetch
router.get('/', integrationsController.getIntegrations);

// POST /:id/connect - Connect an integration
router.post('/:id/connect', requireAuth, integrationsController.connectIntegration);

// POST /:id/disconnect - Disconnect an integration
router.post('/:id/disconnect', requireAuth, integrationsController.disconnectIntegration);

// POST /:id/test - Test an integration
router.post('/:id/test', requireAuth, integrationsController.testIntegration);

// POST /:id/sync - Sync an integration
router.post('/:id/sync', requireAuth, integrationsController.syncIntegration);

module.exports = router;
