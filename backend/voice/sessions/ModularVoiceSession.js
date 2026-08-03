'use strict';

/**
 * ModularVoiceSession — VoiceWorkerSession implementation for modular_v1
 *
 * Ties together:
 *   - DeepgramStt     (live streaming STT + native turn detection)
 *   - CerebraLlm      (primary streaming LLM)
 *   - GroqLlm         (fallback LLM if Cerebras fails)
 *   - ElevenLabsTts   (streaming TTS with native ulaw_8000 output)
 *   - CurrentTwilioTelephony  (audio transport)
 *
 * Current status: STUB SAFE — providers are instantiated and connected,
 * but if the modular pipeline fails at any stage it logs the error and
 * falls back to the existing callStream.js behavior.
 *
 * This class does NOT touch the existing callStream.js code path.
 * It is only reached when the voiceStackRouter selects 'modular_v1'.
 */

const VoiceWorkerSession       = require('../providers/interfaces/VoiceWorkerSession');
const DeepgramStt              = require('../providers/modular/DeepgramStt');
const CerebraLlm               = require('../providers/modular/CerebraLlm');
const GroqLlm                  = require('../providers/modular/GroqLlm');
const ElevenLabsTts            = require('../providers/modular/ElevenLabsTts');
const CurrentTwilioTelephony   = require('../providers/current/CurrentTwilioTelephony');
const { getVoiceConfig }       = require('../../config/voiceConfig');
const db                       = require('../../database/db');
const { deductCallSeconds }    = require('../../middleware/planEnforcement');

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
    this._dbCallId   = null;
    this._history    = [];
    this._sessionId  = null;
    this._turnCount  = 0;
    this._leadData   = null;
    this._isProcessing = false;
    this._finalTranscript = '';
  }

  // ── VoiceWorkerSession implementation ────────────────────────────────────

  async start({ ws, callSid, streamSid, business, assistant, systemPrompt, isDemo = false }) {
    this._callSid    = callSid;
    this._businessId = business?.id;
    this._startTime  = Date.now();

    const cfg = getVoiceConfig();

    console.log(`[ModularVoiceSession] Starting — callSid=${callSid} business=${this._businessId}`);

    try {
      // ── 1. Telephony ────────────────────────────────────────────────────
      this._telephony = new CurrentTwilioTelephony();
      await this._telephony.startMediaSession({ ws, callSid, streamSid });

      // ── 2. STT ──────────────────────────────────────────────────────────
      this._stt = new DeepgramStt({
        apiKey: cfg.deepgram._apiKey,
        model : cfg.deepgram.model,
      });

      const language = assistant?.language || 'en-US';

      this._stt.onSpeechStarted(() => {
        // Barge-in: caller started speaking while AI is talking
        if (this._tts) this._tts.cancel();
        this._telephony.clearAudio();
      });

      this._stt.onPartialTranscript((text) => {
        // Optional: log partials for debugging
        // console.debug(`[ModularVoiceSession] Partial: "${text}"`);
      });

      this._stt.onEndOfTurn(async (transcript) => {
        if (!transcript.trim()) return;
        await this._handleTurn(transcript);
      });

      await this._stt.connect({
        language,
        encoding  : 'mulaw',
        sampleRate: 8000,
        channels  : 1,
      });

      // ── 3. LLM ──────────────────────────────────────────────────────────
      const primaryLlmProvider = this._buildLlm(cfg.primaryLlm, cfg);
      this._llm = primaryLlmProvider;

      this._sessionId = await this._llm.createSession({
        systemPrompt,
        callSid,
      });

      // ── 4. TTS ──────────────────────────────────────────────────────────
      this._tts = new ElevenLabsTts({
        apiKey : cfg.elevenlabs._apiKey,
        modelId: cfg.elevenlabs.modelId,
      });

      this._tts.onAudioChunk((chunk) => {
        this._telephony.sendAudio(chunk);
      });

      await this._tts.connect({
        voiceId : assistant?.elevenlabs_voice_id || assistant?.voice_id || undefined,
        language,
      });

      // ── 5. Play greeting ─────────────────────────────────────────────────
      const greeting = assistant?.first_message || assistant?.greeting || 'Hello! How can I help you today?';
      this._tts.streamText(greeting);
      await this._tts.flush();

      console.log(`[ModularVoiceSession] Providers ready. Greeting sent.`);

    } catch (err) {
      console.error(`[ModularVoiceSession] Startup failed: ${err.message}`);
      throw err;   // Caller (callStream.js) will fall back to current pipeline
    }
  }

  handleAudio(audioChunk) {
    if (this._stt) {
      this._stt.sendAudio(audioChunk);
    }
  }

  async end() {
    const durationMs = Date.now() - (this._startTime || Date.now());
    const durationSec = Math.ceil(durationMs / 1000);

    console.log(`[ModularVoiceSession] Ending — callSid=${this._callSid} duration=${durationSec}s turns=${this._turnCount}`);

    try {
      // ── Close providers ──────────────────────────────────────────────────
      if (this._stt)  await this._stt.close().catch(e => console.error('[ModularVoiceSession] STT close error:', e.message));
      if (this._tts)  await this._tts.close().catch(e => console.error('[ModularVoiceSession] TTS close error:', e.message));
      if (this._llm && this._sessionId) await this._llm.close(this._sessionId).catch(() => {});
      if (this._telephony) await this._telephony.close().catch(() => {});

      // ── Persist call record and transcript ────────────────────────────────
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
      callSid      : this._callSid,
      businessId   : this._businessId,
      turnCount    : this._turnCount,
      durationMs   : this._startTime ? Date.now() - this._startTime : 0,
      isProcessing : this._isProcessing,
      stack        : 'modular_v1',
    };
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _buildLlm(backend, cfg) {
    if (backend === 'cerebras') {
      return new CerebraLlm({ apiKey: cfg.cerebras._apiKey, model: cfg.cerebras.model });
    }
    if (backend === 'groq') {
      return new GroqLlm({ apiKey: cfg.groq._apiKey, model: cfg.groq.model });
    }
    throw new Error(`[ModularVoiceSession] Unknown LLM backend: ${backend}`);
  }

  async _handleTurn(transcript) {
    if (this._isProcessing) return;
    this._isProcessing = true;
    this._turnCount++;

    console.log(`[ModularVoiceSession] Turn ${this._turnCount} — "${transcript.slice(0, 80)}"`);

    try {
      // Reset TTS for new turn
      if (this._tts) {
        this._tts.cancel();
        await this._tts.connect();   // Fresh connection per turn for ElevenLabs
      }

      const cfg = getVoiceConfig();
      let succeeded = false;

      // Try primary LLM
      try {
        await this._llm.streamResponse({
          sessionId      : this._sessionId,
          userTranscript : transcript,
          onChunk        : (chunk) => {
            // Sentence-level streaming: send each sentence to TTS immediately
            if (chunk.match(/[.!?]/)) {
              this._tts?.streamText(chunk);
            } else {
              this._tts?.streamText(chunk);
            }
          },
          onComplete: async ({ fullText, leadData, shouldEnd }) => {
            if (this._tts) await this._tts.flush();
            if (leadData)  this._leadData = leadData;
            if (shouldEnd) await this._end();
          },
        });
        succeeded = true;
      } catch (primaryErr) {
        console.error(`[ModularVoiceSession] Primary LLM (${cfg.primaryLlm}) failed: ${primaryErr.message}. Trying fallback.`);

        // Fallback LLM
        if (cfg.primaryLlm !== cfg.fallbackLlm) {
          const fallbackLlm = this._buildLlm(cfg.fallbackLlm, cfg);
          const fbSessionId = await fallbackLlm.createSession({
            systemPrompt: this._llm._sessions?.get(this._sessionId)?.systemPrompt || '',
            callSid      : this._callSid,
          });

          await fallbackLlm.streamResponse({
            sessionId      : fbSessionId,
            userTranscript : transcript,
            onChunk        : (chunk) => this._tts?.streamText(chunk),
            onComplete: async ({ fullText, leadData, shouldEnd }) => {
              if (this._tts) await this._tts.flush();
              if (leadData)  this._leadData = leadData;
              if (shouldEnd) await this._end();
            },
          });
          await fallbackLlm.close(fbSessionId);
          succeeded = true;
        }
      }

      if (!succeeded) {
        const fallbackText = "I'm sorry, I'm having a technical issue. Please try again in a moment.";
        this._tts?.streamText(fallbackText);
        await this._tts?.flush();
      }

    } catch (err) {
      console.error(`[ModularVoiceSession] Turn error: ${err.message}`);
    } finally {
      this._isProcessing = false;
    }
  }

  async _saveCallRecord(durationSec) {
    try {
      const summary     = `${this._turnCount} turns (modular_v1)`;
      const transcript  = this._llm?._sessions?.get(this._sessionId)?.history || [];
      const transcriptJ = JSON.stringify(transcript);

      const callRes = await db.query(
        `INSERT INTO calls
           (user_id, country_code, call_sid, provider, voice_stack, duration_seconds, status, started_at, ended_at, cost_currency, created_at)
         VALUES ($1, $2, $3, 'twilio', 'modular_v1', $4, 'completed', NOW() - INTERVAL '${durationSec} seconds', NOW(), 'USD', NOW())
         RETURNING id`,
        [this._businessId, 'US', this._callSid, durationSec]
      );

      const dbCallId = callRes.rows[0]?.id;
      if (dbCallId) {
        await db.query(
          `INSERT INTO transcripts (call_id, business_id, transcript, summary)
           VALUES ($1, $2, $3::jsonb, $4)
           ON CONFLICT (call_id) DO UPDATE SET transcript = EXCLUDED.transcript, summary = EXCLUDED.summary`,
          [dbCallId, this._businessId, transcriptJ, summary]
        );

        if (this._leadData) {
          await db.query(
            `INSERT INTO leads (business_id, call_id, intent, notes, status)
             VALUES ($1, $2, $3, $4, 'new')`,
            [this._businessId, dbCallId, this._leadData.intent || 'inquiry', JSON.stringify(this._leadData)]
          );
        }
      }
    } catch (err) {
      console.error(`[ModularVoiceSession] _saveCallRecord error: ${err.message}`);
    }
  }
}

module.exports = ModularVoiceSession;
