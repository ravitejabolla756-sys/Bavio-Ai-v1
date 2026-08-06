'use strict';

/**
 * TelephonyProvider — abstract base interface
 *
 * Abstracts the media transport layer (Twilio WebSocket, SIP, etc.).
 * Responsible for:
 *   - Receiving raw inbound audio from the carrier
 *   - Sending synthesised audio back to the carrier
 *   - Clearing (stopping) playback mid-stream (barge-in)
 *   - Terminating the call programmatically
 *
 * The current implementation uses Twilio Media Streams over WebSocket.
 * A SIP implementation for India would replace only this provider.
 */

class TelephonyProvider {
  /**
   * @param {string} providerName  Human-readable name used in logs
   */
  constructor(providerName) {
    if (new.target === TelephonyProvider) {
      throw new TypeError(
        'TelephonyProvider is abstract and cannot be instantiated directly.'
      );
    }
    this.providerName  = providerName;
    this._onAudioChunk = null;
    this._onCallEnd    = null;
  }

  // ── Abstract ──────────────────────────────────────────────────────────────

  /**
   * Initialise the media session for a call.
   * For Twilio this is the WebSocket connection established by Twilio's
   * <Connect><Stream> TwiML verb.
   *
   * @param {object} opts
   * @param {object} opts.ws        Raw WebSocket object from the 'upgrade' event
   * @param {string} opts.callSid   Provider call identifier
   * @param {string} opts.streamSid Twilio stream identifier (set on 'start' event)
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async startMediaSession(opts) {
    throw new Error(`${this.providerName}.startMediaSession() not implemented`);
  }

  /**
   * Send a raw audio buffer to the caller.
   * Buffer must be G.711 mu-law 8 kHz mono.
   * The provider is responsible for chunking (e.g. 160-byte / 20 ms packets).
   *
   * @param {Buffer} audioBuffer
   * @returns {void}
   */
  // eslint-disable-next-line no-unused-vars
  sendAudio(audioBuffer) {
    throw new Error(`${this.providerName}.sendAudio() not implemented`);
  }

  /**
   * Stop any ongoing audio playback immediately (barge-in).
   * For Twilio this sends a 'clear' event on the stream.
   * @returns {void}
   */
  clearAudio() {
    throw new Error(`${this.providerName}.clearAudio() not implemented`);
  }

  /**
   * Terminate the call programmatically.
   * @param {string} [reason]  Optional reason for logging
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async terminateCall(reason) {
    throw new Error(`${this.providerName}.terminateCall() not implemented`);
  }

  /**
   * Close the media session and release resources.
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error(`${this.providerName}.close() not implemented`);
  }

  // ── Callback registration ─────────────────────────────────────────────────

  /**
   * Fired for each inbound audio chunk from the carrier.
   * Chunk is raw G.711 mu-law 8 kHz binary.
   * @param {function(chunk: Buffer): void} cb
   */
  onAudioChunk(cb) {
    this._onAudioChunk = cb;
    return this;
  }

  /**
   * Fired when the carrier signals that the call has ended.
   * @param {function(): void} cb
   */
  onCallEnd(cb) {
    this._onCallEnd = cb;
    return this;
  }

  // ── Protected emitters ────────────────────────────────────────────────────

  _emitAudioChunk(chunk) { if (this._onAudioChunk) this._onAudioChunk(chunk); }
  _emitCallEnd()         { if (this._onCallEnd)    this._onCallEnd(); }
}

module.exports = TelephonyProvider;
