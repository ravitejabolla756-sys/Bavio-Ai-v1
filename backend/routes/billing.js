const express = require('express');
const router  = express.Router();
const billingController = require('../controllers/billingController');
const { requireAuth } = require('../middleware/auth');

// ── Subscription management ──────────────────────────────────────────
router.post('/subscribe',            requireAuth, billingController.subscribe);
router.get( '/status/:client_id',    requireAuth, billingController.getStatus);
router.post('/cancel',               requireAuth, billingController.cancel);
router.post('/change-plan',          requireAuth, billingController.changePlan);
router.get( '/payments/:client_id',  requireAuth, billingController.getPaymentHistory);
router.get( '/invoice/:payment_id',  requireAuth, billingController.getInvoice);

// ── Pricing / plans ──────────────────────────────────────────────────
router.get('/pricing', requireAuth, billingController.getPricing);
router.get('/plans',                 billingController.getPricing);    // public, no auth

// ── Balance ──────────────────────────────────────────────────────────
router.get('/balance',               requireAuth, billingController.getBalance);

// ── Checkout ─────────────────────────────────────────────────────────
router.post('/create-checkout',      requireAuth, billingController.createCheckout);

// ── Top-ups ──────────────────────────────────────────────────────────
router.post('/create-topup-checkout', requireAuth, billingController.createTopupCheckout);
router.get( '/topup-transactions',    requireAuth, billingController.getTopupTransactions);

// ── Trial status ─────────────────────────────────────────────────────
router.get('/trial-status',          requireAuth, billingController.getTrialStatus);

// ── Webhooks (NO auth — called by Dodo Payments) ─────────────────────
router.post('/webhook',      express.raw({ type: 'application/json' }), billingController.handleWebhook);
router.post('/dodo-webhook', express.raw({ type: 'application/json' }), billingController.handleWebhook);

// ── Retired endpoints ─────────────────────────────────────────────────
router.post('/razorpay/create-order', requireAuth, billingController.createRazorpayOrder);
router.post('/razorpay/verify',       requireAuth, billingController.verifyRazorpayPayment);

module.exports = router;
