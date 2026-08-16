'use strict';

const db = require('../../database/db');
const {
  USD_TO_INR_RATE,
  PROVIDER_RATES,
  TIER_INFRA_TARGETS,
  CUSTOMER_TIER_PRICING,
} = require('./pricingConfig');
const { PROVIDER_REGISTRY } = require('./providerRegistry');

const INDIC_LANGUAGES = new Set([
  'hi', 'hi-in', 'hindi',
  'te', 'te-in', 'telugu',
  'ta', 'ta-in', 'tamil',
  'kn', 'kn-in', 'kannada',
  'bn', 'bn-in', 'bengali',
  'mr', 'mr-in', 'marathi',
  'gu', 'gu-in', 'gujarati',
  'pa', 'pa-in', 'punjabi',
  'hinglish', 'hi-en',
]);

function isIndicLanguage(lang) {
  if (!lang) return false;
  const normalized = lang.toLowerCase().trim();
  return INDIC_LANGUAGES.has(normalized);
}

class ModelRouter {
  /**
   * Resolve runtime stack (LLM, STT, TTS) for an AI employee call turn
   */
  resolveModelStack({
    tier = 'core',
    language = 'en-US',
    complexity = 'normal',
    overrides = {},
  } = {}) {
    const rawTier = (tier || 'core').toLowerCase().trim();
    const isIndic = isIndicLanguage(language);

    // 1. Resolve effective intelligence tier
    let effectiveTier = rawTier;
    if (rawTier === 'auto') {
      if (complexity === 'high' || overrides.needsDeepReasoning) {
        effectiveTier = 'prime';
      } else if (complexity === 'low' || overrides.isSimpleFaq) {
        effectiveTier = 'swift';
      } else {
        effectiveTier = 'core';
      }
    }

    if (!['swift', 'core', 'prime'].includes(effectiveTier)) {
      effectiveTier = 'core';
    }

    // 2. Select default provider stack per tier and language matrix
    let intelligence;
    let stt;
    let tts;

    switch (effectiveTier) {
      case 'swift':
        if (isIndic) {
          intelligence = { provider: 'sarvam', model: 'sarvam-30b', displayName: 'Sarvam-30B' };
          stt = { provider: 'sarvam', model: 'saaras-v3', displayName: 'Sarvam Saaras v3' };
          tts = { provider: 'sarvam', model: 'bulbul-v3', displayName: 'Sarvam Bulbul v3' };
        } else {
          intelligence = { provider: 'openai', model: 'gpt-5.4-mini', displayName: 'GPT-5.4 mini' };
          stt = { provider: 'elevenlabs', model: 'scribe-v2-realtime', displayName: 'ElevenLabs Scribe v2 Realtime' };
          tts = { provider: 'elevenlabs', model: 'flash-v2.5', displayName: 'ElevenLabs Flash v2.5' };
        }
        break;

      case 'prime':
        if (isIndic) {
          intelligence = { provider: 'sarvam', model: 'sarvam-105b', displayName: 'Sarvam-105B' };
          stt = { provider: 'sarvam', model: 'saaras-v3', displayName: 'Sarvam Saaras v3' };
          tts = { provider: 'sarvam', model: 'bulbul-v3', displayName: 'Sarvam Bulbul v3' };
        } else {
          intelligence = { provider: 'openai', model: 'gpt-5.5', displayName: 'GPT-5.5' };
          stt = { provider: 'elevenlabs', model: 'scribe-v2-realtime', displayName: 'ElevenLabs Scribe v2 Realtime' };
          tts = { provider: 'elevenlabs', model: 'multilingual-v2', displayName: 'ElevenLabs Multilingual v2' };
        }
        break;

      case 'core':
      default:
        if (isIndic) {
          intelligence = { provider: 'sarvam', model: 'sarvam-105b', displayName: 'Sarvam-105B' };
          stt = { provider: 'sarvam', model: 'saaras-v3', displayName: 'Sarvam Saaras v3' };
          tts = { provider: 'sarvam', model: 'bulbul-v3', displayName: 'Sarvam Bulbul v3' };
        } else {
          intelligence = { provider: 'openai', model: 'gpt-5.4', displayName: 'GPT-5.4' };
          stt = { provider: 'elevenlabs', model: 'scribe-v2-realtime', displayName: 'ElevenLabs Scribe v2 Realtime' };
          tts = { provider: 'elevenlabs', model: 'multilingual-v2', displayName: 'ElevenLabs Multilingual v2' };
        }
        break;
    }

    // 3. Apply custom advanced overrides if explicitly requested
    if (overrides.intelligence_provider && overrides.intelligence_provider !== 'automatic') {
      intelligence.provider = overrides.intelligence_provider;
    }
    if (overrides.intelligence_model && overrides.intelligence_model !== 'automatic') {
      intelligence.model = overrides.intelligence_model;
    }
    if (overrides.stt_provider && overrides.stt_provider !== 'automatic') {
      stt.provider = overrides.stt_provider;
    }
    if (overrides.stt_model && overrides.stt_model !== 'automatic') {
      stt.model = overrides.stt_model;
    }
    if (overrides.tts_provider && overrides.tts_provider !== 'automatic') {
      tts.provider = overrides.tts_provider;
    }
    if (overrides.tts_model && overrides.tts_model !== 'automatic') {
      tts.model = overrides.tts_model;
    }

    return {
      tier: rawTier,
      effectiveTier,
      isAuto: rawTier === 'auto',
      language,
      isIndic,
      intelligence,
      stt,
      tts,
      routingReason: rawTier === 'auto'
        ? `auto_routed_to_${effectiveTier}_based_on_${isIndic ? 'indic_language' : 'conversation_complexity'}`
        : `explicit_tier_${rawTier}`,
    };
  }

  /**
   * Calculate precise session telemetry, infrastructure costs, retail billing, and gross margin
   */
  calculateCallCost({
    tier = 'core',
    durationSeconds = 0,
    inputTokens = 0,
    outputTokens = 0,
    ttsCharacters = 0,
    llmProvider = 'openai',
    llmModel = 'gpt-5.4',
    sttProvider = 'elevenlabs',
    sttModel = 'scribe-v2-realtime',
    ttsProvider = 'elevenlabs',
    ttsModel = 'multilingual-v2',
    telephonyProvider = 'twilio',
  } = {}) {
    const minutes = Math.max(durationSeconds, 0) / 60;
    const durSecs = Math.max(durationSeconds, 0);

    // 1. LLM Cost calculation
    const llmKey = `${llmProvider}/${llmModel}`;
    const llmRate = PROVIDER_RATES.llm[llmKey] || PROVIDER_RATES.llm['openai/gpt-5.4'];
    const llmCostUsd = (inputTokens / 1000) * llmRate.inputPer1k + (outputTokens / 1000) * llmRate.outputPer1k;

    // 2. STT Cost calculation
    const sttKey = `${sttProvider}/${sttModel}`;
    const sttRate = PROVIDER_RATES.stt[sttKey] || PROVIDER_RATES.stt['elevenlabs/scribe-v2-realtime'];
    const sttCostUsd = minutes * sttRate.perMinuteUsd;

    // 3. TTS Cost calculation
    const ttsKey = `${ttsProvider}/${ttsModel}`;
    const ttsRate = PROVIDER_RATES.tts[ttsKey] || PROVIDER_RATES.tts['elevenlabs/multilingual-v2'];
    const ttsCostUsd = (ttsCharacters / 1000) * ttsRate.per1kCharsUsd;

    // 4. Telephony Carrier Cost calculation
    const telKey = `${telephonyProvider}/voice-inbound`;
    const telRate = PROVIDER_RATES.telephony[telKey] || PROVIDER_RATES.telephony['twilio/voice-inbound'];
    const telephonyCostUsd = minutes * telRate.perMinuteUsd;

    // 5. Total Estimated Infrastructure Cost
    const estimatedCostUsd = parseFloat((llmCostUsd + sttCostUsd + ttsCostUsd + telephonyCostUsd).toFixed(6));
    const estimatedCostInr = parseFloat((estimatedCostUsd * USD_TO_INR_RATE).toFixed(4));

    // 6. Customer Price & Margin
    const tierPricing = CUSTOMER_TIER_PRICING[tier] || CUSTOMER_TIER_PRICING.core;
    const customerPriceInr = parseFloat((minutes * tierPricing.priceInrPerMin).toFixed(4));
    
    let grossMarginPercent = 0;
    if (customerPriceInr > 0) {
      grossMarginPercent = parseFloat((((customerPriceInr - estimatedCostInr) / customerPriceInr) * 100).toFixed(2));
    }

    return {
      durationSeconds: durSecs,
      durationMinutes: parseFloat(minutes.toFixed(2)),
      inputTokens,
      outputTokens,
      ttsCharacters,
      sttCostUsd: parseFloat(sttCostUsd.toFixed(6)),
      ttsCostUsd: parseFloat(ttsCostUsd.toFixed(6)),
      llmCostUsd: parseFloat(llmCostUsd.toFixed(6)),
      telephonyCostUsd: parseFloat(telephonyCostUsd.toFixed(6)),
      estimatedCostUsd,
      estimatedCostInr,
      customerPriceInr,
      grossMarginPercent,
    };
  }

  /**
   * Persist granular session cost log to call_cost_logs table
   */
  async recordCallCostLog({
    workspaceId = null,
    businessId = null,
    aiEmployeeId = null,
    callId = null,
    tier = 'core',
    language = 'en',
    provider = 'openai',
    model = 'gpt-5.4',
    sttProvider = 'elevenlabs',
    sttModel = 'scribe-v2-realtime',
    ttsProvider = 'elevenlabs',
    ttsModel = 'multilingual-v2',
    durationSeconds = 0,
    inputTokens = 0,
    outputTokens = 0,
    ttsCharacters = 0,
    sttLatencyMs = null,
    llmFirstTokenMs = null,
    ttsFirstAudioMs = null,
    totalTtfbMs = null,
  }) {
    try {
      const costMetrics = this.calculateCallCost({
        tier,
        durationSeconds,
        inputTokens,
        outputTokens,
        ttsCharacters,
        llmProvider: provider,
        llmModel: model,
        sttProvider,
        sttModel,
        ttsProvider,
        ttsModel,
      });

      const res = await db.query(
        `INSERT INTO call_cost_logs (
          workspace_id, business_id, ai_employee_id, call_id,
          tier, language, provider, model,
          stt_provider, stt_model, tts_provider, tts_model,
          duration_seconds, input_tokens, output_tokens, tts_characters,
          stt_cost_usd, tts_cost_usd, llm_cost_usd, telephony_cost_usd,
          estimated_cost_usd, estimated_cost_inr, customer_price_inr, gross_margin_percent,
          stt_latency_ms, llm_first_token_ms, tts_first_audio_ms, total_ttfb_ms
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19, $20,
          $21, $22, $23, $24,
          $25, $26, $27, $28
        ) RETURNING id`,
        [
          workspaceId,
          businessId,
          aiEmployeeId,
          callId,
          tier,
          language,
          provider,
          model,
          sttProvider,
          sttModel,
          ttsProvider,
          ttsModel,
          costMetrics.durationSeconds,
          costMetrics.inputTokens,
          costMetrics.outputTokens,
          costMetrics.ttsCharacters,
          costMetrics.sttCostUsd,
          costMetrics.ttsCostUsd,
          costMetrics.llmCostUsd,
          costMetrics.telephonyCostUsd,
          costMetrics.estimatedCostUsd,
          costMetrics.estimatedCostInr,
          costMetrics.customerPriceInr,
          costMetrics.grossMarginPercent,
          sttLatencyMs,
          llmFirstTokenMs,
          ttsFirstAudioMs,
          totalTtfbMs,
        ]
      );

      return {
        success: true,
        logId: res.rows[0]?.id,
        costMetrics,
      };
    } catch (err) {
      console.error('[ModelRouter] Error saving call cost log:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Return clean client catalog for UI tier selector and settings
   */
  getCatalog() {
    return {
      tiers: Object.keys(CUSTOMER_TIER_PRICING).map((key) => ({
        id: key,
        ...CUSTOMER_TIER_PRICING[key],
      })),
      registry: {
        intelligence: PROVIDER_REGISTRY.intelligence.map((i) => ({
          provider: i.provider,
          model: i.model,
          displayName: i.displayName,
          tier: i.tier,
          latencyClass: i.latencyClass,
        })),
        stt: PROVIDER_REGISTRY.stt.map((s) => ({
          provider: s.provider,
          model: s.model,
          displayName: s.displayName,
        })),
        tts: PROVIDER_REGISTRY.tts.map((t) => ({
          provider: t.provider,
          model: t.model,
          displayName: t.displayName,
        })),
      },
    };
  }
}

const defaultModelRouter = new ModelRouter();

module.exports = {
  ModelRouter,
  defaultModelRouter,
  isIndicLanguage,
  CUSTOMER_TIER_PRICING,
  TIER_INFRA_TARGETS,
  PROVIDER_RATES,
  USD_TO_INR_RATE,
};
