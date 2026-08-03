'use strict';

const { getVoiceConfig } = require('./config/voiceConfig');
const SpeechToTextProvider = require('./providers/interfaces/SpeechToTextProvider');
const TurnDetectionProvider = require('./providers/interfaces/TurnDetectionProvider');
const LanguageModelProvider = require('./providers/interfaces/LanguageModelProvider');
const TextToSpeechProvider = require('./providers/interfaces/TextToSpeechProvider');
const TelephonyProvider = require('./providers/interfaces/TelephonyProvider');
const VoiceWorkerSessionBase = require('./providers/interfaces/VoiceWorkerSession');

const CurrentTwilioTelephony = require('./providers/current/CurrentTwilioTelephony');
const DeepgramStt = require('./providers/modular/DeepgramStt');
const CerebraLlm = require('./providers/modular/CerebraLlm');
const GroqLlm = require('./providers/modular/GroqLlm');
const ElevenLabsTts = require('./providers/modular/ElevenLabsTts');

const VoiceSessionManager = require('./sessions/VoiceSessionManager');
const VoiceWorkerSession = require('./sessions/VoiceWorkerSession');

module.exports = {
  getVoiceConfig,
  SpeechToTextProvider,
  TurnDetectionProvider,
  LanguageModelProvider,
  TextToSpeechProvider,
  TelephonyProvider,
  VoiceWorkerSessionBase,

  CurrentTwilioTelephony,
  DeepgramStt,
  CerebraLlm,
  GroqLlm,
  ElevenLabsTts,

  VoiceSessionManager,
  VoiceWorkerSession
};
