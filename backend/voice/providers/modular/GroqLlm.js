'use strict';

/**
 * GroqLlm — Groq LLM fallback provider
 *
 * Groq uses the OpenAI-compatible API at api.groq.com/openai/v1.
 * Acts as the fallback when the primary LLM (Cerebras) fails or times out.
 *
 * Note: The existing openAIService.js already routes to Groq when the
 * OPENAI_API_KEY starts with 'gsk_'.  This provider makes that routing
 * explicit and injectable.
 *
 * Status: IMPLEMENTED — feature-flagged behind modular_v1.
 *
 * Required env: GROQ_API_KEY, GROQ_MODEL
 */

const axios                  = require('axios');
const LanguageModelProvider  = require('../interfaces/LanguageModelProvider');

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

class GroqLlm extends LanguageModelProvider {
  /**
   * @param {object} opts
   * @param {string} opts.apiKey  Groq API key (required)
   * @param {string} opts.model   Groq model name
   */
  constructor({ apiKey, model = 'llama-3.3-70b-versatile' } = {}) {
    super('GroqLlm');
    if (!apiKey) throw new Error('[GroqLlm] apiKey is required');
    this._apiKey   = apiKey;
    this._model    = model;
    this._sessions = new Map();
  }

  // ── LanguageModelProvider implementation ──────────────────────────────────

  async createSession({ systemPrompt, callSid = '' }) {
    const sessionId = `grq_${callSid || Date.now()}`;
    this._sessions.set(sessionId, { systemPrompt, history: [] });
    console.log(`[GroqLlm] Session created — ${sessionId} model=${this._model}`);
    return sessionId;
  }

  async streamResponse({ sessionId, userTranscript, onChunk, onComplete }) {
    const session = this._sessions.get(sessionId);
    if (!session) throw new Error(`[GroqLlm] Unknown session: ${sessionId}`);

    session.history.push({ role: 'user', content: userTranscript });

    const messages = [
      { role: 'system', content: session.systemPrompt },
      ...session.history.map(m => ({ role: m.role, content: m.content })),
    ];

    let fullText  = '';
    let leadData  = null;
    let shouldEnd = false;

    try {
      const response = await axios.post(
        `${GROQ_BASE_URL}/chat/completions`,
        {
          model      : this._model,
          max_tokens : 256,
          temperature: 0.7,
          stream     : true,
          messages,
        },
        {
          headers     : {
            Authorization : `Bearer ${this._apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
          timeout     : 20000,
        }
      );

      await new Promise((resolve, reject) => {
        let buffer = '';

        response.data.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') { resolve(); return; }

            try {
              const parsed = JSON.parse(raw);
              const token  = parsed.choices?.[0]?.delta?.content || '';
              if (token) {
                fullText += token;
                if (onChunk) onChunk(token);
              }
            } catch { /* skip */ }
          }
        });

        response.data.on('end',   resolve);
        response.data.on('error', reject);
      });

    } catch (err) {
      console.error(`[GroqLlm] streamResponse error: ${err.message}`);
      throw err;
    }

    // Clean [END_CALL] marker
    if (fullText.includes('[END_CALL]')) {
      shouldEnd = true;
      fullText  = fullText.replace('[END_CALL]', '').trim();
    }

    // Basic [LEAD_CAPTURED] fallback (compatibility with current prompts)
    if (fullText.includes('[LEAD_CAPTURED]')) {
      try {
        const parts   = fullText.split('[LEAD_CAPTURED]');
        const jsonPart = parts[parts.length - 1].trim();
        const start   = jsonPart.indexOf('{');
        const end     = jsonPart.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          leadData = JSON.parse(jsonPart.slice(start, end + 1));
        }
        fullText = parts[0].trim();
      } catch { /* ignore parse failures */ }
    }

    session.history.push({ role: 'assistant', content: fullText });
    if (onComplete) onComplete({ fullText, leadData, shouldEnd });
  }

  async cancelResponse(sessionId) {
    console.warn(`[GroqLlm] cancelResponse(${sessionId}) — streaming cancellation not yet implemented`);
  }

  // eslint-disable-next-line no-unused-vars
  async callTool({ sessionId, toolName, toolArgs }) {
    console.warn(`[GroqLlm] callTool not supported — use CerebraLlm for tool calling`);
    return { result: null };
  }

  async close(sessionId) {
    this._sessions.delete(sessionId);
  }
}

module.exports = GroqLlm;
