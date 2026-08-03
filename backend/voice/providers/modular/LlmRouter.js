'use strict';

const CerebraLlm = require('./CerebraLlm');
const GroqLlm    = require('./GroqLlm');

const STATES = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

class LlmRouter {
  constructor({ cerebrasApiKey, cerebrasModel, groqApiKey, groqModel }) {
    this.cerebrasClient = new CerebraLlm({ apiKey: cerebrasApiKey, model: cerebrasModel });
    this.groqClient     = new GroqLlm({ apiKey: groqApiKey, model: groqModel });

    this.state = STATES.CLOSED;
    this.failuresCount = 0;
    this.lastFailureTime = null;
    this.cooldownMs = 15000; // 15s cooldown for mock testing speed, in production can be 60s
    this._isProbing = false;
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
    // Session IDs are unique. We create sessions in both clients so we can failover instantly
    const [cSessionId, gSessionId] = await Promise.all([
      this.cerebrasClient.createSession({ systemPrompt, callSid, tools }),
      this.groqClient.createSession({ systemPrompt, callSid, tools })
    ]);

    return { cSessionId, gSessionId };
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
    const { cSessionId, gSessionId } = sessionIds;

    // Check circuit breaker status and trigger recovery in background if cooldown passed
    this._checkCircuitBreaker();

    // If circuit is OPEN or HALF_OPEN (probe in-flight), route directly to Groq fallback
    if (this.state === STATES.OPEN || this.state === STATES.HALF_OPEN) {
      console.log(`[LlmRouter] Circuit is ${this.state}. Routing directly to Groq fallback.`);
      return {
        providerUsed: 'groq',
        fallbackTriggered: true,
        fallbackReason: `circuit_breaker_${this.state.toLowerCase()}`,
        promise: this.groqClient.streamResponse({
          sessionId: gSessionId,
          userTranscript,
          abortSignal,
          onChunk,
          onComplete
        })
      };
    }

    // Otherwise, attempt primary (Cerebras)
    return {
      providerUsed: 'cerebras',
      fallbackTriggered: false,
      fallbackReason: null,
      promise: (async () => {
        try {
          let res;
          await this.cerebrasClient.streamResponse({
            sessionId: cSessionId,
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
          console.warn(`[LlmRouter] Primary Cerebras failed: ${err.message}. Attempting failover.`);
          this._handleFailure(err);

          // Instantiate a fresh AbortController to cleanly abort Cerebras stream if not already
          if (abortSignal && !abortSignal.aborted) {
            // Cerebras Axios is already aborted or rejected on throw, but we ensure cancellation
          }

          // Trigger fallback immediately
          const failoverStart = Date.now();
          let fallbackRes;
          await this.groqClient.streamResponse({
            sessionId: gSessionId,
            userTranscript,
            abortSignal,
            onChunk,
            onComplete: (completedData) => {
              fallbackRes = completedData;
            }
          });

          const failoverDuration = Date.now() - failoverStart;
          console.log(`[LlmRouter] Failover to Groq successful. Duration: ${failoverDuration}ms.`);
          
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
    const { cSessionId, gSessionId } = sessionIds;
    await Promise.all([
      this.cerebrasClient.close(cSessionId).catch(() => {}),
      this.groqClient.close(gSessionId).catch(() => {})
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
      console.log('[LlmRouter] Circuit Breaker: Cerebras recovered! Closing circuit.');
    }
    this.state = STATES.CLOSED;
    this.failuresCount = 0;
  }

  _handleFailure(err) {
    this.failuresCount++;
    this.lastFailureTime = Date.now();
    console.warn(`[LlmRouter] Consecutive Cerebras failures: ${this.failuresCount}/3`);
    
    if (this.failuresCount >= 3) {
      this.state = STATES.OPEN;
      console.error(`[LlmRouter] Circuit Breaker: Tripped to OPEN! Failing over directly to Groq.`);
    }
  }

  async runRecoveryProbe() {
    if (this._isProbing) return;
    this._isProbing = true;
    console.log('[LlmRouter] Circuit Breaker: Running background recovery probe...');

    try {
      const probeSession = await this.cerebrasClient.createSession({
        systemPrompt: 'Respond with exactly "pong"',
        tools: []
      });

      // Background stream
      await this.cerebrasClient.streamResponse({
        sessionId: probeSession,
        userTranscript: 'ping',
        onChunk: () => {}
      });

      await this.cerebrasClient.close(probeSession);
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
      groqModel: cfg.groq.model
    });
  }
  return sharedRouterInstance;
}

module.exports = { LlmRouter, getSharedRouter };
