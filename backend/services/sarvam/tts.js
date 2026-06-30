const elevenLabsService = require('../elevenLabsService');

async function synthesizeSpeech(text, language = 'hi-IN', speaker = 'meera') {
  console.log(`[TTS Proxy] Synthesizing audio with ElevenLabs (requested lang: ${language}, speaker: ${speaker})`);
  // Map any speaker parameter to voiceId if necessary, otherwise pass it directly
  return elevenLabsService.synthesizeSpeech(text, language, speaker);
}

module.exports = { synthesizeSpeech };
