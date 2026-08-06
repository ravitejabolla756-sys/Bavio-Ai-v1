'use strict';

/**
 * Bavio Voice Stack — Centralised Configuration
 *
 * Single source of truth for all voice-pipeline env vars.
 * - Never hard-codes model identifiers.
 * - Never prints secret values in logs.
 * - Throws at startup when modular_v1 is enabled but required keys are absent.
 * - Returns a frozen, immutable config object.
 */

const PROVIDER_CURRENT  = 'current_openai';
const PROVIDER_MODULAR  = 'modular_v1';
const VALID_PROVIDERS   = [PROVIDER_CURRENT, PROVIDER_MODULAR];
const VALID_LLM_BACKENDS = ['cerebras', 'groq', 'openai'];

// ── Internal: parse & validate ────────────────────────────────────────────────
function buildConfig() {
  // ── provider ──────────────────────────────────────────────────────────────
  const provider = (process.env.VOICE_STACK_PROVIDER || PROVIDER_CURRENT).trim().toLowerCase();
  if (!VALID_PROVIDERS.includes(provider)) {
    throw new Error(
      `[VoiceConfig] Invalid VOICE_STACK_PROVIDER "${provider}". ` +
      `Valid values: ${VALID_PROVIDERS.join(', ')}`
    );
  }

  // ── rollout percent ───────────────────────────────────────────────────────
  const rolloutPercent = Number(process.env.VOICE_STACK_ROLLOUT_PERCENT ?? 0);
  if (Number.isNaN(rolloutPercent) || rolloutPercent < 0 || rolloutPercent > 100) {
    throw new Error('[VoiceConfig] VOICE_STACK_ROLLOUT_PERCENT must be a number between 0 and 100.');
  }

  // ── allowlist ─────────────────────────────────────────────────────────────
  const allowedBusinessIds = new Set(
    (process.env.VOICE_STACK_ALLOWED_BUSINESS_IDS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  );

  // ── LLM backend selection ─────────────────────────────────────────────────
  const primaryLlm  = (process.env.VOICE_PRIMARY_LLM  || 'cerebras').trim().toLowerCase();
  const fallbackLlm = (process.env.VOICE_FALLBACK_LLM || 'groq').trim().toLowerCase();

  if (!VALID_LLM_BACKENDS.includes(primaryLlm)) {
    throw new Error(
      `[VoiceConfig] Invalid VOICE_PRIMARY_LLM "${primaryLlm}". ` +
      `Valid: ${VALID_LLM_BACKENDS.join(', ')}`
    );
  }
  if (!VALID_LLM_BACKENDS.includes(fallbackLlm)) {
    throw new Error(
      `[VoiceConfig] Invalid VOICE_FALLBACK_LLM "${fallbackLlm}". ` +
      `Valid: ${VALID_LLM_BACKENDS.join(', ')}`
    );
  }
  if (primaryLlm === fallbackLlm) {
    console.warn('[VoiceConfig] VOICE_PRIMARY_LLM and VOICE_FALLBACK_LLM are the same. Fallback will be a no-op.');
  }

  // ── provider credentials (never expose raw keys in log output) ────────────
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

  const region = process.env.VOICE_WORKER_REGION || 'us-east-1';

  // ── Fail-fast: modular_v1 requires all relevant keys ─────────────────────
  const modularActive =
    provider === PROVIDER_MODULAR ||
    rolloutPercent > 0             ||
    allowedBusinessIds.size > 0;

  if (modularActive) {
    const missing = [];
    if (!deepgram._apiKey)                                        missing.push('DEEPGRAM_API_KEY');
    if (!elevenlabs._apiKey)                                      missing.push('ELEVENLABS_API_KEY');
    if ((primaryLlm === 'cerebras' || fallbackLlm === 'cerebras') && !cerebras._apiKey)
      missing.push('CEREBRAS_API_KEY');
    if ((primaryLlm === 'groq'     || fallbackLlm === 'groq')     && !groq._apiKey)
      missing.push('GROQ_API_KEY');

    const uniqueMissing = [...new Set(missing)];
    if (uniqueMissing.length > 0) {
      throw new Error(
        `[VoiceConfig] modular_v1 stack is enabled but the following environment variables ` +
        `are missing: ${uniqueMissing.join(', ')}`
      );
    }
  }

  // ── Build frozen config (keys accessible by services, never logged) ───────
  return Object.freeze({
    provider,
    rolloutPercent,
    allowedBusinessIds,        // Set<string>
    region,
    primaryLlm,
    fallbackLlm,

    deepgram    : Object.freeze({ model: deepgram.model,     hasKey: deepgram.hasKey,     _apiKey: deepgram._apiKey }),
    cerebras    : Object.freeze({ model: cerebras.model,     hasKey: cerebras.hasKey,     _apiKey: cerebras._apiKey }),
    elevenlabs  : Object.freeze({ modelId: elevenlabs.modelId, hasKey: elevenlabs.hasKey, _apiKey: elevenlabs._apiKey }),
    groq        : Object.freeze({ model: groq.model,         hasKey: groq.hasKey,         _apiKey: groq._apiKey }),

    PROVIDER_CURRENT,
    PROVIDER_MODULAR,
  });
}

// ── Singleton ─────────────────────────────────────────────────────────────────
let _config = null;

/**
 * Returns the singleton voice configuration.
 * First call validates the environment and throws on any error.
 * Subsequent calls return the cached, frozen config.
 *
 * @returns {Readonly<object>} Validated voice stack configuration
 */
function getVoiceConfig() {
  if (!_config) {
    _config = buildConfig();
    // Safe summary — never print key values
    console.log(
      `[VoiceConfig] Initialised — ` +
      `provider=${_config.provider} ` +
      `rollout=${_config.rolloutPercent}% ` +
      `region=${_config.region} ` +
      `primaryLlm=${_config.primaryLlm} ` +
      `fallbackLlm=${_config.fallbackLlm} ` +
      `allowlist=${_config.allowedBusinessIds.size} business(es) ` +
      `deepgram=${_config.deepgram.hasKey ? 'key-set' : 'no-key'} ` +
      `cerebras=${_config.cerebras.hasKey ? 'key-set' : 'no-key'} ` +
      `elevenlabs=${_config.elevenlabs.hasKey ? 'key-set' : 'no-key'} ` +
      `groq=${_config.groq.hasKey ? 'key-set' : 'no-key'}`
    );
  }
  return _config;
}

/** Reset singleton — for testing only. Do not call in production. */
function _resetConfigForTesting() {
  _config = null;
}

module.exports = { getVoiceConfig, _resetConfigForTesting, PROVIDER_CURRENT, PROVIDER_MODULAR };
