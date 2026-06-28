const express = require('express');
const router = express.Router();
const redisService = require('../services/redis/redisService');
const emailService = require('../services/emailService');

// Helper to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// POST /demo/subscribe-email
router.post('/subscribe-email', async (req, res) => {
  try {
    const { email, sessionId } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        error: 'invalid_email',
        message: 'Please enter a valid email address'
      });
    }

    const safeSessionId = sessionId || `demo_sess_${Math.random().toString(36).substring(2, 11)}`;
    const redisKey = `demo:email:${safeSessionId}`;

    // Store in Redis with a 30-day TTL (30 days * 24 hrs * 3600 secs)
    const thirtyDaysInSeconds = 30 * 24 * 3600;
    await redisService.setSession(redisKey, { email, sessionId: safeSessionId, subscribedAt: new Date().toISOString() }, thirtyDaysInSeconds);

    console.log(`[DEMO SUBSCRIBE] Saved email ${email} to Redis with key ${redisKey} (30-day TTL)`);

    // Schedule email to be sent in 24 hours (simulated low-priority via setTimeout + console log)
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    console.log(`[EmailService] Scheduled email to be sent in 24 hours to: ${email} (Session: ${safeSessionId})`);
    
    setTimeout(() => {
      emailService.sendMail(
        email,
        "Ready to try Bavio? Here's your demo call recording...",
        "Hi! Thanks for checking out the Bavio AI demo call. Ready to qualify leads 24/7? Get started here: https://bavio.in/signup"
      ).catch(err => {
        console.error(`[EmailService] Failed to send scheduled demo email to ${email}:`, err.message);
      });
    }, twentyFourHoursMs);

    return res.status(200).json({
      success: true,
      message: "Email saved. We'll send you updates soon.",
      nextAction: "close_modal"
    });
  } catch (err) {
    console.error('[DEMO SUBSCRIBE] Exception:', err.message);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

module.exports = router;
