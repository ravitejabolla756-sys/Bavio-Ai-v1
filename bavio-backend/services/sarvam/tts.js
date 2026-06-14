const axios = require('axios');

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

/**
 * Synthesizes speech using Sarvam AI TTS.
 *
 * Returns: { audioBase64, audioBuffer }
 *   - audioBase64: raw base64 string (for debugging / legacy)
 *   - audioBuffer: Buffer ready for Supabase Storage upload
 *
 * Upload to Supabase and get a public URL in the CALLER (twilioCallController),
 * not here. This keeps TTS focused on audio generation only.
 */
async function synthesizeSpeech(
  text,
  language = 'hi-IN',
  speaker = 'meera'
) {
  if (!SARVAM_API_KEY) {
    throw new Error('[TTS] SARVAM_API_KEY not set in .env');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('[TTS] Empty text provided');
  }

  // bulbul:v2 compatible speakers: anushka, abhilash, manisha, vidya, arya, karun, hitesh
  let activeSpeaker = speaker;
  const validV2Speakers = ['anushka', 'abhilash', 'manisha', 'vidya', 'arya', 'karun', 'hitesh'];
  if (!validV2Speakers.includes(activeSpeaker.toLowerCase())) {
    activeSpeaker = 'anushka';
  }

  console.log(`[TTS] Synthesizing ${text.length} chars, lang: ${language}, speaker: ${activeSpeaker}`);

  // Chunk if text > 450 chars — Sarvam TTS has character limits
  const chunks = chunkText(text, 450);
  const audioParts = [];

  for (const chunk of chunks) {
    const response = await axios.post(
      process.env.SARVAM_TTS_URL || 'https://api.sarvam.ai/text-to-speech',
      {
        inputs: [chunk],
        target_language_code: language,
        speaker: activeSpeaker,
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: 'bulbul:v2'
      },
      {
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const audioBase64 = response.data?.audios?.[0];
    if (!audioBase64) {
      throw new Error('[TTS] No audio returned from Sarvam');
    }

    audioParts.push(audioBase64);
  }

  // Concatenate multiple chunks if needed
  const finalBase64 =
    audioParts.length === 1
      ? audioParts[0]
      : concatenateBase64Audio(audioParts);

  const audioBuffer = Buffer.from(finalBase64, 'base64');
  console.log(`[TTS] Done — ${audioBuffer.length} bytes of WAV audio`);

  return {
    audioBase64: finalBase64,
    audioBuffer
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Split text into chunks at sentence boundaries
function chunkText(text, maxChars) {
  if (text.length <= maxChars) return [text];

  const chunks = [];
  const sentences = text.split(/(?<=[।.!?])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text.slice(0, maxChars)];
}

// Concatenate multiple base64 WAV buffers
function concatenateBase64Audio(parts) {
  const buffers = parts.map(p => Buffer.from(p, 'base64'));
  return Buffer.concat(buffers).toString('base64');
}

module.exports = { synthesizeSpeech };
