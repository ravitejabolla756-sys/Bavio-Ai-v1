const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');
const twilioProvider = require('../providers/twilio');
const redisService = require('../services/redis/redisService');
const emailService = require('../services/emailService');
const phoneValidation = require('../utils/phoneValidation');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const industryProfiles = require('../voice/profiles/industryProfiles');

const JWT_SECRET = process.env.JWT_SECRET || '7e0341f2ee874653ce795be1851359683e92e769db290b69965697ae80da0a5e5745972bd30e6b51088fbc878ea141f97acec678ca57855eb024064f44f4d220';
const { selectVoiceStack, PROVIDER_MODULAR } = require('../voice/routing/voiceStackRouter');
const { selectWorkerRegionUrl } = require('../voice/routing/regionalWorkerRouter');

// Helper to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// POST /demo/subscribe-email (Kept for backwards compatibility)
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

    const thirtyDaysInSeconds = 30 * 24 * 3600;
    await redisService.setSession(redisKey, { email, sessionId: safeSessionId, subscribedAt: new Date().toISOString() }, thirtyDaysInSeconds);

    console.log(`[DEMO SUBSCRIBE] Saved email ${email} to Redis with key ${redisKey}`);

    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
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
      message: "Email saved. We'll send you updates soon."
    });
  } catch (err) {
    console.error('[DEMO SUBSCRIBE] Exception:', err.message);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// NEW PAID 3-MINUTE VOICE DEMO ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// POST /demo/create-session
router.post('/create-session', requireAuth, async (req, res) => {
  try {
    const { industry, language } = req.body;
    const userId = req.user.id;
    if (!industry || !language) {
      return res.status(400).json({ error: 'missing_fields', message: 'Industry and language are required.' });
    }

    // Resolve Twilio number mapping
    const industryKey = (industry || 'REAL_ESTATE').toUpperCase().replace('-', '_');
    const twilioNumber = process.env[`TWILIO_NUMBER_${industryKey}`] || process.env.TWILIO_PHONE_NUMBER || '+15555550100';

    // 1. Create a pending session in database
    const sessionRes = await db.query(
      `INSERT INTO public_demo_sessions (industry, language, product_id, twilio_number, agent_profile, status, user_id)
       VALUES ($1, $2, $3, $4, $5, 'pending_payment', $6) RETURNING *`,
      [industry, language, 'pdt_0Nl1J57f2MHnLBxSbFHNO', twilioNumber, `${industry.toLowerCase()}_demo`, userId]
    );
    const session = sessionRes.rows[0];

    // 2. Generate Dodo checkout link
    const DODO_API_KEY = process.env.DODO_API_KEY;
    const DEMO_PRODUCT_ID = process.env.DODO_DEMO_PRODUCT_ID || 'pdt_0Nl1J57f2MHnLBxSbFHNO';
    const isLive = process.env.DODO_ENV === 'live' || (process.env.NODE_ENV === 'production' && process.env.DODO_ENV !== 'test');
    const DODO_BASE_URL = isLive ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
    const frontendUrl = process.env.FRONTEND_URL || 'https://bavio.in';
    const redirectUrl = `${frontendUrl}/workspace/demo?session_id=${session.id}`;

    let checkoutUrl = '';
    try {
      const response = await axios.post(
        `${DODO_BASE_URL}/checkouts`,
        {
          product_cart: [
            {
              product_id: DEMO_PRODUCT_ID,
              quantity: 1
            }
          ],
          customer: {
            email: req.user.email || 'public-demo@bavio.in'
          },
          billing_address: {
            country: 'US'
          },
          metadata: {
            demo_session_id: session.id.toString(),
            is_public_demo: 'true',
            industry,
            language
          },
          return_url: redirectUrl
        },
        {
          headers: {
            Authorization: `Bearer ${DODO_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      checkoutUrl = response.data.checkout_url;
      const paymentId = response.data.id || response.data.payment_id;
      
      await db.query(
        "UPDATE public_demo_sessions SET payment_id = $1 WHERE id = $2 AND user_id = $3",
        [paymentId, session.id, userId]
      );
    } catch (dodoErr) {
      console.warn('[DEMO CHECKOUT] Dodo payment creation failed, using mock fallback:', dodoErr.response?.data || dodoErr.message);
      if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_PAYMENTS === 'true') {
        const mockPaymentId = 'pay_mock_' + Math.random().toString(36).substring(2, 15);
        checkoutUrl = `${frontendUrl}/workspace/demo?session_id=${session.id}&mock_paid=true`;
        await db.query(
          "UPDATE public_demo_sessions SET payment_id = $1 WHERE id = $2 AND user_id = $3",
          [mockPaymentId, session.id, userId]
        );
      } else {
        return res.status(502).json({
          error: 'payment_gateway_error',
          message: 'Failed to contact payment gateway (Dodo Payments). Please check internet connectivity or check if Dodo is down.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      checkoutUrl
    });
  } catch (err) {
    console.error('[DEMO CREATE SESSION] Error:', err.message);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// GET /demo/verify-payment
router.get('/verify-payment', requireAuth, async (req, res) => {
  try {
    const { session_id, mock_paid } = req.query;
    const userId = req.user.id;
    if (!session_id) {
      return res.status(400).json({ error: 'missing_session', message: 'Session ID is required.' });
    }

    const result = await db.query('SELECT * FROM public_demo_sessions WHERE id = $1 AND user_id = $2', [session_id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'session_not_found', message: 'Demo session not found.' });
    }

    let session = result.rows[0];

    // If session is already paid or active, return it immediately
    if (session.status !== 'pending_payment') {
      return res.status(200).json({ success: true, session });
    }

    // Check if mock_paid parameter is passed in dev mode
    if (mock_paid === 'true' && (process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_PAYMENTS === 'true')) {
      const updated = await db.query(
        "UPDATE public_demo_sessions SET status = 'paid' WHERE id = $1 AND user_id = $2 RETURNING *",
        [session_id, userId]
      );
      return res.status(200).json({ success: true, session: updated.rows[0] });
    }

    // Secure server-side check with Dodo API
    if (session.payment_id) {
      const DODO_API_KEY = process.env.DODO_API_KEY;
      const isLive = process.env.DODO_ENV === 'live' || (process.env.NODE_ENV === 'production' && process.env.DODO_ENV !== 'test');
      const DODO_BASE_URL = isLive ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
      try {
        const response = await axios.get(
          `${DODO_BASE_URL}/checkouts/${session.payment_id}`,
          {
            headers: { Authorization: `Bearer ${DODO_API_KEY}` }
          }
        );
        const paymentStatus = response.data.payment_status;
        if (paymentStatus === 'succeeded' || paymentStatus === 'SUCCESS') {
          const updated = await db.query(
            "UPDATE public_demo_sessions SET status = 'paid' WHERE id = $1 AND user_id = $2 RETURNING *",
            [session_id, userId]
          );
          session = updated.rows[0];
        }
      } catch (dodoErr) {
        console.error('[DEMO VERIFY] Error fetching payment from Dodo:', dodoErr.message);
      }
    }

    return res.status(200).json({ success: true, session });
  } catch (err) {
    console.error('[DEMO VERIFY ERROR] Exception:', err.message);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// GET /demo/session-status/:id
router.get('/session-status/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await db.query('SELECT * FROM public_demo_sessions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'session_not_found', message: 'Demo session not found.' });
    }

    const session = result.rows[0];

    // Fetch live transcript if active
    let transcriptData = [];
    if (session.status === 'active' && session.call_sid) {
      const callRes = await db.query(
        "SELECT id FROM calls WHERE call_sid = $1 LIMIT 1",
        [session.call_sid]
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
      success: true,
      session,
      transcript: transcriptData
    });
  } catch (err) {
    console.error('[DEMO SESSION STATUS ERROR] Exception:', err.message);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// POST /demo/configure-session/:id
router.post('/configure-session/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { industry, language } = req.body;
    const userId = req.user.id;
    if (!industry || !language) {
      return res.status(400).json({ error: 'missing_fields', message: 'Industry and language are required.' });
    }

    // Verify ownership first
    const checkRes = await db.query('SELECT * FROM public_demo_sessions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'session_not_found', message: 'Demo session not found.' });
    }

    // Resolve Twilio number mapping dynamically
    const industryKey = (industry || 'REAL_ESTATE').toUpperCase().replace('-', '_');
    const twilioNumber = process.env[`TWILIO_NUMBER_${industryKey}`] || process.env.TWILIO_PHONE_NUMBER || '+15555550100';

    const updated = await db.query(
      `UPDATE public_demo_sessions 
       SET industry = $1, language = $2, twilio_number = $3, agent_profile = $4
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [industry, language, twilioNumber, `${industry.toLowerCase()}_demo`, id, userId]
    );

    return res.status(200).json({ success: true, session: updated.rows[0] });
  } catch (err) {
    console.error('[DEMO CONFIGURE ERROR] Exception:', err.message);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// POST /demo/start-session-call/:id
router.post('/start-session-call/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { phoneNumber, countryCode } = req.body;
    const userId = req.user.id;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'missing_phone', message: 'Phone number is required.' });
    }

    const result = await db.query('SELECT * FROM public_demo_sessions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'session_not_found', message: 'Demo session not found.' });
    }

    const session = result.rows[0];
    if (session.status !== 'paid') {
      return res.status(400).json({ error: 'invalid_status', message: 'Session is not paid or already consumed.' });
    }

    // Validate phone number format
    const resolvedCountry = (countryCode || 'US').toUpperCase().trim();
    const validation = phoneValidation.validateAndNormalizePhone(phoneNumber, resolvedCountry);
    if (!validation.valid) {
      return res.status(400).json({ error: 'invalid_phone', message: validation.error || 'Invalid phone number format' });
    }
    const e164Phone = validation.normalized;

    // Resolve Twilio number mapping
    const industryKey = (session.industry || 'REAL_ESTATE').toUpperCase().replace('-', '_');
    const fromNumber = process.env[`TWILIO_NUMBER_${industryKey}`] || process.env.TWILIO_PHONE_NUMBER || '+15555550100';

    // Build the webhook callback URL for Twilio
    const host = req.headers.host || 'localhost:5001';
    const isSsl = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const protocol = isSsl ? 'https' : 'http';
    const webhookUrl = `${protocol}://${host}/demo/incoming?isPublicDemo=true&sessionId=${session.id}`;

    console.log(`[PUBLIC DEMO START] Calling ${e164Phone} from ${fromNumber} for session ${session.id}`);

    try {
      const callSid = await twilioProvider.createOutboundCall({
        to: e164Phone,
        from: fromNumber,
        webhookUrl
      });

      // Update session to active
      await db.query(
        `UPDATE public_demo_sessions
         SET status = 'active', call_sid = $1, phone_number = $2, twilio_number = $3, started_at = NOW()
         WHERE id = $4 AND user_id = $5`,
        [callSid, e164Phone, fromNumber, session.id, userId]
      );

      return res.status(200).json({ success: true, callSid });
    } catch (twilioErr) {
      console.error('[PUBLIC DEMO START] Twilio call failed:', twilioErr.message);
      return res.status(500).json({
        error: 'twilio_error',
        message: 'Failed to place the demonstration call. Please verify your phone number and try again.'
      });
    }
  } catch (err) {
    console.error('[DEMO START CALL ERROR] Exception:', err.message);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// POST /demo/hangup-session-call/:id
router.post('/hangup-session-call/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await db.query('SELECT * FROM public_demo_sessions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'session_not_found', message: 'Demo session not found.' });
    }

    const session = result.rows[0];
    if (session.status === 'active' && session.call_sid) {
      try {
        await twilioProvider.client.calls(session.call_sid).update({ status: 'completed' });
      } catch (termErr) {
        console.error('[DEMO HANGUP] Failed to terminate call at Twilio:', termErr.message);
      }
      
      await db.query(
        "UPDATE public_demo_sessions SET status = 'completed', expires_at = NOW() WHERE id = $1 AND user_id = $2",
        [session.id, userId]
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[DEMO HANGUP CALL ERROR] Exception:', err.message);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});

// POST /demo/incoming (Public Twilio webhook callback)
router.post('/incoming', async (req, res) => {
  try {
    const { CallSid, From, To } = req.body;
    const { isPublicDemo, sessionId } = req.query;
    
    console.log(`[TWILIO DEMO Webhook] Connected demo call: ${From} → ${To} | CallSid: ${CallSid} | Public: ${isPublicDemo}`);
    
    const placeholderUser = '00000000-0000-0000-0000-000000000000';

    if (isPublicDemo === 'true' && sessionId) {
      // Fetch public demo session
      const sessionRes = await db.query('SELECT * FROM public_demo_sessions WHERE id = $1', [sessionId]);
      if (sessionRes.rows.length === 0) {
        console.error(`[TWILIO DEMO Webhook] Public demo session ${sessionId} not found.`);
        res.type('text/xml');
        return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Demo session not found. Goodbye.</Say><Hangup/></Response>`);
      }
      
      // Create call logs & session records
      await db.query(
        `INSERT INTO calls (
          user_id, country_code, call_sid, provider, from_number, virtual_number, started_at, cost_currency, created_at
         ) VALUES ($1, 'US', $2, 'twilio', $3, $4, NOW(), 'USD', NOW())`,
        [placeholderUser, CallSid, From, To || '+15555550100']
      );
      
      await db.query(
        `INSERT INTO call_sessions (call_sid, business_id, caller_phone, exotel_number, session_status, started_at)
         VALUES ($1, $2, $3, $4, 'active', NOW())
         ON CONFLICT (call_sid) DO UPDATE SET session_status = 'active', started_at = NOW()`,
        [CallSid, placeholderUser, From, To || '+15555550100']
      );

      const host = req.headers.host || 'localhost:5001';
      const isSsl = req.secure || req.headers['x-forwarded-proto'] === 'https';
      const wsProtocol = isSsl ? 'wss' : 'ws';
      const wsUrl = `${wsProtocol}://${host}/api/call-stream/ws?callSid=${CallSid}&isPublicDemo=true&sessionId=${sessionId}`;

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}" />
  </Connect>
</Response>`;

      res.type('text/xml');
      return res.send(twiml);
    }

    // Default flow for registered user (backwards compatibility)
    const userId = req.query.userId || placeholderUser;
    
    await db.query(
      `INSERT INTO calls (
        user_id, country_code, call_sid, provider, from_number, virtual_number, started_at, cost_currency, created_at
       ) VALUES ($1, 'US', $2, 'twilio', $3, $4, NOW(), 'USD', NOW())`,
      [userId, CallSid, From, To || '+15555550100']
    );
    
    await db.query(
      `INSERT INTO call_sessions (call_sid, business_id, caller_phone, exotel_number, session_status, started_at)
       VALUES ($1, $2, $3, $4, 'active', NOW())
       ON CONFLICT (call_sid) DO UPDATE SET session_status = 'active', started_at = NOW()`,
      [CallSid, userId, From, To || '+15555550100']
    );
    
    let voiceStack = 'current_openai';
    try {
      voiceStack = selectVoiceStack(userId, { callSid: CallSid });
    } catch (routerErr) {
      console.error('[TWILIO DEMO Webhook] selectVoiceStack error:', routerErr.message);
    }

    let wsUrl;
    if (voiceStack === PROVIDER_MODULAR) {
      const token = jwt.sign(
        {
          callSid: CallSid,
          businessId: userId,
          assistantId: '00000000-0000-0000-0000-000000000000',
          isDemo: true
        },
        JWT_SECRET,
        { expiresIn: '5m' }
      );
      const { FromCountry = '', ToCountry = '' } = req.body;
      const voiceWorkerBase = await selectWorkerRegionUrl({
        toNumber: To,
        toCountry: ToCountry,
        fromCountry: FromCountry
      });
      wsUrl = `${voiceWorkerBase}/api/call-stream/ws?token=${token}`;
    } else {
      const host = req.headers.host || 'localhost:5001';
      const isSsl = req.secure || req.headers['x-forwarded-proto'] === 'https';
      const wsProtocol = isSsl ? 'wss' : 'ws';
      wsUrl = `${wsProtocol}://${host}/api/call-stream/ws?callSid=${CallSid}`;
    }

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

// Legacy stubs (kept for backwards-compat, return eligible: false to redirect to new billing demo)
router.get('/status', requireAuth, async (req, res) => {
  return res.status(200).json({ eligible: false, session: null });
});
router.post('/start', requireAuth, async (req, res) => {
  return res.status(400).json({ error: 'deprecated', message: 'This endpoint is deprecated. Use the new paid demo flow.' });
});
router.post('/hangup', requireAuth, async (req, res) => {
  return res.status(200).json({ success: true });
});

module.exports = router;
