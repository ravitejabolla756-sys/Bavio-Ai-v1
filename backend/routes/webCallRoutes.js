'use strict';

const express = require('express');
const router = express.Router();
const webCallController = require('../controllers/webCallController');
const { requireAuth } = require('../middleware/auth');

// Session management
router.post('/session', requireAuth, webCallController.initiateWebCallSession);
router.post('/:callSid/telemetry', webCallController.recordClientTelemetry);
router.post('/:callSid/end', webCallController.endWebCallSession);

// Historical sessions & telemetry analytics (Phases 19 & 20)
router.get('/sessions', requireAuth, webCallController.listWebCallSessions);
router.get('/:callSid', requireAuth, webCallController.getWebCallSessionDetails);

module.exports = router;
