'use strict';

const LanguageModelProvider = require('../interfaces/LanguageModelProvider');
const gnaniService = require('../../../services/gnaniService');

/**
 * GnaniEvonLlm — LanguageModelProvider implementation for Gnani Evon v3.3
 * 
 * Capabilities:
 * - Session-based conversation state tracking
 * - Regional language context reasoning (Tamil, Telugu, Hindi, Indian English)
 * - RAG context integration & grounding
 * - Sentence-level streaming chunk emissions for low-latency TTS pipeline
 * - Tool invocation / outcome extraction support
 */
class GnaniEvonLlm extends LanguageModelProvider {
  constructor(opts = {}) {
    super('GnaniEvonLlm');
    this.apiKey = opts.apiKey || process.env.GNANI_API_KEY;
    this.model = opts.model || 'gnani-evon-v3.3';
    this._sessions = new Map();
  }

  async createSession(opts = {}) {
    const sessionId = `evon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this._sessions.set(sessionId, {
      systemPrompt: opts.systemPrompt || '',
      history: [],
      callSid: opts.callSid || '',
      language: opts.language || 'hi-IN',
      retrievedContext: opts.retrievedContext || '',
      activeAbortController: null
    });
    console.log(`[GnaniEvonLlm] Created session ${sessionId} (model: ${this.model})`);
    return sessionId;
  }

  setSessionContext(sessionId, retrievedContext) {
    const session = this._sessions.get(sessionId);
    if (session) {
      session.retrievedContext = retrievedContext;
    }
  }

  async streamResponse(opts = {}) {
    const { sessionId, userTranscript, onChunk, onComplete } = opts;
    const session = this._sessions.get(sessionId);

    if (!session) {
      throw new Error(`[GnaniEvonLlm] Session ${sessionId} not found`);
    }

    // Append caller utterance to history
    session.history.push({ role: 'user', content: userTranscript });

    const abortController = new AbortController();
    session.activeAbortController = abortController;

    let fullAccumulatedText = '';
    let sentenceBuffer = '';
    const startTime = Date.now();

    try {
      const result = await gnaniService.generateEvonCompletion(session.history, {
        systemPrompt: session.systemPrompt,
        retrievedContext: session.retrievedContext,
        temperature: 0.3,
        maxTokens: 256,
        apiKey: this.apiKey,
        stream: true,
        onChunk: (chunk) => {
          if (abortController.signal.aborted) return;
          fullAccumulatedText += chunk;
          sentenceBuffer += chunk;

          // Emit when a full sentence or clause is ready for TTS
          const match = sentenceBuffer.match(/([.?!;\n]+)|(,\s+)/);
          if (match && match.index !== undefined) {
            const boundaryEnd = match.index + match[0].length;
            const candidate = sentenceBuffer.slice(0, boundaryEnd).trim();
            sentenceBuffer = sentenceBuffer.slice(boundaryEnd);

            if (candidate.length > 2 && onChunk) {
              onChunk(candidate);
            }
          }
        }
      });

      // Flush remainder sentence buffer
      if (sentenceBuffer.trim().length > 0 && onChunk && !abortController.signal.aborted) {
        onChunk(sentenceBuffer.trim());
      }

      const responseText = (result.text || fullAccumulatedText).trim();
      session.history.push({ role: 'assistant', content: responseText });

      if (onComplete && !abortController.signal.aborted) {
        onComplete({
          fullText: responseText,
          leadData: null,
          shouldEnd: responseText.includes('[END_CALL]'),
          ttftMs: result.ttftMs,
          totalLatencyMs: Date.now() - startTime
        });
      }
    } catch (err) {
      console.error(`[GnaniEvonLlm] streamResponse error: ${err.message}`);
      throw err;
    } finally {
      session.activeAbortController = null;
    }
  }

  async cancelResponse(sessionId) {
    const session = this._sessions.get(sessionId);
    if (session && session.activeAbortController) {
      console.log(`[GnaniEvonLlm] Cancelling in-flight stream for session ${sessionId}`);
      session.activeAbortController.abort();
      session.activeAbortController = null;
    }
  }

  async callTool(opts = {}) {
    return { result: 'Tool execution handled in orchestrator' };
  }

  async close(sessionId) {
    if (this._sessions.has(sessionId)) {
      this.cancelResponse(sessionId);
      this._sessions.delete(sessionId);
      console.log(`[GnaniEvonLlm] Closed session ${sessionId}`);
    }
  }
}

module.exports = GnaniEvonLlm;
