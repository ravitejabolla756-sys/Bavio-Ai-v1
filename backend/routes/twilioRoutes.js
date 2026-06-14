const express = require('express');
const router = express.Router();
const {
  handleIncomingCall,
  handleRecording,
  handleCallStatus,
  handleTelephonySync,
  handleSaveLeadTool
} = require('../controllers/twilioCallController');

// All Twilio webhooks — NO JWT auth
// Twilio calls these directly

// Step 1: Incoming call
router.post('/incoming', handleIncomingCall);

// Step 2: Recording ready (audio from caller)
router.post('/recording', handleRecording);

// Step 3: Call ended
router.post('/status', handleCallStatus);

// Step 4: Telephony sync callback (logs & metrics)
router.post('/telephony-sync', handleTelephonySync);

// Step 5: Bavio Voice Tool Callback (save lead during call)
router.post('/save-lead', handleSaveLeadTool);

module.exports = router;
