'use strict';

/**
 * Provider Capability Registry
 * Central catalog of AI, STT, and TTS engines and their dynamic routing capabilities.
 */

const PROVIDER_REGISTRY = {
  intelligence: [
    {
      provider: 'openai',
      model: 'gpt-5.4-mini',
      displayName: 'GPT-5.4 mini',
      tier: 'swift',
      latencyClass: 'ultra_low',
      costClass: 'low',
      supportsStreaming: true,
      supportsRealtime: true,
      supportedLanguages: ['*'],
      status: 'active',
    },
    {
      provider: 'openai',
      model: 'gpt-5.4',
      displayName: 'GPT-5.4',
      tier: 'core',
      latencyClass: 'low',
      costClass: 'medium',
      supportsStreaming: true,
      supportsRealtime: true,
      supportedLanguages: ['*'],
      status: 'active',
    },
    {
      provider: 'openai',
      model: 'gpt-5.5',
      displayName: 'GPT-5.5',
      tier: 'prime',
      latencyClass: 'standard',
      costClass: 'high',
      supportsStreaming: true,
      supportsRealtime: true,
      supportedLanguages: ['*'],
      status: 'active',
    },
    {
      provider: 'anthropic',
      model: 'claude-opus-5',
      displayName: 'Claude Opus 5',
      tier: 'prime',
      latencyClass: 'standard',
      costClass: 'high',
      supportsStreaming: true,
      supportsRealtime: false,
      supportedLanguages: ['*'],
      status: 'active',
    },
    {
      provider: 'sarvam',
      model: 'sarvam-30b',
      displayName: 'Sarvam-30B',
      tier: 'swift',
      latencyClass: 'low',
      costClass: 'low',
      supportsStreaming: true,
      supportsRealtime: true,
      supportedLanguages: ['hi-IN', 'te-IN', 'ta-IN', 'kn-IN', 'bn-IN', 'mr-IN', 'gu-IN', 'pa-IN', 'en-IN'],
      status: 'active',
    },
    {
      provider: 'sarvam',
      model: 'sarvam-105b',
      displayName: 'Sarvam-105B',
      tier: 'core',
      latencyClass: 'low',
      costClass: 'medium',
      supportsStreaming: true,
      supportsRealtime: true,
      supportedLanguages: ['hi-IN', 'te-IN', 'ta-IN', 'kn-IN', 'bn-IN', 'mr-IN', 'gu-IN', 'pa-IN', 'en-IN'],
      status: 'active',
    },
  ],

  stt: [
    {
      provider: 'elevenlabs',
      model: 'scribe-v2-realtime',
      displayName: 'ElevenLabs Scribe v2 Realtime',
      tier: ['swift', 'core', 'prime'],
      latencyClass: 'ultra_low',
      supportsStreaming: true,
      supportedLanguages: ['*'],
      status: 'active',
    },
    {
      provider: 'sarvam',
      model: 'saaras-v3',
      displayName: 'Sarvam Saaras v3',
      tier: ['swift', 'core', 'prime'],
      latencyClass: 'ultra_low',
      supportsStreaming: true,
      supportedLanguages: ['hi-IN', 'te-IN', 'ta-IN', 'kn-IN', 'bn-IN', 'mr-IN', 'gu-IN', 'pa-IN', 'en-IN'],
      status: 'active',
    },
    {
      provider: 'deepgram',
      model: 'nova-2',
      displayName: 'Deepgram Nova-2',
      tier: ['swift', 'core'],
      latencyClass: 'ultra_low',
      supportsStreaming: true,
      supportedLanguages: ['*'],
      status: 'active',
    },
  ],

  tts: [
    {
      provider: 'elevenlabs',
      model: 'flash-v2.5',
      displayName: 'ElevenLabs Flash v2.5',
      tier: ['swift'],
      latencyClass: 'ultra_low',
      supportsStreaming: true,
      supportedLanguages: ['*'],
      status: 'active',
    },
    {
      provider: 'elevenlabs',
      model: 'multilingual-v2',
      displayName: 'ElevenLabs Multilingual v2',
      tier: ['core', 'prime'],
      latencyClass: 'low',
      supportsStreaming: true,
      supportedLanguages: ['*'],
      status: 'active',
    },
    {
      provider: 'elevenlabs',
      model: 'v3',
      displayName: 'ElevenLabs v3',
      tier: ['prime'],
      latencyClass: 'standard',
      supportsStreaming: true,
      supportedLanguages: ['*'],
      status: 'active',
    },
    {
      provider: 'sarvam',
      model: 'bulbul-v3',
      displayName: 'Sarvam Bulbul v3',
      tier: ['swift', 'core', 'prime'],
      latencyClass: 'ultra_low',
      supportsStreaming: true,
      supportedLanguages: ['hi-IN', 'te-IN', 'ta-IN', 'kn-IN', 'bn-IN', 'mr-IN', 'gu-IN', 'pa-IN', 'en-IN'],
      status: 'active',
    },
  ],
};

function getProviderRegistry() {
  return PROVIDER_REGISTRY;
}

module.exports = {
  PROVIDER_REGISTRY,
  getProviderRegistry,
};
