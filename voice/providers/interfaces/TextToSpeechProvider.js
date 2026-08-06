'use strict';

/**
 * TextToSpeechProvider — abstract base interface
 *
 * Designed for sentence-level streaming: text chunks arrive as the LLM
 * generates them and audio chunks are returned before the full response
 * is known.  This cuts first-audio latency vs full-response TTS.
 *
 * Audio output format MUST be G.711 mu-law 8 kHz mono so Twilio can
 * play it directly without re-encoding.
 */

class TextToSpeechProvider {
  /**
   * @param {string} providerName  Human-readable name used in logs
   */
  constructor(providerName) {
    if (new.target === TextToSpeechProvider) {
      throw new TypeError(
        'TextToSpeechProvider is abstract and cannot be instantiated directly.'
      );
    }
    this.providerName    = providerName;
    this._onAudioChunk   = null;
    this._onComplete     = null;
    this._onError        = null;
  }

  // ── Abstract ──────────────────────────────────────────────────────────────

  /**
   * Open a TTS session / connection for the duration of one call turn.
   *
   * @param {object} opts
   * @param {string} opts.voiceId       Provider-specific voice identifier
   * @param {string} opts.modelId       Provider-specific model/engine ID
   * @param {string} [opts.outputFormat] Audio format (default: 'ulaw_8000')
   * @param {string} [opts.language]    BCP-47 hint (e.g. 'en-US')
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async connect(opts) {
    throw new Error(`${this.providerName}.connect() not implemented`);
  }

  /**
   * Stream a text chunk to the TTS engine.
   * Providers should start emitting audio chunks as soon as possible.
   * Call multiple times with sentence fragments; call flush() when done.
   *
   * @param {string} textChunk
   * @returns {void}
   */
  // eslint-disable-next-line no-unused-vars
  streamText(textChunk) {
    throw new Error(`${this.providerName}.streamText() not implemented`);
  }

  /**
   * Signal that all text for this turn has been sent.
   * The provider should finish generating audio and emit the final chunk.
   * @returns {Promise<void>}
   */
  async flush() {
    throw new Error(`${this.providerName}.flush() not implemented`);
  }

  /**
   * Abort the current synthesis (barge-in / cancellation).
   * @returns {void}
   */
  cancel() {
    throw new Error(`${this.providerName}.cancel() not implemented`);
  }

  /**
   * Close the connection and release resources.
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error(`${this.providerName}.close() not implemented`);
  }

  // ── Callback registration ─────────────────────────────────────────────────

  /**
   * Fired for each audio chunk as TTS generates it.
   * The chunk is a Buffer containing G.711 mu-law 8 kHz mono audio.
   * @param {function(chunk: Buffer): void} cb
   */
  onAudioChunk(cb) {
    this._onAudioChunk = cb;
    return this;
  }

  /**
   * Fired when TTS synthesis for the current turn is complete.
   * @param {function(): void} cb
   */
  onComplete(cb) {
    this._onComplete = cb;
    return this;
  }

  /**
   * Fired on TTS error.
   * @param {function(error: Error): void} cb
   */
  onError(cb) {
    this._onError = cb;
    return this;
  }

  // ── Protected emitters ────────────────────────────────────────────────────

  _emitAudioChunk(chunk) { if (this._onAudioChunk) this._onAudioChunk(chunk); }
  _emitComplete()        { if (this._onComplete)   this._onComplete(); }
  _emitError(err)        { if (this._onError)      this._onError(err); }
}

module.exports = TextToSpeechProvider;
