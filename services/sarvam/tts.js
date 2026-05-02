const axios = require('axios');

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

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

  console.log(`[TTS] Synthesizing ${text.length} chars, lang: ${language}, speaker: ${speaker}`);

  // Chunk if text > 500 chars
  // Sarvam TTS has character limits
  const chunks = chunkText(text, 450);
  const audioParts = [];

  for (const chunk of chunks) {
    const response = await axios.post(
      process.env.SARVAM_TTS_URL ||
        'https://api.sarvam.ai/text-to-speech',
      {
        inputs: [chunk],
        target_language_code: language,
        speaker: speaker,
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

  // If only one chunk, return directly
  // If multiple chunks, concatenate base64
  const finalAudio = audioParts.length === 1
    ? audioParts[0]
    : concatenateBase64Audio(audioParts);

  console.log(`[TTS] Done — ${finalAudio.length} chars of base64 audio`);
  return finalAudio;
}

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

// Simple base64 concatenation for audio parts
function concatenateBase64Audio(parts) {
  const buffers = parts.map(p => Buffer.from(p, 'base64'));
  return Buffer.concat(buffers).toString('base64');
}

module.exports = { synthesizeSpeech };
