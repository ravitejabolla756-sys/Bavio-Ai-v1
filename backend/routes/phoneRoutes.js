const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  setupPhoneNumber,
  getPhoneInfo,
  confirmForwarding,
  getTestInstructions
} = require('../controllers/phoneSetupController');

router.post('/setup', requireAuth, setupPhoneNumber);
router.get('/info', requireAuth, getPhoneInfo);
router.post('/confirm-forwarding', requireAuth, confirmForwarding);
router.get('/test-instructions', requireAuth, getTestInstructions);

module.exports = router;
