'use strict';

/**
 * LanguageModelProvider — abstract base interface
 *
 * Manages a conversational LLM session across a full call.
 * Designed for streaming token delivery so TTS can start before the
 * full LLM response is available (sentence-level streaming pipeline).
 *
 * Tool calling (lead capture) is surfaced as a first-class operation
 * rather than being hidden inside the prompt text ([LEAD_CAPTURED] hack).
 */

class LanguageModelProvider {
  /**
   * @param {string} providerName  Human-readable name used in logs
   */
  constructor(providerName) {
    if (new.target === LanguageModelProvider) {
      throw new TypeError(
        'LanguageModelProvider is abstract and cannot be instantiated directly.'
      );
    }
    this.providerName = providerName;
  }

  // ── Abstract ──────────────────────────────────────────────────────────────

  /**
   * Create a new LLM session for an incoming call.
   *
   * @param {object} opts
   * @param {string} opts.systemPrompt     System instructions
   * @param {string} opts.model            Provider-specific model name
   * @param {number} [opts.maxTokens]      Response token limit (default: 256)
   * @param {number} [opts.temperature]    Sampling temperature (default: 0.7)
   * @param {Array}  [opts.tools]          Tool definitions (JSON Schema array)
   * @param {string} [opts.callSid]        Call SID for logging correlation
   * @returns {Promise<string>}            Session ID
   */
  // eslint-disable-next-line no-unused-vars
  async createSession(opts) {
    throw new Error(`${this.providerName}.createSession() not implemented`);
  }

  /**
   * Send the caller's transcript and stream the LLM response back.
   *
   * The provider MUST invoke onChunk for each incremental token or sentence
   * fragment so TTS can begin immediately.  onComplete is called once when
   * the full response is ready.
   *
   * @param {object} opts
   * @param {string} opts.sessionId        Session created by createSession()
   * @param {string} opts.userTranscript   Latest caller utterance
   * @param {function(string): void} opts.onChunk     Streaming chunk callback
   * @param {function(object): void} opts.onComplete  Full response callback
   *   onComplete receives: { fullText, leadData, shouldEnd }
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async streamResponse(opts) {
    throw new Error(`${this.providerName}.streamResponse() not implemented`);
  }

  /**
   * Cancel an in-flight streamResponse (called on barge-in).
   * @param {string} sessionId
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async cancelResponse(sessionId) {
    throw new Error(`${this.providerName}.cancelResponse() not implemented`);
  }

  /**
   * Invoke a defined tool and return its result to the LLM.
   * Used for structured lead capture instead of the [LEAD_CAPTURED] hack.
   *
   * @param {object} opts
   * @param {string} opts.sessionId
   * @param {string} opts.toolName
   * @param {object} opts.toolArgs
   * @returns {Promise<object>}  { result: any }
   */
  // eslint-disable-next-line no-unused-vars
  async callTool(opts) {
    throw new Error(`${this.providerName}.callTool() not implemented`);
  }

  /**
   * Close the session and release server-side resources.
   * @param {string} sessionId
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async close(sessionId) {
    throw new Error(`${this.providerName}.close() not implemented`);
  }
}

module.exports = LanguageModelProvider;
