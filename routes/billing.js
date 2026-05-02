const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticateJwt } = require('../middleware/auth');

// Protected routes
router.post('/subscribe', authenticateJwt, billingController.subscribe);
router.get('/status/:client_id', authenticateJwt, billingController.getStatus);
router.post('/cancel', authenticateJwt, billingController.cancel);

// Webhook - NO authentication (called by Dodo)
router.post('/webhook', billingController.handleWebhook);

module.exports = router;
