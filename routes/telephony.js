const express = require('express');
const router = express.Router();
const telephonyController = require('../controllers/telephonyController');

// Webhooks are NOT authenticated by API key (called by Twilio/Exotel)
router.post('/incoming', telephonyController.handleIncoming);
router.post('/status', telephonyController.handleStatus);

module.exports = router;
