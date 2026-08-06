'use strict';

/**
 * SpeechToTextProvider — abstract base interface
 *
 * All concrete STT implementations (Deepgram, Whisper, etc.) MUST extend
 * this class and implement every method marked as abstract.
 *
 * Design intent:
 *   - Providers emit events via registered callbacks, not return values.
 *   - This allows both streaming (live WebSocket) and batch (HTTP) providers
 *     to share the same calling convention.
 *   - onEagerEndOfTurn fires before the final transcript to allow the LLM
 *     to pre-compute while the last words are still being transcribed.
 */

class SpeechToTextProvider {
  /**
   * @param {string} providerName  Human-readable name used in logs
   */
  constructor(providerName) {
    if (new.target === SpeechToTextProvider) {
      throw new TypeError(
        'SpeechToTextProvider is abstract and cannot be instantiated directly.'
      );
    }
    this.providerName = providerName;
    this._onPartialTranscript  = null;
    this._onFinalTranscript    = null;
    this._onSpeechStarted      = null;
    this._onEagerEndOfTurn     = null;
    this._onEndOfTurn          = null;
  }

  // ── Abstract: subclasses MUST override ───────────────────────────────────

  /**
   * Establish connection to the STT service.
   * @param {object} opts
   * @param {string} opts.language   BCP-47 code, e.g. 'en-US'
   * @param {string} opts.model      Provider-specific model name
   * @param {string} opts.encoding   'mulaw' | 'linear16' | 'opus'
   * @param {number} opts.sampleRate Sample rate in Hz (e.g. 8000)
   * @param {number} opts.channels   Channel count (1 = mono)
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async connect(opts) {
    throw new Error(`${this.providerName}.connect() not implemented`);
  }

  /**
   * Push a raw audio chunk to the provider.
   * For streaming providers this writes to the live connection.
   * For batch providers this accumulates a buffer.
   * @param {Buffer} audioChunk
   */
  // eslint-disable-next-line no-unused-vars
  sendAudio(audioChunk) {
    throw new Error(`${this.providerName}.sendAudio() not implemented`);
  }

  /**
   * Gracefully close the connection and release resources.
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error(`${this.providerName}.close() not implemented`);
  }

  // ── Callback registration (concrete; stored in base class) ────────────────

  /**
   * Fired when the provider emits an interim (partial) transcript.
   * High frequency — keep the callback lightweight.
   * @param {function(transcript: string): void} cb
   */
  onPartialTranscript(cb) {
    this._onPartialTranscript = cb;
    return this;
  }

  /**
   * Fired when the provider commits a final transcript for a word/phrase.
   * @param {function(transcript: string): void} cb
   */
  onFinalTranscript(cb) {
    this._onFinalTranscript = cb;
    return this;
  }

  /**
   * Fired when the provider detects the start of speech (VAD onset).
   * Use to interrupt TTS playback (barge-in).
   * @param {function(): void} cb
   */
  onSpeechStarted(cb) {
    this._onSpeechStarted = cb;
    return this;
  }

  /**
   * Fired when the provider predicts an imminent end-of-turn
   * before the final transcript is ready (Deepgram endpointing / UtteranceEnd).
   * Allows the LLM request to be pre-launched.
   * @param {function(): void} cb
   */
  onEagerEndOfTurn(cb) {
    this._onEagerEndOfTurn = cb;
    return this;
  }

  /**
   * Fired when the provider definitively signals that the caller has
   * finished their turn.  Receives the committed final transcript.
   * @param {function(transcript: string): void} cb
   */
  onEndOfTurn(cb) {
    this._onEndOfTurn = cb;
    return this;
  }

  // ── Protected helpers — subclasses call these to emit events ─────────────

  _emitPartialTranscript(text) {
    if (this._onPartialTranscript) this._onPartialTranscript(text);
  }

  _emitFinalTranscript(text) {
    if (this._onFinalTranscript) this._onFinalTranscript(text);
  }

  _emitSpeechStarted() {
    if (this._onSpeechStarted) this._onSpeechStarted();
  }

  _emitEagerEndOfTurn() {
    if (this._onEagerEndOfTurn) this._onEagerEndOfTurn();
  }

  _emitEndOfTurn(finalTranscript) {
    if (this._onEndOfTurn) this._onEndOfTurn(finalTranscript);
  }
}

module.exports = SpeechToTextProvider;
