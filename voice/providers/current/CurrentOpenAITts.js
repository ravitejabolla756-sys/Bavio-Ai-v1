'use strict';

/**
 * CurrentOpenAITts — TTS adapter for the current_openai stack
 *
 * Wraps services/openAIService.textToSpeech() in the TextToSpeechProvider
 * interface.  This is a BATCH implementation — the full text is collected
 * and sent as one HTTP request, then the result is delivered as one audio
 * chunk.  No sentence-level streaming.
 *
 * Output: G.711 mu-law 8 kHz mono (convertPcm24kToMuLaw8k inside openAIService).
 */

const TextToSpeechProvider = require('../interfaces/TextToSpeechProvider');
const openAIService         = require('../../../services/openAIService');

class CurrentOpenAITts extends TextToSpeechProvider {
  /**
   * @param {object} opts
   * @param {string|null} opts.apiKey    Custom OpenAI key (or null for env key)
   * @param {string}      opts.voiceId   OpenAI voice name (alloy, nova, etc.)
   * @param {string}      opts.language  BCP-47 hint
   */
  constructor({ apiKey = null, voiceId = 'alloy', language = 'en-US' } = {}) {
    super('CurrentOpenAITts');
    this._apiKey   = apiKey;
    this._voiceId  = voiceId;
    this._language = language;
    this._buffer   = [];       // Accumulated text chunks
    this._open     = false;
    this._cancelled = false;
  }

  // ── TextToSpeechProvider implementation ───────────────────────────────────

  async connect({ voiceId, language } = {}) {
    if (voiceId)  this._voiceId  = voiceId;
    if (language) this._language = language;
    this._buffer    = [];
    this._cancelled = false;
    this._open      = true;
  }

  streamText(textChunk) {
    if (!this._open || this._cancelled) return;
    this._buffer.push(textChunk);
  }

  async flush() {
    if (!this._open || this._cancelled) return;

    const fullText = this._buffer.join('');
    this._buffer   = [];

    if (!fullText.trim()) {
      this._emitComplete();
      return;
    }

    try {
      const muLawBuffer = await openAIService.textToSpeech(
        fullText,
        this._voiceId,
        this._language,
        'ulaw_8000',
        this._apiKey
      );
      if (!this._cancelled) {
        this._emitAudioChunk(muLawBuffer);
        this._emitComplete();
      }
    } catch (err) {
      this._emitError(err);
    }
  }

  cancel() {
    this._cancelled = true;
    this._buffer    = [];
  }

  async close() {
    this._open      = false;
    this._cancelled = true;
    this._buffer    = [];
  }

  // ── Convenience: synthesize a single text string ──────────────────────────

  /**
   * Shortcut for single-string synthesis (used by callStream greeting).
   * @param {string} text
   * @returns {Promise<Buffer>}  G.711 mu-law buffer
   */
  async synthesize(text) {
    return openAIService.textToSpeech(
      text,
      this._voiceId,
      this._language,
      'ulaw_8000',
      this._apiKey
    );
  }
}

module.exports = CurrentOpenAITts;
