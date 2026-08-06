'use strict';

/**
 * voice/index.js — barrel export for the Bavio voice abstraction layer
 *
 * Import from here, not from individual provider files, so that internal
 * module layout can change without updating every call site.
 *
 * Example:
 *   const { selectVoiceStack, getVoiceConfig } = require('./voice');
 *   const { DeepgramStt, ElevenLabsTts }       = require('./voice');
 */

// ── Configuration ─────────────────────────────────────────────────────────────
const { getVoiceConfig, PROVIDER_CURRENT, PROVIDER_MODULAR } = require('./config/voiceConfig');

// ── Interfaces ────────────────────────────────────────────────────────────────
const SpeechToTextProvider  = require('./providers/interfaces/SpeechToTextProvider');
const TurnDetectionProvider = require('./providers/interfaces/TurnDetectionProvider');
const LanguageModelProvider = require('./providers/interfaces/LanguageModelProvider');
const TextToSpeechProvider  = require('./providers/interfaces/TextToSpeechProvider');
const TelephonyProvider     = require('./providers/interfaces/TelephonyProvider');
const VoiceWorkerSession    = require('./providers/interfaces/VoiceWorkerSession');
const VoiceCatalogProvider  = require('./providers/interfaces/VoiceCatalogProvider');

// ── Current-stack adapters ────────────────────────────────────────────────────
const CurrentOpenAIStt      = require('./providers/current/CurrentOpenAIStt');
const CurrentOpenAILlm      = require('./providers/current/CurrentOpenAILlm');
const CurrentOpenAITts      = require('./providers/current/CurrentOpenAITts');
const CurrentTwilioTelephony = require('./providers/current/CurrentTwilioTelephony');

// ── Modular-stack providers ───────────────────────────────────────────────────
const DeepgramStt    = require('./providers/modular/DeepgramStt');
const CerebraLlm     = require('./providers/modular/CerebraLlm');
const GroqLlm        = require('./providers/modular/GroqLlm');
const ElevenLabsTts  = require('./providers/modular/ElevenLabsTts');

// ── Routing ───────────────────────────────────────────────────────────────────
const { selectVoiceStack, isAllowlisted, getStackSummary } = require('./routing/voiceStackRouter');

// ── Sessions ──────────────────────────────────────────────────────────────────
const ModularVoiceSession = require('./sessions/ModularVoiceSession');

// ── Catalog ───────────────────────────────────────────────────────────────────
const DefaultVoiceCatalog = require('./catalog/DefaultVoiceCatalog');

module.exports = {
  // Config
  getVoiceConfig,
  PROVIDER_CURRENT,
  PROVIDER_MODULAR,

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

  // Routing
  selectVoiceStack,
  isAllowlisted,
  getStackSummary,

  // Sessions
  ModularVoiceSession,

  // Catalog
  DefaultVoiceCatalog,
};
