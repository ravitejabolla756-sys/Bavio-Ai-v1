'use strict';

const axios = require('axios');

// ── 1. CANONICAL SUPPORTED LANGUAGES ─────────────────────────────────────────
const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-IN', name: 'English (India)' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'hi-en', name: 'Hinglish' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'ta-IN', name: 'Tamil' },
];

// ── 2. CANONICAL BAVIO VOICE CATALOG ──────────────────────────────────────────
const BAVIO_VOICE_CATALOG = [
  {
    id: 'bavio_voice_arjun',
    name: 'Arjun',
    gender: 'male',
    tone: 'friendly',
    description: 'Warm, natural and conversational',
    supportedLanguages: ['en-US', 'en-IN', 'hi-IN', 'hi-en'],
    previewAvailable: true,
    _provider: 'elevenlabs',
    _providerVoiceId: 'pNInz6obpgDQGcFmaJgB', // Adam / Arjun
  },
  {
    id: 'bavio_voice_ananya',
    name: 'Ananya',
    gender: 'female',
    tone: 'professional',
    description: 'Clear, confident and articulate',
    supportedLanguages: ['en-US', 'en-IN', 'hi-IN', 'hi-en', 'te-IN', 'ta-IN'],
    previewAvailable: true,
    _provider: 'sarvam',
    _providerVoiceId: 'aditi',
  },
  {
    id: 'bavio_voice_sarah',
    name: 'Sarah',
    gender: 'female',
    tone: 'friendly',
    description: 'Bright, engaging and empathetic',
    supportedLanguages: ['en-US'],
    previewAvailable: true,
    _provider: 'elevenlabs',
    _providerVoiceId: 'EXAVITQu4vr4xnSDxMaL',
  },
  {
    id: 'bavio_voice_marcus',
    name: 'Marcus',
    gender: 'male',
    tone: 'calm',
    description: 'Deep, reassuring and authoritative',
    supportedLanguages: ['en-US'],
    previewAvailable: true,
    _provider: 'elevenlabs',
    _providerVoiceId: 'VR6AewLTigWG4xSOukaG',
  },
  {
    id: 'bavio_voice_vikram',
    name: 'Vikram',
    gender: 'male',
    tone: 'confident',
    description: 'Professional, energetic and clear',
    supportedLanguages: ['en-US', 'en-IN', 'hi-IN', 'hi-en', 'te-IN'],
    previewAvailable: true,
    _provider: 'elevenlabs',
    _providerVoiceId: 'ErXwobaYiN019PkySvjV',
  },
  {
    id: 'bavio_voice_priya',
    name: 'Priya',
    gender: 'female',
    tone: 'conversational',
    description: 'Friendly, expressive and helpful',
    supportedLanguages: ['en-US', 'en-IN', 'hi-IN', 'hi-en', 'ta-IN'],
    previewAvailable: true,
    _provider: 'elevenlabs',
    _providerVoiceId: '21m00Tcm4TlvDq8ikWAM',
  },
  {
    id: 'bavio_voice_dev',
    name: 'Dev',
    gender: 'male',
    tone: 'energetic',
    description: 'Dynamic, upbeat and clear',
    supportedLanguages: ['en-US', 'en-IN', 'hi-IN'],
    previewAvailable: true,
    _provider: 'elevenlabs',
    _providerVoiceId: 'TxGEqnHWrfWFTfGW9XjX',
  },
  {
    id: 'bavio_voice_kavya',
    name: 'Kavya',
    gender: 'female',
    tone: 'empathetic',
    description: 'Soft-spoken, calm and polite',
    supportedLanguages: ['en-US', 'en-IN', 'hi-IN', 'te-IN', 'ta-IN'],
    previewAvailable: true,
    _provider: 'sarvam',
    _providerVoiceId: 'meera',
  },
  {
    id: 'bavio_voice_rohan',
    name: 'Rohan',
    gender: 'male',
    tone: 'conversational',
    description: 'Casual, clear and friendly',
    supportedLanguages: ['en-US', 'en-IN', 'hi-IN'],
    previewAvailable: true,
    _provider: 'elevenlabs',
    _providerVoiceId: 'N2l01tihxBBnnA5pDmcL',
  },
];

// Audio preview cache: key = `${voiceId}_${langCode}` -> Buffer
const previewAudioCache = new Map();

// Localized preview phrases
const PREVIEW_PHRASES = {
  'en-US': 'Thanks for calling. How can I help you today?',
  'en-IN': 'Thanks for calling. How can I help you today?',
  'hi-IN': 'नमस्कार, बाविओ में आपका स्वागत है। मैं आपकी क्या मदद कर सकता हूँ?',
  'hi-en': 'Hi there, thanks for calling. Aapki kya help kar sakta hoon?',
  'te-IN': 'నమస్కారం, బావియోకి స్వాగతం. నేను మీకు ఎలా సహాయం చేయగలను?',
  'ta-IN': 'வணக்கம், பாவியோவிற்கு வரவேற்கிறோம். நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?',
};

/**
 * Returns supported languages list
 */
function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

/**
 * Returns canonical voice catalog stripped of internal provider fields.
 */
function getVoiceCatalog() {
  return BAVIO_VOICE_CATALOG.map(({ _provider, _providerVoiceId, ...publicVoice }) => publicVoice);
}

/**
 * Finds a voice by ID
 */
function getVoiceById(voiceId) {
  const v = BAVIO_VOICE_CATALOG.find(item => item.id === voiceId || item._providerVoiceId === voiceId);
  if (!v) return null;
  const { _provider, _providerVoiceId, ...publicVoice } = v;
  return publicVoice;
}

/**
 * Checks if a voice ID is compatible with a selected primary language.
 */
function isVoiceCompatible(voiceId, languageCode) {
  const voice = BAVIO_VOICE_CATALOG.find(v => v.id === voiceId || v._providerVoiceId === voiceId);
  if (!voice) return false;
  if (!languageCode) return true;
  return voice.supportedLanguages.includes(languageCode);
}

/**
 * Generates or retrieves cached preview audio buffer for a given voice and language.
 */
async function getVoicePreviewAudio(voiceId, languageCode = 'en-US') {
  const voice = BAVIO_VOICE_CATALOG.find(v => v.id === voiceId || v._providerVoiceId === voiceId);
  if (!voice) {
    throw new Error('Voice not found');
  }

  const cacheKey = `${voice.id}_${languageCode}`;
  if (previewAudioCache.has(cacheKey)) {
    return previewAudioCache.get(cacheKey);
  }

  const textToSynthesize = PREVIEW_PHRASES[languageCode] || PREVIEW_PHRASES['en-US'];
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  const sarvamKey = process.env.SARVAM_API_KEY;

  // 1. Try Sarvam TTS for Sarvam voices if key available
  if (voice._provider === 'sarvam' && sarvamKey && !sarvamKey.includes('your_')) {
    try {
      const sarvamLang = languageCode === 'hi-en' ? 'hi-IN' : (languageCode || 'hi-IN');
      const response = await axios.post(
        'https://api.sarvam.ai/text-to-speech',
        {
          inputs: [textToSynthesize],
          target_language_code: sarvamLang,
          speaker: voice._providerVoiceId || 'aditi',
          pitch: 0,
          pace: 1.05,
          loudness: 1.5,
          speech_sample_rate: 8000,
          enable_preprocessing: true,
          model: 'bulbul-v3',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': sarvamKey,
          },
          timeout: 8000,
        }
      );
      const base64Audio = response.data?.audios?.[0] || response.data?.audio || '';
      if (base64Audio) {
        const audioBuffer = Buffer.from(base64Audio, 'base64');
        previewAudioCache.set(cacheKey, audioBuffer);
        return audioBuffer;
      }
    } catch (err) {
      console.warn(`[VOICE PREVIEW] Sarvam synthesis failed for ${voice.id}:`, err.message);
    }
  }

  // 2. Try ElevenLabs REST TTS synthesis for ElevenLabs voices if key available
  if (voice._provider === 'elevenlabs' && elevenLabsKey && !elevenLabsKey.includes('your_')) {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice._providerVoiceId}`,
        {
          text: textToSynthesize,
          model_id: languageCode === 'hi-en' || languageCode === 'hi-IN' || languageCode === 'te-IN' || languageCode === 'ta-IN' ? 'eleven_multilingual_v2' : 'eleven_flash_v2_5',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        },
        {
          headers: {
            'xi-api-key': elevenLabsKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          responseType: 'arraybuffer',
          timeout: 8000,
        }
      );
      const audioBuffer = Buffer.from(response.data);
      previewAudioCache.set(cacheKey, audioBuffer);
      return audioBuffer;
    } catch (err) {
      console.warn(`[VOICE PREVIEW] ElevenLabs synthesis failed for ${voice.id}:`, err.message);
    }
  }

  // 3. Try ElevenLabs static preview proxy if provider voice ID exists
  if (elevenLabsKey && !elevenLabsKey.includes('your_') && voice._providerVoiceId) {
    try {
      const response = await axios.get(
        `https://api.elevenlabs.io/v1/voices/${voice._providerVoiceId}/previews`,
        { responseType: 'arraybuffer', timeout: 5000 }
      );
      const audioBuffer = Buffer.from(response.data);
      previewAudioCache.set(cacheKey, audioBuffer);
      return audioBuffer;
    } catch (err) {
      console.warn(`[VOICE PREVIEW] ElevenLabs preview fetch failed for ${voice.id}:`, err.message);
    }
  }

  // FAIL CLOSED: No silent synthetic tone fallback or voice replacement
  throw new Error(`Real preview audio generation failed for voice ${voice.id} (${languageCode}).`);
}

/**
 * Normalizes Hinglish (hi-en) and regional language configurations for STT/TTS/LLM providers.
 */
function getNormalizedLanguageMapping(langCode) {
  if (langCode === 'hi-en') {
    return {
      sttCode: 'hi-IN',
      ttsCode: 'hi-IN',
      elevenLabsModel: 'eleven_multilingual_v2',
      promptInstruction: 'The caller will communicate in Hinglish (a conversational blend of Hindi and English). Respond naturally in clear Hinglish.',
    };
  }
  return {
    sttCode: langCode || 'en-US',
    ttsCode: langCode || 'en-US',
    elevenLabsModel: langCode?.startsWith('en') ? 'eleven_flash_v2_5' : 'eleven_multilingual_v2',
    promptInstruction: null,
  };
}

module.exports = {
  getSupportedLanguages,
  getVoiceCatalog,
  getVoiceById,
  isVoiceCompatible,
  getVoicePreviewAudio,
  getNormalizedLanguageMapping,
};
