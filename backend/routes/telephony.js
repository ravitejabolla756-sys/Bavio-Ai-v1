const express = require('express');
const router = express.Router();
const telephonyController = require('../controllers/telephonyController');

// Webhooks are NOT authenticated by API key (called by Twilio/Exotel)
// Legacy routes removed in favor of dedicated /calls/twilio and /calls/exotel endpoints
// router.post('/incoming', telephonyController.handleIncoming);
// router.post('/status', telephonyController.handleStatus);

module.exports = router;
