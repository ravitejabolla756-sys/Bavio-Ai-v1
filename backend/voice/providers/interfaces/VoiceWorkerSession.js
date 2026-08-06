'use strict';

/**
 * VoiceWorkerSession — abstract base interface
 *
 * Top-level coordinator for a single inbound call.
 * Ties together STT + TurnDetection + LLM + TTS + Telephony providers.
 *
 * Concrete implementations:
 *   - voice/sessions/ModularVoiceSession.js  (Deepgram + Cerebras + ElevenLabs)
 *   - The current pipeline in routes/callStream.js is the implicit implementation
 *     for the current_openai stack (not refactored into a class yet).
 *
 * The interface is designed so that:
 *   1. Each call gets its own session instance.
 *   2. The session handles the full call lifecycle (greeting → turns → summary).
 *   3. All state (conversationHistory, turn count, etc.) lives here.
 */

class VoiceWorkerSession {
  /**
   * @param {string} providerName  Human-readable name used in logs
   */
  constructor(providerName) {
    if (new.target === VoiceWorkerSession) {
      throw new TypeError(
        'VoiceWorkerSession is abstract and cannot be instantiated directly.'
      );
    }
    this.providerName = providerName;
  }

  // ── Abstract ──────────────────────────────────────────────────────────────

  /**
   * Start the voice session.
   * Implementations should:
   *   1. Connect all providers.
   *   2. Play the assistant greeting.
   *   3. Begin receiving caller audio.
   *
   * @param {object} opts
   * @param {object} opts.ws           Raw WebSocket (from Twilio upgrade)
   * @param {string} opts.callSid      Twilio call SID
   * @param {object} opts.business     Business DB row
   * @param {object} opts.assistant    Assistant DB row
   * @param {string} opts.systemPrompt Fully rendered system prompt
   * @param {boolean} opts.isDemo      Whether this is a demo session
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async start(opts) {
    throw new Error(`${this.providerName}.start() not implemented`);
  }

  /**
   * Handle an inbound audio chunk from the telephony layer.
   * @param {Buffer} audioChunk  G.711 mu-law 8 kHz mono
   * @returns {void}
   */
  // eslint-disable-next-line no-unused-vars
  handleAudio(audioChunk) {
    throw new Error(`${this.providerName}.handleAudio() not implemented`);
  }

  /**
   * Gracefully end the call: persist transcript, deduct seconds, clean up.
   * @returns {Promise<void>}
   */
  async end() {
    throw new Error(`${this.providerName}.end() not implemented`);
  }

  /**
   * Return the current call state for diagnostics / auditing.
   * @returns {object}
   */
  getState() {
    throw new Error(`${this.providerName}.getState() not implemented`);
  }
}

module.exports = VoiceWorkerSession;
