const express = require('express');
const router = express.Router();
const {
  handleIncomingExotel,
  handleRecording,
  handleCallStatus
} = require('../controllers/callController');

// No auth — Exotel calls these directly as webhooks
router.post('/incoming', handleIncomingExotel);
router.post('/recording', handleRecording);
router.post('/status', handleCallStatus);

module.exports = router;
