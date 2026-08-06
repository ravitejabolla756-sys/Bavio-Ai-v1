'use strict';

/**
 * CurrentOpenAILlm — LLM adapter for the current_openai stack
 *
 * Wraps services/openAIService.chat() in the LanguageModelProvider interface.
 * Uses the existing GPT-4o / Groq Llama-3.3-70b routing logic unchanged.
 *
 * Streaming: this is NOT a true streaming implementation — the full response
 * is awaited before onComplete fires.  A streaming upgrade belongs in
 * voice/providers/modular/CerebraLlm.js.
 *
 * Tool calling: the [LEAD_CAPTURED] marker approach from openAIService.js
 * is preserved exactly — lead extraction is done internally in chat().
 */

const LanguageModelProvider = require('../interfaces/LanguageModelProvider');
const openAIService          = require('../../../services/openAIService');

class CurrentOpenAILlm extends LanguageModelProvider {
  /**
   * @param {object} opts
   * @param {string|null} opts.apiKey  Custom OpenAI/Groq key (or null for env key)
   */
  constructor({ apiKey = null } = {}) {
    super('CurrentOpenAILlm');
    this._apiKey           = apiKey;
    this._sessions         = new Map(); // sessionId → { systemPrompt, history }
    this._nextSessionId    = 1;
  }

  // ── LanguageModelProvider implementation ──────────────────────────────────

  async createSession({ systemPrompt, callSid = '' }) {
    const sessionId = `cur_${callSid || this._nextSessionId++}`;
    this._sessions.set(sessionId, { systemPrompt, history: [] });
    return sessionId;
  }

  async streamResponse({ sessionId, userTranscript, onChunk, onComplete }) {
    const session = this._sessions.get(sessionId);
    if (!session) throw new Error(`[CurrentOpenAILlm] Unknown session: ${sessionId}`);

    session.history.push({ role: 'user', content: userTranscript });

    const result = await openAIService.chat(session.systemPrompt, session.history, this._apiKey);

    session.history.push({ role: 'assistant', content: result.response_text });

    // Batch delivery — fire a single chunk then complete
    if (onChunk)    onChunk(result.response_text);
    if (onComplete) onComplete({
      fullText  : result.response_text,
      leadData  : result.lead_data,
      shouldEnd : result.should_end,
    });
  }

  // eslint-disable-next-line no-unused-vars
  async cancelResponse(_sessionId) {
    // Batch model — cannot cancel an in-flight HTTP request
  }

  // eslint-disable-next-line no-unused-vars
  async callTool({ sessionId, toolName, toolArgs }) {
    // Not implemented in the current batch pipeline.
    // Tool results come from the [LEAD_CAPTURED] marker inside chat().
    console.warn(`[CurrentOpenAILlm] callTool() called (${toolName}) but is not supported in the current_openai stack`);
    return { result: null };
  }

  async close(sessionId) {
    this._sessions.delete(sessionId);
  }

  // ── Convenience: direct access for callStream.js ──────────────────────────

  /** Returns the history array for a session (read-only). */
  getHistory(sessionId) {
    return this._sessions.get(sessionId)?.history || [];
  }
}

module.exports = CurrentOpenAILlm;
