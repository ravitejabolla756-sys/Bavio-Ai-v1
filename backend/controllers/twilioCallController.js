const db = require('../database/db');
const sttService = require('../services/sarvam/stt');
const llmService = require('../services/sarvam/llm');
const ttsService = require('../services/sarvam/tts');
const storageService = require('../services/storage/storageService');
const audioService = require('../services/audio/audioService');
const axios = require('axios');

const activeRequests = {};

// ── HELPERS ───────────────────────────────────────────────────────────────────

// Build a TwiML <Play> or <Say> tag depending on whether we have a public URL
function buildAudioTag(audioUrl, fallbackText, language) {
  if (audioUrl) {
    return `<Play>${audioUrl}</Play>`;
  }
  return `<Say language="${language}">${fallbackText}</Say>`;
}

// Synthesize TTS and upload to Supabase → returns public HTTPS URL or null
async function generateAndUploadTts(text, language, callSid, turn) {
  const ttsResult = await ttsService.synthesizeSpeech(text, language);
  const base64Audio = ttsResult.audioBuffer.toString('base64');
  const fileName = audioService.saveAudio(base64Audio, callSid, turn);
  const audioUrl = audioService.getAudioUrl(fileName);
  console.log(`[TTS→LOCAL] Turn ${turn} → ${audioUrl}`);
  return { audioUrl, filePath: fileName };
}

// Helper to upsert transcript in transcripts table
async function upsertTranscript(callId, businessId, transcript, summary) {
  try {
    const existing = await db.query(
      'SELECT id FROM transcripts WHERE call_id = $1',
      [callId]
    );
    if (existing.rows.length > 0) {
      await db.query(
        'UPDATE transcripts SET transcript = $1, summary = $2 WHERE call_id = $3',
        [JSON.stringify(transcript), summary, callId]
      );
    } else {
      await db.query(
        `INSERT INTO transcripts (call_id, business_id, transcript, summary)
         VALUES ($1, $2, $3, $4)`,
        [callId, businessId, JSON.stringify(transcript), summary]
      );
    }
  } catch (err) {
    console.error('[TWILIO TRANSCRIPT] Upsert error:', err.message);
  }
}

// ── STEP 1: Incoming Call ─────────────────────────────────────────────────────
async function handleIncomingCall(req, res) {
  try {
    const { CallSid, From, To } = req.body;
    console.log(`[TWILIO] Incoming: ${From} → ${To} | ${CallSid}`);

    // ── Look up phone number + assistant ────────────────────────────────
    let assistant = null;
    let businessId = null;
    let phoneNumberId = null;
    let phoneResult = null;

    try {
      phoneResult = await db.query(
        'SELECT id, business_id, assistant_id, country_code FROM phone_numbers WHERE number = $1 OR phone_number = $1 OR user_original_number = $1',
        [To]
      );

      if (phoneResult.rows.length > 0) {
        phoneNumberId = phoneResult.rows[0].id;
        businessId = phoneResult.rows[0].business_id;
        let assistantId = phoneResult.rows[0].assistant_id;

        // For shared pool numbers, business_id is null. Resolve using callRoutingService.
        if (!businessId) {
          try {
            const { resolveBusinessFromCall } = require('../services/phone/callRoutingService');
            const route = await resolveBusinessFromCall(To, From);
            if (route) {
              businessId = route.business_id;
              // Look up assistant for this business
              const astResult = await db.query(
                'SELECT * FROM assistants WHERE business_id = $1 LIMIT 1',
                [businessId]
              );
              if (astResult.rows.length > 0) {
                assistant = astResult.rows[0];
              }
            }
          } catch (routeErr) {
            console.error('[TWILIO] Routing resolution failed:', routeErr.message);
          }
        } else if (assistantId) {
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

    const firstMessage =
      assistant?.first_message || 'Namaste! Main aapki kaise madad kar sakta hoon?';
    const language = assistant?.language || 'hi-IN';

    // ── Check if business has remaining minutes ──────────────────────────
    if (businessId) {
      try {
        const bizResult = await db.query(
          'SELECT minutes_limit, minutes_used FROM businesses WHERE id = $1',
          [businessId]
        );
        if (bizResult.rows.length > 0) {
          const { minutes_limit, minutes_used } = bizResult.rows[0];
          if (minutes_limit !== null && minutes_used !== null && minutes_limit - minutes_used <= 0) {
            console.log(`[TWILIO] Limit reached for business ${businessId} (${minutes_used}/${minutes_limit})`);
            res.type('text/xml');
            return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${language}">Aapke account ka monthly limit poora ho chuka hai. Kripya upgrade/recharge karein.</Say>
  <Hangup/>
</Response>`);
          }
        }
      } catch (bizErr) {
        console.error('[TWILIO] Business limit check error:', bizErr.message);
      }
    }

    // ── Create call record (include business_id!) ──────────────────────────
    try {
      const countryCode = phoneResult.rows[0]?.country_code || 'US';
      const currency = 'USD';
      await db.query(
        `INSERT INTO calls (
          user_id, country_code, call_sid, provider, from_number, virtual_number, started_at, cost_currency, created_at
        ) VALUES ($1, $2, $3, 'twilio', $4, $5, NOW(), $6, NOW())`,
        [businessId, countryCode, CallSid, From, To, currency]
      );
    } catch (dbErr) {
      console.error('[TWILIO] Call record error:', dbErr.message);
    }

    // ── TTS greeting → Supabase Storage → public URL ─────────────────────
    let greetingUrl = null;
    try {
      const result = await generateAndUploadTts(firstMessage, language, CallSid, 0);
      greetingUrl = result.audioUrl;
    } catch (ttsErr) {
      console.error('[TWILIO] TTS greeting failed:', ttsErr.message);
      // Falls back to <Say> below
    }

    // ── TwiML: <Play public-url> or <Say> fallback ───────────────────────
    const audioTag = buildAudioTag(greetingUrl, firstMessage, language);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather
    input="speech"
    action="/calls/twilio/recording"
    method="POST"
    language="${language}"
    speechTimeout="auto"
  >
    ${audioTag}
  </Gather>
  <Redirect method="POST">/calls/twilio/recording?silence=true</Redirect>
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

// ── STEP 2: Process Recording ─────────────────────────────────────────────────
async function handleRecording(req, res) {
  const { CallSid, RecordingUrl, RecordingDuration, SpeechResult } = req.body;
  const isSilence = req.query.silence === 'true';

  if (!RecordingUrl && !SpeechResult && !isSilence) {
    console.log('[TWILIO] RecordingUrl, SpeechResult, and silence query are missing — hanging up');
    return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`);
  }

  const requestKey = `${CallSid}-${RecordingUrl || SpeechResult || (isSilence ? 'silence-' + Date.now() : 'unknown')}`;

  if (activeRequests[requestKey]) {
    console.log(`[TWILIO] Concurrency lock: Duplicate request detected for key: ${requestKey}. Waiting for original response...`);
    try {
      const twiml = await activeRequests[requestKey];
      console.log(`[TWILIO] Concurrency unlock: Duplicate request returning cached response for key: ${requestKey}`);
      res.type('text/xml');
      return res.send(twiml);
    } catch (err) {
      console.error(`[TWILIO] Original request failed for duplicate:`, err.message);
      return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`);
    }
  }

  const processingPromise = (async () => {
    // ── Get call + session data from DB ──────────────────────────────────
    let callData = null;
    let session = {
      transcript: [],
      turn: 0,
      language: 'hi-IN',
      business_id: null,
      assistant_id: null,
      industry: 'general'
    };

    try {
      const callResult = await db.query(
        'SELECT * FROM calls WHERE call_sid = $1',
        [CallSid]
      );
      if (callResult.rows.length > 0) {
        callData = callResult.rows[0];
        callData.business_id = callData.user_id; // map user_id to business_id for backward compatibility
        session.business_id = callData.business_id;

        // Fetch transcript from transcripts table instead of calls table
        const transResult = await db.query(
          'SELECT transcript FROM transcripts WHERE call_id = $1',
          [callData.id]
        );
        session.transcript = transResult.rows[0]?.transcript || [];
        session.turn = Math.floor((session.transcript?.length || 0) / 2);

        if (callData.virtual_number) {
          const phoneResult = await db.query(
            'SELECT assistant_id FROM phone_numbers WHERE number = $1',
            [callData.virtual_number]
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
      console.log('[TWILIO] No call found — hanging up');
      return `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`;
    }

    // ── Skip silence / Parse caller input ────────────────────────────
    let userText = '';

    if (isSilence) {
      console.log('[TWILIO] Silence detected via Redirect');
      const silenceText = session.language === 'hi-IN' 
        ? "Mujhe aapki awaaz nahi aayi. Kripya phir se bolein." 
        : "I did not hear you. Could you please repeat?";
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather
    input="speech"
    action="/calls/twilio/recording"
    method="POST"
    language="${session.language}"
    speechTimeout="auto"
  >
    <Say language="${session.language}">${silenceText}</Say>
  </Gather>
  <Redirect method="POST">/calls/twilio/recording?silence=true</Redirect>
</Response>`;
    }

    if (SpeechResult) {
      userText = SpeechResult.trim();
      console.log(`[GATHER] Twilio speech recognized: "${userText}"`);
    } else if (RecordingUrl) {
      // ── Skip silence recordings (< 1 second) ────────────────────────────
      if (parseInt(RecordingDuration) < 1) {
        console.log('[TWILIO] Recording too short (silence) — re-recording');
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather
    input="speech"
    action="/calls/twilio/recording"
    method="POST"
    language="${session.language}"
    speechTimeout="auto"
  />
  <Redirect method="POST">/calls/twilio/recording?silence=true</Redirect>
</Response>`;
      }

      // ── Download caller's audio from Twilio ──────────────────────────────
      let audioBuffer;
      console.log('[TWILIO] Downloading caller audio from:', RecordingUrl);
      try {
        const audioResponse = await axios.get(RecordingUrl + '.wav', {
          responseType: 'arraybuffer',
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID,
            password: process.env.TWILIO_AUTH_TOKEN
          },
          timeout: 15000
        });
        audioBuffer = Buffer.from(audioResponse.data);
        console.log(`[TWILIO] Caller audio downloaded: ${audioBuffer.length} bytes`);
      } catch (downloadErr) {
        console.error('[TWILIO] Audio download failed:', downloadErr.message);
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${session.language}">Sorry, I could not hear that. Please try again.</Say>
  <Gather
    input="speech"
    action="/calls/twilio/recording"
    method="POST"
    language="${session.language}"
    speechTimeout="auto"
  />
  <Redirect method="POST">/calls/twilio/recording?silence=true</Redirect>
</Response>`;
      }

      // ── SARVAM STT ───────────────────────────────────────────────────────
      try {
        const sttResult = await sttService.transcribeAudio(audioBuffer, session.language);
        userText = sttResult.text?.trim() || '';
        console.log(`[STT] User said: "${userText}"`);
      } catch (sttErr) {
        console.error('[STT] Failed:', sttErr.message);
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${session.language}">Sorry, I did not catch that. Could you please repeat?</Say>
  <Gather
    input="speech"
    action="/calls/twilio/recording"
    method="POST"
    language="${session.language}"
    speechTimeout="auto"
  />
  <Redirect method="POST">/calls/twilio/recording?silence=true</Redirect>
</Response>`;
      }
    } else {
      // General fallback if somehow both are missing
      console.log('[TWILIO] No speech or recording - looping back to listen');
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather
    input="speech"
    action="/calls/twilio/recording"
    method="POST"
    language="${session.language}"
    speechTimeout="auto"
  />
  <Redirect method="POST">/calls/twilio/recording?silence=true</Redirect>
</Response>`;
    }

    // Add caller turn to transcript
    session.transcript.push({ role: 'user', content: userText });
    session.turn += 1;

    // ── Fetch business + assistant context ───────────────────────────────
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

    // ── SARVAM LLM ───────────────────────────────────────────────────────
    const systemPrompt = llmService.buildSystemPrompt(assistant, business);

    let llmResult;
    try {
      llmResult = await llmService.generateResponse(session.transcript, systemPrompt);
      console.log(`[LLM] Response: "${llmResult.response_text.slice(0, 100)}"`);
    } catch (llmErr) {
      console.error('[LLM] Failed:', llmErr.message);
      llmResult = {
        response_text: 'Sorry, I am having trouble understanding. Could you please repeat?',
        lead_data: null,
        should_end: false
      };
    }

    // Add AI turn to transcript
    session.transcript.push({ role: 'assistant', content: llmResult.response_text });

    // ── Save lead if AI detected one ─────────────────────────────────────
    if (llmResult.lead_data && callData) {
      try {
        await db.query(
          `INSERT INTO leads (business_id, call_id, phone, name, intent, budget, location, notes, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new', NOW())`,
          [
            session.business_id,
            callData.id,
            llmResult.lead_data.phone || callData.caller_number,
            llmResult.lead_data.name || null,
            llmResult.lead_data.intent || null,
            llmResult.lead_data.budget || null,
            llmResult.lead_data.location || null,
            JSON.stringify(llmResult.lead_data)
          ]
        );
        console.log('[LEAD] Saved to DB:', llmResult.lead_data);
      } catch (dbErr) {
        console.error('[LEAD] DB save error explicitly:', dbErr.message);
      }
    }

    // ── Update call transcript in DB ─────────────────────────────────────
    try {
      const summary = `${session.transcript.length} turns.`;
      await upsertTranscript(callData.id, session.business_id, session.transcript, summary);
    } catch (updErr) {
      console.error('[TWILIO] Transcript update error:', updErr.message);
    }

    // ── SARVAM TTS → Supabase Storage → public URL ───────────────────────
    let responseAudioUrl = null;
    try {
      const result = await generateAndUploadTts(
        llmResult.response_text,
        session.language,
        CallSid,
        session.turn
      );
      responseAudioUrl = result.audioUrl;
    } catch (ttsErr) {
      console.error('[TTS] Failed — falling back to <Say>:', ttsErr.message);
    }

    const audioTag = buildAudioTag(responseAudioUrl, llmResult.response_text, session.language);

    // ── End call or continue loop ────────────────────────────────────────
    if (llmResult.should_end || session.turn >= 20) {
      console.log('[TWILIO] Ending call — natural completion');
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${audioTag}
  <Hangup/>
</Response>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather
    input="speech"
    action="/calls/twilio/recording"
    method="POST"
    language="${session.language}"
    speechTimeout="auto"
  >
    ${audioTag}
  </Gather>
  <Redirect method="POST">/calls/twilio/recording?silence=true</Redirect>
</Response>`;
  })();

  activeRequests[requestKey] = processingPromise;

  try {
    const twiml = await processingPromise;
    res.type('text/xml');
    return res.send(twiml);
  } catch (err) {
    console.error('[TWILIO] handleRecording promise rejection:', err.message);
    return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>I am having trouble right now. Please call back in a moment.</Say><Hangup/></Response>`);
  } finally {
    delete activeRequests[requestKey];
  }
}

// ── STEP 3: Call Status Callback ──────────────────────────────────────────────
async function handleCallStatus(req, res) {
  try {
    const { CallSid, CallStatus, CallDuration } = req.body;
    console.log(`[TWILIO] Status: ${CallSid} → ${CallStatus} (${CallDuration}s)`);

    // Only process final state
    if (CallStatus !== 'completed') return res.sendStatus(200);

    // Get call data
    let callData = null;
    try {
      const callResult = await db.query(
        'SELECT * FROM calls WHERE call_sid = $1',
        [CallSid]
      );
      callData = callResult.rows[0];
      if (callData) {
        callData.business_id = callData.user_id; // map user_id to business_id for backward compatibility
      }
    } catch (dbErr) {
      console.error('[TWILIO] Call lookup error:', dbErr.message);
    }

    // ── Async: clean up this call's TTS files in Supabase Storage & Local Storage ───────
    // Fire-and-forget — don't await (keep webhook response fast)
    audioService.deleteAudio(CallSid);
    storageService
      .cleanupCallTtsFiles(CallSid)
      .catch(err => console.error('[STORAGE] Cleanup error:', err.message));

    if (!callData) return res.sendStatus(200);

    const duration = parseInt(CallDuration) || 0;
    const mins = duration / 60;

    // Update call record
    try {
      await db.query(
        'UPDATE calls SET status = $1, duration_seconds = $2, ended_at = NOW() WHERE call_sid = $3',
        ['completed', duration, CallSid]
      );
    } catch (updErr) {
      console.error('[TWILIO] Call update error:', updErr.message);
    }

    // Get final transcript from transcripts table
    let transcript = [];
    try {
      const transResult = await db.query(
        'SELECT transcript FROM transcripts WHERE call_id = $1',
        [callData.id]
      );
      transcript = transResult.rows[0]?.transcript || [];
    } catch (transErr) {
      console.error('[TWILIO] Failed to fetch final transcript for billing:', transErr.message);
    }

    // Calculate costs
    const cost_stt = (mins / 60) * 0.15;          // Whisper STT $0.15/hr
    const cost_tts = (transcript.length * 100 / 10000) * 0.005;
    const cost_telephony = mins * 0.013;           // Twilio US $0.013/min
    const cost_total = cost_stt + cost_tts + cost_telephony;

    // Check if business has remaining minutes and calculate overage
    let is_overage = false;
    let cost_amount = 0;
    let business_plan = 'free';

    if (callData.business_id) {
      try {
        const bizResult = await db.query(
          'SELECT plan, minutes_limit, minutes_used FROM businesses WHERE id = $1',
          [callData.business_id]
        );
        if (bizResult.rows.length > 0) {
          const { plan, minutes_limit, minutes_used } = bizResult.rows[0];
          business_plan = plan || 'free';
          const callMins = Math.ceil(mins);
          
          const dodoBilling = require('../services/dodoBillingService');
          const overageRate = dodoBilling.OVERAGE_RATES[business_plan.toLowerCase()] || 0;
          
          const prevUsed = minutes_used || 0;
          const limit = minutes_limit || 100;
          
          if (prevUsed >= limit) {
            is_overage = true;
            cost_amount = callMins * overageRate;
          } else if (prevUsed + callMins > limit) {
            is_overage = true;
            cost_amount = (prevUsed + callMins - limit) * overageRate;
          }
        }
      } catch (bizErr) {
        console.error('[TWILIO] Business look up for overage calculation failed:', bizErr.message);
      }
    }

    // Save usage log using user_id and cost_total
    try {
      const now = new Date();
      const billingMonth = now.getMonth() + 1;
      const billingYear = now.getFullYear();
      const countryCode = callData.country_code || 'US';
      const currency = callData.cost_currency || 'USD';

      await db.query(
        `INSERT INTO usage_logs (
          user_id, country_code, call_id, minutes_used, cost_stt, cost_tts, cost_telephony, cost_total, currency_code, billing_month, billing_year, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
        [
          callData.user_id,
          countryCode,
          callData.id,
          Math.ceil(mins),
          cost_stt,
          cost_tts,
          cost_telephony,
          cost_total,
          currency,
          billingMonth,
          billingYear
        ]
      );
    } catch (logErr) {
      console.error('[TWILIO] Usage log error explicitly:', logErr.message);
    }

    // Deduct minutes from business account using business_id
    if (callData.business_id) {
      try {
        await db.query(
          'UPDATE businesses SET minutes_used = minutes_used + $1 WHERE id = $2',
          [Math.ceil(mins), callData.business_id]
        );
      } catch (minErr) {
        console.error('[TWILIO] Minutes update error explicitly:', minErr.message);
      }
    }

    console.log(`[TWILIO] Call complete — ${Math.ceil(mins)} min, ₹${cost_total.toFixed(2)} cost`);
    return res.sendStatus(200);

  } catch (err) {
    console.error('[TWILIO] handleCallStatus error:', err.message);
    return res.sendStatus(200);
  }
}

// ── STEP 4: Telephony Sync Callback (Inconspicuous Webhook for Vapi logs) ────
async function handleTelephonySync(req, res) {
  try {
    const { message } = req.body;
    if (!message || message.type !== 'end-of-call-report') {
      return res.status(200).json({ status: 'ignored' });
    }

    const call = message.call;
    const rawFrom = call.customer?.number || 'Unknown';
    const rawTo = call.phoneNumber?.number || 'Unknown';
    
    // Normalize phone numbers (remove spaces, dashes, parentheses)
    const fromNumber = rawFrom !== 'Unknown' ? '+' + rawFrom.replace(/\D/g, '') : rawFrom;
    let toNumber = rawTo !== 'Unknown' ? '+' + rawTo.replace(/\D/g, '') : rawTo;
    
    const duration = Math.round(call.duration || 0);
    const callSid = call.id;

    console.log(`[TELEPHONY SYNC] Webhook received: ${fromNumber} → ${toNumber} | Duration: ${duration}s`);

    // 1. Resolve business owner details by Twilio number
    let businessId = null;
    let countryCode = 'US';

    if (toNumber && toNumber !== 'Unknown') {
      const phoneResult = await db.query(
        'SELECT id, business_id, country_code FROM phone_numbers WHERE number = $1 OR phone_number = $1 OR user_original_number = $1',
        [toNumber]
      );
      if (phoneResult.rows.length > 0) {
        businessId = phoneResult.rows[0].business_id;
        countryCode = phoneResult.rows[0].country_code || 'US';
      }
    }

    // Try assistantId lookup if we still don't have businessId
    const assistantId = call.assistantId;
    if (!businessId && assistantId) {
      const astResult = await db.query(
        'SELECT business_id FROM assistants WHERE id = $1',
        [assistantId]
      );
      if (astResult.rows.length > 0) {
        businessId = astResult.rows[0].business_id;
        // Lookup country from business
        const bizRes = await db.query('SELECT country_code FROM businesses WHERE id = $1', [businessId]);
        countryCode = bizRes.rows[0]?.country_code || 'US';
      }
    }

    // Fallback: Use the first business if not found (for Vapi web testing convenience)
    if (!businessId) {
      const firstBiz = await db.query('SELECT id, country_code FROM businesses LIMIT 1');
      if (firstBiz.rows.length > 0) {
        businessId = firstBiz.rows[0].id;
        countryCode = firstBiz.rows[0].country_code || 'US';
      }
    }

    const currency = 'USD';

    // 2. Insert call record
    const insertCallResult = await db.query(
      `INSERT INTO calls (
        user_id, country_code, call_sid, provider, from_number, virtual_number, duration_seconds, status, started_at, ended_at, cost_currency, created_at
      ) VALUES ($1, $2, $3, 'twilio', $4, $5, $6, 'completed', NOW() - interval '${duration} seconds', NOW(), $7, NOW())
      RETURNING id`,
      [businessId, countryCode, callSid, fromNumber, toNumber, duration, currency]
    );

    const dbCallId = insertCallResult.rows[0]?.id;

    if (dbCallId) {
      // 3. Format Vapi transcript into standard database array
      const rawTranscript = call.transcript || '';
      const lines = rawTranscript.split('\n').filter(l => l.trim().length > 0);
      const transcriptArray = lines.map(line => {
        const lower = line.toLowerCase();
        if (lower.startsWith('user:') || lower.startsWith('caller:')) {
          return { role: 'user', content: line.replace(/^(user|caller):/i, '').trim() };
        }
        return { role: 'assistant', content: line.replace(/^assistant:/i, '').trim() };
      });

      const summary = call.analysis?.summary || `${transcriptArray.length} turns.`;
      await upsertTranscript(dbCallId, businessId, transcriptArray, summary);

      // 4. Extract and save structured lead details if present
      const structuredData = call.analysis?.structuredData || {};
      
      // Helper to find key case-insensitively
      const getField = (obj, key) => {
        if (!obj) return null;
        const lowerKey = key.toLowerCase();
        for (const k of Object.keys(obj)) {
          if (k.toLowerCase() === lowerKey) {
            return obj[k];
          }
        }
        return null;
      };

      const extractedName = getField(structuredData, 'name');
      const extractedIntent = getField(structuredData, 'intent');
      const extractedLocation = getField(structuredData, 'location');
      const extractedApptTime = getField(structuredData, 'appointment_time') || getField(structuredData, 'budget');

      const hasLead = extractedName || extractedIntent || extractedLocation || extractedApptTime;

      if (hasLead) {
        try {
          await db.query(
            `INSERT INTO leads (business_id, call_id, phone, name, intent, budget, location, notes, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new', NOW())`,
            [
              businessId,
              dbCallId,
              fromNumber,
              extractedName || null,
              extractedIntent || 'inquiry',
              extractedApptTime || null,
              extractedLocation || null,
              JSON.stringify(structuredData)
            ]
          );
          console.log('[TELEPHONY SYNC] Lead auto-captured:', structuredData);
        } catch (dbErr) {
          console.error('[TELEPHONY SYNC] Lead save error:', dbErr.message);
        }
      }

      // 5. Save usage log and deduct minutes
      try {
        const mins = duration / 60;
        const cost_stt = (mins / 60) * 30; // Sarvam STT standard rate
        const cost_tts = (transcriptArray.length * 100 / 10000) * 15;
        const cost_telephony = mins * 0.71;
        const cost_total = cost_stt + cost_tts + cost_telephony;

        const now = new Date();
        const billingMonth = now.getMonth() + 1;
        const billingYear = now.getFullYear();

        await db.query(
          `INSERT INTO usage_logs (
            user_id, country_code, call_id, minutes_used, cost_stt, cost_tts, cost_telephony, cost_total, currency_code, billing_month, billing_year, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
          [
            businessId,
            countryCode,
            dbCallId,
            Math.ceil(mins),
            cost_stt,
            cost_tts,
            cost_telephony,
            cost_total,
            currency,
            billingMonth,
            billingYear
          ]
        );

        if (businessId) {
          await db.query(
            'UPDATE businesses SET minutes_used = minutes_used + $1 WHERE id = $2',
            [Math.ceil(mins), businessId]
          );
        }
      } catch (logErr) {
        console.error('[TELEPHONY SYNC] Usage logging error:', logErr.message);
      }
    }

    return res.status(200).json({ status: 'success' });
  } catch (err) {
    console.error('[TELEPHONY SYNC] handleTelephonySync error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ── STEP 5: Vapi Tool Call (Save Lead During Call) ────────────────────────────
async function handleSaveLeadTool(req, res) {
  try {
    const { message } = req.body;
    
    // Check if it's a tool call message from Vapi
    if (!message || message.type !== 'tool-calls') {
      // Sometimes Vapi sends tool call arguments directly depending on setup, but typically wraps it in message
      const toolCalls = req.body.toolCalls || [];
      if (toolCalls.length === 0) {
        return res.status(400).json({ error: 'Invalid payload. Expected tool-calls.' });
      }
    }

    const payloadMessage = message || req.body || {};
    const toolCalls = payloadMessage.toolCalls || [];
    const call = payloadMessage.call || {};
    const rawFrom = call.customer?.number || 'Unknown';
    const rawTo = call.phoneNumber?.number || 'Unknown';
    const fromNumber = rawFrom !== 'Unknown' ? '+' + rawFrom.replace(/\D/g, '') : rawFrom;
    let toNumber = rawTo !== 'Unknown' ? '+' + rawTo.replace(/\D/g, '') : rawTo;
    const callSid = call.id || 'Unknown';

    // 1. Resolve business owner details
    let businessId = req.query?.business_id || null;
    let countryCode = 'US';

    if (!businessId && toNumber && toNumber !== 'Unknown') {
      const phoneResult = await db.query(
        'SELECT business_id, country_code FROM phone_numbers WHERE number = $1 OR phone_number = $1 OR user_original_number = $1',
        [toNumber]
      );
      if (phoneResult.rows.length > 0) {
        businessId = phoneResult.rows[0].business_id;
        countryCode = phoneResult.rows[0].country_code || 'US';
      }
    }

    // Try assistantId lookup if we still don't have businessId
    const assistantId = call.assistantId;
    if (!businessId && assistantId) {
      const astResult = await db.query(
        'SELECT business_id FROM assistants WHERE id = $1',
        [assistantId]
      );
      if (astResult.rows.length > 0) {
        businessId = astResult.rows[0].business_id;
      }
    }

    // Fallback: Use the first business if not found (for Vapi web testing convenience)
    if (!businessId) {
      const firstBiz = await db.query('SELECT id, country_code FROM businesses LIMIT 1');
      businessId = firstBiz.rows[0]?.id || null;
      countryCode = firstBiz.rows[0]?.country_code || 'US';
    } else {
      // If we have businessId but didn't resolve countryCode (e.g. from assistantId path), lookup country
      if (!countryCode) {
        const bizRes = await db.query('SELECT country_code FROM businesses WHERE id = $1', [businessId]);
        countryCode = bizRes.rows[0]?.country_code || 'US';
      }
    }

    // 2. Find the db call record if it exists, or create one
    let dbCallId = null;
    const callResult = await db.query('SELECT id FROM calls WHERE call_sid = $1', [callSid]);
    if (callResult.rows.length > 0) {
      dbCallId = callResult.rows[0].id;
    } else {
      // Create a temporary call record so we can link it
      const insertCallResult = await db.query(
        `INSERT INTO calls (
          user_id, country_code, call_sid, provider, from_number, virtual_number, status, started_at, created_at
        ) VALUES ($1, $2, $3, 'twilio', $4, $5, 'in-progress', NOW(), NOW())
        RETURNING id`,
        [businessId, countryCode, callSid, fromNumber, toNumber]
      );
      dbCallId = insertCallResult.rows[0]?.id;
    }

    // 3. Process each tool call (usually just one)
    const results = [];
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function?.name;
      if (functionName === 'save_lead') {
        const args = toolCall.function.arguments || {};
        
        // Use case-insensitive helper to extract arguments
        const getField = (obj, key) => {
          if (!obj) return null;
          const lowerKey = key.toLowerCase();
          for (const k of Object.keys(obj)) {
            if (k.toLowerCase() === lowerKey) {
              return obj[k];
            }
          }
          return null;
        };

        const name = getField(args, 'name');
        const phone = getField(args, 'phone') || fromNumber;
        const intent = getField(args, 'intent') || 'inquiry';
        const location = getField(args, 'location');
        const appointmentTime = getField(args, 'appointment_time') || getField(args, 'budget');

        // Insert into leads table
        await db.query(
          `INSERT INTO leads (business_id, call_id, phone, name, intent, budget, location, notes, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new', NOW())`,
          [
            businessId,
            dbCallId,
            phone,
            name || null,
            intent || null,
            appointmentTime || null,
            location || null,
            JSON.stringify(args)
          ]
        );

        results.push({
          toolCallId: toolCall.id,
          result: "Lead details saved successfully to Supabase."
        });
      } else {
        results.push({
          toolCallId: toolCall.id,
          result: "Tool ignored."
        });
      }
    }

    // Return response in the format Vapi expects
    return res.status(200).json({ results });

  } catch (err) {
    console.error('[SAVE LEAD TOOL] Error:', err.stack);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  handleIncomingCall,
  handleRecording,
  handleCallStatus,
  handleTelephonySync,
  handleSaveLeadTool
};
