'use strict';

const db = require('../database/db');
const exotelProvider = require('../providers/exotel');
const GramaVoiceSession = require('../voice/sessions/GramaVoiceSession');
const { retrieveRelevantSchemes, buildGramaRagContext } = require('../services/gramaKnowledgeService');
const gnaniService = require('../services/gnaniService');

/**
 * Handle Inbound Exotel Call Webhook for BAVIO GRAMA
 */
async function handleExotelIncoming(req, res) {
  try {
    const callData = await exotelProvider.handleIncomingCall(req);
    const { providerCallId, callerNumber, calledNumber } = callData;

    console.log(`[ExotelController] Incoming call from ${callerNumber} to ${calledNumber} (CallSid: ${providerCallId})`);

    // Determine Language from query param or caller state prefix (default: Hindi/Tamil/Telugu)
    let lang = req.query.lang || req.body.lang || 'hi-IN';
    if (calledNumber.includes('44') || req.query.state === 'TN') lang = 'ta-IN';
    if (calledNumber.includes('40') || req.query.state === 'AP' || req.query.state === 'TS') lang = 'te-IN';

    // Insert call log into DB
    try {
      await db.query(
        `INSERT INTO calls (call_sid, provider, caller_number, called_number, status, voice_stack, started_at, created_at)
         VALUES ($1, 'exotel', $2, $3, 'in-progress', 'gnani_grama_v1', NOW(), NOW())
         ON CONFLICT (call_sid) DO NOTHING`,
        [providerCallId, callerNumber, calledNumber]
      );
    } catch (dbErr) {
      console.warn('[ExotelController] DB insert warning:', dbErr.message);
    }

    // Return Exotel Passthru XML / Applet response or WebSocket Stream Connect
    const wsUrl = (process.env.VOICE_STREAM_BASE_URL || 'wss://api.bavio.in').replace('http', 'ws');

    // Exotel audio response XML
    res.set('Content-Type', 'text/xml');
    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="female" language="${lang.slice(0, 2)}">Namaste! Bavio Grama AI Helpline mein aapka swagat hai.</Say>
  <Gather action="/api/calls/exotel/gather?lang=${lang}&amp;callSid=${providerCallId}" method="POST" input="speech" timeout="5" speechTimeout="auto">
    <Say>Kripya apna sawal boliye.</Say>
  </Gather>
</Response>`;

    return res.status(200).send(xmlResponse);
  } catch (err) {
    console.error('[ExotelController] Incoming call error:', err.message);
    res.set('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>An error occurred. Please call back later.</Say></Response>`);
  }
}

/**
 * Handle Exotel Gather Webhook (Turn-based / Telephony Speech Recognition fallback)
 */
async function handleExotelGather(req, res) {
  try {
    const callSid = req.query.callSid || req.body.CallSid || `exotel_${Date.now()}`;
    const lang = req.query.lang || 'hi-IN';
    const speechResult = req.body.SpeechResult || req.body.RecognitionResult || req.body.TranscriptionText || '';

    console.log(`[ExotelController] Gather Result for ${callSid}: "${speechResult}" (lang: ${lang})`);

    if (!speechResult || !speechResult.trim()) {
      res.set('Content-Type', 'text/xml');
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="/api/calls/exotel/gather?lang=${lang}&amp;callSid=${callSid}" method="POST" input="speech" timeout="5">
    <Say>Hum aapki aawaz nahi sun paye. Kripya apna sawal dobara boliye.</Say>
  </Gather>
</Response>`);
    }

    // 1. Grama RAG Knowledge Retrieval
    const relevantSchemes = retrieveRelevantSchemes(speechResult, lang, 2);
    const ragContext = buildGramaRagContext(relevantSchemes, lang);

    // 2. Gnani Evon LLM Reasoning
    const systemPrompt = `You are BAVIO GRAMA, an Indian AI Voice helpline assisting rural citizens. Answer briefly in 1-2 simple sentences in the caller's spoken language based on verified scheme details.`;
    const evonResult = await gnaniService.generateEvonCompletion(
      [{ role: 'user', content: speechResult }],
      {
        systemPrompt,
        retrievedContext: ragContext,
        temperature: 0.3
      }
    );

    const answerText = evonResult.text || (relevantSchemes[0]?.benefit?.hi || 'Is yojana ki jankari ke liye kripya 1551 par call karein.');

    // 3. Return Exotel Audio XML with Next Turn Gather
    res.set('Content-Type', 'text/xml');
    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="female" language="${lang.slice(0, 2)}">${answerText}</Say>
  <Gather action="/api/calls/exotel/gather?lang=${lang}&amp;callSid=${callSid}" method="POST" input="speech" timeout="5">
    <Say>Kya aap koi aur jankari chahte hain?</Say>
  </Gather>
</Response>`;

    return res.status(200).send(xmlResponse);
  } catch (err) {
    console.error('[ExotelController] Gather error:', err.message);
    res.set('Content-Type', 'text/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Technical issue. Please try again.</Say></Response>`);
  }
}

/**
 * Handle Exotel Call Status Webhook
 */
async function handleExotelStatus(req, res) {
  try {
    const callSid = req.body.CallSid || req.query.CallSid;
    const duration = parseInt(req.body.CallDuration || req.body.Duration || '0', 10);
    const status = req.body.Status || req.body.CallStatus || 'completed';

    console.log(`[ExotelController] Call status update: ${callSid} -> ${status} (${duration}s)`);

    if (callSid) {
      await db.query(
        `UPDATE calls 
         SET status = $1, duration_seconds = $2, ended_at = NOW() 
         WHERE call_sid = $3`,
        [status, duration, callSid]
      );
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('[ExotelController] Status callback error:', err.message);
    return res.status(500).send('Error');
  }
}

module.exports = {
  handleExotelIncoming,
  handleExotelGather,
  handleExotelStatus
};
