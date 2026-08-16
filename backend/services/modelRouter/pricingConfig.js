'use strict';

/**
 * Central Pricing Configuration for Bavio AI
 * Contains provider unit rates, target infrastructure costs, and customer billing rates.
 */

const USD_TO_INR_RATE = 86.50;

const PROVIDER_RATES = {
  // LLM Pricing (per 1,000 tokens)
  llm: {
    'openai/gpt-5.4-mini': { inputPer1k: 0.00015, outputPer1k: 0.00060 },
    'openai/gpt-4o-mini': { inputPer1k: 0.00015, outputPer1k: 0.00060 },
    'openai/gpt-5.4': { inputPer1k: 0.00250, outputPer1k: 0.01000 },
    'openai/gpt-4o': { inputPer1k: 0.00250, outputPer1k: 0.01000 },
    'openai/gpt-5.5': { inputPer1k: 0.00500, outputPer1k: 0.01500 },
    'anthropic/claude-opus-5': { inputPer1k: 0.01500, outputPer1k: 0.07500 },
    'anthropic/claude-3-5-sonnet': { inputPer1k: 0.00300, outputPer1k: 0.01500 },
    'sarvam/sarvam-30b': { inputPer1k: 0.00180, outputPer1k: 0.00180 },
    'sarvam/sarvam-105b': { inputPer1k: 0.00480, outputPer1k: 0.00480 },
    'groq/llama-3.3-70b': { inputPer1k: 0.00059, outputPer1k: 0.00079 },
    'cerebras/llama-3.3-70b': { inputPer1k: 0.00060, outputPer1k: 0.00080 },
  },

  // STT Pricing (per minute of processed audio)
  stt: {
    'elevenlabs/scribe-v2-realtime': { perMinuteUsd: 0.0080 },
    'sarvam/saaras-v3': { perMinuteUsd: 0.0054 }, // ~₹0.47/min
    'deepgram/nova-2': { perMinuteUsd: 0.0043 },
    'openai/whisper': { perMinuteUsd: 0.0060 },
  },

  // TTS Pricing (per 1,000 characters)
  tts: {
    'elevenlabs/flash-v2.5': { per1kCharsUsd: 0.0150 },
    'elevenlabs/multilingual-v2': { per1kCharsUsd: 0.0240 },
    'elevenlabs/v3': { per1kCharsUsd: 0.0350 },
    'sarvam/bulbul-v3': { per1kCharsUsd: 0.0036 }, // ~₹0.31/1k chars
    'openai/tts-1': { per1kCharsUsd: 0.0150 },
  },

  // Telephony Carrier Pricing (per minute)
  telephony: {
    'twilio/voice-inbound': { perMinuteUsd: 0.0140 },
    'twilio/voice-outbound': { perMinuteUsd: 0.0140 },
    'exotel/voice-inbound': { perMinuteUsd: 0.0120 },
  },
};

// Target Estimated Infrastructure Costs (Internal COGS Reference)
const TIER_INFRA_TARGETS = {
  swift: {
    targetCostUsdPerMin: 0.041,
    targetCostInrPerMin: 3.92,
  },
  core: {
    targetCostUsdPerMin: 0.048,
    targetCostInrPerMin: 4.58,
  },
  prime: {
    targetCostUsdPerMin: 0.058,
    targetCostInrPerMin: 5.54,
  },
  auto: {
    targetCostUsdPerMin: 0.048,
    targetCostInrPerMin: 4.58,
  },
};

// Customer Usage Pricing (Retail Rates)
const CUSTOMER_TIER_PRICING = {
  swift: {
    priceInrPerMin: 12.00,
    priceUsdPerMin: 0.15,
    label: 'Bavio Swift',
    tagline: 'Fast responses · Lower usage cost',
    description: 'Optimized for FAQs, high-volume inquiries, and fast appointments.',
  },
  core: {
    priceInrPerMin: 18.00,
    priceUsdPerMin: 0.22,
    label: 'Bavio Core',
    tagline: 'Balanced intelligence and speed · Recommended',
    description: 'Ideal for standard customer support, lead qualification, and business workflows.',
    isDefault: true,
  },
  prime: {
    priceInrPerMin: 32.00,
    priceUsdPerMin: 0.38,
    label: 'Bavio Prime',
    tagline: 'Advanced reasoning · Higher usage cost',
    description: 'Designed for complex policies, multi-step objection handling, and advanced reasoning.',
  },
  auto: {
    priceInrPerMin: 18.00,
    priceUsdPerMin: 0.22,
    label: 'Bavio Auto',
    tagline: 'Automatically selects the best model for each conversation.',
    description: 'Dynamically routes each turn to the optimal intelligence and speech stack.',
  },
};

module.exports = {
  USD_TO_INR_RATE,
  PROVIDER_RATES,
  TIER_INFRA_TARGETS,
  CUSTOMER_TIER_PRICING,
};
