'use strict';

const CerebraLlm = require('./CerebraLlm');
const GroqLlm    = require('./GroqLlm');
const OpenAiLlm  = require('./OpenAiLlm');
const { getVoiceConfig } = require('../../config/voiceConfig');

const STATES = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

class LlmRouter {
  constructor({ cerebrasApiKey, cerebrasModel, groqApiKey, groqModel, openaiApiKey, openaiModel }) {
    this.cerebrasClient = cerebrasApiKey ? new CerebraLlm({ apiKey: cerebrasApiKey, model: cerebrasModel }) : null;
    this.groqClient     = groqApiKey ? new GroqLlm({ apiKey: groqApiKey, model: groqModel }) : null;
    this.openaiClient   = openaiApiKey ? new OpenAiLlm({ apiKey: openaiApiKey, model: openaiModel }) : null;

    this.state = STATES.CLOSED;
    this.failuresCount = 0;
    this.lastFailureTime = null;
    this.cooldownMs = 15000; // 15s cooldown for mock testing speed, in production can be 60s
    this._isProbing = false;
  }

  _getClient(providerName) {
    if (providerName === 'cerebras') return this.cerebrasClient;
    if (providerName === 'groq') return this.groqClient;
    if (providerName === 'openai') return this.openaiClient;
    return null;
  }

  getState() {
    return {
      state: this.state,
      failuresCount: this.failuresCount,
      lastFailureTime: this.lastFailureTime
    };
  }

  // ── Concurrency Safe Routing ─────────────────────────────────────────────

  async createSession({ systemPrompt, callSid, tools }) {
    const cfg = getVoiceConfig();
    const primaryClient = this._getClient(cfg.primaryLlm);
    const fallbackClient = this._getClient(cfg.fallbackLlm);

    if (!primaryClient) throw new Error(`[LlmRouter] Primary LLM client not configured for: ${cfg.primaryLlm}`);
    if (!fallbackClient) throw new Error(`[LlmRouter] Fallback LLM client not configured for: ${cfg.fallbackLlm}`);

    const [pSessionId, fbSessionId] = await Promise.all([
      primaryClient.createSession({ systemPrompt, callSid, tools }),
      fallbackClient.createSession({ systemPrompt, callSid, tools })
    ]);

    return { pSessionId, fbSessionId };
  }

  async streamResponse({
    sessionIds,
    userTranscript,
    abortSignal,
    onChunk,
    onComplete,
    firstTokenTimeoutMs = 2000,
    totalResponseTimeoutMs = 15000
  }) {
    const { pSessionId, fbSessionId } = sessionIds;
    const cfg = getVoiceConfig();
    const primaryClient = this._getClient(cfg.primaryLlm);
    const fallbackClient = this._getClient(cfg.fallbackLlm);

    // Check circuit breaker status and trigger recovery in background if cooldown passed
    this._checkCircuitBreaker();

    // If circuit is OPEN or HALF_OPEN (probe in-flight), route directly to fallback
    if (this.state === STATES.OPEN || this.state === STATES.HALF_OPEN) {
      console.log(`[LlmRouter] Circuit is ${this.state}. Routing directly to fallback client (${cfg.fallbackLlm}).`);
      return {
        providerUsed: cfg.fallbackLlm,
        fallbackTriggered: true,
        fallbackReason: `circuit_breaker_${this.state.toLowerCase()}`,
        promise: fallbackClient.streamResponse({
          sessionId: fbSessionId,
          userTranscript,
          abortSignal,
          onChunk,
          onComplete
        })
      };
    }

    // Otherwise, attempt primary
    return {
      providerUsed: cfg.primaryLlm,
      fallbackTriggered: false,
      fallbackReason: null,
      promise: (async () => {
        try {
          let res;
          await primaryClient.streamResponse({
            sessionId: pSessionId,
            userTranscript,
            abortSignal,
            onChunk,
            onComplete: (completedData) => {
              res = completedData;
            }
          });
          this._handleSuccess();
          if (onComplete) onComplete(res);
          return res;
        } catch (err) {
          console.warn(`[LlmRouter] Primary ${cfg.primaryLlm} failed: ${err.message}. Attempting failover.`);
          this._handleFailure(err);

          // Trigger fallback immediately
          const failoverStart = Date.now();
          let fallbackRes;
          await fallbackClient.streamResponse({
            sessionId: fbSessionId,
            userTranscript,
            abortSignal,
            onChunk,
            onComplete: (completedData) => {
              fallbackRes = completedData;
            }
          });

          const failoverDuration = Date.now() - failoverStart;
          console.log(`[LlmRouter] Failover to ${cfg.fallbackLlm} successful. Duration: ${failoverDuration}ms.`);
          
          if (onComplete) {
            onComplete({
              ...fallbackRes,
              fallbackTriggered: true,
              fallbackReason: err.message,
              failoverDuration
            });
          }
          return fallbackRes;
        }
      })()
    };
  }

  async close(sessionIds) {
    const { pSessionId, fbSessionId } = sessionIds;
    const cfg = getVoiceConfig();
    const primaryClient = this._getClient(cfg.primaryLlm);
    const fallbackClient = this._getClient(cfg.fallbackLlm);

    await Promise.all([
      primaryClient ? primaryClient.close(pSessionId).catch(() => {}) : null,
      fallbackClient ? fallbackClient.close(fbSessionId).catch(() => {}) : null
    ]);
  }

  // ── Circuit Breaker Logic ──────────────────────────────────────────────────

  _checkCircuitBreaker() {
    if (this.state === STATES.OPEN && !this._isProbing) {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.state = STATES.HALF_OPEN;
        this.runRecoveryProbe();
      }
    }
  }

  _handleSuccess() {
    if (this.state === STATES.HALF_OPEN || this.state === STATES.OPEN) {
      console.log('[LlmRouter] Circuit Breaker: Primary recovered! Closing circuit.');
    }
    this.state = STATES.CLOSED;
    this.failuresCount = 0;
  }

  _handleFailure(err) {
    this.failuresCount++;
    this.lastFailureTime = Date.now();
    console.warn(`[LlmRouter] Consecutive primary failures: ${this.failuresCount}/3`);
    
    if (this.failuresCount >= 3) {
      this.state = STATES.OPEN;
      console.error(`[LlmRouter] Circuit Breaker: Tripped to OPEN! Failing over directly to fallback.`);
    }
  }

  async runRecoveryProbe() {
    if (this._isProbing) return;
    this._isProbing = true;
    console.log('[LlmRouter] Circuit Breaker: Running background recovery probe...');

    try {
      const cfg = getVoiceConfig();
      const primaryClient = this._getClient(cfg.primaryLlm);

      const probeSession = await primaryClient.createSession({
        systemPrompt: 'Respond with exactly "pong"',
        tools: []
      });

      // Background stream
      await primaryClient.streamResponse({
        sessionId: probeSession,
        userTranscript: 'ping',
        onChunk: () => {}
      });

      await primaryClient.close(probeSession);
      console.log('[LlmRouter] Circuit Breaker: Background recovery probe succeeded. Resetting circuit to CLOSED.');
      this.state = STATES.CLOSED;
      this.failuresCount = 0;
    } catch (err) {
      console.warn(`[LlmRouter] Circuit Breaker: Background recovery probe failed: ${err.message}. Keeping circuit OPEN.`);
      this.state = STATES.OPEN;
      this.lastFailureTime = Date.now();
    } finally {
      this._isProbing = false;
    }
  }
}

let sharedRouterInstance = null;
function getSharedRouter(cfg) {
  if (!sharedRouterInstance) {
    sharedRouterInstance = new LlmRouter({
      cerebrasApiKey: cfg.cerebras._apiKey,
      cerebrasModel: cfg.cerebras.model,
      groqApiKey: cfg.groq._apiKey,
      groqModel: cfg.groq.model,
      openaiApiKey: cfg.openai?._apiKey || null,
      openaiModel: cfg.openai?.model || 'gpt-4o-mini'
    });
  }
  return sharedRouterInstance;
}

module.exports = { LlmRouter, getSharedRouter };
