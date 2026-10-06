'use strict';

/**
 * Bavio Voice Worker Config
 */

const PROVIDER_CURRENT  = 'current_openai';
const PROVIDER_MODULAR  = 'modular_v1';
const PROVIDER_GRAMA    = 'gnani_grama_v1';
const VALID_PROVIDERS   = [PROVIDER_CURRENT, PROVIDER_MODULAR, PROVIDER_GRAMA];
const VALID_LLM_BACKENDS = ['cerebras', 'groq', 'openai', 'gnani_evon'];

function buildConfig() {
  const provider = (process.env.VOICE_STACK_PROVIDER || PROVIDER_CURRENT).trim().toLowerCase();

  const rolloutPercent = Number(process.env.VOICE_STACK_ROLLOUT_PERCENT ?? 0);
  const allowedBusinessIds = new Set(
    (process.env.VOICE_STACK_ALLOWED_BUSINESS_IDS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  );

  const primaryLlm  = (process.env.VOICE_PRIMARY_LLM  || 'cerebras').trim().toLowerCase();
  const fallbackLlm = (process.env.VOICE_FALLBACK_LLM || 'groq').trim().toLowerCase();

  const deepgram = {
    _apiKey : process.env.DEEPGRAM_API_KEY    || null,
    model   : process.env.DEEPGRAM_MODEL      || 'nova-2',
    get hasKey() { return !!this._apiKey; },
  };

  const cerebras = {
    _apiKey : process.env.CEREBRAS_API_KEY    || null,
    model   : process.env.CEREBRAS_MODEL      || 'gpt-oss-120b',
    get hasKey() { return !!this._apiKey; },
  };

  const elevenlabs = {
    _apiKey : process.env.ELEVENLABS_API_KEY  || null,
    modelId : process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5',
    get hasKey() { return !!this._apiKey; },
  };

  const groq = {
    _apiKey : process.env.GROQ_API_KEY        || null,
    model   : process.env.GROQ_MODEL          || 'openai/gpt-oss-120b',
    get hasKey() { return !!this._apiKey; },
  };

  const openai = {
    _apiKey : process.env.OPENAI_API_KEY      || null,
    model   : process.env.OPENAI_MODEL        || 'gpt-4o-mini',
    get hasKey() { return !!this._apiKey; },
  };

  const gnani = {
    _apiKey   : process.env.GNANI_API_KEY     || null,
    sttModel  : process.env.GNANI_STT_MODEL   || 'prisma-v2.5',
    llmModel  : process.env.GNANI_LLM_MODEL   || 'gnani-evon-v3.3',
    ttsModel  : process.env.GNANI_TTS_MODEL   || 'timbre-v2.5',
    get hasKey() { return !!this._apiKey; },
  };

  const exotel = {
    _apiKey     : process.env.EXOTEL_API_KEY      || null,
    _apiToken   : process.env.EXOTEL_API_TOKEN    || null,
    accountSid  : process.env.EXOTEL_ACCOUNT_SID  || null,
    subdomain   : process.env.EXOTEL_SUBDOMAIN    || 'api.exotel.com',
    get hasKey() { return !!(this._apiKey && this._apiToken && this.accountSid); },
  };

  const region = process.env.VOICE_WORKER_REGION || 'us-east-1';

  return Object.freeze({
    provider,
    rolloutPercent,
    allowedBusinessIds,
    region,
    primaryLlm,
    fallbackLlm,

    deepgram    : Object.freeze({ model: deepgram.model,     hasKey: deepgram.hasKey,     _apiKey: deepgram._apiKey }),
    cerebras    : Object.freeze({ model: cerebras.model,     hasKey: cerebras.hasKey,     _apiKey: cerebras._apiKey }),
    elevenlabs  : Object.freeze({ modelId: elevenlabs.modelId, hasKey: elevenlabs.hasKey, _apiKey: elevenlabs._apiKey }),
    groq        : Object.freeze({ model: groq.model,         hasKey: groq.hasKey,         _apiKey: groq._apiKey }),
    openai      : Object.freeze({ model: openai.model,       hasKey: openai.hasKey,       _apiKey: openai._apiKey }),
    gnani       : Object.freeze({ sttModel: gnani.sttModel,  llmModel: gnani.llmModel,   ttsModel: gnani.ttsModel, hasKey: gnani.hasKey, _apiKey: gnani._apiKey }),
    exotel      : Object.freeze({ accountSid: exotel.accountSid, subdomain: exotel.subdomain, hasKey: exotel.hasKey, _apiKey: exotel._apiKey, _apiToken: exotel._apiToken }),

    PROVIDER_CURRENT,
    PROVIDER_MODULAR,
    PROVIDER_GRAMA,
  });
}

let _config = null;

function getVoiceConfig() {
  if (!_config) {
    _config = buildConfig();
    console.log(
      `[VoiceConfig] Voice Worker Configuration initialized successfully. ` +
      `provider=${_config.provider} primaryLlm=${_config.primaryLlm} region=${_config.region}`
    );
  }
  return _config;
}

module.exports = { getVoiceConfig, PROVIDER_CURRENT, PROVIDER_MODULAR, PROVIDER_GRAMA };
