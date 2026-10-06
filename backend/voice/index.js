'use strict';

/**
 * voice/index.js — barrel export for the Bavio voice abstraction layer
 */

// ── Configuration ─────────────────────────────────────────────────────────────
const { getVoiceConfig, PROVIDER_CURRENT, PROVIDER_MODULAR, PROVIDER_GRAMA } = require('./config/voiceConfig');

// ── Interfaces ────────────────────────────────────────────────────────────────
const SpeechToTextProvider  = require('./providers/interfaces/SpeechToTextProvider');
const TurnDetectionProvider = require('./providers/interfaces/TurnDetectionProvider');
const LanguageModelProvider = require('./providers/interfaces/LanguageModelProvider');
const TextToSpeechProvider  = require('./providers/interfaces/TextToSpeechProvider');
const TelephonyProvider     = require('./providers/interfaces/TelephonyProvider');
const VoiceWorkerSession    = require('./providers/interfaces/VoiceWorkerSession');
const VoiceCatalogProvider  = require('./providers/interfaces/VoiceCatalogProvider');

// ── Current-stack adapters (OpenAI / Twilio) ──────────────────────────────────
const CurrentOpenAIStt      = require('./providers/current/CurrentOpenAIStt');
const CurrentOpenAILlm      = require('./providers/current/CurrentOpenAILlm');
const CurrentOpenAITts      = require('./providers/current/CurrentOpenAITts');
const CurrentTwilioTelephony = require('./providers/current/CurrentTwilioTelephony');

// ── Modular-stack providers ───────────────────────────────────────────────────
const DeepgramStt    = require('./providers/modular/DeepgramStt');
const CerebraLlm     = require('./providers/modular/CerebraLlm');
const GroqLlm        = require('./providers/modular/GroqLlm');
const ElevenLabsTts  = require('./providers/modular/ElevenLabsTts');
const SarvamStt      = require('./providers/modular/SarvamStt');
const SarvamLlm      = require('./providers/modular/SarvamLlm');
const SarvamTts      = require('./providers/modular/SarvamTts');

// ── Gnani AI & Exotel Providers (Bavio Grama Stack) ───────────────────────────
const GnaniPrismaStt = require('./providers/gnani/GnaniPrismaStt');
const GnaniEvonLlm   = require('./providers/gnani/GnaniEvonLlm');
const GnaniTimbreTts = require('./providers/gnani/GnaniTimbreTts');
const ExotelTelephony = require('./providers/exotel/ExotelTelephony');

// ── Routing ───────────────────────────────────────────────────────────────────
const { selectVoiceStack, isAllowlisted, getStackSummary } = require('./routing/voiceStackRouter');

// ── Sessions ──────────────────────────────────────────────────────────────────
const ModularVoiceSession = require('./sessions/ModularVoiceSession');
const GramaVoiceSession   = require('./sessions/GramaVoiceSession');

// ── Catalog ───────────────────────────────────────────────────────────────────
const DefaultVoiceCatalog = require('./catalog/DefaultVoiceCatalog');

module.exports = {
  // Config
  getVoiceConfig,
  PROVIDER_CURRENT,
  PROVIDER_MODULAR,
  PROVIDER_GRAMA,

  // Interfaces
  SpeechToTextProvider,
  TurnDetectionProvider,
  LanguageModelProvider,
  TextToSpeechProvider,
  TelephonyProvider,
  VoiceWorkerSession,
  VoiceCatalogProvider,

  // Current-stack adapters
  CurrentOpenAIStt,
  CurrentOpenAILlm,
  CurrentOpenAITts,
  CurrentTwilioTelephony,

  // Modular-stack providers
  DeepgramStt,
  CerebraLlm,
  GroqLlm,
  ElevenLabsTts,
  SarvamStt,
  SarvamLlm,
  SarvamTts,

  // Gnani & Exotel providers
  GnaniPrismaStt,
  GnaniEvonLlm,
  GnaniTimbreTts,
  ExotelTelephony,

  // Routing
  selectVoiceStack,
  isAllowlisted,
  getStackSummary,

  // Sessions
  ModularVoiceSession,
  GramaVoiceSession,

  // Catalog
  DefaultVoiceCatalog,
};
