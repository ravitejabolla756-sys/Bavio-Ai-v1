const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { requireAuth } = require('../middleware/auth');

// Protected routes
router.post('/subscribe', requireAuth, billingController.subscribe);
router.get('/status/:client_id', requireAuth, billingController.getStatus);
router.post('/cancel', requireAuth, billingController.cancel);
router.post('/change-plan', requireAuth, billingController.changePlan);
router.get('/payments/:client_id', requireAuth, billingController.getPaymentHistory);
router.get('/invoice/:payment_id', requireAuth, billingController.getInvoice);
router.post('/razorpay/create-order', requireAuth, billingController.createRazorpayOrder);
router.post('/razorpay/verify', requireAuth, billingController.verifyRazorpayPayment);

// Webhook - NO authentication (called by Dodo)
router.post('/webhook', billingController.handleWebhook);

module.exports = router;
