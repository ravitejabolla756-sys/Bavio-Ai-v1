const axios = require('axios');
const FormData = require('form-data');

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

async function transcribeAudio(audioBuffer, language = 'hi-IN') {

  if (!SARVAM_API_KEY) {
    throw new Error('[STT] SARVAM_API_KEY not set in .env');
  }

  console.log(`[STT] Transcribing ${audioBuffer.length} bytes, lang: ${language}`);

  // Retry logic — max 3 attempts
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const form = new FormData();
      form.append('file', audioBuffer, {
        filename: 'audio.wav',
        contentType: 'audio/wav'
      });
      form.append('language_code', language);
      form.append('model', 'saarika:v2.5');
      form.append('with_timestamps', 'false');
      form.append('with_disfluencies', 'false');

      const response = await axios.post(
        process.env.SARVAM_STT_URL ||
          'https://api.sarvam.ai/speech-to-text',
        form,
        {
          headers: {
            'api-subscription-key': SARVAM_API_KEY,
            ...form.getHeaders()
          },
          timeout: 15000
        }
      );

      const text = response.data?.transcript || '';
      console.log(`[STT] Result (attempt ${attempt}): "${text.slice(0, 100)}"`);

      return {
        text,
        language_code: language
      };

    } catch (err) {
      lastError = err;
      console.error(`[STT] Attempt ${attempt} failed:`, err.message);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw new Error(`[STT] All 3 attempts failed: ${lastError.message}`);
}

module.exports = { transcribeAudio };
