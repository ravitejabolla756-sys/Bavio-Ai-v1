'use strict';

/**
 * TurnDetectionProvider — abstract base interface
 *
 * Responsible for voice activity detection (VAD) and end-of-turn signalling.
 * This is a distinct concern from STT — some providers (e.g. Deepgram Flux)
 * bundle turn detection into their streaming connection; others require a
 * separate VAD implementation (Silero, WebRTC VAD, energy threshold).
 *
 * The current_openai stack uses an energy-threshold accumulator
 * (silenceCount >= 60 packets of 20 ms). Deepgram Flux exposes native
 * UtteranceEnd and endpointing events, making the energy hack unnecessary.
 */

class TurnDetectionProvider {
  /**
   * @param {string} providerName  Human-readable name used in logs
   */
  constructor(providerName) {
    if (new.target === TurnDetectionProvider) {
      throw new TypeError(
        'TurnDetectionProvider is abstract and cannot be instantiated directly.'
      );
    }
    this.providerName         = providerName;
    this._onSpeechStart       = null;
    this._onSpeechEnd         = null;
    this._onEagerEndOfTurn    = null;
  }

  // ── Abstract ──────────────────────────────────────────────────────────────

  /**
   * Start the VAD session.
   * @param {object} opts
   * @param {string} opts.encoding   'mulaw' | 'linear16'
   * @param {number} opts.sampleRate Sample rate in Hz
   * @param {number} [opts.silenceMs]  Silence duration in ms before end-of-turn (default: 800)
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async start(opts) {
    throw new Error(`${this.providerName}.start() not implemented`);
  }

  /**
   * Push a raw audio chunk for VAD analysis.
   * @param {Buffer} audioChunk
   */
  // eslint-disable-next-line no-unused-vars
  pushAudio(audioChunk) {
    throw new Error(`${this.providerName}.pushAudio() not implemented`);
  }

  /**
   * Notify the detector that the AI has started speaking.
   * Allows barge-in energy threshold to be temporarily adjusted.
   */
  setAiSpeaking() {
    // Optional — subclasses may override
  }

  /**
   * Notify the detector that the AI has stopped speaking.
   */
  setAiSilent() {
    // Optional — subclasses may override
  }

  /**
   * Stop VAD and release resources.
   * @returns {Promise<void>}
   */
  async stop() {
    throw new Error(`${this.providerName}.stop() not implemented`);
  }

  // ── Callback registration ─────────────────────────────────────────────────

  /**
   * Fired when speech onset is detected (user started speaking).
   * Use to trigger barge-in on AI playback.
   * @param {function(): void} cb
   */
  onSpeechStart(cb) {
    this._onSpeechStart = cb;
    return this;
  }

  /**
   * Fired when end-of-turn silence threshold is reached.
   * @param {function(): void} cb
   */
  onSpeechEnd(cb) {
    this._onSpeechEnd = cb;
    return this;
  }

  /**
   * Fired on an eager (predictive) end-of-turn signal,
   * before the silence threshold is fully met.
   * @param {function(): void} cb
   */
  onEagerEndOfTurn(cb) {
    this._onEagerEndOfTurn = cb;
    return this;
  }

  // ── Protected emitters ────────────────────────────────────────────────────

  _emitSpeechStart()    { if (this._onSpeechStart)    this._onSpeechStart(); }
  _emitSpeechEnd()      { if (this._onSpeechEnd)      this._onSpeechEnd(); }
  _emitEagerEndOfTurn() { if (this._onEagerEndOfTurn) this._onEagerEndOfTurn(); }
}

module.exports = TurnDetectionProvider;
