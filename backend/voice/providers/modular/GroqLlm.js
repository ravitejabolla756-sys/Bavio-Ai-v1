'use strict';

const https                  = require('https');
const axios                  = require('axios');
const LanguageModelProvider  = require('../interfaces/LanguageModelProvider');

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

const keepAliveAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 100,
  keepAliveMsecs: 15000
});

class GroqLlm extends LanguageModelProvider {
  constructor({ apiKey, model = 'llama-3.3-70b-versatile' } = {}) {
    super('GroqLlm');
    if (!apiKey) throw new Error('[GroqLlm] apiKey is required');
    this._apiKey   = apiKey;
    this._model    = model;
    this._sessions = new Map();
  }

  async createSession({ systemPrompt, callSid = '' }) {
    const sessionId = `grq_${callSid || Date.now()}`;
    this._sessions.set(sessionId, { systemPrompt, history: [] });
    console.log(`[GroqLlm] Session created — ${sessionId} model=${this._model}`);
    return sessionId;
  }

  async streamResponse({ sessionId, userTranscript, onChunk, onComplete, abortSignal = null }) {
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
          signal      : abortSignal,
          httpsAgent  : keepAliveAgent
        }
      );

      await new Promise((resolve, reject) => {
        let buffer = '';

        const onAbort = () => {
          response.data.destroy();
          reject(new Error('AbortError'));
        };

        if (abortSignal) {
          if (abortSignal.aborted) {
            return onAbort();
          }
          abortSignal.addEventListener('abort', onAbort);
        }

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

        response.data.on('end', () => {
          if (abortSignal) {
            abortSignal.removeEventListener('abort', onAbort);
          }
          resolve();
        });
        response.data.on('error', (err) => {
          if (abortSignal) {
            abortSignal.removeEventListener('abort', onAbort);
          }
          reject(err);
        });
      });

    } catch (err) {
      console.error(`[GroqLlm] streamResponse error: ${err.message}`);
      throw err;
    }

    if (fullText.includes('[END_CALL]')) {
      shouldEnd = true;
      fullText  = fullText.replace('[END_CALL]', '').trim();
    }

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
      } catch { /* ignore */ }
    }

    session.history.push({ role: 'assistant', content: fullText });
    if (onComplete) onComplete({ fullText, leadData, shouldEnd });
  }

  async cancelResponse(sessionId) {
    console.warn(`[GroqLlm] cancelResponse(${sessionId}) — streaming cancellation not yet implemented`);
  }

  async callTool({ sessionId, toolName, toolArgs }) {
    console.warn(`[GroqLlm] callTool not supported — use CerebraLlm for tool calling`);
    return { result: null };
  }

  async close(sessionId) {
    this._sessions.delete(sessionId);
  }
}

module.exports = GroqLlm;
