'use strict';

/**
 * CerebraLlm — Cerebras GPT-OSS streaming LLM provider
 *
 * Cerebras exposes an OpenAI-compatible REST API at api.cerebras.ai/v1.
 * Uses SSE streaming so TTS can start on the first sentence fragment.
 *
 * Status: IMPLEMENTED — feature-flagged behind modular_v1.
 *
 * Required env: CEREBRAS_API_KEY, CEREBRAS_MODEL
 */

const axios                  = require('axios');
const LanguageModelProvider  = require('../interfaces/LanguageModelProvider');

const CEREBRAS_BASE_URL = 'https://api.cerebras.ai/v1';

// Tool definition for structured lead capture
// Replaces the [LEAD_CAPTURED] text-marker hack
const LEAD_CAPTURE_TOOL = {
  type: 'function',
  function: {
    name       : 'capture_lead',
    description: 'Save caller lead details when name, phone, intent, budget or location is collected.',
    parameters : {
      type      : 'object',
      properties: {
        name    : { type: 'string', description: 'Caller full name' },
        phone   : { type: 'string', description: 'Caller phone number (E.164)' },
        intent  : { type: 'string', description: 'Reason for calling' },
        budget  : { type: 'string', description: 'Budget or price range mentioned' },
        location: { type: 'string', description: 'Location or area of interest' },
      },
      required: ['intent'],
    },
  },
};

class CerebraLlm extends LanguageModelProvider {
  /**
   * @param {object} opts
   * @param {string} opts.apiKey  Cerebras API key (required)
   * @param {string} opts.model   Model name (e.g. 'llama3.1-70b')
   */
  constructor({ apiKey, model = 'llama3.1-70b' } = {}) {
    super('CerebraLlm');
    if (!apiKey) throw new Error('[CerebraLlm] apiKey is required');
    this._apiKey    = apiKey;
    this._model     = model;
    this._sessions  = new Map();   // sessionId → { systemPrompt, history }
  }

  // ── LanguageModelProvider implementation ──────────────────────────────────

  async createSession({ systemPrompt, callSid = '', tools = [LEAD_CAPTURE_TOOL] }) {
    const sessionId = `cbl_${callSid || Date.now()}`;
    this._sessions.set(sessionId, { systemPrompt, history: [], tools });
    console.log(`[CerebraLlm] Session created — ${sessionId} model=${this._model}`);
    return sessionId;
  }

  async streamResponse({ sessionId, userTranscript, onChunk, onComplete }) {
    const session = this._sessions.get(sessionId);
    if (!session) throw new Error(`[CerebraLlm] Unknown session: ${sessionId}`);

    session.history.push({ role: 'user', content: userTranscript });

    const messages = [
      { role: 'system', content: session.systemPrompt },
      ...session.history.map(m => ({
        role   : m.role === 'user' ? 'user' : 'assistant',
        content: m.content?.trim() || '(silence)',
      })),
    ];

    let fullText  = '';
    let leadData  = null;
    let shouldEnd = false;

    try {
      const response = await axios.post(
        `${CEREBRAS_BASE_URL}/chat/completions`,
        {
          model      : this._model,
          max_tokens : 256,
          temperature: 0.7,
          stream     : true,
          messages,
          tools      : session.tools,
        },
        {
          headers     : {
            Authorization : `Bearer ${this._apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
          timeout     : 25000,
        }
      );

      // ── SSE streaming ────────────────────────────────────────────────────
      await new Promise((resolve, reject) => {
        let buffer = '';

        response.data.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop();  // Keep incomplete line

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') { resolve(); return; }

            try {
              const parsed  = JSON.parse(raw);
              const delta   = parsed.choices?.[0]?.delta;
              const token   = delta?.content || '';

              if (token) {
                fullText += token;
                if (onChunk) onChunk(token);
              }

              // Tool call detection
              if (delta?.tool_calls?.length > 0) {
                for (const tc of delta.tool_calls) {
                  if (tc.function?.name === 'capture_lead') {
                    try {
                      leadData = JSON.parse(tc.function.arguments || '{}');
                    } catch { /* incomplete args, skip */ }
                  }
                }
              }
            } catch { /* skip malformed SSE line */ }
          }
        });

        response.data.on('end',   resolve);
        response.data.on('error', reject);
      });

    } catch (err) {
      console.error(`[CerebraLlm] streamResponse error: ${err.message}`);
      throw err;
    }

    // Clean [END_CALL] marker from spoken text
    if (fullText.includes('[END_CALL]')) {
      shouldEnd = true;
      fullText  = fullText.replace('[END_CALL]', '').trim();
    }

    session.history.push({ role: 'assistant', content: fullText });

    if (onComplete) onComplete({ fullText, leadData, shouldEnd });
  }

  async cancelResponse(sessionId) {
    // SSE: cancel happens at the HTTP/stream level.
    // Axios stream cancellation requires CancelToken — stub for now.
    console.warn(`[CerebraLlm] cancelResponse(${sessionId}) — streaming cancellation not yet implemented`);
  }

  async callTool({ sessionId, toolName, toolArgs }) {
    const session = this._sessions.get(sessionId);
    if (!session) throw new Error(`[CerebraLlm] Unknown session: ${sessionId}`);

    // Inject tool result back into history for next turn
    session.history.push({
      role   : 'tool',
      content: JSON.stringify(toolArgs),
      name   : toolName,
    });
    return { result: 'acknowledged' };
  }

  async close(sessionId) {
    this._sessions.delete(sessionId);
  }
}

module.exports = CerebraLlm;
