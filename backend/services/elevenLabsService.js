const axios = require('axios');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// Default voice: Rachel (ElevenLabs ID 21m00Tcm4TlvDq8ikWAM)
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

// Voice model to use - multilingual for non-English, turbo for English
const MULTILINGUAL_MODEL = 'eleven_multilingual_v2';
const TURBO_MODEL = 'eleven_turbo_v2_5';

/**
 * ElevenLabs language -> voice model selection.
 * Multilingual model handles Hindi, Tamil, etc. Turbo is faster for English.
 */
function pickModel(language = 'en-IN') {
  const lang = language.split('-')[0].toLowerCase();
  return lang === 'en' ? TURBO_MODEL : MULTILINGUAL_MODEL;
}

/**
 * Convert text to speech using ElevenLabs.
 *
 * @param {string} text         - Text to synthesize
 * @param {string} voiceId      - ElevenLabs voice ID (from assistants.voice column)
 * @param {string} language     - BCP-47 language code (e.g. 'hi-IN', 'en-US')
 * @param {string} outputFormat - Output format (e.g. 'ulaw_8000' or 'mp3_44100_128')
 * @param {string} apiKey       - Optional custom ElevenLabs API key
 * @returns {Promise<Buffer>} - Audio buffer
 */
async function textToSpeech(text, voiceId, language = 'en-IN', outputFormat = 'mp3_44100_128', apiKey = null) {
  const key = apiKey || ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error('[ElevenLabs TTS] ElevenLabs API key is not configured.');
  }
  if (!text || text.trim().length === 0) {
    throw new Error('[ElevenLabs TTS] Empty text provided');
  }

  const vid = voiceId || DEFAULT_VOICE_ID;
  const model = pickModel(language);

  console.log(`[ElevenLabs TTS] Synthesizing ${text.length} chars | voice: ${vid} | lang: ${language} | format: ${outputFormat}`);

  const url = `${ELEVENLABS_BASE_URL}/text-to-speech/${vid}?output_format=${outputFormat}`;

  const response = await axios.post(
    url,
    {
      text: text.slice(0, 2500),  // ElevenLabs limit
      model_id: model,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0,
        use_speaker_boost: true
      }
    },
    {
      headers: {
        'xi-api-key': key,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer',
      timeout: 20000
    }
  );

  const audioBuffer = Buffer.from(response.data);
  console.log(`[ElevenLabs TTS] Done - ${audioBuffer.length} bytes`);
  return audioBuffer;
}

/**
 * Synthesize speech - returns object compatible with Sarvam tts.synthesizeSpeech() callers.
 * Drop-in replacement: { audioBase64, audioBuffer }
 */
async function synthesizeSpeech(text, language = 'en-IN', voiceId, apiKey = null) {
  const audioBuffer = await textToSpeech(text, voiceId, language, 'mp3_44100_128', apiKey);
  return {
    audioBuffer,
    audioBase64: audioBuffer.toString('base64')
  };
}

module.exports = { textToSpeech, synthesizeSpeech };
