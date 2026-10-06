'use strict';

const VoiceWorkerSession = require('../providers/interfaces/VoiceWorkerSession');
const GnaniPrismaStt = require('../providers/gnani/GnaniPrismaStt');
const GnaniEvonLlm = require('../providers/gnani/GnaniEvonLlm');
const GnaniTimbreTts = require('../providers/gnani/GnaniTimbreTts');
const ExotelTelephony = require('../providers/exotel/ExotelTelephony');
const { retrieveRelevantSchemes, buildGramaRagContext } = require('../../services/gramaKnowledgeService');
const db = require('../../database/db');

/**
 * GramaVoiceSession — Dedicated Voice Orchestration for BAVIO GRAMA
 * 
 * Pipeline:
 * Caller (Indian Phone)
 *   ↓
 * Exotel Telephony Provider
 *   ↓
 * Gnani Prisma v2.5 (Regional STT & VAD)
 *   ↓
 * Bavio Grama RAG (Curated Government & Agriculture Knowledge)
 *   ↓
 * Gnani Evon v3.3 (Regional LLM Grounding)
 *   ↓
 * Gnani Timbre v2.5 (Telephony TTS)
 *   ↓
 * Exotel Audio Playback
 */
class GramaVoiceSession extends VoiceWorkerSession {
  constructor() {
    super('GramaVoiceSession');
    this._stt = null;
    this._llm = null;
    this._tts = null;
    this._telephony = null;
    this._startTime = null;
    this._callSid = null;
    this._businessId = null;
    this._dbCallId = null;
    this._language = 'hi-IN';
    this._sessionId = null;
    this._turnCount = 0;
    this._isProcessing = false;
    this._turnsTelemetry = [];
    this._transcriptHistory = [];
  }

  async start({ ws, callSid, streamSid, business, assistant, language = 'hi-IN', isDemo = false }) {
    this._callSid = callSid || `exotel_grama_${Date.now()}`;
    this._businessId = business?.id || '00000000-0000-0000-0000-000000000000';
    this._language = language || assistant?.language || 'hi-IN';
    this._startTime = Date.now();

    console.log(`[GramaVoiceSession] Initializing Bavio Grama Session (callSid=${this._callSid}, lang=${this._language})`);

    try {
      // 1. Initialize Exotel Telephony
      this._telephony = new ExotelTelephony();
      await this._telephony.startMediaSession({ ws, callSid: this._callSid, streamSid });

      this._telephony.onCallEnd(() => {
        console.log(`[GramaVoiceSession] Caller hung up callSid=${this._callSid}`);
        this.end();
      });

      // 2. Initialize Gnani Prisma STT (v2.5)
      this._stt = new GnaniPrismaStt({
        language: this._language,
        model: 'prisma-v2.5',
        silenceThresholdMs: 650
      });

      this._stt.onSpeechStarted(() => {
        // Realtime Barge-in: Caller started speaking while AI is talking
        console.log(`[GramaVoiceSession] Barge-in detected on turn ${this._turnCount}. Clearing playback.`);
        if (this._tts) this._tts.cancel();
        if (this._llm && this._sessionId) this._llm.cancelResponse(this._sessionId);
        this._telephony.clearAudio();
      });

      this._stt.onEndOfTurn(async (transcript) => {
        if (!transcript || !transcript.trim()) return;
        await this._handleTurn(transcript.trim());
      });

      await this._stt.connect({
        language: this._language,
        encoding: 'mulaw',
        sampleRate: 8000
      });

      // 3. Initialize Gnani Evon LLM (v3.3)
      this._llm = new GnaniEvonLlm({
        model: 'gnani-evon-v3.3'
      });

      const baseSystemPrompt = this._buildGramaSystemPrompt(this._language);
      this._sessionId = await this._llm.createSession({
        systemPrompt: baseSystemPrompt,
        callSid: this._callSid,
        language: this._language
      });

      // 4. Initialize Gnani Timbre TTS (v2.5)
      this._tts = new GnaniTimbreTts({
        language: this._language,
        modelId: 'timbre-v2.5',
        outputFormat: 'mulaw_8000'
      });

      this._tts.onAudioChunk((chunk) => {
        this._telephony.sendAudio(chunk);
      });

      await this._tts.connect({
        language: this._language,
        outputFormat: 'mulaw_8000'
      });

      // 5. Speak Regional Welcome Greeting
      const greeting = this._getRegionalGreeting(this._language);
      this._transcriptHistory.push({ speaker: 'assistant', text: greeting, timestamp_ms: Date.now() - this._startTime });
      this._tts.streamText(greeting);
      await this._tts.flush();

      console.log(`[GramaVoiceSession] Grama AI Helpline Ready. Greeting spoken.`);
    } catch (err) {
      console.error(`[GramaVoiceSession] Startup error: ${err.message}`);
      throw err;
    }
  }

  handleAudio(audioChunk) {
    if (this._stt) {
      this._stt.sendAudio(audioChunk);
    }
  }

  async _handleTurn(userTranscript) {
    if (this._isProcessing) return;
    this._isProcessing = true;
    this._turnCount++;

    const turnStartTime = Date.now();
    let sttLatencyMs = Date.now() - turnStartTime;
    let ragLatencyMs = 0;
    let llmFirstTokenMs = 0;
    let ttsFirstByteMs = 0;

    console.log(`[GramaVoiceSession] Turn ${this._turnCount} Input: "${userTranscript}"`);
    this._transcriptHistory.push({ speaker: 'caller', text: userTranscript, timestamp_ms: turnStartTime - this._startTime });

    try {
      // Step A: Grama Knowledge Retrieval (RAG)
      const ragStart = Date.now();
      const relevantSchemes = retrieveRelevantSchemes(userTranscript, this._language, 2);
      const ragContext = buildGramaRagContext(relevantSchemes, this._language);
      ragLatencyMs = Date.now() - ragStart;

      // Update Session Context in Evon LLM
      this._llm.setSessionContext(this._sessionId, ragContext);

      // Step B: Reset TTS for new turn
      if (this._tts) {
        this._tts.cancel();
        await this._tts.connect({ language: this._language, outputFormat: 'mulaw_8000' });
      }

      let isFirstChunk = true;
      let fullAssistantText = '';

      // Step C: Stream Evon Completion -> Timbre TTS
      await this._llm.streamResponse({
        sessionId: this._sessionId,
        userTranscript,
        onChunk: (sentenceChunk) => {
          if (isFirstChunk) {
            llmFirstTokenMs = Date.now() - turnStartTime;
            isFirstChunk = false;
          }
          fullAssistantText += ` ${sentenceChunk}`;
          if (this._tts) {
            this._tts.streamText(sentenceChunk);
          }
        },
        onComplete: async ({ fullText, shouldEnd, ttftMs }) => {
          if (this._tts) {
            await this._tts.flush();
          }
          ttsFirstByteMs = ttftMs || (Date.now() - turnStartTime);

          const totalTurnLatencyMs = Date.now() - turnStartTime;
          this._turnsTelemetry.push({
            turn: this._turnCount,
            stt_latency_ms: sttLatencyMs,
            rag_latency_ms: ragLatencyMs,
            llm_first_token_ms: llmFirstTokenMs,
            tts_first_byte_ms: ttsFirstByteMs,
            total_response_latency_ms: totalTurnLatencyMs,
            schemes_cited: relevantSchemes.map((s) => s.id)
          });

          this._transcriptHistory.push({
            speaker: 'assistant',
            text: fullText.trim(),
            timestamp_ms: Date.now() - this._startTime
          });

          console.log(`[GramaVoiceSession] Turn ${this._turnCount} Complete. Total Latency: ${totalTurnLatencyMs}ms`);

          if (shouldEnd) {
            setTimeout(() => this.end(), 1500);
          }
        }
      });
    } catch (err) {
      console.error(`[GramaVoiceSession] Turn error: ${err.message}`);
      const fallbackMsg = this._getFallbackMessage(this._language);
      this._tts?.streamText(fallbackMsg);
      await this._tts?.flush();
    } finally {
      this._isProcessing = false;
    }
  }

  _buildGramaSystemPrompt(lang = 'hi-IN') {
    return `You are BAVIO GRAMA, an official AI Voice Helpline assisting Indian rural citizens, farmers, and villagers in simple, respectful language.

CORE RESPONSIBILITIES:
1. Provide accurate, clear information about Indian Government Schemes (PM-Kisan, PMFBY Crop Insurance, Ayushman Bharat, PMAY-G Housing, KCC Loans).
2. Answer in short, simple conversational sentences (maximum 2 sentences per response). Never use complicated bureaucratic terminology.
3. Language: Match the caller's spoken language (Tamil / Telugu / Hindi / English).
4. Grounding: Answer ONLY from the verified knowledge context provided. If a scheme is not verified in the context, clearly say that verified details are not available yet at this helpline.
5. Safety: Never prescribe medical drugs or give legal guarantees. Direct medical inquiries to the nearest Primary Health Centre (PHC).

If the user wants to finish the conversation, say polite goodbye and append [END_CALL].`;
  }

  _getRegionalGreeting(lang = 'hi-IN') {
    const l = (lang || 'hi').toLowerCase().slice(0, 2);
    switch (l) {
      case 'ta':
        return 'வணக்கம்! பாவியோ கிராம உதவி மையத்திற்கு வரவேற்கிறோம். அரசு திட்டங்கள் மற்றும் விவசாய தகவல்களுக்கு நான் எப்படி உதவ முடியும்?';
      case 'te':
        return 'నమస్కారం! బావియో గ్రామ హెల్ప్‌లైన్‌కు స్వాగతం. ప్రభుత్వ పథకాలు మరియు వ్యవసాయ సహాయం గురించి మీకేమి సమాచారం కావాలి?';
      case 'hi':
      default:
        return 'नमस्ते! बाविओ ग्राम हेल्पलाइन में आपका स्वागत है। सरकारी योजनाओं और कृषि सहायता के बारे में आप क्या जानना चाहते हैं?';
    }
  }

  _getFallbackMessage(lang = 'hi-IN') {
    const l = (lang || 'hi').toLowerCase().slice(0, 2);
    switch (l) {
      case 'ta':
        return 'மன்னிக்கவும், இந்த விவரம் சரிபார்க்கப்பட்ட பதிவுகளில் இல்லை. தயவுசெய்து உங்கள் அருகிலுள்ள இ-சேவை அல்லது பஞ்சாயத்து அலுவலகத்தை தொடர்பு கொள்ளவும்.';
      case 'te':
        return 'క్షమించండి, ఈ పథకం గురించిన ధృవీకరించబడిన సమాచారం అందుబాటులో లేదు. దయచేసి సమీప మీసేవా లేదా పంచాయతీ కార్యాలయాన్ని సంప్రదించండి.';
      case 'hi':
      default:
        return 'क्षमा करें, इस योजना की सत्यापित जानकारी अभी उपलब्ध नहीं है। कृपया नजदीकी सीएससी जन सेवा केंद्र या पंचायत कार्यालय से संपर्क करें।';
    }
  }

  async end() {
    const durationMs = Date.now() - (this._startTime || Date.now());
    const durationSec = Math.ceil(durationMs / 1000);

    console.log(`[GramaVoiceSession] Ending Grama Call ${this._callSid} (duration: ${durationSec}s, turns: ${this._turnCount})`);

    try {
      if (this._stt) await this._stt.close().catch(() => {});
      if (this._tts) await this._tts.close().catch(() => {});
      if (this._llm && this._sessionId) await this._llm.close(this._sessionId).catch(() => {});
      if (this._telephony) await this._telephony.close().catch(() => {});

      // Persist Call Record and Latency Telemetry to DB
      await this._saveGramaCallRecord(durationSec);
    } catch (err) {
      console.error(`[GramaVoiceSession] End cleanup error: ${err.message}`);
    }
  }

  async _saveGramaCallRecord(durationSec) {
    try {
      const summary = `Bavio Grama (${this._language}) - ${this._turnCount} turns`;
      const transcriptJson = JSON.stringify(this._transcriptHistory);

      let dbCallId = null;
      try {
        const callRes = await db.query(
          `INSERT INTO calls
             (provider_call_id, caller_number, call_status, duration, cost, created_at)
           VALUES ($1, $2, 'completed', $3, 0, NOW())
           ON CONFLICT (provider_call_id) DO UPDATE SET duration = EXCLUDED.duration, call_status = 'completed'
           RETURNING id`,
          [this._callSid, 'caller_grama', durationSec]
        );
        dbCallId = callRes.rows[0]?.id;
      } catch (insertErr) {
        // Fallback for schema variants with call_sid
        try {
          const callRes = await db.query(
            `INSERT INTO calls (call_sid, provider, status, duration_seconds, created_at)
             VALUES ($1, 'exotel', 'completed', $2, NOW())
             ON CONFLICT DO NOTHING
             RETURNING id`,
            [this._callSid, durationSec]
          );
          dbCallId = callRes.rows[0]?.id;
        } catch {}
      }
      if (dbCallId) {
        await db.query(
          `INSERT INTO transcripts (call_id, business_id, transcript, summary)
           VALUES ($1, $2, $3::jsonb, $4)
           ON CONFLICT (call_id) DO UPDATE SET transcript = EXCLUDED.transcript, summary = EXCLUDED.summary`,
          [dbCallId, this._businessId, transcriptJson, summary]
        );
      }
    } catch (err) {
      console.warn(`[GramaVoiceSession] DB save warning: ${err.message}`);
    }
  }

  getState() {
    return {
      callSid: this._callSid,
      language: this._language,
      turnCount: this._turnCount,
      durationMs: this._startTime ? Date.now() - this._startTime : 0,
      stack: 'gnani_grama_v1',
      telemetry: this._turnsTelemetry
    };
  }
}

module.exports = GramaVoiceSession;
