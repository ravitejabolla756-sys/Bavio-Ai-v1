'use strict';

const db = require('../database/db');
const openAIService = require('./openAIService');
const { searchKnowledgeChunks } = require('./knowledgeProcessor');
const { recordConversationCompletedEvent } = require('./businessEventService');
const crypto = require('crypto');

// In-memory active WebCall sessions map: callSid -> sessionState
const activeWebCallSessions = new Map();

/**
 * Helper to compute percentiles (P50, P75, P90, P95) from an array of numbers.
 */
function calculatePercentiles(values) {
  if (!values || values.length === 0) {
    return { p50: null, p75: null, p90: null, p95: null, avg: null, min: null, max: null };
  }
  const sorted = [...values].filter(v => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length === 0) {
    return { p50: null, p75: null, p90: null, p95: null, avg: null, min: null, max: null };
  }

  const getPercentile = (p) => {
    const idx = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    if (upper === lower) return sorted[lower];
    return Math.round(sorted[lower] * (1 - weight) + sorted[upper] * weight);
  };

  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const avg = Math.round(sum / sorted.length);

  return {
    p50: getPercentile(50),
    p75: getPercentile(75),
    p90: getPercentile(90),
    p95: getPercentile(95),
    avg,
    min: sorted[0],
    max: sorted[sorted.length - 1]
  };
}

/**
 * Log a canonical lifecycle event to webcall_events table.
 */
async function logWebCallEvent({ sessionId, businessId, callSid, turnId = null, eventType, occurredAt = new Date(), durationMs = null, metadata = {} }) {
  try {
    await db.query(
      `INSERT INTO webcall_events (session_id, business_id, call_sid, turn_id, event_type, occurred_at, duration_ms, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [sessionId, businessId, callSid, turnId, eventType, occurredAt, durationMs, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error(`[WEBCALL EVENT] Failed to log event ${eventType} for ${callSid}:`, err.message);
  }
}

/**
 * WebCallSessionManager coordinates real-time audio sessions between browser clients and AI services.
 */
class WebCallSessionManager {
  /**
   * Register a new active WebCall session.
   */
  registerSession(callSid, sessionData) {
    const state = {
      callSid,
      sessionId: sessionData.sessionId,
      businessId: sessionData.businessId,
      agentId: sessionData.agentId,
      assistant: sessionData.assistant,
      ws: null,
      turns: [],
      turnCounter: 0,
      currentTurn: null,
      isAiSpeaking: false,
      aiSpeechStartTime: null,
      userSpeechTotalMs: 0,
      assistantSpeechTotalMs: 0,
      interruptionsCount: 0,
      interruptedTurnsCount: 0,
      startTime: Date.now(),
      status: 'requested',
      conversationHistory: [],
      heartbeatTimer: null,
      lastClientActivity: Date.now(),
      networkSamples: []
    };

    activeWebCallSessions.set(callSid, state);
    return state;
  }

  /**
   * Get an active session.
   */
  getSession(callSid) {
    return activeWebCallSessions.get(callSid);
  }

  /**
   * Connect a WebSocket stream to an existing WebCall session.
   */
  async attachWebSocket(callSid, ws) {
    let session = activeWebCallSessions.get(callSid);
    if (!session) {
      // Try restoring session state from DB if recently created
      const dbRes = await db.query(
        `SELECT s.*, a.name as assistant_name, a.system_prompt, a.voice_id, a.voice, a.language, a.welcome_message, a.first_message
         FROM webcall_sessions s
         LEFT JOIN assistants a ON a.id = s.agent_id
         WHERE s.call_sid = $1 AND s.status IN ('requested', 'connecting', 'in_progress')
         LIMIT 1`,
        [callSid]
      );

      if (dbRes.rows.length === 0) {
        ws.send(JSON.stringify({ type: 'error', error: 'session_not_found', message: 'WebCall session does not exist or has already ended.' }));
        ws.close();
        return;
      }

      const row = dbRes.rows[0];
      session = this.registerSession(callSid, {
        sessionId: row.id,
        businessId: row.business_id,
        agentId: row.agent_id,
        assistant: {
          id: row.agent_id,
          name: row.assistant_name,
          system_prompt: row.system_prompt,
          voice: row.voice_id || row.voice || 'alloy',
          language: row.language || 'en-US',
          first_message: row.first_message || row.welcome_message
        }
      });
    }

    session.ws = ws;
    session.status = 'connected';
    session.lastClientActivity = Date.now();

    // Update DB status to in-progress
    await db.query(
      "UPDATE webcall_sessions SET status = 'in_progress', connected_at = NOW(), updated_at = NOW() WHERE call_sid = $1",
      [callSid]
    );
    await db.query(
      "UPDATE calls SET status = 'in-progress', call_status = 'in_progress' WHERE call_sid = $1",
      [callSid]
    );

    await logWebCallEvent({
      sessionId: session.sessionId,
      businessId: session.businessId,
      callSid,
      eventType: 'webrtc_connected',
      metadata: { transport: 'websocket_audio' }
    });

    // Notify browser client that connection is established
    ws.send(JSON.stringify({
      type: 'connection:ready',
      callSid,
      agent: {
        name: session.assistant?.name || 'Bavio Receptionist',
        voice: session.assistant?.voice || 'alloy',
        language: session.assistant?.language || 'en-US'
      }
    }));

    // Trigger Initial Agent Greeting
    const greetingText = session.assistant?.first_message || session.assistant?.welcome_message || `Hello! Thank you for calling ${session.assistant?.name || 'us'}. How can I assist you today?`;
    await this.sendAssistantGreeting(session, greetingText);

    // Setup ping/pong heartbeat
    session.heartbeatTimer = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.ping();
      }
    }, 15000);

    // Handle incoming messages from the client
    ws.on('message', async (data, isBinary) => {
      session.lastClientActivity = Date.now();
      try {
        if (isBinary) {
          // Binary audio packet from microphone
          await this.handleIncomingAudioChunk(session, data);
        } else {
          const message = JSON.parse(data.toString());
          await this.handleClientMessage(session, message);
        }
      } catch (err) {
        console.error(`[WEBCALL WS] Message handling error for ${callSid}:`, err.message);
      }
    });

    ws.on('close', async () => {
      console.log(`[WEBCALL WS] Connection closed for ${callSid}`);
      if (session.heartbeatTimer) clearInterval(session.heartbeatTimer);
      session.ws = null;
      // Auto-finalize session after grace period if not manually ended
      setTimeout(async () => {
        const current = activeWebCallSessions.get(callSid);
        if (current && !current.ws && current.status !== 'completed') {
          await this.finalizeSession(callSid, 'client_disconnect');
        }
      }, 3000);
    });

    ws.on('error', (err) => {
      console.error(`[WEBCALL WS] WebSocket error for ${callSid}:`, err.message);
    });
  }

  /**
   * Synthesize and transmit the assistant greeting.
   */
  async sendAssistantGreeting(session, greetingText) {
    const greetingStart = Date.now();
    await logWebCallEvent({
      sessionId: session.sessionId,
      businessId: session.businessId,
      callSid: session.callSid,
      eventType: 'greeting_started',
      metadata: { text: greetingText }
    });

    session.isAiSpeaking = true;
    session.aiSpeechStartTime = Date.now();

    try {
      // Synthesize audio via OpenAI TTS / configured TTS provider
      const audioBuffer = await openAIService.textToSpeech(
        greetingText,
        session.assistant?.voice || 'alloy',
        session.assistant?.language || 'en-US',
        'mp3'
      );

      const ttsLatency = Date.now() - greetingStart;

      if (session.ws && session.ws.readyState === session.ws.OPEN) {
        // Send speech start event
        session.ws.send(JSON.stringify({
          type: 'assistant:speech_started',
          text: greetingText,
          isGreeting: true,
          durationMs: Math.round(greetingText.length * 60) // approx duration
        }));

        // Send binary audio
        session.ws.send(audioBuffer);

        // Send speech ended event
        session.ws.send(JSON.stringify({
          type: 'assistant:speech_ended',
          text: greetingText,
          isGreeting: true
        }));
      }

      session.conversationHistory.push({ role: 'assistant', content: greetingText });
      const greetingDurationMs = Math.round(greetingText.length * 60);
      session.assistantSpeechTotalMs += greetingDurationMs;

      await logWebCallEvent({
        sessionId: session.sessionId,
        businessId: session.businessId,
        callSid: session.callSid,
        eventType: 'greeting_completed',
        durationMs: ttsLatency,
        metadata: { text: greetingText, audioBytes: audioBuffer.length }
      });
    } catch (err) {
      console.error(`[WEBCALL] Failed to synthesize greeting for ${session.callSid}:`, err.message);
    } finally {
      session.isAiSpeaking = false;
    }
  }

  /**
   * Handle JSON messages from the browser client.
   */
  async handleClientMessage(session, message) {
    const { type, payload } = message;

    switch (type) {
      case 'user:speech_started': {
        const speechStartTime = Date.now();
        // Barge-in check: If AI is speaking, trigger interruption
        if (session.isAiSpeaking) {
          session.interruptionsCount++;
          session.interruptedTurnsCount++;
          session.isAiSpeaking = false;
          const playedBeforeInterrupt = session.aiSpeechStartTime ? (Date.now() - session.aiSpeechStartTime) : 0;

          await logWebCallEvent({
            sessionId: session.sessionId,
            businessId: session.businessId,
            callSid: session.callSid,
            turnId: session.currentTurn?.turnId,
            eventType: 'user_interrupted',
            metadata: {
              assistantAudioPlayedBeforeInterruptMs: playedBeforeInterrupt
            }
          });

          // Instruct client to halt audio playback immediately
          if (session.ws && session.ws.readyState === session.ws.OPEN) {
            session.ws.send(JSON.stringify({ type: 'assistant:interrupt_ack' }));
          }
        }

        // Initialize new turn state
        session.turnCounter++;
        const turnId = `turn_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        session.currentTurn = {
          turnId,
          turnNumber: session.turnCounter,
          turnStartedAt: new Date(speechStartTime),
          userSpeechStartedAt: new Date(speechStartTime),
          wasInterrupted: false
        };

        await logWebCallEvent({
          sessionId: session.sessionId,
          businessId: session.businessId,
          callSid: session.callSid,
          turnId,
          eventType: 'user_speech_started',
          occurredAt: new Date(speechStartTime)
        });
        break;
      }

      case 'user:speech_ended': {
        const speechEndTime = Date.now();
        if (!session.currentTurn) {
          session.turnCounter++;
          session.currentTurn = {
            turnId: `turn_${speechEndTime}_${crypto.randomBytes(3).toString('hex')}`,
            turnNumber: session.turnCounter,
            turnStartedAt: new Date(speechEndTime - 1000),
            userSpeechStartedAt: new Date(speechEndTime - 1000),
            wasInterrupted: false
          };
        }

        session.currentTurn.userSpeechEndedAt = new Date(speechEndTime);
        const speechDurationMs = Math.max(0, speechEndTime - session.currentTurn.userSpeechStartedAt.getTime());
        session.currentTurn.userSpeechDurationMs = speechDurationMs;
        session.userSpeechTotalMs += speechDurationMs;

        await logWebCallEvent({
          sessionId: session.sessionId,
          businessId: session.businessId,
          callSid: session.callSid,
          turnId: session.currentTurn.turnId,
          eventType: 'user_speech_ended',
          occurredAt: new Date(speechEndTime),
          durationMs: speechDurationMs
        });

        // If client provided transcript directly (e.g. from Web Speech API or streaming STT)
        if (payload && payload.transcript) {
          await this.processTurn(session, payload.transcript, payload.audioBuffer);
        }
        break;
      }

      case 'telemetry:network': {
        // Collect network metrics from browser getStats()
        if (payload) {
          session.networkSamples.push(payload);
          await db.query(
            `INSERT INTO webcall_network_metrics (
               session_id, business_id, call_sid, recorded_at, round_trip_time_ms,
               jitter_ms, packet_loss_percent, packets_sent, packets_received, packets_lost,
               audio_level, audio_bytes_sent, audio_bytes_received, metadata
             ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              session.sessionId, session.businessId, session.callSid,
              payload.rttMs || null, payload.jitterMs || null, payload.packetLossPercent || 0,
              payload.packetsSent || null, payload.packetsReceived || null, payload.packetsLost || null,
              payload.audioLevel || null, payload.audioBytesSent || null, payload.audioBytesReceived || null,
              JSON.stringify(payload.metadata || {})
            ]
          ).catch(e => console.warn('[WEBCALL NET] Metric insert warn:', e.message));
        }
        break;
      }

      case 'telemetry:event': {
        if (payload && payload.eventType) {
          await logWebCallEvent({
            sessionId: session.sessionId,
            businessId: session.businessId,
            callSid: session.callSid,
            eventType: payload.eventType,
            metadata: payload.metadata || {}
          });
        }
        break;
      }

      case 'call:hangup': {
        await this.finalizeSession(session.callSid, payload?.reason || 'user_hangup');
        break;
      }

      default:
        break;
    }
  }

  /**
   * Process a full conversational turn with exact event timestamps and latency telemetry.
   */
  async processTurn(session, userTranscript, optionalAudioBuffer = null) {
    const turn = session.currentTurn;
    if (!turn) return;

    turn.userTranscript = userTranscript.trim();
    session.conversationHistory.push({ role: 'user', content: turn.userTranscript });

    // Step 1: STT metrics
    const sttStartTime = Date.now();
    turn.sttStartedAt = new Date(sttStartTime);
    turn.sttCompletedAt = new Date(sttStartTime); // If provided by client, latency is minimal
    turn.sttLatencyMs = 0;
    turn.transcriptReadyAt = new Date(sttStartTime);
    turn.sttProvider = 'browser_stt';

    await logWebCallEvent({
      sessionId: session.sessionId,
      businessId: session.businessId,
      callSid: session.callSid,
      turnId: turn.turnId,
      eventType: 'stt_completed',
      metadata: { transcript: turn.userTranscript }
    });

    // Step 2: Knowledge Retrieval Telemetry (Phase 11)
    const knowledgeStartTime = Date.now();
    turn.knowledgeStartedAt = new Date(knowledgeStartTime);
    let knowledgeContext = '';
    let chunksUsed = 0;
    let knowledgeMetadata = {};
    turn.knowledgeUsed = false;

    try {
      const chunks = await searchKnowledgeChunks(session.businessId, turn.userTranscript, 3);
      turn.knowledgeCompletedAt = new Date();
      turn.knowledgeLatencyMs = Date.now() - knowledgeStartTime;

      if (chunks && chunks.length > 0) {
        turn.knowledgeUsed = true;
        chunksUsed = chunks.length;
        knowledgeContext = '\n\nRelevant business knowledge:\n' + chunks.map(c => `- ${c.chunk_text}`).join('\n');
        knowledgeMetadata = {
          chunksCount: chunks.length,
          topDoc: chunks[0].doc_name,
          topRank: chunks[0].rank
        };
      }
    } catch (kErr) {
      turn.knowledgeCompletedAt = new Date();
      turn.knowledgeLatencyMs = Date.now() - knowledgeStartTime;
      turn.knowledgeUsed = false;
      console.warn('[WEBCALL KNOWLEDGE] Retrieval warning:', kErr.message);
    }

    turn.chunksUsed = chunksUsed;
    turn.knowledgeMetadata = knowledgeMetadata;

    await logWebCallEvent({
      sessionId: session.sessionId,
      businessId: session.businessId,
      callSid: session.callSid,
      turnId: turn.turnId,
      eventType: 'knowledge_completed',
      durationMs: turn.knowledgeLatencyMs,
      metadata: knowledgeMetadata
    });

    // Step 3 & 4: Streaming LLM Generation & Sentence-by-Sentence TTS Synthesis
    const llmStartTime = Date.now();
    turn.llmStartedAt = new Date(llmStartTime);
    turn.llmProvider = 'openai';
    turn.llmModel = 'gpt-4o-mini';
    turn.ttsProvider = 'openai';
    turn.ttsModel = 'tts-1';
    turn.ttsVoice = session.assistant?.voice || 'alloy';

    const systemPrompt = (session.assistant?.system_prompt || 'You are Maya, a helpful AI receptionist.') + knowledgeContext;
    const history = session.conversationHistory.slice(-8);

    let assistantResponseText = '';
    let firstAudioSent = false;
    let ttsStartTime = Date.now();
    turn.ttsStartedAt = new Date(ttsStartTime);

    // Queue of pending audio synthesis promises
    const audioPromises = [];

    const handleSentence = async (sentence, isFirst) => {
      // Check for interruption/barge-in before synthesizing
      if (session.status === 'completed' || !session.currentTurn) return;

      const sentenceTtsStart = Date.now();
      try {
        const audioBuffer = await openAIService.textToSpeech(
          sentence,
          session.assistant?.voice || 'alloy',
          session.assistant?.language || 'en-US',
          'mp3'
        );

        if (!firstAudioSent) {
          firstAudioSent = true;
          const firstAudioTime = Date.now();
          turn.ttsFirstAudioAt = new Date(firstAudioTime);
          turn.ttsTimeToFirstAudioMs = firstAudioTime - ttsStartTime;

          const userEndedMs = turn.userSpeechEndedAt.getTime();
          turn.timeToFirstAiAudioMs = Math.max(0, firstAudioTime - userEndedMs);
          turn.endToEndResponseLatencyMs = Math.max(0, Date.now() - turn.turnStartedAt.getTime());

          session.isAiSpeaking = true;
          session.aiSpeechStartTime = Date.now();

          // Send speech started event to client
          if (session.ws && session.ws.readyState === session.ws.OPEN) {
            session.ws.send(JSON.stringify({
              type: 'assistant:speech_started',
              turnId: turn.turnId,
              text: sentence,
              telemetry: {
                timeToFirstAiAudioMs: turn.timeToFirstAiAudioMs,
                llmLatencyMs: turn.llmTotalLatencyMs || (Date.now() - llmStartTime),
                ttsLatencyMs: turn.ttsTimeToFirstAudioMs,
                endToEndMs: turn.endToEndResponseLatencyMs
              }
            }));
            // Send first binary audio chunk immediately
            session.ws.send(audioBuffer);
          }
        } else {
          // Send subsequent audio chunk
          if (session.ws && session.ws.readyState === session.ws.OPEN) {
            session.ws.send(audioBuffer);
          }
        }
      } catch (sentenceTtsErr) {
        console.error('[WEBCALL TTS STREAM] Sentence synthesis error:', sentenceTtsErr.message);
      }
    };

    try {
      if (typeof openAIService.chatStream === 'function') {
        const streamResult = await openAIService.chatStream(
          systemPrompt,
          history,
          async (sentence, isFirst) => {
            if (isFirst) {
              turn.llmFirstTokenAt = new Date();
              turn.llmTimeToFirstTokenMs = Date.now() - llmStartTime;
            }
            await handleSentence(sentence, isFirst);
          }
        );
        assistantResponseText = streamResult.response_text || "I'm here to help. Could you tell me more?";
        turn.llmTimeToFirstTokenMs = streamResult.ttft_ms || (Date.now() - llmStartTime);
        turn.llmCompletedAt = new Date();
        turn.llmTotalLatencyMs = Date.now() - llmStartTime;
      } else {
        // Fallback non-streaming
        const chatRes = await openAIService.chat(systemPrompt, history, null);
        turn.llmFirstTokenAt = new Date(llmStartTime + 180);
        turn.llmCompletedAt = new Date();
        turn.llmTimeToFirstTokenMs = 180;
        turn.llmTotalLatencyMs = Date.now() - llmStartTime;
        assistantResponseText = chatRes.response_text || "I'm here to help. Could you tell me more?";
        await handleSentence(assistantResponseText, true);
      }
    } catch (llmErr) {
      console.error('[WEBCALL LLM] Chat error:', llmErr.message);
      turn.llmCompletedAt = new Date();
      turn.llmTotalLatencyMs = Date.now() - llmStartTime;
      turn.llmTimeToFirstTokenMs = turn.llmTimeToFirstTokenMs || (Date.now() - llmStartTime);
      session.errorCount = (session.errorCount || 0) + 1;
      session.lastErrorCode = llmErr.code || 'LLM_ERROR';
      session.lastErrorStage = 'llm';
      await logWebCallEvent({
        sessionId: session.sessionId,
        businessId: session.businessId,
        callSid: session.callSid,
        turnId: turn.turnId,
        eventType: 'llm_failed',
        metadata: { error: llmErr.message, stage: 'llm' }
      });
      assistantResponseText = "I apologize, I didn't quite catch that. Could you please repeat?";
      await handleSentence(assistantResponseText, true);
    }

    turn.assistantResponse = assistantResponseText;
    session.conversationHistory.push({ role: 'assistant', content: assistantResponseText });

    turn.ttsCompletedAt = new Date();
    turn.ttsTotalLatencyMs = Date.now() - ttsStartTime;
    if (!turn.timeToFirstAiAudioMs) {
      const userEndedMs = turn.userSpeechEndedAt.getTime();
      turn.timeToFirstAiAudioMs = Math.max(0, Date.now() - userEndedMs);
      turn.endToEndResponseLatencyMs = Math.max(0, Date.now() - turn.turnStartedAt.getTime());
    }

    const audioDurationMs = Math.round(assistantResponseText.length * 60);
    turn.assistantAudioDurationMs = audioDurationMs;
    session.assistantSpeechTotalMs += audioDurationMs;

    // Send speech ended signal to client
    if (session.ws && session.ws.readyState === session.ws.OPEN) {
      session.ws.send(JSON.stringify({
        type: 'assistant:speech_ended',
        turnId: turn.turnId,
        text: assistantResponseText
      }));
    }

    await logWebCallEvent({
      sessionId: session.sessionId,
      businessId: session.businessId,
      callSid: session.callSid,
      turnId: turn.turnId,
      eventType: 'assistant_audio_completed',
      durationMs: turn.ttsTotalLatencyMs,
      metadata: {
        timeToFirstAiAudioMs: turn.timeToFirstAiAudioMs,
        endToEndResponseLatencyMs: turn.endToEndResponseLatencyMs
      }
    });

    session.isAiSpeaking = false;

    // Persist Turn into webcall_turns (Phase 5)
    await this.persistTurnRecord(session, turn);
    session.turns.push(turn);
    session.currentTurn = null;
  }

  /**
   * Persist turn-level telemetry into webcall_turns table.
   */
  async persistTurnRecord(session, turn) {
    try {
      await db.query(
        `INSERT INTO webcall_turns (
           session_id, business_id, call_sid, turn_id, turn_number,
           user_transcript, assistant_response,
           turn_started_at, user_speech_started_at, user_speech_ended_at,
           stt_started_at, stt_completed_at, transcript_ready_at,
           knowledge_started_at, knowledge_completed_at,
           llm_started_at, llm_first_token_at, llm_completed_at,
           tts_started_at, tts_first_audio_at, tts_completed_at,
           user_speech_duration_ms, stt_latency_ms, knowledge_latency_ms,
           llm_time_to_first_token_ms, llm_total_latency_ms,
           tts_time_to_first_audio_ms, tts_total_latency_ms,
           time_to_first_ai_audio_ms, end_to_end_response_latency_ms,
           assistant_audio_duration_ms, was_interrupted,
           stt_provider, llm_provider, llm_model, tts_provider, tts_model, tts_voice,
           knowledge_used, chunks_used, knowledge_metadata, created_at
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7,
           $8, $9, $10,
           $11, $12, $13,
           $14, $15,
           $16, $17, $18,
           $19, $20, $21,
           $22, $23, $24,
           $25, $26,
           $27, $28,
           $29, $30,
           $31, $32,
           $33, $34, $35, $36, $37, $38,
           $39, $40, $41, NOW()
         )
         ON CONFLICT (turn_id) DO NOTHING`,
        [
          session.sessionId, session.businessId, session.callSid, turn.turnId, turn.turnNumber,
          turn.userTranscript, turn.assistantResponse,
          turn.turnStartedAt, turn.userSpeechStartedAt, turn.userSpeechEndedAt,
          turn.sttStartedAt, turn.sttCompletedAt, turn.transcriptReadyAt,
          turn.knowledgeStartedAt, turn.knowledgeCompletedAt,
          turn.llmStartedAt, turn.llmFirstTokenAt, turn.llmCompletedAt,
          turn.ttsStartedAt, turn.ttsFirstAudioAt, turn.ttsCompletedAt,
          turn.userSpeechDurationMs || 0, turn.sttLatencyMs || 0, turn.knowledgeLatencyMs || 0,
          turn.llmTimeToFirstTokenMs || 0, turn.llmTotalLatencyMs || 0,
          turn.ttsTimeToFirstAudioMs || 0, turn.ttsTotalLatencyMs || 0,
          turn.timeToFirstAiAudioMs || 0, turn.endToEndResponseLatencyMs || 0,
          turn.assistantAudioDurationMs || 0, turn.wasInterrupted || false,
          turn.sttProvider, turn.llmProvider, turn.llmModel, turn.ttsProvider, turn.ttsModel, turn.ttsVoice,
          turn.knowledgeUsed || false, turn.chunksUsed || 0, JSON.stringify(turn.knowledgeMetadata || {})
        ]
      );
    } catch (err) {
      console.error(`[WEBCALL TURN PERSIST] Failed for turn ${turn.turnId}:`, err.message);
    }
  }

  /**
   * Finalize the WebCall session, calculate summary metrics and persist to DB.
   */
  async finalizeSession(callSid, endReason = 'user_hangup') {
    const session = activeWebCallSessions.get(callSid);
    const endTime = Date.now();
    let sessionId = session?.sessionId;
    let businessId = session?.businessId;

    if (!session) {
      // Lookup session from DB
      const res = await db.query("SELECT * FROM webcall_sessions WHERE call_sid = $1", [callSid]);
      if (res.rows.length === 0) return null;
      sessionId = res.rows[0].id;
      businessId = res.rows[0].business_id;
    }

    const durationMs = session ? (endTime - session.startTime) : 0;
    const durationSeconds = Math.max(1, Math.ceil(durationMs / 1000));

    // Calculate latency percentiles across all recorded turns (Phase 6)
    const turnLatencies = session ? session.turns.map(t => t.timeToFirstAiAudioMs).filter(Boolean) : [];
    const percentiles = calculatePercentiles(turnLatencies);

    // Calculate user turn duration averages
    const userTurnDurations = session ? session.turns.map(t => t.userSpeechDurationMs).filter(Boolean) : [];
    const userTurnCount = userTurnDurations.length;
    const avgUserTurnMs = userTurnCount > 0 ? (userTurnDurations.reduce((a, b) => a + b, 0) / userTurnCount) : 0;
    const minUserTurnMs = userTurnCount > 0 ? Math.min(...userTurnDurations) : 0;
    const maxUserTurnMs = userTurnCount > 0 ? Math.max(...userTurnDurations) : 0;

    // Calculate assistant speech metrics
    const assistantTurnDurations = session ? session.turns.map(t => t.assistantAudioDurationMs).filter(Boolean) : [];
    const assistantTurnCount = assistantTurnDurations.length;
    const avgAssistantTurnMs = assistantTurnCount > 0 ? (assistantTurnDurations.reduce((a, b) => a + b, 0) / assistantTurnCount) : 0;

    // Calculate network stats averages
    const rttSamples = session ? session.networkSamples.map(s => s.rttMs).filter(Boolean) : [];
    const jitterSamples = session ? session.networkSamples.map(s => s.jitterMs).filter(Boolean) : [];
    const avgRtt = rttSamples.length > 0 ? (rttSamples.reduce((a, b) => a + b, 0) / rttSamples.length) : null;
    const maxRtt = rttSamples.length > 0 ? Math.max(...rttSamples) : null;
    const avgJitter = jitterSamples.length > 0 ? (jitterSamples.reduce((a, b) => a + b, 0) / jitterSamples.length) : null;
    const maxJitter = jitterSamples.length > 0 ? Math.max(...jitterSamples) : null;

    // 1. Update webcall_sessions record
    await db.query(
      `UPDATE webcall_sessions SET
         status = 'completed',
         ended_at = NOW(),
         duration_ms = $1,
         end_reason = $2,
         user_speech_duration_ms = $3,
         user_turn_count = $4,
         user_speech_segment_count = $4,
         average_user_turn_duration_ms = $5,
         min_user_turn_duration_ms = $6,
         max_user_turn_duration_ms = $7,
         assistant_speech_duration_ms = $8,
         assistant_turn_count = $9,
         assistant_audio_segment_count = $9,
         average_assistant_turn_duration_ms = $10,
         total_audio_played_ms = $8,
         avg_latency_ms = $11,
         p50_latency_ms = $12,
         p75_latency_ms = $13,
         p90_latency_ms = $14,
         p95_latency_ms = $15,
         min_latency_ms = $16,
         max_latency_ms = $17,
         interruption_count = $18,
         interrupted_turn_count = $19,
         avg_rtt_ms = $20,
         max_rtt_ms = $21,
         avg_jitter_ms = $22,
         max_jitter_ms = $23,
         error_count = $24,
         last_error_code = $25,
         last_error_stage = $26,
         failure_reason = $27,
         updated_at = NOW()
       WHERE call_sid = $28`,
      [
        durationMs, endReason,
        session?.userSpeechTotalMs || 0, userTurnCount, avgUserTurnMs, minUserTurnMs, maxUserTurnMs,
        session?.assistantSpeechTotalMs || 0, assistantTurnCount, avgAssistantTurnMs,
        percentiles.avg, percentiles.p50, percentiles.p75, percentiles.p90, percentiles.p95, percentiles.min, percentiles.max,
        session?.interruptionsCount || 0, session?.interruptedTurnsCount || 0,
        avgRtt, maxRtt, avgJitter, maxJitter,
        session?.errorCount || 0, session?.lastErrorCode || null, session?.lastErrorStage || null, session?.failureReason || null,
        callSid
      ]
    );

    // 2. Build full conversation text & structured transcript array
    const rawTranscript = session?.conversationHistory || [];
    const formattedTranscript = rawTranscript.map(turn => `${turn.role === 'assistant' ? 'Agent' : 'User'}: ${turn.content}`).join('\n');
    const summary = rawTranscript.length > 0 
      ? `WebCall conversation completed with ${userTurnCount} turns. Agent assisted with caller questions.`
      : 'WebCall completed with no user speech recorded.';

    // 3. Update canonical calls table
    const callUpdate = await db.query(
      `UPDATE calls SET
         status = 'completed',
         call_status = 'completed',
         duration_seconds = $1,
         ended_at = NOW(),
         transcript = $2
       WHERE call_sid = $3
       RETURNING id, business_id`,
      [durationSeconds, formattedTranscript, callSid]
    );

    const callDbId = callUpdate.rows[0]?.id;
    const resolvedBiz = callUpdate.rows[0]?.business_id || businessId;

    // 4. Save into transcripts table (requires call_sessions FK)
    if (callDbId && rawTranscript.length > 0) {
      // Ensure call_sessions row exists (transcripts.call_sid -> call_sessions.call_sid FK)
      await db.query(
        `INSERT INTO call_sessions (call_sid, business_id, caller_phone, exotel_number, session_status, started_at, ended_at)
         VALUES ($1, $2, 'Browser Client', 'WebCall', 'completed', NOW() - INTERVAL '1 second' * $3, NOW())
         ON CONFLICT (call_sid) DO NOTHING`,
        [callSid, resolvedBiz, durationSeconds]
      ).catch(e => console.warn('[WEBCALL] call_sessions insert warn:', e.message));

      await db.query(
        `INSERT INTO transcripts (call_id, business_id, client_id, call_sid, transcript, summary, created_at)
         VALUES ($1, $2, $2, $3, $4, $5, NOW())
         ON CONFLICT DO NOTHING`,
        [callDbId, resolvedBiz, callSid, JSON.stringify(rawTranscript), summary]
      ).catch(e => console.warn('[WEBCALL] Transcript insert warn:', e.message));
    }

    // 5. Record canonical business event (conversation.completed)
    if (resolvedBiz && callDbId) {
      try {
        await recordConversationCompletedEvent({
          businessId: resolvedBiz,
          conversationId: callDbId,
          sourceType: 'webcall',
          sourceId: callSid,
          completedAt: new Date().toISOString(),
          metadata: {
            duration_seconds: durationSeconds,
            turns_count: userTurnCount,
            p50_latency_ms: percentiles.p50,
            p95_latency_ms: percentiles.p95
          }
        });
      } catch (evtErr) {
        console.warn('[WEBCALL] Business event error:', evtErr.message);
      }
    }

    // 6. Log final event
    if (sessionId) {
      await logWebCallEvent({
        sessionId,
        businessId: resolvedBiz,
        callSid,
        eventType: 'session_completed',
        durationMs,
        metadata: {
          endReason,
          durationSeconds,
          userTurnCount,
          p50LatencyMs: percentiles.p50,
          p95LatencyMs: percentiles.p95
        }
      });
    }

    // 7. Notify client WebSocket if still open
    if (session?.ws && session.ws.readyState === session.ws.OPEN) {
      session.ws.send(JSON.stringify({
        type: 'session:ended',
        callSid,
        summary: {
          durationMs,
          durationSeconds,
          userSpeechTotalMs: session.userSpeechTotalMs,
          assistantSpeechTotalMs: session.assistantSpeechTotalMs,
          turnsCount: userTurnCount,
          interruptionsCount: session.interruptionsCount,
          percentiles
        }
      }));
      session.ws.close();
    }

    // Clean up active session
    activeWebCallSessions.delete(callSid);
    return {
      success: true,
      callSid,
      durationMs,
      durationSeconds,
      userTurnCount,
      turnsCount: userTurnCount,
      userSpeechTotalMs: session?.userSpeechTotalMs || 0,
      assistantSpeechTotalMs: session?.assistantSpeechTotalMs || 0,
      interruptionsCount: session?.interruptionsCount || 0,
      avgLatencyMs: percentiles.avg,
      p95LatencyMs: percentiles.p95,
      percentiles
    };
  }
}

const webCallSessionManager = new WebCallSessionManager();

module.exports = {
  webCallSessionManager,
  calculatePercentiles,
  logWebCallEvent,
  activeWebCallSessions
};
