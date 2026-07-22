const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');
const twilioProvider = require('../providers/twilio');
const redisService = require('../services/redis/redisService');
const emailService = require('../services/emailService');
const phoneValidation = require('../utils/phoneValidation');

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

// GET /demo/status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch latest demo session
    const result = await db.query(
      'SELECT * FROM demo_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(200).json({ eligible: true, session: null });
    }
    
    const session = result.rows[0];
    
    // Fetch real-time transcript if session is active
    let transcriptData = [];
    if (session.demo_status === 'active') {
      const callRes = await db.query(
        "SELECT id FROM calls WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [userId]
      );
      if (callRes.rows.length > 0) {
        const transRes = await db.query(
          "SELECT transcript FROM transcripts WHERE call_id = $1",
          [callRes.rows[0].id]
        );
        if (transRes.rows.length > 0) {
          try {
            transcriptData = JSON.parse(transRes.rows[0].transcript || '[]');
          } catch (e) {
            transcriptData = [];
          }
        }
      }
    }

    return res.status(200).json({
      eligible: !session.demo_used,
      session,
      transcript: transcriptData
    });
  } catch (err) {
    console.error('[DEMO STATUS] Error:', err.message);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// POST /demo/start
router.post('/start', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { phoneNumber, countryCode } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'missing_phone', message: 'Phone number is required' });
    }
    
    // Validate phone number
    const validation = phoneValidation.validateAndNormalizePhone(phoneNumber, countryCode || 'US');
    if (!validation.valid) {
      return res.status(400).json({ error: 'invalid_phone', message: validation.error || 'Invalid phone number format' });
    }
    
    const e164Phone = validation.normalized;
    
    // 1. Confirm email verification if required (REQUIRE_EMAIL_VERIFICATION flag check)
    const isEmailVerified = req.tokenData?.email_confirmed_at || req.tokenData?.email_verified || req.tokenData?.user_metadata?.email_verified;
    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !isEmailVerified) {
      return res.status(400).json({
        error: 'email_not_verified',
        message: 'Please verify your email address before starting the demo.'
      });
    }
    
    // 2. Confirm demo_used is false
    const usedCheck = await db.query(
      'SELECT * FROM demo_sessions WHERE user_id = $1 AND demo_used = true LIMIT 1',
      [userId]
    );
    if (usedCheck.rows.length > 0) {
      return res.status(400).json({
        error: 'demo_already_used',
        message: 'You have already completed your free demo session.'
      });
    }
    
    // 3. Confirm there is no active demo session
    const activeCheck = await db.query(
      "SELECT * FROM demo_sessions WHERE user_id = $1 AND demo_status = 'active' LIMIT 1",
      [userId]
    );
    if (activeCheck.rows.length > 0) {
      return res.status(400).json({
        error: 'active_session_exists',
        message: 'An active demo session is already running.'
      });
    }
    
    // 4. Create server-controlled demo session
    const sessionRes = await db.query(
      `INSERT INTO demo_sessions (user_id, demo_started_at, demo_status, demo_used)
       VALUES ($1, NOW(), 'active', false) RETURNING *`,
      [userId]
    );
    const session = sessionRes.rows[0];
    
    // 5. Start outbound call using Twilio
    const host = req.headers.host || 'localhost:5001';
    const isSsl = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const protocol = isSsl ? 'https' : 'http';
    const webhookUrl = `${protocol}://${host}/demo/incoming?userId=${userId}&sessionId=${session.id}`;
    
    console.log(`[DEMO START] Placing demo call to ${e164Phone} with webhook: ${webhookUrl}`);
    
    try {
      const callSid = await twilioProvider.createOutboundCall({
        to: e164Phone,
        from: process.env.TWILIO_PHONE_NUMBER || '+15555550100',
        webhookUrl
      });
      
      // Update session record with the CallSid
      await db.query(
        "UPDATE demo_sessions SET termination_reason = $1 WHERE id = $2",
        [callSid, session.id]
      );
      
      console.log(`[DEMO START] Twilio call created. CallSid: ${callSid}`);
      return res.status(200).json({ success: true, session, callSid });
    } catch (twilioErr) {
      console.error('[DEMO START] Twilio call placement failed:', twilioErr.message);
      await db.query(
        "UPDATE demo_sessions SET demo_status = 'failed', termination_reason = $1, demo_ended_at = NOW() WHERE id = $2",
        ['Twilio call failed: ' + twilioErr.message, session.id]
      );
      return res.status(500).json({
        error: 'twilio_error',
        message: 'Failed to place call. Please make sure your phone number is correct and registered with Twilio if using a trial account.'
      });
    }
  } catch (err) {
    console.error('[DEMO START] Exception:', err.message);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// POST /demo/hangup
router.post('/hangup', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find active demo session
    const active = await db.query(
      "SELECT * FROM demo_sessions WHERE user_id = $1 AND demo_status = 'active' ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    
    if (active.rows.length > 0) {
      const session = active.rows[0];
      const callSid = session.termination_reason; // we stored callSid in termination_reason on start
      
      if (callSid && callSid.startsWith('CA')) {
        try {
          await twilioProvider.client.calls(callSid).update({ status: 'completed' });
        } catch (termErr) {
          console.error('[DEMO HANGUP] Failed to terminate call at Twilio:', termErr.message);
        }
      }
      
      // Update session status in DB
      await db.query(
        `UPDATE demo_sessions 
         SET demo_status = 'completed', demo_used = true, demo_ended_at = NOW(),
             termination_reason = 'user_hangup'
         WHERE id = $1`,
        [session.id]
      );
    }
    
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[DEMO HANGUP] Exception:', err.message);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// POST /demo/incoming (public Twilio webhook)
router.post('/incoming', async (req, res) => {
  try {
    const { CallSid, From, To } = req.body;
    const { userId, sessionId } = req.query;
    
    console.log(`[TWILIO DEMO Webhook] Connected demo call: ${From} → ${To} | CallSid: ${CallSid}`);
    
    // 1. Create call record for demo in calls table
    await db.query(
      `INSERT INTO calls (
        user_id, country_code, call_sid, provider, from_number, virtual_number, started_at, cost_currency, created_at
       ) VALUES ($1, 'US', $2, 'twilio', $3, $4, NOW(), 'USD', NOW())`,
      [userId, CallSid, From, To || '+15555550100']
    );
    
    // 2. Create/update active call session in call_sessions table for WebSocket authorization
    await db.query(
      `INSERT INTO call_sessions (call_sid, business_id, caller_phone, exotel_number, session_status, started_at)
       VALUES ($1, '00000000-0000-0000-0000-000000000000', $2, $3, 'active', NOW())
       ON CONFLICT (call_sid) DO UPDATE SET session_status = 'active', started_at = NOW()`,
      [CallSid, From, To || '+15555550100']
    );
    
    // 3. Connect to Media Stream WebSocket
    const host = req.headers.host || 'localhost:5001';
    const isSsl = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const wsProtocol = isSsl ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${host}/api/call-stream/ws?callSid=${CallSid}`;
    
    console.log(`[TWILIO DEMO Webhook] Routing to WebSocket: ${wsUrl}`);
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}" />
  </Connect>
</Response>`;
    
    res.type('text/xml');
    return res.send(twiml);
  } catch (err) {
    console.error('[TWILIO DEMO Webhook] Exception:', err.message);
    res.type('text/xml');
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, an error occurred starting your demo. Goodbye.</Say>
  <Hangup/>
</Response>`);
  }
});

module.exports = router;
