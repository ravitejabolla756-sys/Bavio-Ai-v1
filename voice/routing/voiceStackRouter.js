'use strict';

/**
 * voiceStackRouter — Feature-flag routing for the Bavio voice stack
 *
 * Determines which voice pipeline runs for a given call using three
 * independent mechanisms that are ORed together:
 *
 *   1. Global toggle    VOICE_STACK_PROVIDER=modular_v1
 *   2. Allowlist        VOICE_STACK_ALLOWED_BUSINESS_IDS=uuid1,uuid2
 *   3. Rollout percent  VOICE_STACK_ROLLOUT_PERCENT=5  (5% of calls)
 *
 * All existing customers continue using current_openai UNLESS explicitly
 * opted in via one of the above mechanisms.
 *
 * The selected stack is returned as a string so it can be stored on the
 * call record for auditing (calls.voice_stack column).
 */

const { getVoiceConfig, PROVIDER_CURRENT, PROVIDER_MODULAR } = require('../config/voiceConfig');

// ── Deterministic rollout hash ─────────────────────────────────────────────
// Maps businessId → 0–99 bucket so the same business always gets the same stack
function _rolloutBucket(businessId) {
  if (!businessId) return 100;     // Never in rollout if no ID

  // FNV-1a 32-bit hash — fast, no dependencies, deterministic
  let hash = 2166136261;
  for (let i = 0; i < businessId.length; i++) {
    hash ^= businessId.charCodeAt(i);
    hash  = (hash * 16777619) >>> 0;
  }
  return hash % 100;               // 0–99
}

/**
 * Select the voice stack for a given call.
 *
 * @param {string|null} businessId  UUID of the business owning the phone number
 * @param {object}      [opts]
 * @param {string}      [opts.callSid]  For log correlation only
 * @returns {'current_openai'|'modular_v1'}
 */
function selectVoiceStack(businessId, { callSid = '' } = {}) {
  let cfg;
  try {
    cfg = getVoiceConfig();
  } catch (err) {
    // Config failed (e.g. missing keys) — always fall back to current
    console.error(`[VoiceRouter] Config error, defaulting to ${PROVIDER_CURRENT}: ${err.message}`);
    return PROVIDER_CURRENT;
  }

  let stack  = PROVIDER_CURRENT;
  let reason = 'default';

  // 1. Global toggle
  if (cfg.provider === PROVIDER_MODULAR) {
    stack  = PROVIDER_MODULAR;
    reason = 'global_toggle';
  }

  // 2. Allowlist (OR — overrides even if global is current_openai)
  if (stack === PROVIDER_CURRENT && businessId && cfg.allowedBusinessIds.has(businessId)) {
    stack  = PROVIDER_MODULAR;
    reason = 'allowlist';
  }

  // 3. Rollout percentage (OR — only if not already promoted)
  if (stack === PROVIDER_CURRENT && cfg.rolloutPercent > 0) {
    const bucket = _rolloutBucket(businessId);
    if (bucket < cfg.rolloutPercent) {
      stack  = PROVIDER_MODULAR;
      reason = `rollout_${cfg.rolloutPercent}pct`;
    }
  }

  console.log(
    `[VoiceRouter] Stack selected: ${stack} reason=${reason} ` +
    `business=${businessId || 'unknown'} ${callSid ? `callSid=${callSid}` : ''}`
  );

  return stack;
}

/**
 * Check whether a business is on the allowlist.
 * Used by admin APIs or dashboards without exposing config internals.
 *
 * @param {string} businessId
 * @returns {boolean}
 */
function isAllowlisted(businessId) {
  try {
    return getVoiceConfig().allowedBusinessIds.has(businessId);
  } catch {
    return false;
  }
}

/**
 * Return the current feature-flag summary for monitoring/health endpoints.
 * Never includes secret values.
 *
 * @returns {object}
 */
function getStackSummary() {
  try {
    const cfg = getVoiceConfig();
    return {
      provider         : cfg.provider,
      rolloutPercent   : cfg.rolloutPercent,
      allowlistSize    : cfg.allowedBusinessIds.size,
      region           : cfg.region,
      primaryLlm       : cfg.primaryLlm,
      fallbackLlm      : cfg.fallbackLlm,
      deepgramReady    : cfg.deepgram.hasKey,
      cerebrasReady    : cfg.cerebras.hasKey,
      elevenlabsReady  : cfg.elevenlabs.hasKey,
      groqReady        : cfg.groq.hasKey,
    };
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = { selectVoiceStack, isAllowlisted, getStackSummary, PROVIDER_CURRENT, PROVIDER_MODULAR };
