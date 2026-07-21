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
const ttsService = require('../services/openAIService');

// ── POST /calls/exotel/incoming ───────────────────────────────────────
async function handleIncomingExotel(req, res) {
  try {
    const { CallSid, From, To, Direction } = req.body;
    console.log(`[EXOTEL] Incoming: ${From} → ${To} | ${CallSid}`);

    // ── Route to business ─────────────────────────────────────────────
    const route = await resolveBusinessFromCall(To, From, req);

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

    // ── Get business info ─────────────────────────────────────────────
    const { data: business } = await supabase
      .from('businesses')
      .select('name, phone, plan, minutes_limit, minutes_used, business_name, industry, owner_name, owner_phone, owner_email, language, system_prompt, first_message, call_handling_type, subscription_plan, country_code')
      .eq('id', businessId)
      .maybeSingle();

    const firstMessage = business?.first_message || assistant?.first_message
      || 'Namaste! Main aapki kaise madad kar sakta hoon?';
    const language = business?.language || assistant?.language || 'hi-IN';

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

    // ── Create call session ───────────────────────────────────────────
    const { data: callSession, error: sessionErr } = await supabase
      .from('call_sessions')
      .insert({
        call_sid: CallSid,
        business_id: businessId,
        caller_phone: From,
        exotel_number: To,
        session_status: 'in-progress'
      })
      .select()
      .single();

    if (sessionErr) {
      console.error('[EXOTEL] Call session insert error:', sessionErr.message);
    }

    // ── Create call log ───────────────────────────────────────────────
    await supabase
      .from('call_logs')
      .insert({
        call_sid: CallSid,
        business_id: businessId,
        duration: 0,
        cost: 0,
        status: 'started'
      });

    // ── Create call record (Legacy table for compatibility) ───────────
    const legacyRoutingMethod =
      route.routing_method === 'caller_whitelist' ? 'caller_id' :
      route.routing_method === 'provider_metadata' ? 'sip' : 'direct';

    const { data: call, error: callErr } = await supabase
      .from('calls')
      .insert({
        business_id: businessId,
        caller_number: From,
        provider_call_id: CallSid,
        call_status: 'started',
        provider: 'exotel',
        bavio_number: To,
        routing_method: legacyRoutingMethod,
        user_original_number: route.business_number,
        country_code: business?.country_code || 'IN'
      })
      .select()
      .single();

    if (callErr) {
      console.error('[EXOTEL] Legacy call insert error:', callErr.message);
    }

    // ── Create Redis session ──────────────────────────────────────────
    const redisSession = {
      business_id: businessId,
      business_number: route.business_number,
      business_name: business?.business_name || business?.name || 'Bavio Customer',
      exotel_number: To,
      caller_phone: From,
      industry: business?.industry || assistant?.industry || 'general',
      language: language,
      assistant_id: assistant?.id || null,
      conversation_history: [],
      lead_data: null,
      session_state: 'greeting',
      
      // Legacy compatibility fields
      call_id: call?.id,
      call_session_id: callSession?.id,
      caller_number: From,
      bavio_number: To,
      business_phone: business?.owner_phone || business?.phone,
      transcript: [],
      turn: 0,
      lead_captured: false,
      tts_chars_total: 0,
      routing_method: route.routing_method,
      started_at: Date.now()
    };

    await redisService.setSession('call:' + CallSid, redisSession);

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
      const sttService = require('../services/openAIService');
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

    // Update transcript and conversation history
    const chatTurn = { role: 'user', content: userText };
    session.transcript.push(chatTurn);
    if (!session.conversation_history) session.conversation_history = [];
    session.conversation_history.push(chatTurn);
    session.turn += 1;
    session.session_state = 'active';

    // Get business config
    const { data: business } = await supabase
      .from('businesses')
      .select('name, plan, system_prompt, first_message, call_handling_type')
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
      const llmService = require('../services/openAIService');
      // Build dynamic prompt using business system_prompt if available, else assistant
      const systemPrompt = business?.system_prompt || llmService.buildSystemPrompt(assistant, business);
      llmResult = await llmService.generateResponse(
        session.conversation_history, systemPrompt
      );
    } catch (llmErr) {
      console.error('[LLM] Failed:', llmErr.message);
      llmResult = {
        response_text: 'Ek minute, main aapki baat samajhne ki koshish kar raha hoon.',
        lead_data: null,
        should_end: false
      };
    }

    // Update assistant responses
    const assistantTurn = { role: 'assistant', content: llmResult.response_text };
    session.transcript.push(assistantTurn);
    session.conversation_history.push(assistantTurn);
    session.tts_chars_total = (session.tts_chars_total || 0) + llmResult.response_text.length;

    // Save lead if detected
    if (llmResult.lead_data && !session.lead_captured) {
      session.lead_captured = true;
      session.lead_data = llmResult.lead_data;
      try {
        // Save to leads table linking with call_sid
        const { error: leadErr } = await supabase.from('leads').insert({
          business_id: session.business_id,
          call_id: session.call_id || null,
          call_sid: CallSid,
          name: llmResult.lead_data.name || null,
          phone: llmResult.lead_data.phone || session.caller_phone || session.caller_number,
          intent: llmResult.lead_data.intent || null,
          budget: llmResult.lead_data.budget || null,
          location: llmResult.lead_data.location || null,
          notes: JSON.stringify(llmResult.lead_data),
          status: 'new'
        });
        if (leadErr) {
          console.error('[LEAD] Save error:', leadErr.message);
        } else {
          console.log('[LEAD] Saved:', llmResult.lead_data);
        }

        // Queue Whatsapp/Email Notification in notifications table
        const { error: notifErr } = await supabase.from('notifications').insert({
          business_id: session.business_id,
          type: 'whatsapp',
          recipient: session.business_phone,
          content: `New Lead: ${llmResult.lead_data.name || 'Unknown'} - ${llmResult.lead_data.intent || 'Inquiry'}`,
          status: 'pending'
        });
        if (notifErr) {
          console.error('[NOTIFICATION] Insert error:', notifErr.message);
        }

        // WhatsApp alert legacy service — non-blocking
        if (session.business_phone) {
          try {
            const whatsappService = require('../services/whatsapp/whatsappService');
            whatsappService.sendLeadAlert(
              session.business_phone,
              llmResult.lead_data,
              { duration: RecordingDuration, caller_number: session.caller_phone }
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

    // Update call_sessions table
    await supabase
      .from('call_sessions')
      .update({
        session_status: 'completed',
        ended_at: new Date().toISOString()
      })
      .eq('call_sid', CallSid);

    // Update legacy call record
    await supabase
      .from('calls')
      .update({
        call_status: 'completed',
        duration,
        ended_at: new Date().toISOString()
      })
      .eq('provider_call_id', CallSid);

    // Calculate costs
    const cost_stt = (mins / 60) * 0.15;                         // Whisper STT $0.15/hr
    const cost_tts = ((session.tts_chars_total || 0) / 10000) * 0.005; // US TTS
    const cost_telephony = mins * 0.013;                         // Twilio US $0.013/min
    const cost_total = cost_stt + cost_tts + cost_telephony;

    // Update call_logs record
    const { error: logErr } = await supabase
      .from('call_logs')
      .update({
        duration,
        cost: cost_total,
        status: 'completed'
      })
      .eq('call_sid', CallSid);

    if (logErr) {
      console.error('[EXOTEL] call_logs update error:', logErr.message);
    }

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
        const limit = business.minutes_limit || 30;
        
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

    // Save usage log linked with call_sid
    try {
      await supabase.from('usage_logs').insert({
        business_id: session.business_id,
        call_id: session.call_id,
        call_sid: CallSid,
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

    // Save transcript linked with call_sid
    const summary = `${(session.conversation_history || session.transcript).length} turns. ` +
      (session.lead_captured
        ? `Lead: ${JSON.stringify(session.lead_data)}`
        : 'No lead captured.');

    try {
      await supabase.from('transcripts').insert({
        call_id: session.call_id,
        call_sid: CallSid,
        business_id: session.business_id,
        transcript: session.conversation_history || session.transcript,
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
