/**
 * callController.js
 * ─────────────────────────────────────────────────────────────────────
 * Exotel-specific call controller for Bavio AI.
 *
 * This is NEW — separate from:
 *   controllers/twilioCallController.js  (DO NOT TOUCH)
 *   controllers/telephonyController.js   (DO NOT TOUCH)
 *
 * Webhooks:
 *   POST /calls/exotel/incoming    → handleIncomingExotel
 *   POST /calls/exotel/recording   → handleRecording
 *   POST /calls/exotel/status      → handleCallStatus
 *
 * ALWAYS return HTTP 200 to Exotel — never let it retry.
 */

const { supabase } = require('../database/db');
const redisService = require('../services/redis/redisService');
const { resolveBusinessFromCall } = require('../services/phone/callRoutingService');
const ttsService = require('../services/sarvam/tts');

// ── POST /calls/exotel/incoming ───────────────────────────────────────
async function handleIncomingExotel(req, res) {
  try {
    const { CallSid, From, To, Direction } = req.body;
    console.log(`[EXOTEL] Incoming: ${From} → ${To} | ${CallSid}`);

    // ── Route to business ─────────────────────────────────────────────
    const route = await resolveBusinessFromCall(To, From);

    if (!route) {
      console.log(`[EXOTEL] No route for ${To}`);
      return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="hi-IN">
    Namaste. Yeh number configure nahi hai. Please baad mein try karein.
  </Say>
  <Hangup/>
</Response>`);
    }

    const businessId = route.business_id;

    // ── Get assistant config ──────────────────────────────────────────
    const { data: assistant } = await supabase
      .from('assistants')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    const firstMessage = assistant?.first_message
      || 'Namaste! Main aapki kaise madad kar sakta hoon?';
    const language = assistant?.language || 'hi-IN';

    // ── Get business info ─────────────────────────────────────────────
    const { data: business } = await supabase
      .from('businesses')
      .select('name, phone, plan, minutes_limit, minutes_used')
      .eq('id', businessId)
      .maybeSingle();

    if (business && business.minutes_limit !== null && business.minutes_used !== null) {
      if (business.minutes_limit - business.minutes_used <= 0) {
        console.log(`[EXOTEL] Limit reached for business ${businessId} (${business.minutes_used}/${business.minutes_limit})`);
        return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${language}">
    Aapke account ka monthly limit poora ho chuka hai. Kripya upgrade/recharge karein.
  </Say>
  <Hangup/>
</Response>`);
      }
    }

    // ── Create call record ────────────────────────────────────────────
    const { data: call } = await supabase
      .from('calls')
      .insert({
        business_id: businessId,
        caller_number: From,
        provider_call_id: CallSid,
        call_status: 'started',
        provider: 'exotel',
        bavio_number: To,
        routing_method: route.routing_method,
        user_original_number: route.user_original_number
      })
      .select()
      .single();

    // ── Create Redis session ──────────────────────────────────────────
    await redisService.setSession('call:' + CallSid, {
      business_id: businessId,
      call_id: call?.id,
      assistant_id: assistant?.id,
      caller_number: From,
      bavio_number: To,
      business_phone: business?.phone,
      language,
      industry: assistant?.industry || 'general',
      transcript: [],
      turn: 0,
      lead_captured: false,
      lead_data: null,
      tts_chars_total: 0,
      routing_method: route.routing_method,
      started_at: Date.now()
    });

    // ── Generate TTS greeting ─────────────────────────────────────────
    let greetingXml;
    try {
      const audioBase64 = await ttsService.synthesizeSpeech(
        firstMessage, language
      );
      // Save audio file and serve URL
      let audioUrl = null;
      try {
        const storageService = require('../services/storage/storageService');
        const filename = storageService.buildTtsFileName(CallSid, 0);
        const result = await storageService.uploadTtsAudio(
          audioBase64?.audioBuffer || audioBase64,
          filename
        );
        audioUrl = result?.audioUrl || null;
      } catch (storageErr) {
        // Storage not available — fall back to Say
        console.log('[EXOTEL] Storage unavailable, using Say fallback');
      }

      if (audioUrl) {
        greetingXml = `<Play>${audioUrl}</Play>`;
      } else {
        greetingXml = `<Say language="${language}">${firstMessage}</Say>`;
      }
    } catch (ttsErr) {
      console.error('[EXOTEL] TTS error:', ttsErr.message);
      greetingXml = `<Say language="${language}">${firstMessage}</Say>`;
    }

    // ── ExoML response ────────────────────────────────────────────────
    return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${greetingXml}
  <Record
    action="${process.env.WEBHOOK_BASE_URL}/calls/exotel/recording"
    method="POST"
    maxLength="15"
    playBeep="false"
    timeout="3"
    finishOnKey=""
  />
</Response>`);

  } catch (err) {
    console.error('[EXOTEL] handleIncomingExotel error:', err.message);
    // ALWAYS return 200 to Exotel — never let it fail silently
    return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="hi-IN">
    Technical problem aa gayi. Please thodi der mein call karein.
  </Say>
  <Hangup/>
</Response>`);
  }
}

// ── POST /calls/exotel/recording ──────────────────────────────────────
async function handleRecording(req, res) {
  try {
    const { CallSid, RecordingUrl, RecordingDuration } = req.body;
    console.log(`[EXOTEL] Recording: ${CallSid}, ${RecordingDuration}s`);

    const session = await redisService.getSession('call:' + CallSid);
    if (!session) {
      console.log('[EXOTEL] No session found for:', CallSid);
      return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response><Hangup/></Response>`);
    }

    // Skip if recording too short (silence)
    if (parseInt(RecordingDuration) < 1) {
      return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Record
    action="${process.env.WEBHOOK_BASE_URL}/calls/exotel/recording"
    method="POST"
    maxLength="15"
    playBeep="false"
    timeout="3"
    finishOnKey=""
  />
</Response>`);
    }

    // Download recording from Exotel
    const axios = require('axios');
    let audioBuffer;
    try {
      const audioResponse = await axios.get(RecordingUrl + '.wav', {
        responseType: 'arraybuffer',
        auth: {
          username: process.env.EXOTEL_API_KEY,
          password: process.env.EXOTEL_API_TOKEN
        },
        timeout: 15000
      });
      audioBuffer = Buffer.from(audioResponse.data);
      console.log(`[EXOTEL] Audio downloaded: ${audioBuffer.length} bytes`);
    } catch (downloadErr) {
      console.error('[EXOTEL] Audio download failed:', downloadErr.message);
      return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${session.language}">
    Maafi kijiye, aapki awaaz nahi aayi. Phir se bolein.
  </Say>
  <Record
    action="${process.env.WEBHOOK_BASE_URL}/calls/exotel/recording"
    method="POST"
    maxLength="15"
    playBeep="false"
    timeout="3"
    finishOnKey=""
  />
</Response>`);
    }

    // STT — Sarvam STT
    let userText = '';
    try {
      const sttService = require('../services/sarvam/stt');
      const sttResult = await sttService.transcribeAudio(
        audioBuffer, session.language
      );
      userText = sttResult?.text?.trim() || sttResult?.transcript?.trim() || '';
      console.log(`[STT] "${userText.slice(0, 80)}"`);
    } catch (sttErr) {
      console.error('[STT] Failed:', sttErr.message);
      return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${session.language}">
    Sorry, main samajh nahi paya. Kya aap dobara bol sakte hain?
  </Say>
  <Record
    action="${process.env.WEBHOOK_BASE_URL}/calls/exotel/recording"
    method="POST"
    maxLength="15"
    playBeep="false"
    timeout="3"
    finishOnKey=""
  />
</Response>`);
    }

    // Update transcript
    session.transcript.push({ role: 'user', content: userText });
    session.turn += 1;

    // Get business + assistant
    const { data: business } = await supabase
      .from('businesses')
      .select('name, plan')
      .eq('id', session.business_id)
      .maybeSingle();

    const { data: assistant } = session.assistant_id
      ? await supabase
          .from('assistants')
          .select('*')
          .eq('id', session.assistant_id)
          .maybeSingle()
      : { data: null };

    // LLM
    let llmResult;
    try {
      const llmService = require('../services/sarvam/llm');
      const systemPrompt = llmService.buildSystemPrompt(assistant, business);
      llmResult = await llmService.generateResponse(
        session.transcript, systemPrompt
      );
    } catch (llmErr) {
      console.error('[LLM] Failed:', llmErr.message);
      llmResult = {
        response_text: 'Ek minute, main aapki baat samajhne ki koshish kar raha hoon.',
        lead_data: null,
        should_end: false
      };
    }

    // Update transcript
    session.transcript.push({
      role: 'assistant',
      content: llmResult.response_text
    });
    session.tts_chars_total =
      (session.tts_chars_total || 0) + llmResult.response_text.length;

    // Save lead if detected
    if (llmResult.lead_data && !session.lead_captured) {
      session.lead_captured = true;
      session.lead_data = llmResult.lead_data;
      try {
        await supabase.from('leads').insert({
          business_id: session.business_id,
          call_id: session.call_id,
          name: llmResult.lead_data.name || null,
          phone: llmResult.lead_data.phone || session.caller_number,
          intent: llmResult.lead_data.intent || null,
          budget: llmResult.lead_data.budget || null,
          location: llmResult.lead_data.location || null,
          notes: JSON.stringify(llmResult.lead_data),
          status: 'new'
        });
        console.log('[LEAD] Saved:', llmResult.lead_data);

        // WhatsApp alert — non-blocking
        if (session.business_phone) {
          try {
            const whatsappService = require('../services/whatsapp/whatsappService');
            whatsappService.sendLeadAlert(
              session.business_phone,
              llmResult.lead_data,
              { duration: RecordingDuration, caller_number: session.caller_number }
            ).catch(e => console.error('[WA]', e.message));
          } catch (waErr) {
            console.log('[WA] WhatsApp service not available');
          }
        }
      } catch (leadErr) {
        console.error('[LEAD] Save error:', leadErr.message);
      }
    }

    // Update Redis session
    await redisService.updateSession('call:' + CallSid, session);

    // TTS for response
    let responseXml;
    try {
      const ttsResult = await ttsService.synthesizeSpeech(
        llmResult.response_text, session.language
      );
      let audioUrl = null;
      try {
        const storageService = require('../services/storage/storageService');
        const filename = storageService.buildTtsFileName(CallSid, session.turn);
        const result = await storageService.uploadTtsAudio(
          ttsResult?.audioBuffer || ttsResult,
          filename
        );
        audioUrl = result?.audioUrl || null;
      } catch (e) {
        console.log('[EXOTEL] Storage unavailable for response TTS');
      }

      responseXml = audioUrl
        ? `<Play>${audioUrl}</Play>`
        : `<Say language="${session.language}">${llmResult.response_text}</Say>`;
    } catch (ttsErr) {
      console.error('[TTS] Failed:', ttsErr.message);
      responseXml = `<Say language="${session.language}">${llmResult.response_text}</Say>`;
    }

    // End call or continue
    if (llmResult.should_end || session.turn >= 20) {
      return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${responseXml}
  <Hangup/>
</Response>`);
    }

    return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${responseXml}
  <Record
    action="${process.env.WEBHOOK_BASE_URL}/calls/exotel/recording"
    method="POST"
    maxLength="15"
    playBeep="false"
    timeout="3"
    finishOnKey=""
  />
</Response>`);

  } catch (err) {
    console.error('[EXOTEL] handleRecording error:', err.message);
    return res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="hi-IN">
    Technical issue aa gaya. Baad mein call karein.
  </Say>
  <Hangup/>
</Response>`);
  }
}

// ── POST /calls/exotel/status ─────────────────────────────────────────
async function handleCallStatus(req, res) {
  try {
    const { CallSid, Status, Duration } = req.body;
    console.log(`[EXOTEL] Status: ${CallSid} → ${Status} (${Duration}s)`);

    if (Status !== 'completed') return res.sendStatus(200);

    const session = await redisService.getSession('call:' + CallSid);
    await redisService.deleteSession('call:' + CallSid);
    if (!session) return res.sendStatus(200);

    const duration = parseInt(Duration) || 0;
    const mins = duration / 60;

    // Update call record
    await supabase
      .from('calls')
      .update({
        call_status: 'completed',
        duration,
        ended_at: new Date().toISOString()
      })
      .eq('provider_call_id', CallSid);

    // Calculate costs
    const cost_stt = (mins / 60) * 30;                          // Sarvam STT ₹30/hr
    const cost_tts = ((session.tts_chars_total || 0) / 10000) * 15; // Sarvam TTS
    const cost_telephony = mins * 0.60;                          // Exotel India ~₹0.60/min
    const cost_total = cost_stt + cost_tts + cost_telephony;

    // Check if business has remaining minutes and calculate overage
    let is_overage = false;
    let cost_amount = 0;
    
    try {
      const { data: business } = await supabase
        .from('businesses')
        .select('plan, minutes_limit, minutes_used')
        .eq('id', session.business_id)
        .maybeSingle();

      if (business) {
        const business_plan = business.plan || 'free';
        const callMins = Math.ceil(mins);
        
        const dodoBilling = require('../services/dodoBillingService');
        const overageRate = dodoBilling.OVERAGE_RATES[business_plan.toLowerCase()] || 0;
        
        const prevUsed = business.minutes_used || 0;
        const limit = business.minutes_limit || 100;
        
        if (prevUsed >= limit) {
          is_overage = true;
          cost_amount = callMins * overageRate;
        } else if (prevUsed + callMins > limit) {
          is_overage = true;
          cost_amount = (prevUsed + callMins - limit) * overageRate;
        }
      }
    } catch (e) {
      console.log('[EXOTEL] Overage calculation look up failed:', e.message);
    }

    // Save usage log
    try {
      await supabase.from('usage_logs').insert({
        business_id: session.business_id,
        call_id: session.call_id,
        minutes_used: Math.ceil(mins),
        cost_stt,
        cost_tts,
        cost_telephony,
        cost_total,
        is_overage,
        cost_amount
      });
    } catch (e) {
      console.log('[USAGE] usage_logs insert error:', e.message);
    }

    // Save transcript
    const summary = `${session.transcript.length} turns. ` +
      (session.lead_captured
        ? `Lead: ${JSON.stringify(session.lead_data)}`
        : 'No lead captured.');

    try {
      await supabase.from('transcripts').insert({
        call_id: session.call_id,
        business_id: session.business_id,
        transcript: session.transcript,
        summary
      });
    } catch (e) {
      console.log('[TRANSCRIPT] Insert error:', e.message);
    }

    // Update business minutes_used
    try {
      const { data: biz } = await supabase
        .from('businesses')
        .select('minutes_used')
        .eq('id', session.business_id)
        .single();

      if (biz) {
        await supabase
          .from('businesses')
          .update({ minutes_used: (biz.minutes_used || 0) + Math.ceil(mins) })
          .eq('id', session.business_id);
      }
    } catch (e) {
      console.log('[MINUTES] Update error:', e.message);
    }

    console.log(`[EXOTEL] Call complete: ${Math.ceil(mins)} min, ₹${cost_total.toFixed(2)}`);
    return res.sendStatus(200);
  } catch (err) {
    console.error('[EXOTEL] handleCallStatus error:', err.message);
    return res.sendStatus(200);
  }
}

module.exports = {
  handleIncomingExotel,
  handleRecording,
  handleCallStatus
};
