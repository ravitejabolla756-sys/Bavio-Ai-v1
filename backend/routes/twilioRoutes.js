const express = require('express');
const router = express.Router();
const {
  handleIncomingCall,
  handleRecording,
  handleCallStatus,
  handleTelephonySync,
  handleSaveLeadTool
} = require('../controllers/twilioCallController');

const { validateTwilioSignature } = require('../middleware/twilioAuth');

// All Twilio webhooks — NO JWT auth
// Twilio calls these directly

// Step 1: Incoming call
router.post('/incoming', validateTwilioSignature, handleIncomingCall);

// Step 2: Recording ready (audio from caller)
router.post('/recording', validateTwilioSignature, handleRecording);

// Step 3: Call ended
router.post('/status', validateTwilioSignature, handleCallStatus);

// Step 4: Telephony sync callback (logs & metrics)
router.post('/telephony-sync', validateTwilioSignature, handleTelephonySync);

// Step 5: Bavio Voice Tool Callback (save lead during call)
router.post('/save-lead', validateTwilioSignature, handleSaveLeadTool);

module.exports = router;
