'use strict';

const db = require('../database/db');
const twilioProvider = require('../providers/twilio');
const phoneValidation = require('../utils/phoneValidation');

/**
 * Helper to mask destination phone number for privacy
 * Example: +919876543210 -> +91 ••••••3210
 */
function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const trimmed = phone.trim();
  if (trimmed.length <= 6) return trimmed;
  const prefix = trimmed.slice(0, 3);
  const suffix = trimmed.slice(-4);
  const maskedCount = Math.max(trimmed.length - 7, 4);
  return `${prefix} ${'•'.repeat(maskedCount)}${suffix}`;
}

/**
 * Normalizes phone numbers to E.164 format.
 * Returns { valid: boolean, normalized?: string, error?: string }
 */
function normalizeToE164(rawPhone, countryIso = 'IN') {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { valid: false, error: 'Phone number is required.' };
  }

  const trimmed = rawPhone.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { valid: false, error: 'Phone number length is invalid for international calling.' };
  }

  // If already starts with '+', validate length
  if (trimmed.startsWith('+')) {
    const e164 = `+${digitsOnly}`;
    const e164Regex = /^\+[1-9]\d{7,14}$/;
    if (!e164Regex.test(e164)) {
      return { valid: false, error: 'Invalid international phone number format.' };
    }
    return { valid: true, normalized: e164 };
  }

  // Try standard country normalization if provided
  try {
    const validation = phoneValidation.validateAndNormalizePhone(trimmed, countryIso);
    if (validation && validation.valid && validation.normalized) {
      return { valid: true, normalized: validation.normalized };
    }
  } catch {
    // Fall back to dial code matching
  }

  // Fallback: If 10 digits without '+' prefix, default to India (+91)
  if (digitsOnly.length === 10) {
    return { valid: true, normalized: `+91${digitsOnly}` };
  }

  // Prepend '+' to digits
  const fallbackE164 = `+${digitsOnly}`;
  const regex = /^\+[1-9]\d{7,14}$/;
  if (regex.test(fallbackE164)) {
    return { valid: true, normalized: fallbackE164 };
  }

  return { valid: false, error: 'Please enter a valid international mobile number.' };
}

function getCountryCode(phone) {
  if (!phone) return 'US';
  if (phone.startsWith('+91')) return 'IN';
  if (phone.startsWith('+1')) return 'US';
  if (phone.startsWith('+44')) return 'GB';
  if (phone.startsWith('+61')) return 'AU';
  return 'US';
}

/**
 * Checks provider availability without leaking internal credentials.
 */
async function checkProviderHealth() {
  try {
    const client = twilioProvider.client;
    if (!client) {
      return { available: false, reason: 'provider_not_configured' };
    }
    return { available: true };
  } catch (err) {
    return { available: false, reason: 'provider_unavailable', error: err.message };
  }
}

/**
 * POST /assistants/:id/test-call
 * Initiates a real test call to the user's phone.
 */
async function initiateTestCall(req, res) {
  try {
    const businessId = req.user && req.user.id;
    if (!businessId) {
      return res.status(401).json({ success: false, error: 'unauthorized', message: 'Authentication required.' });
    }

    const { id: assistantId } = req.params;
    const { phoneNumber, countryCode = 'IN', idempotencyKey } = req.body || {};

    // 1. Resolve & verify agent belongs to this workspace
    const astRes = await db.query(
      'SELECT * FROM assistants WHERE id = $1 AND business_id = $2',
      [assistantId, businessId]
    );

    if (astRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'agent_not_found',
        message: 'Agent not found in current workspace. Please save the agent before testing.'
      });
    }

    const assistant = astRes.rows[0];

    // 2. Validate agent readiness
    if (!assistant.name || !assistant.name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'missing_name',
        message: 'Agent name is required before making a test call.'
      });
    }

    if (!assistant.system_prompt || !assistant.system_prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'missing_instructions',
        message: 'Complete Instructions before testing your agent.'
      });
    }

    const hasVoice = Boolean(assistant.voice_id || assistant.voice);
    if (!hasVoice) {
      return res.status(400).json({
        success: false,
        error: 'missing_voice',
        message: 'Complete Voice & language before testing your agent.'
      });
    }

    if (!assistant.language) {
      return res.status(400).json({
        success: false,
        error: 'missing_language',
        message: 'Complete Voice & language before testing your agent.'
      });
    }

    // 3. Resolve assigned Bavio phone number
    const phoneRes = await db.query(
      `SELECT * FROM phone_numbers 
       WHERE (assistant_id = $1 OR business_id = $2) AND status = 'active'
       ORDER BY (assistant_id = $1) DESC, created_at DESC 
       LIMIT 1`,
      [assistantId, businessId]
    );

    if (phoneRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'phone_unassigned',
        message: 'Assign a phone number before making a live test call.'
      });
    }

    const assignedRecord = phoneRes.rows[0];
    const assignedNumber = (assignedRecord.number || assignedRecord.phone_number || '').trim();

    if (!assignedNumber) {
      return res.status(400).json({
        success: false,
        error: 'phone_unassigned',
        message: 'Assign a phone number before making a live test call.'
      });
    }

    // 4. Validate and normalize destination phone number (E.164)
    const norm = normalizeToE164(phoneNumber, countryCode);
    if (!norm.valid || !norm.normalized) {
      return res.status(400).json({
        success: false,
        error: 'invalid_phone',
        message: norm.error || 'Please enter a valid mobile number in international format.'
      });
    }
    const destinationPhone = norm.normalized;

    // 5. Backend Idempotency: Check if an active test call already exists for this assistant
    const activeCallRes = await db.query(
      `SELECT * FROM calls 
       WHERE business_id = $1 AND assistant_id = $2 
         AND (status IN ('started', 'in-progress') OR call_status IN ('queued', 'ringing', 'in_progress'))
         AND created_at > NOW() - INTERVAL '5 minutes'
       ORDER BY created_at DESC
       LIMIT 1`,
      [businessId, assistantId]
    );

    if (activeCallRes.rows.length > 0) {
      const activeCall = activeCallRes.rows[0];
      return res.status(200).json({
        success: true,
        callSid: activeCall.call_sid,
        status: activeCall.call_status === 'in_progress' || activeCall.status === 'in-progress' ? 'in_progress' : activeCall.call_status,
        fromNumber: activeCall.virtual_number || assignedNumber,
        toNumber: activeCall.caller_number || destinationPhone,
        maskedNumber: maskPhoneNumber(activeCall.caller_number || destinationPhone),
        duplicate: true,
        message: 'A test call is already in progress.'
      });
    }

    // 6. Check telephony provider availability
    const providerHealth = await checkProviderHealth();
    if (!providerHealth.available) {
      console.warn('[TEST CALL] Provider unavailable check triggered:', providerHealth.reason);
      return res.status(503).json({
        success: false,
        error: 'provider_unavailable',
        message: 'Live calling is currently unavailable. Please verify your telephony settings or try again shortly.'
      });
    }

    // 7. Build webhook endpoints
    const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const defaultBase = `${proto}://${forwardedHost}`;
    const configuredBase = process.env.WEBHOOK_BASE_URL || defaultBase;
    const baseUrl = configuredBase.replace(/\/$/, '');

    const webhookUrl = `${baseUrl}/calls/twilio/outbound-test-connect`;
    const statusCallback = `${baseUrl}/calls/twilio/status`;

    // 8. Create test call record in database (using valid enum for status: 'started')
    const isoCountry = getCountryCode(destinationPhone);
    const tempCallSid = `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const callInsert = await db.query(
      `INSERT INTO calls (
         user_id, business_id, client_id, assistant_id, country_code,
         call_sid, provider, from_number, virtual_number, caller_number,
         status, call_status, cost_currency, is_test, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, 'twilio', $7, $7, $8, 'started', 'queued', 'USD', true, NOW())
       RETURNING *`,
      [businessId, businessId, businessId, assistantId, isoCountry, tempCallSid, assignedNumber, destinationPhone]
    );

    const callRecord = callInsert.rows[0];

    // 9. Initiate outbound call through telephony provider
    let realCallSid;
    try {
      realCallSid = await twilioProvider.createOutboundCall({
        to: destinationPhone,
        from: assignedNumber,
        webhookUrl,
        statusCallback,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
      });
    } catch (providerError) {
      console.error('[TEST CALL] Twilio dispatch error:', providerError.message);

      // Clean up call record on failure
      await db.query(
        "UPDATE calls SET status = 'failed', call_status = 'failed', ended_at = NOW() WHERE id = $1",
        [callRecord.id]
      );

      // Check if account is suspended / inactive (Twilio code 20003 or similar)
      const errCode = providerError.code;
      const errMsg = (providerError.message || '').toLowerCase();
      if (errCode === 20003 || errMsg.includes('not active') || errMsg.includes('authenticate') || errMsg.includes('credentials')) {
        return res.status(503).json({
          success: false,
          error: 'provider_unavailable',
          message: 'Live calling is currently unavailable. Telephony provider credentials are inactive or suspended.'
        });
      }

      if (errCode === 21211 || errMsg.includes('invalid') || errMsg.includes('unverified')) {
        return res.status(400).json({
          success: false,
          error: 'invalid_destination',
          message: 'The entered phone number could not be reached by the carrier network. Please verify your number.'
        });
      }

      return res.status(502).json({
        success: false,
        error: 'provider_dispatch_failed',
        message: 'Live calling could not be connected. Please try again in a few moments.'
      });
    }

    // 10. Update call record with real Twilio call SID
    await db.query(
      "UPDATE calls SET call_sid = $1, status = 'started', call_status = 'queued' WHERE id = $2",
      [realCallSid, callRecord.id]
    );

    // 11. Create active call session for MediaStream / WebSocket streaming
    try {
      await db.query(
        `INSERT INTO call_sessions (call_sid, business_id, caller_phone, exotel_number, session_status, started_at)
         VALUES ($1, $2, $3, $4, 'active', NOW())
         ON CONFLICT (call_sid) DO UPDATE SET session_status = 'active', started_at = NOW()`,
        [realCallSid, businessId, destinationPhone, assignedNumber]
      );
    } catch (sessionErr) {
      console.error('[TEST CALL] Failed to insert session for test call:', sessionErr.message);
    }

    return res.status(200).json({
      success: true,
      callSid: realCallSid,
      status: 'queued',
      fromNumber: assignedNumber,
      toNumber: destinationPhone,
      maskedNumber: maskPhoneNumber(destinationPhone),
      expectedDelaySeconds: 60
    });

  } catch (err) {
    console.error('[TEST CALL] Unexpected error in initiateTestCall:', err.message);
    return res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to initiate test call. Please try again.'
    });
  }
}

/**
 * GET /assistants/:id/test-call/:callSid
 * Returns real-time call status, duration, transcript, and AI summary.
 */
async function getTestCallStatus(req, res) {
  try {
    const businessId = req.user && req.user.id;
    if (!businessId) {
      return res.status(401).json({ success: false, error: 'unauthorized', message: 'Authentication required.' });
    }

    const { id: assistantId, callSid } = req.params;

    // 1. Look up call record for this workspace and assistant
    const callRes = await db.query(
      `SELECT c.*, a.name as assistant_name, a.language as assistant_language, 
              a.voice_id as assistant_voice_id, a.voice as assistant_voice
       FROM calls c
       LEFT JOIN assistants a ON c.assistant_id = a.id
       WHERE c.call_sid = $1 AND (c.business_id = $2 OR c.user_id = $2)`,
      [callSid, businessId]
    );

    if (callRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'call_not_found',
        message: 'Test call not found in current workspace.'
      });
    }

    const call = callRes.rows[0];
    let currentStatus = call.call_status || call.status || 'queued';
    let duration = call.duration_seconds || call.duration || 0;

    // Normalize status string
    if (currentStatus === 'in-progress' || currentStatus === 'started') {
      currentStatus = call.call_status || 'in_progress';
    }

    // 2. If call is not in a terminal state, fetch live status from provider
    const isTerminal = ['completed', 'failed', 'canceled'].includes(currentStatus);
    if (!isTerminal) {
      try {
        const providerStatus = await twilioProvider.getCallStatus(callSid);
        if (providerStatus) {
          const pStatus = providerStatus.status;
          if (pStatus === 'in-progress') {
            currentStatus = 'in_progress';
            await db.query(
              "UPDATE calls SET status = 'in-progress', call_status = 'in_progress', started_at = COALESCE(started_at, NOW()) WHERE call_sid = $1",
              [callSid]
            );
          } else if (pStatus === 'ringing') {
            currentStatus = 'ringing';
            await db.query(
              "UPDATE calls SET status = 'started', call_status = 'ringing' WHERE call_sid = $1",
              [callSid]
            );
          } else if (pStatus === 'completed') {
            currentStatus = 'completed';
            duration = providerStatus.duration || duration;
            await db.query(
              "UPDATE calls SET status = 'completed', call_status = 'completed', duration_seconds = $2, ended_at = COALESCE(ended_at, NOW()) WHERE call_sid = $1",
              [callSid, duration]
            );
          } else if (['failed', 'busy', 'no-answer', 'canceled'].includes(pStatus)) {
            currentStatus = 'failed';
            await db.query(
              "UPDATE calls SET status = 'failed', call_status = 'failed', ended_at = NOW() WHERE call_sid = $1",
              [callSid]
            );
          }
        }
      } catch (pollErr) {
        // Non-fatal: if Twilio cannot be polled, rely on database webhook state
      }
    }

    // 3. Fetch transcript & summary
    let transcript = [];
    let summary = '';

    try {
      const transRes = await db.query(
        'SELECT transcript, summary FROM transcripts WHERE call_id = $1 OR call_sid = $2 ORDER BY created_at DESC LIMIT 1',
        [call.id, callSid]
      );
      if (transRes.rows.length > 0) {
        const row = transRes.rows[0];
        transcript = typeof row.transcript === 'string' ? JSON.parse(row.transcript) : (row.transcript || []);
        summary = row.summary || '';
      }
    } catch {
      // Non-fatal
    }

    // If transcript is in call record
    if ((!transcript || transcript.length === 0) && call.transcript) {
      transcript = typeof call.transcript === 'string' ? JSON.parse(call.transcript) : call.transcript;
    }

    // If call completed and has transcript but no summary, generate concise AI summary
    if (currentStatus === 'completed' && Array.isArray(transcript) && transcript.length > 0 && !summary) {
      try {
        const outcomeExtractionService = require('../services/outcomeExtractionService');
        const textTranscript = transcript.map(t => `${t.role === 'assistant' ? 'Agent' : 'Caller'}: ${t.content}`).join('\n');
        const outcome = await outcomeExtractionService.extractCallOutcome(call.id, businessId, textTranscript, call.caller_number);
        if (outcome && outcome.summary) {
          summary = outcome.summary;
        }
      } catch {
        summary = 'The agent answered the test call and conversed with the caller in real time.';
      }
    }

    return res.status(200).json({
      success: true,
      callSid,
      status: currentStatus,
      durationSeconds: duration,
      voice: call.assistant_voice_id || call.assistant_voice || 'Voice configured',
      language: call.assistant_language || 'en-US',
      agentName: call.assistant_name || 'AI Receptionist',
      maskedNumber: maskPhoneNumber(call.caller_number),
      fromNumber: call.virtual_number,
      toNumber: call.caller_number,
      summary: summary || (currentStatus === 'completed' ? 'The test call completed successfully.' : ''),
      transcript: Array.isArray(transcript) ? transcript : []
    });

  } catch (err) {
    console.error('[TEST CALL STATUS] Unexpected error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to retrieve test call status.'
    });
  }
}

/**
 * POST /assistants/:id/test-call/:callSid/hangup
 * Gracefully terminates the active test call.
 */
async function hangupTestCall(req, res) {
  try {
    const businessId = req.user && req.user.id;
    if (!businessId) {
      return res.status(401).json({ success: false, error: 'unauthorized', message: 'Authentication required.' });
    }

    const { callSid } = req.params;

    const callRes = await db.query(
      'SELECT id, call_sid, status FROM calls WHERE call_sid = $1 AND (business_id = $2 OR user_id = $2)',
      [callSid, businessId]
    );

    if (callRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'call_not_found', message: 'Call not found.' });
    }

    try {
      await twilioProvider.client.calls(callSid).update({ status: 'completed' });
    } catch (twErr) {
      console.warn('[TEST CALL HANGUP] Provider update notice:', twErr.message);
    }

    await db.query(
      "UPDATE calls SET status = 'completed', call_status = 'completed', ended_at = NOW() WHERE call_sid = $1",
      [callSid]
    );

    await db.query(
      "UPDATE call_sessions SET session_status = 'ended', ended_at = NOW() WHERE call_sid = $1",
      [callSid]
    );

    return res.status(200).json({ success: true, message: 'Call terminated successfully.' });

  } catch (err) {
    console.error('[TEST CALL HANGUP] Error:', err.message);
    return res.status(500).json({ success: false, error: 'hangup_failed', message: 'Failed to end call.' });
  }
}

module.exports = {
  initiateTestCall,
  getTestCallStatus,
  hangupTestCall,
  maskPhoneNumber,
  normalizeToE164,
  checkProviderHealth
};
