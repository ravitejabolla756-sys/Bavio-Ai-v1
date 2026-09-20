'use strict';

/**
 * Bavio Voice Worker Config
 *
 * Production defaults intentionally favor the ultra-low-latency modular stack
 * components without globally enabling modular_v1 for every tenant. Rollout is
 * still controlled by VOICE_STACK_PROVIDER / allowlist / rollout percentage.
 */

const PROVIDER_CURRENT  = 'current_openai';
const PROVIDER_MODULAR  = 'modular_v1';
const VALID_PROVIDERS   = [PROVIDER_CURRENT, PROVIDER_MODULAR];
const VALID_LLM_BACKENDS = ['cerebras', 'groq', 'openai'];

function numberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function buildConfig() {
  const provider = (process.env.VOICE_STACK_PROVIDER || PROVIDER_CURRENT).trim().toLowerCase();
  if (!VALID_PROVIDERS.includes(provider)) {
    throw new Error(`[VoiceConfig] Invalid VOICE_STACK_PROVIDER "${provider}".`);
  }

  const rolloutPercent = numberEnv('VOICE_STACK_ROLLOUT_PERCENT', 0);
  const allowedBusinessIds = new Set(
    (process.env.VOICE_STACK_ALLOWED_BUSINESS_IDS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  );

  // Groq GPT-OSS 20B is the realtime default. OpenAI is the fallback.
  // Cerebras remains supported but is not selected by default.
  const primaryLlm  = (process.env.VOICE_PRIMARY_LLM  || 'groq').trim().toLowerCase();
  const fallbackLlm = (process.env.VOICE_FALLBACK_LLM || 'openai').trim().toLowerCase();

  if (!VALID_LLM_BACKENDS.includes(primaryLlm) || !VALID_LLM_BACKENDS.includes(fallbackLlm)) {
    throw new Error(
      `[VoiceConfig] Invalid LLM routing: primary=${primaryLlm} fallback=${fallbackLlm}`
    );
  }

  const deepgram = {
    _apiKey : process.env.DEEPGRAM_API_KEY || null,
    model   : process.env.DEEPGRAM_MODEL || 'flux-general-en',
    eagerEotThreshold: numberEnv('DEEPGRAM_EAGER_EOT_THRESHOLD', 0.4),
    eotThreshold: numberEnv('DEEPGRAM_EOT_THRESHOLD', 0.7),
    eotTimeoutMs: numberEnv('DEEPGRAM_EOT_TIMEOUT_MS', 6000),
    audioChunkMs: numberEnv('DEEPGRAM_AUDIO_CHUNK_MS', 80),
    get hasKey() { return !!this._apiKey; },
  };

  const cerebras = {
    _apiKey : process.env.CEREBRAS_API_KEY || null,
    model   : process.env.CEREBRAS_MODEL || 'gpt-oss-120b',
    get hasKey() { return !!this._apiKey; },
  };

  const elevenlabs = {
    _apiKey : process.env.ELEVENLABS_API_KEY || null,
    modelId : process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5',
    get hasKey() { return !!this._apiKey; },
  };

  const sarvam = {
    _apiKey : process.env.SARVAM_API_KEY || null,
    modelId : process.env.SARVAM_TTS_MODEL || 'bulbul:v3',
    speaker : process.env.SARVAM_TTS_SPEAKER || 'shubh',
    get hasKey() { return !!this._apiKey; },
  };

  const groq = {
    _apiKey : process.env.GROQ_API_KEY || null,
    model   : process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
    get hasKey() { return !!this._apiKey; },
  };

  const openai = {
    _apiKey : process.env.OPENAI_API_KEY || null,
    model   : process.env.OPENAI_MODEL || 'gpt-4o-mini',
    get hasKey() { return !!this._apiKey; },
  };

  const region = process.env.VOICE_WORKER_REGION || 'us-east-1';

  const missing = [];
  if (!deepgram._apiKey) missing.push('DEEPGRAM_API_KEY');
  if (!elevenlabs._apiKey) missing.push('ELEVENLABS_API_KEY');
  if ((primaryLlm === 'cerebras' || fallbackLlm === 'cerebras') && !cerebras._apiKey)
    missing.push('CEREBRAS_API_KEY');
  if ((primaryLlm === 'groq' || fallbackLlm === 'groq') && !groq._apiKey)
    missing.push('GROQ_API_KEY');
  if ((primaryLlm === 'openai' || fallbackLlm === 'openai') && !openai._apiKey)
    missing.push('OPENAI_API_KEY');

  const uniqueMissing = [...new Set(missing)];
  if (uniqueMissing.length > 0) {
    console.warn(
      '[VoiceConfig] WARNING: Voice worker configuration is missing the following environment variables: ' +
      `${uniqueMissing.join(', ')}. Calls requesting these services will fail at runtime.`
    );
  }

  if (deepgram.eagerEotThreshold > deepgram.eotThreshold) {
    throw new Error(
      '[VoiceConfig] DEEPGRAM_EAGER_EOT_THRESHOLD must be <= DEEPGRAM_EOT_THRESHOLD.'
    );
  }

  return Object.freeze({
    provider,
    rolloutPercent,
    allowedBusinessIds,
    region,
    primaryLlm,
    fallbackLlm,

    deepgram: Object.freeze({
      model: deepgram.model,
      hasKey: deepgram.hasKey,
      _apiKey: deepgram._apiKey,
      eagerEotThreshold: deepgram.eagerEotThreshold,
      eotThreshold: deepgram.eotThreshold,
      eotTimeoutMs: deepgram.eotTimeoutMs,
      audioChunkMs: deepgram.audioChunkMs,
    }),
    cerebras: Object.freeze({
      model: cerebras.model,
      hasKey: cerebras.hasKey,
      _apiKey: cerebras._apiKey,
    }),
    elevenlabs: Object.freeze({
      modelId: elevenlabs.modelId,
      hasKey: elevenlabs.hasKey,
      _apiKey: elevenlabs._apiKey,
    }),
    sarvam: Object.freeze({
      modelId: sarvam.modelId,
      speaker: sarvam.speaker,
      hasKey: sarvam.hasKey,
      _apiKey: sarvam._apiKey,
    }),
    groq: Object.freeze({
      model: groq.model,
      hasKey: groq.hasKey,
      _apiKey: groq._apiKey,
    }),
    openai: Object.freeze({
      model: openai.model,
      hasKey: openai.hasKey,
      _apiKey: openai._apiKey,
    }),

    PROVIDER_CURRENT,
    PROVIDER_MODULAR,
  });
}

let _config = null;

function getVoiceConfig() {
  if (!_config) {
    _config = buildConfig();
    console.log(
      '[VoiceConfig] Voice Worker Configuration initialized successfully. ' +
      `primaryLlm=${_config.primaryLlm} fallbackLlm=${_config.fallbackLlm} region=${_config.region}`
    );
  }
  return _config;
}

module.exports = { getVoiceConfig, PROVIDER_CURRENT, PROVIDER_MODULAR };
