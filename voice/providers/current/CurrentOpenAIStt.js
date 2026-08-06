'use strict';

/**
 * CurrentOpenAIStt — batch STT adapter for the current_openai stack
 *
 * Wraps services/openAIService.transcribeAudio() and
 * services/deepgramService.transcribeAudio() in the SpeechToTextProvider
 * interface.  This is a BATCH implementation — it accumulates audio and
 * transcribes after silence is detected — matching the existing behaviour
 * in routes/callStream.js.
 *
 * It does NOT open a live streaming connection.
 * onPartialTranscript is never fired (batch STT cannot produce partials).
 * onSpeechStarted is never fired (energy check is in TurnDetectionProvider).
 * onEndOfTurn fires once with the final transcript.
 */

const SpeechToTextProvider = require('../interfaces/SpeechToTextProvider');
const deepgramService       = require('../../../services/deepgramService');
const openAIService         = require('../../../services/openAIService');

class CurrentOpenAIStt extends SpeechToTextProvider {
  /**
   * @param {object} opts
   * @param {string|null} opts.deepgramApiKey  Custom Deepgram key (or null for env key)
   * @param {string|null} opts.openAiApiKey    Custom OpenAI/Groq key (or null for env key)
   */
  constructor({ deepgramApiKey = null, openAiApiKey = null } = {}) {
    super('CurrentOpenAIStt');
    this._deepgramApiKey = deepgramApiKey;
    this._openAiApiKey   = openAiApiKey;
    this._language       = 'en-US';
    this._connected      = false;
  }

  // ── SpeechToTextProvider implementation ───────────────────────────────────

  async connect({ language = 'en-US' } = {}) {
    this._language  = language;
    this._connected = true;
    // Batch STT — no persistent connection to open
  }

  /**
   * sendAudio is not used in the batch model.
   * The batch path accumulates audio in callStream.js and calls
   * transcribeBuffer() directly.
   */
  // eslint-disable-next-line no-unused-vars
  sendAudio(_audioChunk) {
    // No-op in batch mode.  Audio is passed directly to transcribeBuffer().
  }

  async close() {
    this._connected = false;
  }

  // ── Extended API (batch-specific) ─────────────────────────────────────────

  /**
   * Transcribe a fully buffered audio chunk.
   * Tries Deepgram first, falls back to Whisper.
   *
   * @param {Buffer} wavBuffer  WAV-wrapped mu-law audio (8 kHz)
   * @returns {Promise<string>}  Transcript text
   */
  async transcribeBuffer(wavBuffer) {
    let transcript = '';

    // Primary: Deepgram Nova-2
    const dgKey = this._deepgramApiKey || process.env.DEEPGRAM_API_KEY;
    if (dgKey) {
      try {
        transcript = await deepgramService.transcribeAudio(wavBuffer, this._language, dgKey);
      } catch (err) {
        console.warn(`[CurrentOpenAIStt] Deepgram failed, falling back to Whisper: ${err.message}`);
      }
    }

    // Fallback: OpenAI Whisper / Groq Whisper-large-v3
    if (!transcript) {
      const result = await openAIService.transcribeAudio(wavBuffer, this._language, this._openAiApiKey);
      transcript   = result.transcript || result.text || '';
    }

    if (transcript) {
      this._emitFinalTranscript(transcript);
      this._emitEndOfTurn(transcript);
    }

    return transcript;
  }
}

module.exports = CurrentOpenAIStt;
