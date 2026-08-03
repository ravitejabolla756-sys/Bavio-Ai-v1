'use strict';

const db                     = require('../../database/db');
const VoiceWorkerSessionBase = require('../providers/interfaces/VoiceWorkerSession');
const DeepgramStt            = require('../providers/modular/DeepgramStt');
const ElevenLabsTts          = require('../providers/modular/ElevenLabsTts');
const CurrentTwilioTelephony = require('../providers/current/CurrentTwilioTelephony');
const { getSharedRouter }    = require('../providers/modular/LlmRouter');
const { getVoiceConfig }     = require('../config/voiceConfig');

// Developer email bypass list (matching planEnforcement.js)
const DEVELOPER_EMAILS = ['ravitejabolla756@gmail.com', 'praneeth.dev111@gmail.com'];

// Session States
const STATES = {
  INITIALIZING    : 'INITIALIZING',
  LISTENING       : 'LISTENING',
  CALLER_SPEAKING : 'CALLER_SPEAKING',
  EAGER_TURN      : 'EAGER_TURN',
  THINKING        : 'THINKING',
  SPEAKING        : 'SPEAKING',
  INTERRUPTED     : 'INTERRUPTED',
  ENDING          : 'ENDING',
  ENDED           : 'ENDED',
  FAILED          : 'FAILED'
};

/**
 * Normalizes spelled-out telephone digit words to numeric digits.
 * Preserves the original text context around them.
 */
function normalizeTelephoneTranscript(text) {
  if (!text) return '';
  const digitWords = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9'
  };
  return text
    .split(/\s+/)
    .map(word => {
      const clean = word.toLowerCase().replace(/[^a-z]/g, '');
      return digitWords[clean] !== undefined ? digitWords[clean] : word;
    })
    .join(' ');
}

class VoiceWorkerSession extends VoiceWorkerSessionBase {
  constructor(callSid, businessId, assistantId, isDemo = false) {
    super('VoiceWorkerSession');
    this.callSid       = callSid;
    this.businessId    = businessId;
    this.assistantId   = assistantId;
    this.isDemo        = isDemo;
    this.sessionId     = `sess_${callSid}_${Date.now()}`;

    this.state         = STATES.INITIALIZING;
    this.startTime     = null;
    this.durationLimitTimer = null;
    this.isProcessing  = false;
    this.turnCount     = 0;
    this.leadData      = null;

    // Speculative Turn State
    this._isSpeculative             = false;
    this._speculativeAudioChunks    = [];
    this._speculativeAbortController = null;
    this._currentSpeculativeLlmText = '';
    this._speculativeShouldEnd      = false;

    // Response Sequence Tracking
    this._currentResponseId = null;

    // Chunking Buffer for TTS streaming
    this._chunkBuffer = '';
    this._firstSpeakablePhraseSent = false;

    // Provider instances
    this._stt          = null;
    this._router       = null;
    this._llmSessionIds = null;
    this._tts          = null;
    this._telephony    = null;

    // Database loaded settings
    this._business     = null;
    this._assistant    = null;
    this._systemPrompt = null;
    this._language     = 'en-US';

    this.turns       = [];
    this.currentTurn = null;

    // Latency & Token Metrics Instrumentation
    this.metrics = {
      // Deepgram Flux / STT
      deepgram_connection_started_at    : null,
      deepgram_partial_transcript_count : 0,
      deepgram_reconnect_count          : 0,
      deepgram_error_code               : null,

      // Telephony (Twilio)
      twilio_first_audio_received       : null,
      caller_speech_started             : null,
      caller_speech_end_estimated       : null,
      deepgram_eager_eot                : null,
      deepgram_final_eot                : null,
      twilio_first_audio_sent           : null,
      twilio_audio_cleared              : null,

      // LLM Routing & Failovers
      llm_request_started               : null,
      llm_first_token                   : null,
      llm_first_speakable_phrase        : null,
      llm_completed_at                  : null,
      llm_cancelled_at                  : null,
      llm_input_tokens                  : 0,
      llm_output_tokens                 : 0,
      llm_reasoning_tokens_if_available : 0,
      llm_tool_calls                    : 0,
      llm_error_code                    : null,

      // TTS
      tts_request_started               : null,
      tts_first_audio                   : null,
      tts_audio_chunks                  : 0,
      tts_characters                    : 0,
      tts_cancelled_at                  : null,
      tts_completed_at                  : null,
      tts_reconnect_count               : 0,
      tts_error_code                    : null,

      // Speculative & Interruption Events
      response_cancelled                : null,
      caller_interruption_detected      : null,

      // Failover Router Specifics
      llm_primary_provider              : 'cerebras',
      llm_selected_provider             : 'cerebras',
      llm_fallback_triggered            : false,
      llm_fallback_reason               : null,
      llm_failover_duration_ms          : 0,
      llm_circuit_breaker_state         : 'CLOSED',
      llm_provider_error_code           : null
    };

    this._log(`Session instance created. State: ${this.state}`);
  }

  _getOrCreateTurn() {
    if (!this.currentTurn) {
      this.currentTurn = {
        turnIndex: this.turnCount + 1,
        caller_speech_start: Date.now(),
        caller_speech_end_estimated: null,
        deepgram_eager_eot: null,
        deepgram_final_eot: null,
        llm_request_start: null,
        llm_first_token: null,
        llm_first_speakable_phrase: null,
        tts_request_start: null,
        tts_first_audio: null,
        telephony_first_audio_sent: null,
        caller_interruption: null,
        audio_clear_sent: null,
        response_complete: null,
        
        // Calculated durations
        end_to_end_first_audio_ms: null,
        speech_end_to_llm_first_token_ms: null,
        speech_end_to_tts_first_audio_ms: null,
        speech_end_to_telephony_audio_ms: null,
        interruption_clear_ms: null,

        // Segment properties
        region: getVoiceConfig().region || 'us-east-1',
        country: this._business?.country || 'US',
        language: this._language,
        voice: this._assistant?.voice_id || 'meera',
        llm_provider: this.metrics.llm_selected_provider || 'cerebras',
        stt_model: 'deepgram-flux',
        tts_model: 'eleven-flash-2.5',
        telephony_provider: 'twilio',
        is_tool_response: false,
        is_mobile: false,

        userTranscript: '',
        aiResponse: '',
        error: null,
        cancelled: false
      };
      this.turns.push(this.currentTurn);
    }
    return this.currentTurn;
  }

  async _finalizeTurn(status = 'success') {
    const turn = this.currentTurn;
    if (!turn || turn.response_complete) return;

    turn.response_complete = Date.now();
    
    // Calculate durations
    const speechEnd = turn.deepgram_final_eot || turn.deepgram_eager_eot || turn.caller_speech_start;
    
    if (turn.telephony_first_audio_sent && speechEnd) {
      turn.end_to_end_first_audio_ms = turn.telephony_first_audio_sent - speechEnd;
      turn.speech_end_to_telephony_audio_ms = turn.telephony_first_audio_sent - speechEnd;
    }
    if (turn.llm_first_token && speechEnd) {
      turn.speech_end_to_llm_first_token_ms = turn.llm_first_token - speechEnd;
    }
    if (turn.tts_first_audio && speechEnd) {
      turn.speech_end_to_tts_first_audio_ms = turn.tts_first_audio - speechEnd;
    }
    if (turn.caller_interruption && turn.audio_clear_sent) {
      turn.interruption_clear_ms = turn.audio_clear_sent - turn.caller_interruption;
    }

    turn.llm_provider = this.metrics.llm_selected_provider || 'cerebras';

    // Persist to DB asynchronously
    try {
      await db.query(
        `INSERT INTO call_turn_metrics (
          call_sid, business_id, turn_index,
          caller_speech_start, caller_speech_end_estimated, deepgram_eager_eot, deepgram_final_eot,
          llm_request_start, llm_first_token, llm_first_speakable_phrase,
          tts_request_start, tts_first_audio, telephony_first_audio_sent,
          caller_interruption, audio_clear_sent, response_complete,
          end_to_end_first_audio_ms, speech_end_to_llm_first_token_ms,
          speech_end_to_tts_first_audio_ms, speech_end_to_telephony_audio_ms, interruption_clear_ms,
          region, country, language, voice, llm_provider, stt_model, tts_model, telephony_provider,
          is_tool_response, is_mobile, user_transcript, ai_response, error, cancelled
        ) VALUES (
          $1, $2, $3,
          $4, $5, $6, $7,
          $8, $9, $10,
          $11, $12, $13,
          $14, $15, $16,
          $17, $18,
          $19, $20, $21,
          $22, $23, $24, $25, $26, $27, $28, $29,
          $30, $31, $32, $33, $34, $35
        )`,
        [
          this.callSid, this.businessId, turn.turnIndex,
          turn.caller_speech_start ? new Date(turn.caller_speech_start) : null,
          turn.caller_speech_end_estimated ? new Date(turn.caller_speech_end_estimated) : null,
          turn.deepgram_eager_eot ? new Date(turn.deepgram_eager_eot) : null,
          turn.deepgram_final_eot ? new Date(turn.deepgram_final_eot) : null,
          turn.llm_request_start ? new Date(turn.llm_request_start) : null,
          turn.llm_first_token ? new Date(turn.llm_first_token) : null,
          turn.llm_first_speakable_phrase ? new Date(turn.llm_first_speakable_phrase) : null,
          turn.tts_request_start ? new Date(turn.tts_request_start) : null,
          turn.tts_first_audio ? new Date(turn.tts_first_audio) : null,
          turn.telephony_first_audio_sent ? new Date(turn.telephony_first_audio_sent) : null,
          turn.caller_interruption ? new Date(turn.caller_interruption) : null,
          turn.audio_clear_sent ? new Date(turn.audio_clear_sent) : null,
          turn.response_complete ? new Date(turn.response_complete) : null,
          turn.end_to_end_first_audio_ms,
          turn.speech_end_to_llm_first_token_ms,
          turn.speech_end_to_tts_first_audio_ms,
          turn.speech_end_to_telephony_audio_ms,
          turn.interruption_clear_ms,
          turn.region, turn.country, turn.language, turn.voice, turn.llm_provider, turn.stt_model, turn.tts_model, turn.telephony_provider,
          turn.is_tool_response, turn.is_mobile, turn.userTranscript, turn.aiResponse, turn.error, turn.cancelled
        ]
      );
    } catch (err) {
      this._log(`Failed to write turn metrics: ${err.message}`, 'error');
    }

    this.currentTurn = null;
  }

  // ── VoiceWorkerSession interface implementation ───────────────────────────

  async start({ ws, streamSid }) {
    this._transition(STATES.INITIALIZING);
    this.startTime = Date.now();

    try {
      // 1. Load Business and Assistant settings once from PostgreSQL
      await this._loadContext();

      // 2. Validate client call balance limits
      const allowed = await this._verifyBalance();
      if (!allowed) {
        this._transition(STATES.FAILED);
        await this._playSystemWarning("balance_exhausted");
        await this.end("insufficient_balance");
        return;
      }

      const cfg = getVoiceConfig();

      // 3. Connect Telephony
      this._telephony = new CurrentTwilioTelephony();
      await this._telephony.startMediaSession({ ws, callSid: this.callSid, streamSid });

      // Handle Twilio call stop/end event
      this._telephony.onCallEnd(async () => {
        this._log('Telephony provider signaled call end.');
        await this.end('caller_hangup');
      });

      // Forward raw caller audio to VAD and STT
      this._telephony.onAudioChunk((chunk) => {
        if (this.metrics.twilio_first_audio_received === null) {
          this.metrics.twilio_first_audio_received = Date.now();
        }
        this.handleAudio(chunk);
      });

      // 4. Connect STT (Deepgram Flux V2)
      this._stt = new DeepgramStt({
        apiKey: cfg.deepgram._apiKey,
        model : cfg.deepgram.model
      });

      this.metrics.deepgram_connection_started_at = Date.now();

      // ── VAD speech start or turn resumption event ──
      const handleCancellation = () => {
        if (this._isSpeculative) {
          this._log('Turn Resumed / speech start. Cancelling speculative execution.');
          this.metrics.response_cancelled = Date.now();
          this.metrics.llm_cancelled_at = Date.now();
          this._isSpeculative = false;
          if (this._speculativeAbortController) {
            this._speculativeAbortController.abort();
            this._speculativeAbortController = null;
          }
          if (this._tts) this._tts.cancel();
          if (this._telephony) this._telephony.clearAudio();
          this._speculativeAudioChunks = [];
          this._transition(STATES.CALLER_SPEAKING);
        }
      };
      this._stt.onSpeechStarted(() => {
        this.metrics.caller_speech_started = Date.now();
        if (this.currentTurn) {
          this._finalizeTurn('interrupted');
        }
        const turn = this._getOrCreateTurn();
        turn.caller_speech_start = Date.now();

        if (this.state === STATES.SPEAKING || this.state === STATES.THINKING) {
          this._handleBargeIn('deepgram_vad');
        }
        handleCancellation();
      });

      this._stt.onTurnResumed(() => {
        handleCancellation();
      });

      this._stt.onPartialTranscript((text) => {
        this.metrics.deepgram_partial_transcript_count++;
        const isDigitPattern = /\b\d{3,}\b/.test(text) ||
                               /\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/i.test(text);
        const isSensitiveKeyword = /\b(email|address|road|street|zip|pincode|pin|code|digit|number|phone)\b/i.test(text);
        const isLongExplanation = text.length > 80;

        const turn = this._getOrCreateTurn();
        if (isDigitPattern || isSensitiveKeyword || isLongExplanation) {
          this._stt.configureThresholds({
            eotThreshold: 0.85,
            eotTimeoutMs: 4000
          });
          this.metrics.caller_speech_end_estimated = Date.now() + 4000;
          turn.caller_speech_end_estimated = Date.now() + 4000;
        } else {
          this._stt.configureThresholds({
            eotThreshold: 0.7,
            eotTimeoutMs: 2000
          });
          this.metrics.caller_speech_end_estimated = Date.now() + 2000;
          turn.caller_speech_end_estimated = Date.now() + 2000;
        }
      });

      this._stt.onEagerEndOfTurn(async (transcript) => {
        if (!transcript.trim()) return;
        this.metrics.deepgram_eager_eot = Date.now();
        const turn = this._getOrCreateTurn();
        turn.deepgram_eager_eot = Date.now();
        turn.userTranscript = transcript;
        await this._startSpeculativeTurn(transcript);
      });

      this._stt.onEndOfTurn(async (transcript) => {
        if (!transcript.trim()) return;
        this.metrics.deepgram_final_eot = Date.now();
        const turn = this._getOrCreateTurn();
        turn.deepgram_final_eot = Date.now();
        turn.userTranscript = transcript;
        await this._confirmTurn(transcript);
      });

      await this._stt.connect({
        language  : this._language,
        encoding  : 'mulaw',
        sampleRate: 8000,
        channels  : 1
      });

      this._router = getSharedRouter(cfg);
      this._llmSessionIds = await this._router.createSession({
        systemPrompt: this._systemPrompt,
        callSid     : this.callSid
      });

      this._tts = new ElevenLabsTts({
        apiKey : cfg.elevenlabs._apiKey,
        modelId: cfg.elevenlabs.modelId
      });

      this._tts.onAudioChunk((chunk, responseId) => {
        if (responseId !== this._currentResponseId) {
          return;
        }

        if (this.metrics.tts_first_audio === null) {
          this.metrics.tts_first_audio = Date.now();
          const turn = this._getOrCreateTurn();
          turn.tts_first_audio = Date.now();
        }

        if (this._isSpeculative) {
          this._speculativeAudioChunks.push(chunk);
        } else {
          if (this.state === STATES.SPEAKING || this.state === STATES.THINKING) {
            if (this.metrics.twilio_first_audio_sent === null) {
              this.metrics.twilio_first_audio_sent = Date.now();
              const turn = this._getOrCreateTurn();
              turn.telephony_first_audio_sent = Date.now();
            }
            this._telephony.sendAudio(chunk);
          }
        }
      });

      this._tts.onComplete(() => {
        if (!this._isSpeculative && this.state === STATES.SPEAKING) {
          this._transition(STATES.LISTENING);
        }
      });

      await this._tts.connect({
        voiceId : this._assistant?.voice_id || undefined,
        language: this._language
      });

      // 7. Start greeting
      const greeting = this._assistant?.first_message || this._assistant?.greeting || 'Hello!';
      this._currentResponseId = `resp_greet_${Date.now()}`;
      this._transition(STATES.SPEAKING);
      this._tts.streamText(greeting, this._currentResponseId);
      await this._tts.flush();

    } catch (err) {
      this._log(`Fatal start error: ${err.message}`, 'error');
      this.metrics.deepgram_error_code = err.code || err.message;
      this._transition(STATES.FAILED);
      await this.end('failed_startup');
    }
  }

  handleAudio(audioChunk) {
    if (this.state === STATES.ENDED || this.state === STATES.ENDING) return;

    // Energy VAD fallback barge-in check
    if (this._telephony && this._telephony.isSpeaking) {
      let sum = 0;
      for (let i = 0; i < audioChunk.length; i++) {
        const u = ~audioChunk[i];
        const sign = (u & 0x80) ? -1 : 1;
        const exponent = (u & 0x70) >> 4;
        const mantissa = u & 0x0F;
        let sample = (mantissa << 3) + 130;
        sample <<= (exponent - 1);
        const pcm = sign * (sample - 130);
        sum += pcm * pcm;
      }
      const energy = Math.sqrt(sum / audioChunk.length);

      if (energy > 400) {
        this._handleBargeIn('energy_vad');
      }
    }

    if (this._stt) {
      this._stt.sendAudio(audioChunk);
    }
  }

  async end(reason = 'completed') {
    if (this.state === STATES.ENDED) return;
    this._transition(STATES.ENDING);

    this._log(`Ending call session. Reason: ${reason}`);

    if (this.durationLimitTimer) {
      clearTimeout(this.durationLimitTimer);
      this.durationLimitTimer = null;
    }

    const durationSec = Math.ceil((Date.now() - this.startTime) / 1000);

    // Sync reconnect counts and errors from Deepgram
    if (this._stt) {
      this.metrics.deepgram_reconnect_count = this._stt.reconnectCount;
      if (this._stt.errorCode) {
        this.metrics.deepgram_error_code = this._stt.errorCode;
      }
    }

    // Sync ElevenLabs TTS Metrics
    if (this._tts && this._tts.metrics) {
      this.metrics.tts_request_started   = this._tts.metrics.tts_request_started_at;
      this.metrics.tts_first_audio       = this._tts.metrics.tts_first_audio_at;
      this.metrics.tts_audio_chunks      = this._tts.metrics.tts_audio_chunks;
      this.metrics.tts_characters        = this._tts.metrics.tts_characters;
      this.metrics.tts_cancelled_at      = this._tts.metrics.tts_cancelled_at;
      this.metrics.tts_completed_at      = this._tts.metrics.tts_completed_at;
      this.metrics.tts_reconnect_count   = this._tts.metrics.tts_reconnect_count;
      this.metrics.tts_error_code        = this._tts.metrics.tts_error_code;
    }

    // Sync router circuit breaker state
    if (this._router) {
      const rState = this._router.getState();
      this.metrics.llm_circuit_breaker_state = rState.state;
    }

    // Monotonic Latency Delta Calculations
    const speechEnd = this.metrics.deepgram_eager_eot || this.metrics.deepgram_final_eot;
    const firstToken = this.metrics.llm_first_token;
    const firstTts = this.metrics.tts_first_audio;
    const firstTwilioSent = this.metrics.twilio_first_audio_sent;
    const interruption = this.metrics.caller_interruption_detected;
    const audioClear = this.metrics.twilio_audio_cleared;

    const speech_end_to_first_token_ms = (speechEnd && firstToken) ? (firstToken - speechEnd) : null;
    const speech_end_to_first_tts_audio_ms = (speechEnd && firstTts) ? (firstTts - speechEnd) : null;
    const speech_end_to_first_twilio_audio_ms = (speechEnd && firstTwilioSent) ? (firstTwilioSent - speechEnd) : null;
    const interruption_to_audio_clear_ms = (interruption && audioClear) ? (audioClear - interruption) : null;

    const stats = {
      ...this.metrics,
      speech_end_to_first_token_ms,
      speech_end_to_first_tts_audio_ms,
      speech_end_to_first_twilio_audio_ms,
      interruption_to_audio_clear_ms
    };

    try {
      // 1. Gracefully close provider streams
      if (this._stt) await this._stt.close().catch(() => {});
      if (this._tts) await this._tts.close().catch(() => {});
      if (this._router && this._llmSessionIds) await this._router.close(this._llmSessionIds).catch(() => {});
      if (this._telephony) {
        this._telephony.clearAudio();
        await this._telephony.close().catch(() => {});
      }

      // Log structured metrics to stdout for diagnostics
      console.log('[METRICS] ' + JSON.stringify({
        callSid: this.callSid,
        businessId: this.businessId,
        durationSec,
        reason,
        ...stats
      }));

      // 2. Perform DB persistence asynchronously
      await this._persistCallLogs(durationSec, reason);

      // 3. Remove itself from session manager
      const manager = require('./VoiceSessionManager');
      manager.unregisterSession(this.callSid);

      this._transition(STATES.ENDED);
      this._log('Session fully closed.');

    } catch (err) {
      this._log(`Error closing session: ${err.message}`, 'error');
      this._transition(STATES.ENDED);
    }
  }

  getState() {
    return {
      callSid      : this.callSid,
      sessionId    : this.sessionId,
      state        : this.state,
      turnCount    : this.turnCount,
      durationSec  : Math.ceil((Date.now() - this.startTime) / 1000),
      isProcessing : this.isProcessing,
      businessId   : this.businessId
    };
  }

  // ── Phrase Chunking Buffer for TTS ────────────────────────────────────────

  _initChunkBuffer() {
    this._chunkBuffer = '';
    this._firstSpeakablePhraseSent = false;
  }

  _processTokenForTts(token) {
    this._chunkBuffer += token;

    // Check if the current buffer contains a natural punctuation phrase boundary
    const boundaryRegex = /[,;:.\n!?]/;
    if (boundaryRegex.test(this._chunkBuffer)) {
      // Find the last punctuation index
      const match = this._chunkBuffer.match(/[,;:.\n!?][^,;:.\n!?]*$/);
      if (match) {
        const boundaryIdx = match.index;
        const phrase = this._chunkBuffer.slice(0, boundaryIdx + 1);
        const remainder = this._chunkBuffer.slice(boundaryIdx + 1);

        // Verify if the phrase is safe to send (protection against incomplete phone, currency or url)
        if (this._isPhraseSafe(phrase)) {
          this._chunkBuffer = remainder;
          this._sendPhraseToTts(phrase);
        }
      }
    }
  }

  _isPhraseSafe(phrase) {
    // 1. Incomplete telephone/digits protection
    const endsWithDigit = /\d+$/.test(phrase);
    if (endsWithDigit) return false;

    // 2. Incomplete currency protection
    const hasCurrency = /[$₹]|Rs\./i.test(phrase);
    if (hasCurrency && /\d+$/.test(phrase)) return false;

    // 3. Incomplete URL protection
    const hasUrl = /http|www|\.com|\.in/i.test(phrase);
    if (hasUrl && !/\s+$/.test(phrase)) return false;

    return true;
  }

  _sendPhraseToTts(phrase) {
    if (!phrase.trim()) return;

    if (!this._firstSpeakablePhraseSent) {
      this._firstSpeakablePhraseSent = true;
      this.metrics.llm_first_speakable_phrase = Date.now();
      if (!this._isSpeculative) {
        this._transition(STATES.SPEAKING);
      }
    }

    if (this._tts && (this._isSpeculative || this.state === STATES.THINKING || this.state === STATES.SPEAKING)) {
      if (this.metrics.tts_request_started === null) {
        this.metrics.tts_request_started = Date.now();
      }
      this._tts.streamText(phrase, this._currentResponseId);
    }
  }

  _flushChunkBuffer() {
    if (this._chunkBuffer.trim()) {
      this._sendPhraseToTts(this._chunkBuffer);
    }
    this._chunkBuffer = '';
  }

  // ── Internal Helpers ──────────────────────────────────────────────────────

  _log(msg, level = 'info') {
    const logStr = `[VoiceWorkerSession][${this.callSid}][${this.sessionId}] ${msg}`;
    if (level === 'error') {
      console.error(logStr);
    } else {
      console.log(logStr);
    }
  }

  _transition(nextState) {
    this._log(`State Transition: ${this.state} ──► ${nextState}`);
    this.state = nextState;
  }

  async _loadContext() {
    this._log('Loading database configuration...');

    // Guard against duplicate call processing across regions
    const sessionCheck = await db.query(
      'SELECT session_status, started_at FROM call_sessions WHERE call_sid = $1',
      [this.callSid]
    );
    if (sessionCheck.rows.length > 0 && sessionCheck.rows[0].session_status === 'active') {
      const startedAt = new Date(sessionCheck.rows[0].started_at).getTime();
      if (Date.now() - startedAt < 180000) {
        throw new Error(`Call session ${this.callSid} is already active on another regional voice worker.`);
      }
    }

    const [bizRes, astRes] = await Promise.all([
      db.query('SELECT * FROM businesses WHERE id = $1', [this.businessId]),
      db.query('SELECT * FROM assistants WHERE business_id = $1 LIMIT 1', [this.businessId])
    ]);

    this._business = bizRes.rows[0];
    this._assistant = astRes.rows[0];

    if (!this._business || !this._assistant) {
      throw new Error(`Business or assistant not found for ID: ${this.businessId}`);
    }

    this._language = this._assistant.language || 'en-US';

    const systemPromptText = this._assistant.system_prompt || '';
    const welcome = this._assistant.greeting || '';
    this._systemPrompt = `Welcome message: ${welcome}\n\nSystem Rules:\n${systemPromptText}`;
  }

  async _verifyBalance() {
    if (this._business.email && DEVELOPER_EMAILS.includes(this._business.email.trim().toLowerCase())) {
      this._log('Developer bypass active. Unlimited call balance allowed.');
      this._setupLimitTimer(3600);
      return true;
    }

    if (this._business.subscription_status !== 'active') {
      this._log('Subscription is inactive.', 'error');
      return false;
    }

    const monthlyLimit   = Math.max(0, this._business.monthly_limit_seconds || 0);
    const monthlyUsed    = Math.max(0, this._business.monthly_usage_seconds || 0);
    const topupBalance    = Math.max(0, this._business.topup_balance_seconds || 0);
    const remainingLimit = Math.max(0, monthlyLimit - monthlyUsed);
    const totalAvailable = remainingLimit + topupBalance;

    this._log(`Balances check: remainingLimit=${remainingLimit}s topupBalance=${topupBalance}s totalAvailable=${totalAvailable}s`);

    if (totalAvailable <= 0) {
      this._log('Call rejected: minute balance fully exhausted.', 'error');
      return false;
    }

    const maxCallSec = Math.min(this.isDemo ? 180 : 1800, totalAvailable);
    this._setupLimitTimer(maxCallSec);
    return true;
  }

  _setupLimitTimer(maxSeconds) {
    this._log(`Setting maximum call duration limit to ${maxSeconds} seconds.`);
    this.durationLimitTimer = setTimeout(async () => {
      this._log('Call reached maximum duration limit. Terminating session gracefully.');
      try {
        if (this._tts) {
          this._transition(STATES.SPEAKING);
          this._currentResponseId = `resp_limit_${Date.now()}`;
          this._tts.streamText("Your call has reached its maximum time limit. Thank you for calling. Goodbye.", this._currentResponseId);
          await this._tts.flush();
        }
      } catch (err) {
        // ignore
      }
      await this.end('duration_limit_exceeded');
    }, maxSeconds * 1000);
  }

  _handleBargeIn(source) {
    if (this.state === STATES.SPEAKING || this.state === STATES.THINKING) {
      this.metrics.caller_interruption_detected = Date.now();
      
      const turn = this.currentTurn;
      if (turn) {
        turn.caller_interruption = Date.now();
      }

      this._log(`Barge-in detected via ${source}. Stopping active AI speech.`);
      this._transition(STATES.INTERRUPTED);
      if (this._tts) this._tts.cancel();
      if (this._telephony) {
        this._telephony.clearAudio();
        this.metrics.twilio_audio_cleared = Date.now();
        if (turn) {
          turn.audio_clear_sent = Date.now();
          this._finalizeTurn('interrupted');
        }
      }
      this._transition(STATES.LISTENING);
    }
  }

  _buildLlm(backend, cfg) {
    // Router singleton handles instantiation now
    return null;
  }

  // ── Speculative Eager LLM Response generation ──
  async _startSpeculativeTurn(transcript) {
    if (this.isProcessing) return;

    this._isSpeculative = true;
    this._speculativeAudioChunks = [];
    this._speculativeAbortController = new AbortController();
    this._speculativeShouldEnd = false;

    // Establish dynamic response sequence ID
    this._currentResponseId = `resp_spec_${Date.now()}`;

    // Initialize phrase chunker
    this._initChunkBuffer();

    this._transition(STATES.THINKING);
    this._log(`Speculative Turn Start — "${transcript.slice(0, 80)}"`);

    this.metrics.llm_request_started = Date.now();
    const turn = this._getOrCreateTurn();
    turn.llm_request_start = Date.now();
    turn.llm_provider = this.metrics.llm_selected_provider || 'cerebras';

    let firstTokenReceived = false;

    // First-token timeout (2 seconds)
    const firstTokenTimer = setTimeout(() => {
      if (!firstTokenReceived && this._isSpeculative) {
        this._log('First token timeout exceeded on Cerebras. Aborting.', 'error');
        this.metrics.llm_error_code = 'first_token_timeout';
        this.metrics.llm_cancelled_at = Date.now();
        this._speculativeAbortController.abort();
      }
    }, 2000);

    // Total response timeout (15 seconds)
    const totalTimer = setTimeout(() => {
      if (this._isSpeculative) {
        this._log('Total response timeout exceeded on Cerebras. Aborting.', 'error');
        this.metrics.llm_error_code = 'total_response_timeout';
        this.metrics.llm_cancelled_at = Date.now();
        this._speculativeAbortController.abort();
      }
    }, 15000);

    // Normalize digit spellings for better LLM processing
    const normalized = normalizeTelephoneTranscript(transcript);

    try {
      const routeRes = await this._router.streamResponse({
        sessionIds: this._llmSessionIds,
        userTranscript: normalized,
        abortSignal: this._speculativeAbortController.signal,
        onChunk: (token) => {
          if (!firstTokenReceived) {
            firstTokenReceived = true;
            clearTimeout(firstTokenTimer);
            this.metrics.llm_first_token = Date.now();
            const t = this._getOrCreateTurn();
            t.llm_first_token = Date.now();
          }
          this._processTokenForTts(token);
        },
        onComplete: async (completedData) => {
          clearTimeout(firstTokenTimer);
          clearTimeout(totalTimer);

          this.metrics.llm_completed_at = Date.now();
          this.metrics.llm_input_tokens = completedData.promptTokens || 0;
          this.metrics.llm_output_tokens = completedData.completionTokens || 0;
          this.metrics.llm_tool_calls = completedData.toolCalls ? completedData.toolCalls.length : 0;

          if (completedData.fallbackTriggered) {
            this.metrics.llm_fallback_triggered = true;
            this.metrics.llm_fallback_reason = completedData.fallbackReason;
            this.metrics.llm_failover_duration_ms = completedData.failoverDuration;
            this.metrics.llm_selected_provider = 'groq';
          }

          const t = this._getOrCreateTurn();
          t.aiResponse = completedData.fullText;
          if (completedData.toolCalls && completedData.toolCalls.length > 0) {
            t.is_tool_response = true;
          }

          this._currentSpeculativeLlmText = completedData.fullText;
          if (completedData.leadData) this.leadData = completedData.leadData;
          if (completedData.shouldEnd) this._speculativeShouldEnd = true;

          this._flushChunkBuffer();
          if (this._tts) await this._tts.flush();
        }
      });

      this.metrics.llm_selected_provider = routeRes.providerUsed;
      if (routeRes.fallbackTriggered) {
        this.metrics.llm_fallback_triggered = true;
        this.metrics.llm_fallback_reason = routeRes.fallbackReason;
        this.metrics.llm_selected_provider = 'groq';
      }

      await routeRes.promise;

    } catch (err) {
      clearTimeout(firstTokenTimer);
      clearTimeout(totalTimer);

      if (err.name === 'AbortError' || err.message === 'AbortError') {
        this._log('Speculative LLM completion aborted successfully.');
      } else {
        this._log(`Speculative LLM failed: ${err.message}`, 'error');
        this.metrics.llm_error_code = err.code || err.message;
        this.metrics.llm_provider_error_code = err.message;
        
        const t = this._getOrCreateTurn();
        t.error = err.message;
      }
    }
  }

  // ── Commit turn and trigger playback ──
  async _confirmTurn(transcript) {
    this.isProcessing = true;
    this.turnCount++;

    const normalized = normalizeTelephoneTranscript(transcript);
    this._log(`Confirming Turn ${this.turnCount}: "${transcript}" (Normalized: "${normalized}")`);

    // Check if the primary speculative run failed due to a timeout or connection issue
    if (this.metrics.llm_error_code) {
      this._log(`Speculative run had error: ${this.metrics.llm_error_code}. Falling back immediately.`);
      this._isSpeculative = false;
      this._speculativeAudioChunks = [];
      this.metrics.llm_error_code = null; // reset for next turn
      
      const turn = this._getOrCreateTurn();
      turn.error = 'speculative_failed';
      
      await this._processSpeech(transcript);
      return;
    }

    if (this._isSpeculative) {
      // Speculative response was already generated, promote it to committed!
      this._isSpeculative = false;
      this._transition(STATES.SPEAKING);

      // Playback all pre-generated TTS audio chunks instantly!
      if (this._speculativeAudioChunks.length > 0) {
        this._log(`Instant Playback: playing ${this._speculativeAudioChunks.length} queued audio chunks.`);
        if (this.metrics.twilio_first_audio_sent === null) {
          this.metrics.twilio_first_audio_sent = Date.now();
          const turn = this._getOrCreateTurn();
          turn.telephony_first_audio_sent = Date.now();
        }
        const fullBuffer = Buffer.concat(this._speculativeAudioChunks);
        this._telephony.sendAudio(fullBuffer);
        this._speculativeAudioChunks = [];
      }

      // Speculative response promoted, finalize the turn now!
      await this._finalizeTurn('success');

      if (this._speculativeShouldEnd) {
        await this.end('llm_requested_termination');
      } else {
        this._transition(STATES.LISTENING);
      }
      this.isProcessing = false;
    } else {
      // Speculative response was cancelled or didn't start. Generate fresh response.
      this._isSpeculative = false;
      this._speculativeAudioChunks = [];
      await this._processSpeech(transcript);
    }
  }

  async _processSpeech(transcript) {
    this._transition(STATES.THINKING);
    const normalized = normalizeTelephoneTranscript(transcript);

    // Initialize phrase chunker
    this._initChunkBuffer();

    // Create unique response ID for this committed turn response
    this._currentResponseId = `resp_comm_${Date.now()}`;

    const turn = this._getOrCreateTurn();
    turn.llm_request_start = Date.now();
    turn.llm_provider = this.metrics.llm_selected_provider || 'cerebras';

    try {
      if (this._tts) {
        this._tts.cancel();
        await this._tts.connect({ language: this._language });
      }

      this.metrics.llm_request_started = Date.now();
      let firstTokenReceived = false;

      const abortController = new AbortController();

      // First-token timeout (2s)
      const firstTokenTimer = setTimeout(() => {
        if (!firstTokenReceived) {
          this._log('First token timeout exceeded on Cerebras. Aborting.', 'error');
          this.metrics.llm_error_code = 'first_token_timeout';
          this.metrics.llm_cancelled_at = Date.now();
          abortController.abort();
        }
      }, 2000);

      // Total response timeout (15s)
      const totalTimer = setTimeout(() => {
        this._log('Total response timeout exceeded on Cerebras. Aborting.', 'error');
        this.metrics.llm_error_code = 'total_response_timeout';
        this.metrics.llm_cancelled_at = Date.now();
        abortController.abort();
      }, 15000);

      let succeeded = false;

      try {
        const routeRes = await this._router.streamResponse({
          sessionIds     : this._llmSessionIds,
          userTranscript : normalized,
          abortSignal    : abortController.signal,
          onChunk        : (token) => {
            if (!firstTokenReceived) {
              firstTokenReceived = true;
              clearTimeout(firstTokenTimer);
              this.metrics.llm_first_token = Date.now();
              const t = this._getOrCreateTurn();
              t.llm_first_token = Date.now();
            }
            this._processTokenForTts(token);
          },
          onComplete: async (completedData) => {
            clearTimeout(firstTokenTimer);
            clearTimeout(totalTimer);

            this.metrics.llm_completed_at = Date.now();
            this.metrics.llm_input_tokens = completedData.promptTokens || 0;
            this.metrics.llm_output_tokens = completedData.completionTokens || 0;
            this.metrics.llm_tool_calls = completedData.toolCalls ? completedData.toolCalls.length : 0;

            if (completedData.fallbackTriggered) {
              this.metrics.llm_fallback_triggered = true;
              this.metrics.llm_fallback_reason = completedData.fallbackReason;
              this.metrics.llm_failover_duration_ms = completedData.failoverDuration;
              this.metrics.llm_selected_provider = 'groq';
            }

            const t = this._getOrCreateTurn();
            t.aiResponse = completedData.fullText;
            if (completedData.toolCalls && completedData.toolCalls.length > 0) {
              t.is_tool_response = true;
            }
            await this._finalizeTurn('success');

            if (completedData.leadData) this.leadData = completedData.leadData;
            this._flushChunkBuffer();
            if (this._tts) await this._tts.flush();

            if (completedData.shouldEnd) {
              await this.end('llm_requested_termination');
            } else {
              this._transition(STATES.LISTENING);
            }
          }
        });

        this.metrics.llm_selected_provider = routeRes.providerUsed;
        if (routeRes.fallbackTriggered) {
          this.metrics.llm_fallback_triggered = true;
          this.metrics.llm_fallback_reason = routeRes.fallbackReason;
          this.metrics.llm_selected_provider = 'groq';
        }

        await routeRes.promise;
        succeeded = true;
      } catch (llmErr) {
        clearTimeout(firstTokenTimer);
        clearTimeout(totalTimer);

        this._log(`LLM routing stream failed: ${llmErr.message}`, 'error');
        this.metrics.llm_error_code = llmErr.code || llmErr.message;
        this.metrics.llm_provider_error_code = llmErr.message;
        this.metrics.llm_cancelled_at = Date.now();
        
        const t = this._getOrCreateTurn();
        t.error = llmErr.message;
      }

      // Caller-safe double failure fallback
      if (!succeeded) {
        await this._handleDoubleFailure();
      }

    } catch (err) {
      this._log(`Turn processing error: ${err.message}`, 'error');
      this._transition(STATES.FAILED);
      
      const t = this._getOrCreateTurn();
      t.error = err.message;
      await this._finalizeTurn('failed');
      
      await this.end('turn_processing_error');
    } finally {
      this.isProcessing = false;
    }
  }

  async _handleDoubleFailure() {
    this._log('Double LLM Failure! Play caller-safe warning and save callback request.', 'error');
    this._transition(STATES.FAILED);

    const turn = this.currentTurn;
    if (turn) {
      turn.error = 'double_llm_failure';
      await this._finalizeTurn('failed');
    }

    // 1. Play short warning text
    if (this._tts) {
      try {
        this._transition(STATES.SPEAKING);
        this._currentResponseId = `resp_warning_double_${Date.now()}`;
        this._tts.streamText("I'm sorry, we are experiencing technical difficulties. I've recorded your number and will notify the owner to call you back. Goodbye.", this._currentResponseId);
        await this._tts.flush();
      } catch {
        // ignore
      }
    }

    // 2. Save a callback request lead
    try {
      await db.query(
        `INSERT INTO leads (business_id, phone, intent, notes, status, created_at)
         VALUES ($1, $2, 'callback', 'EMERGENCY DOUBLE LLM FAILURE FALLBACK CALLBACK REQUEST', 'new', NOW())`,
        [this.businessId, 'unknown']
      );
    } catch {
      // ignore
    }

    // 3. Notify the business owner
    try {
      await db.query(
        `INSERT INTO notifications (business_id, title, message, type, status, created_at)
         VALUES ($1, 'Urgent: Call Assistant Failure', 'Both primary and fallback LLM services failed. A caller was played the fallback message. Please review your voice workers.', 'error', 'unread', NOW())`,
        [this.businessId]
      );
    } catch {
      // ignore
    }

    await this.end('double_llm_failure');
  }

  async _playSystemWarning(type) {
    if (!this._tts) return;
    try {
      this._transition(STATES.SPEAKING);
      let text = "I am sorry, but we are experiencing technical difficulties. Please try again later.";
      if (type === "balance_exhausted") {
        text = "This call cannot be completed because the account has insufficient call minutes. Please contact the administrator.";
      }
      this._currentResponseId = `resp_warning_${Date.now()}`;
      this._tts.streamText(text, this._currentResponseId);
      await this._tts.flush();
    } catch {
      // ignore
    }
  }

  async _persistCallLogs(durationSec, reason) {
    this._log(`Persisting call logs asynchronously. Duration: ${durationSec}s. Reason: ${reason}`);

    try {
      const summary    = `${this.turnCount} turns (voice-worker modular_v1). Reason: ${reason}`;
      const transcript = this._llm?._sessions?.get(this._llmSessionId)?.history || [];
      const transcriptJ = JSON.stringify(transcript);

      const callRes = await db.query(
        `INSERT INTO calls (
          user_id, business_id, caller_number, provider_call_id, call_status, status,
          provider, voice_stack, duration, duration_seconds, transcript, direction, started_at, ended_at
         )
         VALUES ($1, $1, 'unknown', $2, 'completed', 'completed', 'twilio_stream', 'modular_v1', $3, $4, $5, 'inbound', $6, NOW())
         RETURNING id`,
        [
          this.businessId,
          this.callSid,
          Math.ceil(durationSec / 60),
          durationSec,
          transcriptJ,
          new Date(this.startTime)
        ]
      );

      const dbCallId = callRes.rows[0]?.id;

      if (dbCallId) {
        await db.query(
          `INSERT INTO transcripts (call_id, business_id, transcript, summary)
           VALUES ($1, $2, $3::jsonb, $4)
           ON CONFLICT (call_id) DO UPDATE SET transcript = EXCLUDED.transcript, summary = EXCLUDED.summary`,
          [dbCallId, this.businessId, transcriptJ, summary]
        );

        if (this.leadData) {
          await db.query(
            `INSERT INTO leads (business_id, call_id, phone, name, intent, budget, location, notes, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new', NOW())`,
            [
              this.businessId,
              dbCallId,
              this.leadData.phone || 'unknown',
              this.leadData.name || null,
              this.leadData.intent || 'inquiry',
              this.leadData.budget || null,
              this.leadData.location || null,
              JSON.stringify(this.leadData)
            ]
          );
        }
      }

      // Accumulate metrics from all turns
      let totalLlmInput = 0;
      let totalLlmOutput = 0;
      let totalTtsChars = 0;
      let totalSttSec = 0;
      let totalToolCalls = 0;
      
      for (const turn of this.turns) {
        if (turn.llm_first_token) {
          totalLlmInput += this.metrics.llm_input_tokens || 0;
          totalLlmOutput += this.metrics.llm_output_tokens || 0;
          totalToolCalls += this.metrics.llm_tool_calls || 0;
        }
        if (turn.tts_first_audio) {
          totalTtsChars += this.metrics.tts_characters || 0;
        }
        if (turn.caller_speech_start && (turn.deepgram_final_eot || turn.deepgram_eager_eot)) {
          const sttEnd = turn.deepgram_final_eot || turn.deepgram_eager_eot;
          totalSttSec += Math.max(0, (sttEnd - turn.caller_speech_start) / 1000);
        }
      }

      const detailedMetrics = {
        telephony: {
          provider: 'twilio',
          region: 'US',
          durationSeconds: durationSec,
          billedSeconds: durationSec,
          recordingUsed: false
        },
        stt: {
          seconds: totalSttSec || (durationSec * 0.4),
          model: 'deepgram-flux'
        },
        llm: {
          inputTokens: totalLlmInput || this.metrics.llm_input_tokens || 0,
          outputTokens: totalLlmOutput || this.metrics.llm_output_tokens || 0,
          reasoningTokens: this.metrics.llm_reasoning_tokens_if_available || 0,
          provider: this.metrics.llm_selected_provider || 'cerebras',
          model: 'gpt-oss-120b',
          toolCallsCount: totalToolCalls || this.metrics.llm_tool_calls || 0
        },
        tts: {
          characters: totalTtsChars || this.metrics.tts_characters || 0,
          durationSeconds: durationSec * 0.5,
          voiceId: this._assistant?.voice_id || 'meera',
          model: 'eleven-flash-2.5'
        },
        infra: {
          workerRegion: 'us-east-1',
          sessionDurationSeconds: durationSec,
          dataTransferredBytes: durationSec * 16000
        }
      };

      if (durationSec > 0) {
        const { deductCallSeconds } = require('../../../bavio-backend/middleware/planEnforcement');
        await deductCallSeconds(this.businessId, durationSec, this.callSid, detailedMetrics);
      }

    } catch (err) {
      this._log(`Failed to persist logs: ${err.message}`, 'error');
    }
  }
}

module.exports = VoiceWorkerSession;
