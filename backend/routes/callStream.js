const WebSocket = require('ws');
const db = require('../database/db');
const openAIService = require('../services/openAIService');
const deepgramService = require('../services/deepgramService');
const encryption = require('../utils/encryption');
const industryProfiles = require('../voice/profiles/industryProfiles');

// ── Voice stack routing (feature-flagged; default is current_openai) ─────────
const { selectVoiceStack, PROVIDER_MODULAR } = require('../voice/routing/voiceStackRouter');
const ModularVoiceSession = require('../voice/sessions/ModularVoiceSession');

const twilioWss = new WebSocket.Server({ noServer: true });

// Convert mulaw to 16-bit linear PCM (for energy/volume calculations)
function mulawToPcm(ulawByte) {
  const u = ~ulawByte;
  const sign = (u & 0x80) ? -1 : 1;
  const exponent = (u & 0x70) >> 4;
  const mantissa = u & 0x0F;
  let sample = (mantissa << 3) + 130;
  sample <<= (exponent - 1);
  return sign * (sample - 130);
}

// Calculate RMS energy (volume) of a mulaw packet
function getPacketEnergy(mulawBuffer) {
  let sum = 0;
  for (let i = 0; i < mulawBuffer.length; i++) {
    const pcm = mulawToPcm(mulawBuffer[i]);
    sum += pcm * pcm;
  }
  return Math.sqrt(sum / mulawBuffer.length);
}

// Build a WAVE header for raw mulaw bytes so Whisper can read it
function writeMulawWavHeader(dataLength) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(7, 20); // 7 = mu-law
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(8000, 24); // 8kHz
  header.writeUInt32LE(8000, 28); // 8000 bytes/sec
  header.writeUInt16LE(1, 32); // 1 byte block align
  header.writeUInt16LE(8, 34); // 8-bit
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

twilioWss.on('connection', async (ws, request) => {
  console.log('[Twilio Stream] New WebSocket connection established.');

  const urlObj = new URL(request.url, 'http://localhost');
  let callSid = urlObj.searchParams.get('callSid') || urlObj.searchParams.get('CallSid');
  const isPublicDemo = urlObj.searchParams.get('isPublicDemo') === 'true';
  const publicDemoSessionId = urlObj.searchParams.get('sessionId');

  if (!callSid) {
    console.error('[Twilio Stream] No callSid provided. Closing connection.');
    ws.close();
    return;
  }

  // 1. Resolve call session details strictly from DB
  let session = null;
  try {
    const sessionRes = await db.query(
      "SELECT * FROM call_sessions WHERE call_sid = $1 AND session_status = 'active' LIMIT 1",
      [callSid]
    );
    session = sessionRes.rows[0];
  } catch (err) {
    console.error('[Twilio Stream] Call session DB lookup error:', err.message);
    ws.close();
    return;
  }

  if (!session) {
    console.error(`[Twilio Stream] Active call session not found for CallSid: ${callSid}. Closing.`);
    ws.close();
    return;
  }

  // Enforce session expiration limits (5 minutes)
  const sessionAge = Date.now() - new Date(session.started_at).getTime();
  if (sessionAge > 5 * 60 * 1000) {
    console.error('[Twilio Stream] Call session expired (> 5 minutes). Closing.');
    ws.close();
    return;
  }

  const businessId = session.business_id;

  // Fetch business & assistant details from DB
  let business = null;
  let assistant = null;
  let isDemo = businessId === '00000000-0000-0000-0000-000000000000' || isPublicDemo;

  let publicDemoSession = null;
  if (isPublicDemo && publicDemoSessionId) {
    try {
      const demoRes = await db.query(
        "SELECT * FROM public_demo_sessions WHERE id = $1 LIMIT 1",
        [publicDemoSessionId]
      );
      if (demoRes.rows.length > 0) {
        publicDemoSession = demoRes.rows[0];
      }
    } catch (e) {
      console.error('[Twilio Stream] Public demo session lookup error:', e.message);
    }
  }

  if (!isPublicDemo && !isDemo) {
    try {
      const demoCheck = await db.query(
        "SELECT id FROM demo_sessions WHERE termination_reason = $1 LIMIT 1",
        [callSid]
      );
      if (demoCheck.rows.length > 0) {
        isDemo = true;
      }
    } catch (e) {
      console.error('[Twilio Stream] Demo check error:', e.message);
    }
  }

  if (isPublicDemo && publicDemoSession) {
    const LANGUAGE_CODES = {
      english: 'en-US',
      spanish: 'es-ES',
      french: 'fr-FR',
      german: 'de-DE',
      portuguese: 'pt-BR',
      arabic: 'ar-AE',
      hindi: 'hi-IN'
    };
    const langName = publicDemoSession.language || 'english';
    const bcp47Code = LANGUAGE_CODES[langName.toLowerCase()] || 'en-US';

    business = {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Bavio Public Demo',
      email: 'public-demo@bavio.in',
      phone: publicDemoSession.twilio_number || '+15555550100'
    };
    assistant = {
      name: `Bavio AI ${publicDemoSession.industry} Employee`,
      language: bcp47Code,
      voice: 'alloy',
      first_message: industryProfiles.getDemoGreeting(publicDemoSession.industry, langName)
    };
  } else if (isDemo) {
    business = {
      id: businessId, // use real businessId for plan/billing consumption
      name: 'Bavio Demo',
      email: 'demo@bavio.in',
      phone: '+15555550100'
    };
    assistant = {
      name: 'Bavio Demo Assistant',
      language: 'en-US',
      voice: 'alloy'
    };
  } else {
    try {
      const [bizRes, astRes] = await Promise.all([
        db.query('SELECT * FROM businesses WHERE id = $1', [businessId]),
        db.query('SELECT * FROM assistants WHERE business_id = $1 LIMIT 1', [businessId])
      ]);
      business = bizRes.rows[0];
      assistant = astRes.rows[0];
    } catch (err) {
      console.error('[Twilio Stream] DB lookup error:', err.message);
      ws.close();
      return;
    }
  }

  if (!business || !assistant) {
    console.error('[Twilio Stream] Business or assistant not found. Closing.');
    ws.close();
    return;
  }

  // ── Voice stack selection (feature-flagged) ─────────────────────────────
  // selectVoiceStack() returns 'current_openai' or 'modular_v1' based on:
  //   VOICE_STACK_PROVIDER, VOICE_STACK_ALLOWED_BUSINESS_IDS, VOICE_STACK_ROLLOUT_PERCENT
  // All current customers continue using the existing pipeline (current_openai).
  let voiceStack = 'current_openai';
  try {
    voiceStack = selectVoiceStack(businessId, { callSid });
  } catch (routerErr) {
    console.error('[Twilio Stream] VoiceRouter error, defaulting to current_openai:', routerErr.message);
  }

  // ── modular_v1 path ─────────────────────────────────────────────────────
  // Only entered when explicitly enabled. On any startup failure the session
  // throws and the connection is closed gracefully — NO fallback into the
  // current pipeline mid-call to avoid silent failures.
  if (voiceStack === PROVIDER_MODULAR) {
    console.log(`[Twilio Stream] Using modular_v1 session for callSid=${callSid}`);
    const modularSession = new ModularVoiceSession();
    const systemPromptForModular = isDemo
      ? openAIService.buildSystemPrompt(assistant, business)
      : openAIService.buildSystemPrompt(assistant, business);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        if (data.event === 'start') {
          const sid = data.start.streamSid;
          try {
            await modularSession.start({
              ws,
              callSid,
              streamSid : sid,
              business,
              assistant,
              systemPrompt: systemPromptForModular,
              isDemo,
            });
          } catch (startErr) {
            console.error('[Twilio Stream] ModularVoiceSession.start() failed:', startErr.message);
            ws.close();
          }
        } else if (data.event === 'media') {
          const chunk = Buffer.from(data.media.payload, 'base64');
          modularSession.handleAudio(chunk);
        } else if (data.event === 'stop') {
          await modularSession.end();
        }
      } catch (err) {
        console.error('[Twilio Stream][modular_v1] Message error:', err.message);
      }
    });

    ws.on('close', async () => {
      console.log('[Twilio Stream][modular_v1] WebSocket closed.');
      if (demoTimer) clearTimeout(demoTimer);
      await modularSession.end().catch(e => console.error('[Twilio Stream] modularSession.end error:', e.message));
    });

    return;  // Do NOT fall through to the current_openai code path
  }
  // ── END modular_v1 path ─────────────────────────────────────────────────

  const voiceId = assistant.voice;
  const language = assistant.language || 'en-US';

  const SHARED_DEMO_PROMPT = `You are Bavio's Shared Demo Assistant. Your goal is to demonstrate Bavio's capabilities to a potential customer in a friendly, conversational manner.
Answer questions about:
- What Bavio is: An AI receptionist platform that answers business calls, qualifies leads, and organizes conversations.
- How Bavio answers business calls: Instantly, naturally, and with 24/7 availability.
- How business information is provided to an AI receptionist: By entering services, FAQs, and receptionist rules in the onboarding or settings dashboard.
- How lead qualification works: Bavio pre-screens callers for budget, requirements, and contact details, then logs them.
- How phone-number forwarding works: Forward existing mobile or landline numbers to a dedicated Bavio number.
- What appears in the dashboard: Call logs, full transcripts, and qualified leads.
- Available plans: Starter, Growth, and Scale plans, starting from $49/mo (or ₹1,999/mo depending on country).
- What happens after payment: Users get a dedicated virtual number and their custom assistant goes live immediately.

Speak naturally, keep your answers concise and conversational, and let the caller know that this demo session will end automatically after 3 minutes.`;

  const systemPrompt = isPublicDemo && publicDemoSession
    ? industryProfiles.buildDemoSystemPrompt(publicDemoSession.industry, publicDemoSession.language || 'english')
    : (isDemo ? SHARED_DEMO_PROMPT : openAIService.buildSystemPrompt(assistant, business));

  // Fetch client API keys if they exist
  let clientKeys = { deepgram: null, openai: null, elevenlabs: null };
  if (!isPublicDemo) {
    try {
      const apiRes = await db.query(
        'SELECT service_name, api_key_encrypted FROM api_integrations WHERE business_id = $1',
        [businessId]
      );
      apiRes.rows.forEach(row => {
        try {
          clientKeys[row.service_name] = encryption.decrypt(row.api_key_encrypted);
        } catch (decErr) {
          console.error(`[Twilio Stream] Failed to decrypt ${row.service_name} API key:`, decErr.message);
        }
      });
    } catch (dbErr) {
      console.error('[Twilio Stream] Failed to fetch api_integrations:', dbErr.message);
    }
  }

  let streamSid = null;
  let demoTimer = null;
  let demoWarningTimer = null;

  if (isDemo) {
    // 30 Seconds Remaining Warning Timer
    demoWarningTimer = setTimeout(async () => {
      console.log(`[Twilio Stream] Demo call session reached 2.5 minutes (30s remaining) warning limit for CallSid: ${callSid}.`);
      try {
        const warnMsg = {
          english: "This call will end in 30 seconds. Thanks for trying Bavio.",
          hindi: "यह कॉल 30 सेकंड में समाप्त हो जाएगी। Bavio का उपयोग करने के लिए धन्यवाद।",
          spanish: "Esta llamada terminará en 30 segundos. Gracias por probar Bavio.",
          french: "Cet appel se terminera dans 30 secondes. Merci d'avoir essayé Bavio.",
          german: "Dieser Anruf endet in 30 Sekunden. Vielen Dank, dass Sie Bavio ausprobiert haben.",
          portuguese: "Esta chamada terminará em 30 segundos. Obrigado por experimentar a Bavio.",
          arabic: "ستنتهي هذه المكالمة خلال 30 ثانية. شكراً لتجربة Bavio."
        };
        const currentLang = (publicDemoSession ? publicDemoSession.language : 'english').toLowerCase();
        const msg = warnMsg[currentLang] || warnMsg.english;
        const mulawAudio = await openAIService.textToSpeech(msg, voiceId, language, 'ulaw_8000', clientKeys.openai);
        streamAudioToTwilio(mulawAudio);
      } catch (warnErr) {
        console.error('[Twilio Stream] Graceful demo warning TTS failed:', warnErr.message);
      }
    }, 150000); // 2.5 minutes (150 seconds)

    // Complete Call Termination Timer
    demoTimer = setTimeout(async () => {
      console.log(`[Twilio Stream] Demo call session reached 3 minutes limit for CallSid: ${callSid}. Terminating.`);
      try {
        const endMsg = {
          english: "Thanks for experiencing Bavio. Your 3-minute demo has ended. Goodbye.",
          hindi: "Bavio का अनुभव करने के लिए धन्यवाद। आपका 3 मिनट का डेमो समाप्त हो गया है। अलविदा।",
          spanish: "Gracias por experimentar Bavio. Su demostración de 3 minutos ha terminado. Adiós.",
          french: "Merci d'avoir fait l'expérience de Bavio. Votre démo de 3 minutes est terminée. Au revoir.",
          german: "Vielen Dank, dass Sie Bavio erlebt haben. Ihre 3-minütige Demo ist beendet. Auf Wiedersehen.",
          portuguese: "Obrigado por experimentar a Bavio. Sua demonstração de 3 minutos terminou. Adeus.",
          arabic: "شكراً لتجربتك Bavio. انتهى العرض التوضيحي الذي تبلغ مدته 3 دقائق. مع السلامة."
        };
        const currentLang = (publicDemoSession ? publicDemoSession.language : 'english').toLowerCase();
        const finalMsg = endMsg[currentLang] || endMsg.english;
        const mulawAudio = await openAIService.textToSpeech(finalMsg, voiceId, language, 'ulaw_8000', clientKeys.openai);
        streamAudioToTwilio(mulawAudio);
      } catch (endErr) {
        console.error('[Twilio Stream] Graceful demo end TTS failed:', endErr.message);
      }

      setTimeout(async () => {
        try {
          const twilioProvider = require('../providers/twilio');
          await twilioProvider.client.calls(callSid).update({ status: 'completed' });
        } catch (termErr) {
          console.error('[Twilio Stream] Failed to terminate demo call at Twilio:', termErr.message);
        }
      }, 4000); // Hang up 4 seconds after final greeting
    }, 180000); // 3 minutes
  }
  let audioChunks = [];
  let silenceCount = 0;
  let isProcessing = false;
  let isSpeaking = false;
  let playbackInterval = null;
  let playbackQueue = [];
  let conversationHistory = [];
  const startTime = Date.now();

  // Helper to send audio payload chunks to Twilio (20ms packets = 160 bytes of mulaw)
  const streamAudioToTwilio = (audioBuffer) => {
    // Clear any existing playback stream
    if (playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }
    
    playbackQueue = [];
    const chunkSize = 160;
    for (let offset = 0; offset < audioBuffer.length; offset += chunkSize) {
      playbackQueue.push(audioBuffer.slice(offset, offset + chunkSize));
    }

    isSpeaking = true;
    let idx = 0;

    playbackInterval = setInterval(() => {
      if (idx >= playbackQueue.length) {
        clearInterval(playbackInterval);
        playbackInterval = null;
        isSpeaking = false;
        console.log('[Twilio Stream] Finished streaming response to Twilio.');
        return;
      }

      if (ws.readyState === WebSocket.OPEN) {
        const payload = playbackQueue[idx].toString('base64');
        ws.send(JSON.stringify({
          event: 'media',
          streamSid: streamSid,
          media: {
            payload: payload
          }
        }));
      }
      idx++;
    }, 20); // Stream 20ms segments
  };

  // Helper to stop current AI playback (Barge-in / Interruption)
  const stopPlayback = () => {
    if (isSpeaking) {
      console.log('[Twilio Stream] Barge-in! Interrupting AI speech.');
      if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
      }
      playbackQueue = [];
      isSpeaking = false;

      // Send clear to Twilio
      if (ws.readyState === WebSocket.OPEN && streamSid) {
        ws.send(JSON.stringify({
          event: 'clear',
          streamSid: streamSid
        }));
      }
    }
  };

  // Play assistant greeting on connection
  const playGreeting = async () => {
    const greeting = assistant.first_message || assistant.greeting || 'Hello! How can I help you today?';
    conversationHistory.push({ role: 'assistant', content: greeting });
    console.log(`[Twilio Stream] Speaking Greeting: "${greeting}"`);
    try {
      const mulawAudio = await openAIService.textToSpeech(greeting, voiceId, language, 'ulaw_8000', clientKeys.openai);
      streamAudioToTwilio(mulawAudio);
    } catch (err) {
      console.error('[Twilio Stream] Failed to play greeting:', err.message);
    }
  };

  // Process user speech once silence is detected
  const processCallerSpeech = async (mulawAudioBuffer) => {
    console.log('[Twilio Stream] Processing caller speech...');
    isProcessing = true;
    stopPlayback(); // Stop any leftover speech if still playing

    try {
      // 1. Convert raw mulaw to WAV format
      const wavHeader = writeMulawWavHeader(mulawAudioBuffer.length);
      const wavBuffer = Buffer.concat([wavHeader, mulawAudioBuffer]);

      // 2. Speech-to-Text (STT) - Try Deepgram if key is available, else fallback to Whisper
      let transcript = '';
      const dgKey = clientKeys.deepgram || process.env.DEEPGRAM_API_KEY;
      if (dgKey) {
        try {
          transcript = await deepgramService.transcribeAudio(wavBuffer, language, dgKey);
        } catch (dgErr) {
          console.warn('[Twilio Stream] Deepgram transcription failed. Falling back to Whisper:', dgErr.message);
        }
      }

      if (!transcript) {
        // Fallback to Whisper
        const whisperResult = await openAIService.transcribeAudio(wavBuffer, language, clientKeys.openai);
        transcript = whisperResult.transcript || '';
      }

      if (!transcript || transcript.trim().length === 0) {
        console.log('[Twilio Stream] Empty transcript. Skipping response.');
        isProcessing = false;
        return;
      }

      conversationHistory.push({ role: 'user', content: transcript });

      // 3. GPT-4o LLM
      const llmResult = await openAIService.chat(systemPrompt, conversationHistory, clientKeys.openai);
      console.log(`[Twilio Stream] AI Reply: "${llmResult.response_text}"`);

      conversationHistory.push({ role: 'assistant', content: llmResult.response_text });

      // Save lead if captured
      if (llmResult.lead_data) {
        try {
          await db.query(
            `INSERT INTO leads (business_id, phone, name, intent, budget, location, notes, status, call_sid, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'new', $8, NOW())`,
            [
              businessId,
              llmResult.lead_data.phone || 'unknown',
              llmResult.lead_data.name || null,
              llmResult.lead_data.intent || null,
              llmResult.lead_data.budget || null,
              llmResult.lead_data.location || null,
              JSON.stringify(llmResult.lead_data),
              callSid || null
            ]
          );
          console.log('[Twilio Stream] Lead captured and saved to DB');
        } catch (dbErr) {
          console.error('[Twilio Stream] Lead database save error:', dbErr.message);
        }
      }

      // 4. ElevenLabs TTS
      const replyAudio = await openAIService.textToSpeech(llmResult.response_text, voiceId, language, 'ulaw_8000', clientKeys.openai);
      
      // 5. Stream back
      streamAudioToTwilio(replyAudio);

      // End call if requested
      if (llmResult.should_end) {
        console.log('[Twilio Stream] AI requested call end. Hanging up in 3 seconds.');
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        }, 3000);
      }

    } catch (err) {
      console.error('[Twilio Stream] Speech processing error:', err.message);
    } finally {
      isProcessing = false;
    }
  };

  // Save full call record on end
  const saveCallSummary = async () => {
    try {
      const durationSec = Math.ceil((Date.now() - startTime) / 1000);
      const durationMin = Math.ceil(durationSec / 60);

      console.log(`[Twilio Stream] Saving Call Summary. Duration: ${durationSec}s`);

      // Save call record — voice_stack column records which pipeline ran this call
      const callInsert = await db.query(
        `INSERT INTO calls (
          user_id, business_id, caller_number, provider_call_id, call_status, status,
          provider, voice_stack, duration, duration_seconds, transcript, direction, started_at, ended_at
         )
         VALUES ($1, $1, 'unknown', $2, 'completed', 'completed', 'twilio_stream', $3, $4, $5, $6, 'inbound', $7, NOW())
         RETURNING id`,
        [
          businessId,
          callSid || 'stream_call',
          voiceStack,        // 'current_openai' (always for this code path)
          durationMin,
          durationSec,
          JSON.stringify(conversationHistory),
          new Date(startTime)
        ]
      );

      const callId = callInsert.rows[0]?.id;

      // Upsert transcript
      if (callId) {
        await db.query(
          `INSERT INTO transcripts (call_id, business_id, transcript, summary)
           VALUES ($1, $2, $3, $4)`,
          [callId, businessId, JSON.stringify(conversationHistory), `${conversationHistory.length} turns.`]
        );

        // Link captured leads to this callId
        if (callSid) {
          await db.query(
            'UPDATE leads SET call_id = $1 WHERE call_sid = $2',
            [callId, callSid]
          );
        }
      }

      if (isPublicDemo && publicDemoSessionId) {
        await db.query(
          "UPDATE public_demo_sessions SET status = 'completed', expires_at = NOW() WHERE id = $1",
          [publicDemoSessionId]
        );
        console.log(`[Twilio Stream] Public demo session ${publicDemoSessionId} completed successfully.`);
      } else {
        // Charge seconds (monthly first, then top-up) for normal calls
        const { deductCallSeconds } = require('../middleware/planEnforcement');
        await deductCallSeconds(businessId, durationSec, callSid);
      }

    } catch (err) {
      console.error('[Twilio Stream] Failed to save call summary:', err.message);
    }
  };

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.event === 'start') {
        streamSid = data.start.streamSid;
        callSid = data.start.callSid;
        console.log(`[Twilio Stream] Start event received. StreamSid: ${streamSid}, CallSid: ${callSid}`);
        await playGreeting();
      }

      if (data.event === 'media') {
        // Stop playback immediately if user is talking
        const chunk = Buffer.from(data.media.payload, 'base64');
        const energy = getPacketEnergy(chunk);

        // Barge-in check: user speaks while AI speaks
        if (isSpeaking && energy > 400) {
          stopPlayback();
        }

        if (!isProcessing) {
          audioChunks.push(chunk);
          if (energy < 300) {
            silenceCount++;
          } else {
            silenceCount = 0; // reset
          }

          // 1.2s silence (60 packets of 20ms) -> user has finished speaking
          if (silenceCount >= 60 && audioChunks.length > 50) {
            silenceCount = 0;
            const fullAudio = Buffer.concat(audioChunks);
            audioChunks = [];
            await processCallerSpeech(fullAudio);
          }
        }
      }

      if (data.event === 'stop') {
        console.log('[Twilio Stream] Stop event received.');
        if (playbackInterval) clearInterval(playbackInterval);
        await saveCallSummary();
      }
    } catch (err) {
      console.error('[Twilio Stream] Message handler error:', err.message);
    }
  });

  ws.on('close', () => {
    console.log('[Twilio Stream] WebSocket connection closed.');
    if (playbackInterval) clearInterval(playbackInterval);
    if (demoTimer) clearTimeout(demoTimer);
    if (demoWarningTimer) clearTimeout(demoWarningTimer);
  });
});

module.exports = { twilioWss };
