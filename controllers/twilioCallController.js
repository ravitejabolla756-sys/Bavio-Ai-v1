const db = require('../database/db');
const sttService = require('../services/sarvam/stt');
const llmService = require('../services/sarvam/llm');
const ttsService = require('../services/sarvam/tts');
const audioService = require('../services/audio/audioService');
const axios = require('axios');

// ── STEP 1: Incoming Call ──────────────────────────
async function handleIncomingCall(req, res) {
  try {
    const { CallSid, From, To } = req.body;
    console.log(`[TWILIO] Incoming: ${From} → ${To} | ${CallSid}`);

    // Find phone number config in DB
    let assistant = null;
    let businessId = null;

    try {
      const phoneResult = await db.query(
        'SELECT client_id, assistant_id FROM phone_numbers WHERE phone_number = $1',
        [To]
      );

      if (phoneResult.rows.length > 0) {
        businessId = phoneResult.rows[0].client_id;
        const assistantId = phoneResult.rows[0].assistant_id;

        if (assistantId) {
          const astResult = await db.query(
            'SELECT * FROM assistants WHERE id = $1',
            [assistantId]
          );
          assistant = astResult.rows[0];
        }
      }
    } catch (dbErr) {
      console.error('[TWILIO] DB lookup error:', dbErr.message);
    }

    const firstMessage = assistant?.first_message
      || 'Namaste! Main aapki kaise madad kar sakta hoon?';
    const language = assistant?.language || 'hi-IN';

    // Create call record in DB
    let callId = null;
    try {
      const callResult = await db.query(
        `INSERT INTO calls (phone_number_id, caller_number, provider_call_id, call_status, provider, created_at)
         VALUES (
           (SELECT id FROM phone_numbers WHERE phone_number = $1 LIMIT 1),
           $2, $3, 'started', 'twilio', NOW()
         ) RETURNING id`,
        [To, From, CallSid]
      );
      callId = callResult.rows[0]?.id;
    } catch (dbErr) {
      console.error('[TWILIO] Call record error:', dbErr.message);
    }

    // Generate TTS for greeting using Sarvam
    let greetingUrl = null;
    try {
      const audioBase64 = await ttsService.synthesizeSpeech(
        firstMessage,
        language
      );
      const filename = audioService.saveAudio(
        audioBase64, CallSid, 0
      );
      greetingUrl = audioService.getAudioUrl(filename);
      console.log(`[TWILIO] Greeting audio: ${greetingUrl}`);
    } catch (ttsErr) {
      console.error('[TWILIO] TTS failed for greeting:', ttsErr.message);
    }

    // Build TwiML response
    // Use <Play> if TTS worked, else <Say> fallback
    const audioTag = greetingUrl
      ? `<Play>${greetingUrl}</Play>`
      : `<Say language="${language}">${firstMessage}</Say>`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${audioTag}
  <Record
    action="/calls/twilio/recording"
    method="POST"
    maxLength="15"
    playBeep="false"
    timeout="3"
    finishOnKey=""
  />
</Response>`;

    res.type('text/xml');
    return res.send(twiml);

  } catch (err) {
    console.error('[TWILIO] handleIncomingCall error:', err.message);
    res.type('text/xml');
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, we are experiencing technical difficulties. Please try again later.</Say>
  <Hangup/>
</Response>`);
  }
}

// ── STEP 2: Process Recording ──────────────────────
async function handleRecording(req, res) {
  try {
    const {
      CallSid,
      RecordingUrl,
      RecordingDuration,
      RecordingSid
    } = req.body;

    console.log(`[TWILIO] Recording: ${CallSid} | duration: ${RecordingDuration}s`);

    // Get call data from DB
    let callData = null;
    let session = { transcript: [], turn: 0, language: 'hi-IN', business_id: null, assistant_id: null };

    try {
      const callResult = await db.query(
        'SELECT * FROM calls WHERE provider_call_id = $1',
        [CallSid]
      );
      if (callResult.rows.length > 0) {
        callData = callResult.rows[0];
        session.business_id = callData.client_id;
        session.transcript = callData.transcript || [];
        session.turn = (callData.transcript?.length || 0) / 2;

        // Get assistant config
        if (callData.phone_number_id) {
          const phoneResult = await db.query(
            'SELECT assistant_id FROM phone_numbers WHERE id = $1',
            [callData.phone_number_id]
          );
          if (phoneResult.rows[0]?.assistant_id) {
            session.assistant_id = phoneResult.rows[0].assistant_id;
            const astResult = await db.query(
              'SELECT * FROM assistants WHERE id = $1',
              [session.assistant_id]
            );
            if (astResult.rows[0]) {
              session.language = astResult.rows[0].language || 'hi-IN';
              session.industry = astResult.rows[0].industry || 'general';
            }
          }
        }
      }
    } catch (dbErr) {
      console.error('[TWILIO] Session lookup error:', dbErr.message);
    }

    if (!callData) {
      console.log('[TWILIO] No call found — ending');
      return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Hangup/></Response>`);
    }

    // Skip if recording too short (< 1 second = silence)
    if (parseInt(RecordingDuration) < 1) {
      console.log('[TWILIO] Recording too short — re-recording');
      return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Record
    action="/calls/twilio/recording"
    method="POST"
    maxLength="15"
    playBeep="false"
    timeout="3"
    finishOnKey=""
  />
</Response>`);
    }

    // Download audio from Twilio
    console.log('[TWILIO] Downloading audio from:', RecordingUrl);
    let audioBuffer;
    try {
      const audioResponse = await axios.get(
        RecordingUrl + '.wav',
        {
          responseType: 'arraybuffer',
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID,
            password: process.env.TWILIO_AUTH_TOKEN
          },
          timeout: 15000
        }
      );
      audioBuffer = Buffer.from(audioResponse.data);
      console.log(`[TWILIO] Audio downloaded: ${audioBuffer.length} bytes`);
    } catch (downloadErr) {
      console.error('[TWILIO] Audio download failed:', downloadErr.message);
      return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${session.language}">Sorry, I could not hear that. Please try again.</Say>
  <Record
    action="/calls/twilio/recording"
    method="POST"
    maxLength="15"
    playBeep="false"
    timeout="3"
    finishOnKey=""
  />
</Response>`);
    }

    // ── SARVAM STT ────────────────────────────────
    let userText = '';
    try {
      const sttResult = await sttService.transcribeAudio(
        audioBuffer,
        session.language
      );
      userText = sttResult.text?.trim() || '';
      console.log(`[STT] User said: "${userText}"`);
    } catch (sttErr) {
      console.error('[STT] Failed:', sttErr.message);
      // If STT fails — ask caller to repeat
      return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${session.language}">Sorry, I did not catch that. Could you please repeat?</Say>
  <Record
    action="/calls/twilio/recording"
    method="POST"
    maxLength="15"
    playBeep="false"
    timeout="3"
    finishOnKey=""
  />
</Response>`);
    }

    // Add to transcript
    session.transcript.push({ role: 'user', content: userText });
    session.turn += 1;

    // ── GET BUSINESS + ASSISTANT CONTEXT ─────────
    let business = null;
    let assistant = null;

    if (session.business_id) {
      try {
        const [bizRes, astRes] = await Promise.all([
          db.query('SELECT * FROM businesses WHERE id = $1', [session.business_id]),
          db.query('SELECT * FROM assistants WHERE id = $1', [session.assistant_id])
        ]);
        business = bizRes.rows[0];
        assistant = astRes.rows[0];
      } catch (ctxErr) {
        console.error('[TWILIO] Context fetch error:', ctxErr.message);
      }
    }

    // ── SARVAM LLM ────────────────────────────────
    const systemPrompt = llmService.buildSystemPrompt(
      assistant, business
    );

    let llmResult;
    try {
      llmResult = await llmService.generateResponse(
        session.transcript,
        systemPrompt
      );
      console.log(`[LLM] Response: "${llmResult.response_text.slice(0, 100)}"`);
    } catch (llmErr) {
      console.error('[LLM] Failed:', llmErr.message);
      llmResult = {
        response_text: 'Sorry, I am having trouble understanding. Could you please repeat?',
        lead_data: null,
        should_end: false
      };
    }

    // Add AI response to transcript
    session.transcript.push({
      role: 'assistant',
      content: llmResult.response_text
    });

    // ── SAVE LEAD IF DETECTED ─────────────────────
    if (llmResult.lead_data && callData) {
      try {
        await db.query(
          `INSERT INTO leads (client_id, caller_number, intent, budget, status, notes, created_at)
           VALUES ($1, $2, $3, $4, 'new', $5, NOW())`,
          [
            session.business_id,
            llmResult.lead_data.phone || callData.caller_number,
            llmResult.lead_data.intent || null,
            llmResult.lead_data.budget || null,
            JSON.stringify(llmResult.lead_data)
          ]
        );
        console.log('[LEAD] Saved to DB:', llmResult.lead_data);
      } catch (dbErr) {
        console.error('[LEAD] DB save error:', dbErr.message);
      }
    }

    // ── UPDATE CALL TRANSCRIPT ──────────────────────
    try {
      await db.query(
        'UPDATE calls SET transcript = $1 WHERE provider_call_id = $2',
        [JSON.stringify(session.transcript), CallSid]
      );
    } catch (updErr) {
      console.error('[TWILIO] Transcript update error:', updErr.message);
    }

    // ── SARVAM TTS ────────────────────────────────
    let responseAudioUrl = null;
    try {
      const audioBase64 = await ttsService.synthesizeSpeech(
        llmResult.response_text,
        session.language
      );
      const filename = audioService.saveAudio(
        audioBase64, CallSid, session.turn
      );
      responseAudioUrl = audioService.getAudioUrl(filename);
      console.log(`[TTS] Audio saved: ${responseAudioUrl}`);
    } catch (ttsErr) {
      console.error('[TTS] Failed:', ttsErr.message);
    }

    const audioTag = responseAudioUrl
      ? `<Play>${responseAudioUrl}</Play>`
      : `<Say language="${session.language}">${llmResult.response_text}</Say>`;

    // ── SHOULD CALL END? ──────────────────────────
    if (llmResult.should_end || session.turn >= 20) {
      console.log('[TWILIO] Ending call — natural completion');

      return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${audioTag}
  <Hangup/>
</Response>`);
    }

    // ── CONTINUE LOOP ─────────────────────────────
    return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${audioTag}
  <Record
    action="/calls/twilio/recording"
    method="POST"
    maxLength="15"
    playBeep="false"
    timeout="3"
    finishOnKey=""
  />
</Response>`);

  } catch (err) {
    console.error('[TWILIO] handleRecording error:', err.message);
    return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>I am having trouble right now. Please call back in a moment.</Say>
  <Hangup/>
</Response>`);
  }
}

// ── STEP 3: Call Status Callback ───────────────────
async function handleCallStatus(req, res) {
  try {
    const { CallSid, CallStatus, CallDuration } = req.body;
    console.log(`[TWILIO] Status: ${CallSid} → ${CallStatus} (${CallDuration}s)`);

    // Only process completed calls
    if (CallStatus !== 'completed') return res.sendStatus(200);

    // Get call data
    let callData = null;
    try {
      const callResult = await db.query(
        'SELECT * FROM calls WHERE provider_call_id = $1',
        [CallSid]
      );
      callData = callResult.rows[0];
    } catch (dbErr) {
      console.error('[TWILIO] Call lookup error:', dbErr.message);
    }

    // Clean up audio files
    audioService.deleteAudio(CallSid);

    if (!callData) return res.sendStatus(200);

    const duration = parseInt(CallDuration) || 0;
    const mins = duration / 60;

    // Update call record
    try {
      await db.query(
        'UPDATE calls SET call_status = $1, duration = $2, ended_at = NOW() WHERE provider_call_id = $3',
        ['completed', duration, CallSid]
      );
    } catch (updErr) {
      console.error('[TWILIO] Call update error:', updErr.message);
    }

    // Calculate costs (simplified)
    const cost_stt = (mins / 60) * 30;  // Sarvam STT ₹30/hr
    const cost_tts = ((callData.transcript?.length || 0) * 100 / 10000) * 15;  // Approx TTS
    const cost_telephony = mins * 0.71;  // Twilio USA ₹0.71/min
    const cost_total = cost_stt + cost_tts + cost_telephony;

    // Save usage log
    try {
      await db.query(
        `INSERT INTO usage_logs (client_id, call_id, minutes_used, cost, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [callData.client_id, callData.id, Math.ceil(mins), cost_total]
      );
    } catch (logErr) {
      console.error('[TWILIO] Usage log error:', logErr.message);
    }

    // Update client minutes_used
    if (callData.client_id) {
      try {
        await db.query(
          'UPDATE businesses SET minutes_used = minutes_used + $1 WHERE id = $2',
          [Math.ceil(mins), callData.client_id]
        );
      } catch (minErr) {
        console.error('[TWILIO] Minutes update error:', minErr.message);
      }
    }

    console.log(`[TWILIO] Call complete — ${Math.ceil(mins)} min, ₹${cost_total.toFixed(2)} cost`);
    return res.sendStatus(200);

  } catch (err) {
    console.error('[TWILIO] handleCallStatus error:', err.message);
    return res.sendStatus(200);
  }
}

module.exports = {
  handleIncomingCall,
  handleRecording,
  handleCallStatus
};
