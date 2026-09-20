'use strict';

/**
 * ModularVoiceSession — ultra-low-latency voice pipeline.
 *
 * Hot path:
 * Twilio mu-law 8k -> Deepgram Flux v2 -> streaming LLM ->
 * persistent streaming TTS (Sarvam for Indian languages, ElevenLabs global)
 * -> Twilio mu-law 8k.
 *
 * Database persistence and billing happen only after the call ends.
 */

const VoiceWorkerSession       = require('../providers/interfaces/VoiceWorkerSession');
const DeepgramStt              = require('../providers/modular/DeepgramStt');
const CerebraLlm               = require('../providers/modular/CerebraLlm');
const GroqLlm                  = require('../providers/modular/GroqLlm');
const OpenAiLlm                = require('../providers/modular/OpenAiLlm');
const ElevenLabsTts            = require('../providers/modular/ElevenLabsTts');
const SarvamTts                = require('../providers/modular/SarvamTts');
const CurrentTwilioTelephony   = require('../providers/current/CurrentTwilioTelephony');
const { getVoiceConfig }       = require('../config/voiceConfig');
const db                       = require('../../database/db');
const { recordConversationCompletedEvent } = require('../../services/businessEventService');
const { deductCallSeconds }    = require('../../middleware/planEnforcement');

const INDIAN_LANGUAGE_PREFIXES = new Set([
  'hi', 'te', 'ta', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa', 'or'
]);

function shouldUseSarvam(language) {
  if (!language) return false;
  if (language.toLowerCase() === 'en-in') return true;
  return INDIAN_LANGUAGE_PREFIXES.has(language.split('-')[0].toLowerCase());
}

class ModularVoiceSession extends VoiceWorkerSession {
  constructor() {
    super('ModularVoiceSession');

    this._stt        = null;
    this._llm        = null;
    this._tts        = null;
    this._telephony  = null;
    this._startTime  = null;
    this._callSid    = null;
    this._businessId = null;
    this._business   = null;
    this._assistant  = null;
    this._systemPrompt = '';
    this._sessionId  = null;
    this._turnCount  = 0;
    this._leadData   = null;
    this._isProcessing = false;
    this._ended      = false;

    // Eager-EOT speculative generation state.
    this._eagerTranscript = '';
    this._eagerPromise = null;
    this._activeTurnToken = 0;
  }

  async start({ ws, callSid, streamSid, business, assistant, systemPrompt, isDemo = false }) {
    this._callSid    = callSid;
    this._businessId = business?.id;
    this._business   = business;
    this._assistant  = assistant;
    this._systemPrompt = systemPrompt;
    this._startTime  = Date.now();

    const cfg = getVoiceConfig();
    const language = assistant?.language || 'en-US';

    console.log(
      `[ModularVoiceSession] Starting — callSid=${callSid} business=${this._businessId} language=${language}`
    );

    try {
      // 1. Twilio transport.
      this._telephony = new CurrentTwilioTelephony();
      await this._telephony.startMediaSession({ ws, callSid, streamSid });

      // 2. Deepgram Flux v2. Audio stays mu-law/8 kHz end-to-end.
      this._stt = new DeepgramStt({
        apiKey: cfg.deepgram._apiKey,
        model: cfg.deepgram.model,
        eagerEotThreshold: cfg.deepgram.eagerEotThreshold,
        eotThreshold: cfg.deepgram.eotThreshold,
        eotTimeoutMs: cfg.deepgram.eotTimeoutMs,
        audioChunkMs: cfg.deepgram.audioChunkMs,
      });

      this._stt.onSpeechStarted(() => {
        this._interruptAssistant('speech_started');
      });

      this._stt.onEagerEndOfTurn((transcript) => {
        const text = (transcript || '').trim();
        if (!text || this._isProcessing || this._eagerPromise) return;

        // Speculatively start the LLM before the definitive EndOfTurn. If Flux
        // emits TurnResumed, _interruptAssistant() cancels this work.
        this._eagerTranscript = text;
        const token = ++this._activeTurnToken;
        this._eagerPromise = this._handleTurn(text, {
          speculative: true,
          turnToken: token,
        });
      });

      this._stt.onTurnResumed(() => {
        this._interruptAssistant('turn_resumed');
        this._eagerTranscript = '';
      });

      this._stt.onEndOfTurn(async (transcript) => {
        const text = (transcript || '').trim();
        if (!text) return;

        // If the eager transcript already launched this same turn, do not send
        // a duplicate LLM request. Flux can slightly extend the final transcript;
        // similarity by prefix is sufficient for the low-latency speculative path.
        if (
          this._eagerPromise &&
          this._eagerTranscript &&
          (
            text === this._eagerTranscript ||
            text.startsWith(this._eagerTranscript) ||
            this._eagerTranscript.startsWith(text)
          )
        ) {
          await this._eagerPromise.catch(() => {});
          this._eagerPromise = null;
          this._eagerTranscript = '';
          return;
        }

        this._eagerPromise = null;
        this._eagerTranscript = '';
        const token = ++this._activeTurnToken;
        await this._handleTurn(text, { speculative: false, turnToken: token });
      });

      await this._stt.connect({
        language,
        encoding: 'mulaw',
        sampleRate: 8000,
        channels: 1,
      });

      // 3. Streaming LLM.
      this._llm = this._buildLlm(cfg.primaryLlm, cfg);
      this._sessionId = await this._llm.createSession({
        systemPrompt,
        callSid,
      });

      // 4. Persistent streaming TTS chosen by language.
      this._tts = this._buildTts(language, cfg);
      this._tts.onAudioChunk((chunk) => {
        this._telephony?.sendAudio(chunk);
      });
      this._tts.onError((err) => {
        console.error(`[ModularVoiceSession] TTS error: ${err.message}`);
      });

      await this._connectTts(language, cfg);

      // 5. Greeting.
      const greeting =
        assistant?.first_message ||
        assistant?.greeting ||
        'Hello! How can I help you today?';

      this._tts.streamText(greeting);
      await this._tts.flush();

      console.log(
        `[ModularVoiceSession] Providers ready — stt=deepgram_flux llm=${cfg.primaryLlm} tts=${this._tts.providerName}`
      );
    } catch (err) {
      console.error(`[ModularVoiceSession] Startup failed: ${err.message}`);
      throw err;
    }
  }

  handleAudio(audioChunk) {
    this._stt?.sendAudio(audioChunk);
  }

  async end() {
    if (this._ended) return;
    this._ended = true;

    const durationMs = Date.now() - (this._startTime || Date.now());
    const durationSec = Math.ceil(durationMs / 1000);

    console.log(
      `[ModularVoiceSession] Ending — callSid=${this._callSid} duration=${durationSec}s turns=${this._turnCount}`
    );

    try {
      await this._llm?.cancelResponse(this._sessionId).catch(() => {});
      await this._stt?.close().catch(e => console.error('[ModularVoiceSession] STT close error:', e.message));
      await this._tts?.close().catch(e => console.error('[ModularVoiceSession] TTS close error:', e.message));
      if (this._llm && this._sessionId) await this._llm.close(this._sessionId).catch(() => {});
      await this._telephony?.close().catch(() => {});

      if (this._businessId) {
        await this._saveCallRecord(durationSec);
        await deductCallSeconds(this._businessId, durationSec, this._callSid);
      }
    } catch (err) {
      console.error(`[ModularVoiceSession] end() error: ${err.message}`);
    }
  }

  getState() {
    return {
      callSid: this._callSid,
      businessId: this._businessId,
      turnCount: this._turnCount,
      durationMs: this._startTime ? Date.now() - this._startTime : 0,
      isProcessing: this._isProcessing,
      stack: 'modular_v1',
      tts: this._tts?.providerName || null,
    };
  }

  _buildLlm(backend, cfg) {
    if (backend === 'cerebras') {
      return new CerebraLlm({
        apiKey: cfg.cerebras._apiKey,
        model: cfg.cerebras.model,
      });
    }
    if (backend === 'groq') {
      return new GroqLlm({
        apiKey: cfg.groq._apiKey,
        model: cfg.groq.model,
      });
    }
    if (backend === 'openai') {
      return new OpenAiLlm({
        apiKey: cfg.openai._apiKey,
        model: cfg.openai.model,
      });
    }

    throw new Error(`[ModularVoiceSession] Unknown LLM backend: ${backend}`);
  }

  _buildTts(language, cfg) {
    if (shouldUseSarvam(language) && cfg.sarvam.hasKey) {
      return new SarvamTts({
        apiKey: cfg.sarvam._apiKey,
        model: cfg.sarvam.modelId,
        speaker: cfg.sarvam.speaker,
      });
    }

    return new ElevenLabsTts({
      apiKey: cfg.elevenlabs._apiKey,
      modelId: cfg.elevenlabs.modelId,
    });
  }

  async _connectTts(language, cfg) {
    if (this._tts instanceof SarvamTts) {
      await this._tts.connect({
        voiceId: this._assistant?.sarvam_voice_id || cfg.sarvam.speaker,
        modelId: cfg.sarvam.modelId,
        language,
      });
      return;
    }

    await this._tts.connect({
      voiceId:
        this._assistant?.elevenlabs_voice_id ||
        this._assistant?.voice_id ||
        undefined,
      modelId: cfg.elevenlabs.modelId,
      language,
    });
  }

  async _interruptAssistant(reason) {
    ++this._activeTurnToken;

    this._tts?.cancel();
    this._telephony?.clearAudio();
    this._eagerPromise = null;

    if (this._llm && this._sessionId) {
      await this._llm.cancelResponse(this._sessionId).catch(() => {});
    }

    this._isProcessing = false;
    console.log(`[ModularVoiceSession] Barge-in interruption: ${reason}`);
  }

  async _handleTurn(transcript, { speculative = false, turnToken } = {}) {
    if (!transcript?.trim()) return;
    if (this._isProcessing) return;

    this._isProcessing = true;
    this._turnCount++;

    const token = turnToken || ++this._activeTurnToken;
    const cfg = getVoiceConfig();
    const language = this._assistant?.language || 'en-US';

    console.log(
      `[ModularVoiceSession] Turn ${this._turnCount} speculative=${speculative} — "${transcript.slice(0, 80)}"`
    );

    try {
      // A barge-in may have closed the previous TTS socket. Ensure the
      // persistent socket is ready before first LLM token arrives.
      await this._connectTts(language, cfg);

      let succeeded = false;

      try {
        await this._llm.streamResponse({
          sessionId: this._sessionId,
          userTranscript: transcript,
          onChunk: (chunk) => {
            if (token !== this._activeTurnToken) return;
            this._tts?.streamText(chunk);
          },
          onComplete: async ({ leadData, shouldEnd }) => {
            if (token !== this._activeTurnToken) return;
            await this._tts?.flush();
            if (leadData) this._leadData = leadData;
            if (shouldEnd) await this.end();
          },
        });
        succeeded = true;
      } catch (primaryErr) {
        if (
          primaryErr.name === 'AbortError' ||
          primaryErr.name === 'CanceledError' ||
          primaryErr.message === 'AbortError'
        ) {
          return;
        }

        console.error(
          `[ModularVoiceSession] Primary LLM (${cfg.primaryLlm}) failed: ${primaryErr.message}. Trying fallback.`
        );

        if (cfg.primaryLlm !== cfg.fallbackLlm && token === this._activeTurnToken) {
          const fallbackLlm = this._buildLlm(cfg.fallbackLlm, cfg);
          const fbSessionId = await fallbackLlm.createSession({
            systemPrompt: this._systemPrompt,
            callSid: this._callSid,
          });

          await fallbackLlm.streamResponse({
            sessionId: fbSessionId,
            userTranscript: transcript,
            onChunk: (chunk) => {
              if (token !== this._activeTurnToken) return;
              this._tts?.streamText(chunk);
            },
            onComplete: async ({ leadData, shouldEnd }) => {
              if (token !== this._activeTurnToken) return;
              await this._tts?.flush();
              if (leadData) this._leadData = leadData;
              if (shouldEnd) await this.end();
            },
          });

          await fallbackLlm.close(fbSessionId);
          succeeded = true;
        }
      }

      if (!succeeded && token === this._activeTurnToken) {
        this._tts?.streamText(
          "I'm sorry, I'm having a technical issue. Please try again in a moment."
        );
        await this._tts?.flush();
      }
    } catch (err) {
      if (
        err.name !== 'AbortError' &&
        err.name !== 'CanceledError' &&
        err.message !== 'AbortError'
      ) {
        console.error(`[ModularVoiceSession] Turn error: ${err.message}`);
      }
    } finally {
      if (token === this._activeTurnToken) {
        this._isProcessing = false;
      }
    }
  }

  async _saveCallRecord(durationSec) {
    try {
      const summary = `${this._turnCount} turns (modular_v1)`;
      const transcript = this._llm?._sessions?.get(this._sessionId)?.history || [];
      const transcriptJ = JSON.stringify(transcript);
      const countryCode =
        (this._business?.country_code || this._business?.country || 'US')
          .toString()
          .slice(0, 2)
          .toUpperCase();

      const callRes = await db.query(
        `INSERT INTO calls
           (user_id, country_code, call_sid, provider, voice_stack, duration_seconds, status, started_at, ended_at, cost_currency, created_at)
         VALUES ($1, $2, $3, 'twilio', 'modular_v1', $4, 'completed', NOW() - ($4 * INTERVAL '1 second'), NOW(), 'USD', NOW())
         RETURNING id`,
        [this._businessId, countryCode, this._callSid, durationSec]
      );

      const dbCallId = callRes.rows[0]?.id;

      if (dbCallId) {
        await recordConversationCompletedEvent({
          db,
          sourceType: 'modular_voice_session',
          sourceId: this._callSid,
          businessId: this._businessId,
          conversationId: String(dbCallId),
          completedAt: new Date().toISOString(),
        });

        await db.query(
          `INSERT INTO transcripts (call_id, business_id, transcript, summary)
           VALUES ($1, $2, $3::jsonb, $4)
           ON CONFLICT (call_id) DO UPDATE
           SET transcript = EXCLUDED.transcript, summary = EXCLUDED.summary`,
          [dbCallId, this._businessId, transcriptJ, summary]
        );

        if (this._leadData) {
          await db.query(
            `INSERT INTO leads (business_id, call_id, intent, notes, status)
             VALUES ($1, $2, $3, $4, 'new')`,
            [
              this._businessId,
              dbCallId,
              this._leadData.intent || this._leadData.service_requested || 'inquiry',
              JSON.stringify(this._leadData),
            ]
          );
        }
      }
    } catch (err) {
      console.error(`[ModularVoiceSession] _saveCallRecord error: ${err.message}`);
    }
  }
}

module.exports = ModularVoiceSession;
