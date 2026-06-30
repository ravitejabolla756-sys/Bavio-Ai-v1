const openAIService = require('../openAIService');

async function transcribeAudio(audioBuffer, language = 'hi-IN') {
  console.log(`[STT Proxy] Transcribing audio with OpenAI Whisper (requested lang: ${language})`);
  return openAIService.transcribeAudio(audioBuffer, language);
}

module.exports = { transcribeAudio };
