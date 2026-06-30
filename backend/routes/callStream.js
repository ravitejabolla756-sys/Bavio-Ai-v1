const WebSocket = require('ws');
const db = require('../database/db');
const openAIService = require('../services/openAIService');
const elevenLabsService = require('../services/elevenLabsService');
const deepgramService = require('../services/deepgramService');
const encryption = require('../utils/encryption');

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

  // Parse businessId from URL query param
  const urlObj = new URL(request.url, 'http://localhost');
  const businessId = urlObj.searchParams.get('businessId') || urlObj.searchParams.get('business_id');

  if (!businessId) {
    console.error('[Twilio Stream] No businessId provided. Closing connection.');
    ws.close();
    return;
  }

  // Fetch business & assistant details from DB
  let business = null;
  let assistant = null;
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

  if (!business || !assistant) {
    console.error('[Twilio Stream] Business or assistant not found. Closing.');
    ws.close();
    return;
  }

  const voiceId = assistant.voice;
  const language = assistant.language || 'en-US';
  const systemPrompt = openAIService.buildSystemPrompt(assistant, business);

  // Fetch client API keys if they exist
  let clientKeys = { deepgram: null, openai: null, elevenlabs: null };
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

  let streamSid = null;
  let callSid = null;
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
      const mulawAudio = await elevenLabsService.textToSpeech(greeting, voiceId, language, 'ulaw_8000', clientKeys.elevenlabs);
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
            `INSERT INTO leads (business_id, phone, name, intent, budget, location, notes, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'new', NOW())`,
            [
              businessId,
              llmResult.lead_data.phone || 'unknown',
              llmResult.lead_data.name || null,
              llmResult.lead_data.intent || null,
              llmResult.lead_data.budget || null,
              llmResult.lead_data.location || null,
              JSON.stringify(llmResult.lead_data)
            ]
          );
          console.log('[Twilio Stream] Lead captured and saved to DB');
        } catch (dbErr) {
          console.error('[Twilio Stream] Lead database save error:', dbErr.message);
        }
      }

      // 4. ElevenLabs TTS
      const replyAudio = await elevenLabsService.textToSpeech(llmResult.response_text, voiceId, language, 'ulaw_8000', clientKeys.elevenlabs);
      
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

      // Save call record
      const callInsert = await db.query(
        `INSERT INTO calls (
          user_id, business_id, caller_number, provider_call_id, call_status, status,
          provider, duration, duration_seconds, transcript, direction, started_at, ended_at
         )
         VALUES ($1, $1, 'unknown', $2, 'completed', 'completed', 'twilio_stream', $3, $4, $5, 'inbound', $6, NOW())
         RETURNING id`,
        [
          businessId,
          callSid || 'stream_call',
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
      }

      // Charge minutes
      const { incrementMinutesUsed } = require('../middleware/planEnforcement');
      await incrementMinutesUsed(businessId, durationMin);

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
  });
});

module.exports = { twilioWss };
