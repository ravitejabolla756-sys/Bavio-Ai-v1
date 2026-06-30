const axios = require('axios');

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

/**
 * Transcribe audio buffer using Deepgram STT
 * @param {Buffer} audioBuffer - Raw audio buffer
 * @param {string} language - Language code (e.g. 'en-US', 'hi-IN')
 * @param {string} apiKey - Optional custom Deepgram API key
 * @returns {Promise<string>} - Transcript text
 */
async function transcribeAudio(audioBuffer, language = 'en-US', apiKey = null) {
  const key = apiKey || DEEPGRAM_API_KEY;
  if (!key) {
    throw new Error('[Deepgram STT] Deepgram API key is not configured.');
  }

  const lang = language || 'en-US';
  
  console.log(`[Deepgram STT] Transcribing ${audioBuffer.length} bytes (lang: ${lang})`);

  const response = await axios.post(
    `https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=${lang}`,
    audioBuffer,
    {
      headers: {
        Authorization: `Token ${key}`,
        'Content-Type': 'audio/wav'
      },
      timeout: 15000
    }
  );

  const transcript = response.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
  console.log(`[Deepgram STT] Transcript: "${transcript.slice(0, 120)}"`);
  return transcript.trim();
}

module.exports = { transcribeAudio };
