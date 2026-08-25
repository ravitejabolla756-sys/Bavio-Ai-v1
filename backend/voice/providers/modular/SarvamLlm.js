'use strict';

/**
 * SarvamLlm — Sarvam 30B / 105B LLM Adapter
 * High performance conversational LLM tuned for Indic languages and regional contextual grounding.
 */

const axios = require('axios');
const LanguageModelProvider = require('../interfaces/LanguageModelProvider');

class SarvamLlm extends LanguageModelProvider {
  constructor({ apiKey = process.env.SARVAM_API_KEY, model = 'sarvam-30b' } = {}) {
    super('SarvamLlm');
    this._apiKey = apiKey;
    this._defaultModel = model;
    this._sessions = new Map();
  }

  async createSession({ systemPrompt, model = this._defaultModel, temperature = 0.7, maxTokens = 256, callSid = '' }) {
    const sessionId = `sarvam_sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this._sessions.set(sessionId, {
      model,
      systemPrompt,
      temperature,
      maxTokens,
      messages: [{ role: 'system', content: systemPrompt }],
      callSid,
    });
    return sessionId;
  }

  async streamResponse({ sessionId, userTranscript, onChunk, onComplete }) {
    const session = this._sessions.get(sessionId);
    if (!session) throw new Error(`[SarvamLlm] Session ${sessionId} not found`);

    if (!this._apiKey) {
      throw new Error('[SarvamLlm] SARVAM_API_KEY is missing');
    }

    session.messages.push({ role: 'user', content: userTranscript });

    try {
      const response = await axios.post(
        'https://api.sarvam.ai/v1/chat/completions',
        {
          model: session.model,
          messages: session.messages,
          temperature: session.temperature,
          max_tokens: session.maxTokens,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': this._apiKey,
          },
          timeout: 15000,
        }
      );

      const reply = response.data?.choices?.[0]?.message?.content || 'Aapka dhanyawad. Main aapki kaise sahayata kar sakta hoon?';
      session.messages.push({ role: 'assistant', content: reply });

      if (typeof onChunk === 'function') onChunk(reply);
      if (typeof onComplete === 'function') onComplete({ fullText: reply, leadData: null, shouldEnd: false });

    } catch (err) {
      console.error('[SarvamLlm] API Error:', err.response?.data || err.message);
      const fallback = 'Kripya apna sawal dobara batayein.';
      if (typeof onChunk === 'function') onChunk(fallback);
      if (typeof onComplete === 'function') onComplete({ fullText: fallback, leadData: null, shouldEnd: false });
    }
  }

  async cancelResponse(sessionId) {
    // No-op for HTTP completion endpoint
  }

  async callTool() {
    return { result: null };
  }

  async close(sessionId) {
    this._sessions.delete(sessionId);
  }
}

module.exports = SarvamLlm;
