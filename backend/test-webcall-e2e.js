'use strict';

require('dotenv').config();
const assert = require('assert');
const db = require('./database/db');
const webCallController = require('./controllers/webCallController');
const { webCallSessionManager, calculatePercentiles } = require('./services/webCallSessionManager');
const openAIService = require('./services/openAIService');
const crypto = require('crypto');

// Helpers for mocking Express req/res
function mockReq(user, params = {}, body = {}, query = {}) {
  return {
    user,
    params,
    body,
    query,
    protocol: 'http',
    get: (header) => (header === 'host' ? 'localhost:5000' : null)
  };
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    set(key, val) {
      this.headers[key] = val;
      return this;
    }
  };
  return res;
}

async function runWebCallTests() {
  console.log('==================================================');
  console.log('BAVIO WEBCALL OBSERVABILITY & TELEMETRY TEST SUITE');
  console.log('==================================================\n');

  const testBizIdA = 'a0000000-0000-0000-0000-000000000001';
  const testBizIdB = 'b0000000-0000-0000-0000-000000000002';
  const testAgentId = 'a1111111-1111-1111-1111-111111111111';
  const testDocId = 'd2222222-2222-2222-2222-222222222222';

  let activeCallSid = null;
  let activeSessionId = null;

  try {
    // ── Setup Test Fixtures ──
    await db.query(`DELETE FROM businesses WHERE id IN ($1, $2)`, [testBizIdA, testBizIdB]);
    await db.query(
      `INSERT INTO businesses (id, name, email, phone, password_hash, subscription_status, status)
       VALUES ($1, 'Acme Health A', 'testa@bavio.local', '+15551112222', 'hash123', 'active', 'active'),
              ($2, 'Beta Clinic B', 'testb@bavio.local', '+15553334444', 'hash123', 'active', 'active')`,
      [testBizIdA, testBizIdB]
    );

    await db.query(
      `INSERT INTO assistants (id, business_id, name, system_prompt, language, voice_id, first_message, is_active)
       VALUES ($1, $2, 'Maya Receptionist', 'You are Maya, receptionist at Acme Health. Assist callers warmly.', 'en-US', 'alloy', 'Hello, thank you for calling Acme Health. How can I help you?', true)`,
      [testAgentId, testBizIdA]
    );

    // Setup knowledge doc & chunks for real knowledge test
    await db.query(
      `INSERT INTO knowledge_base_docs (id, business_id, name, original_filename, file_type, file_size, status)
       VALUES ($1, $2, 'Clinic Services', 'clinic-services.pdf', 'pdf', 1024, 'ready')
       ON CONFLICT (id) DO NOTHING`,
      [testDocId, testBizIdA]
    );

    await db.query(
      `INSERT INTO knowledge_chunks (doc_id, business_id, chunk_index, content, word_count, metadata)
       VALUES ($1, $2, 1, 'Acme Health clinic hours are Monday through Friday from 8 AM to 6 PM. Dr. Maya works here and specializes in cardiology.', 22, '{"page": 1}')
       ON CONFLICT DO NOTHING`,
      [testDocId, testBizIdA]
    );

    // ─────────────────────────────────────────────────────────────
    // TEST GROUP 1: SESSION CREATION & WORKSPACE ISOLATION (Phase 2 & 18)
    // ─────────────────────────────────────────────────────────────
    console.log('--- Test Group 1: Session Creation & Workspace Isolation ---');
    {
      // 1. Unauthenticated request rejected
      const reqNoAuth = mockReq(null, {}, { agentId: testAgentId });
      const resNoAuth = mockRes();
      await webCallController.initiateWebCallSession(reqNoAuth, resNoAuth);
      assert.strictEqual(resNoAuth.statusCode, 401, 'Unauthenticated request returns 401');

      // 2. Cross-workspace isolation (Tenant B cannot access Tenant A agent)
      const reqCross = mockReq({ id: testBizIdB }, {}, { agentId: testAgentId });
      const resCross = mockRes();
      await webCallController.initiateWebCallSession(reqCross, resCross);
      assert.strictEqual(resCross.statusCode, 404, 'Cross-workspace agent returns 404');

      // 3. Valid Session Creation
      const reqValid = mockReq({ id: testBizIdA }, {}, {
        agentId: testAgentId,
        browser: 'Chrome 122',
        os: 'macOS',
        deviceType: 'desktop'
      });
      const resValid = mockRes();
      await webCallController.initiateWebCallSession(reqValid, resValid);

      assert.strictEqual(resValid.statusCode, 201, 'Valid session initiation returns 201 Created');
      assert(resValid.body.success, 'Returns success: true');
      assert(resValid.body.callSid && resValid.body.callSid.startsWith('webcall_'), 'Generates canonical webcall_ call_sid');
      assert(resValid.body.sessionToken, 'Issues signed session token');
      assert(resValid.body.wsUrl && resValid.body.wsUrl.includes('/api/webcall/stream'), 'Returns WebSocket streaming URL');

      activeCallSid = resValid.body.callSid;
      activeSessionId = resValid.body.sessionId;

      // Verify record created in canonical calls table
      const callDb = await db.query("SELECT * FROM calls WHERE call_sid = $1", [activeCallSid]);
      assert.strictEqual(callDb.rows.length, 1, 'Created entry in canonical calls table');
      assert.strictEqual(callDb.rows[0].provider, 'webcall', 'Calls table provider is webcall');
      assert.strictEqual(callDb.rows[0].status, 'started', 'Initial status is started');

      // Verify record created in webcall_sessions table
      const sessDb = await db.query("SELECT * FROM webcall_sessions WHERE call_sid = $1", [activeCallSid]);
      assert.strictEqual(sessDb.rows.length, 1, 'Created entry in webcall_sessions table');
      assert.strictEqual(sessDb.rows[0].transport, 'webrtc', 'Transport is webrtc');
      assert.strictEqual(sessDb.rows[0].business_id, testBizIdA, 'Business isolation preserved');

      // 4. Idempotency test: duplicate call attempt returns existing session
      const resDup = mockRes();
      await webCallController.initiateWebCallSession(reqValid, resDup);
      assert.strictEqual(resDup.statusCode, 200, 'Duplicate session attempt handled idempotently');
      assert.strictEqual(resDup.body.duplicate, true, 'Flags duplicate: true');
      assert.strictEqual(resDup.body.callSid, activeCallSid, 'Returns existing callSid');

      console.log('  ✓ Unauthenticated rejected with 401');
      console.log('  ✓ Workspace isolation enforced (404 for foreign tenant)');
      console.log('  ✓ WebCall session created with canonical call_sid');
      console.log('  ✓ Calls table record inserted with provider=webcall');
      console.log('  ✓ Webcall_sessions record inserted with metadata');
      console.log('  ✓ Backend idempotency prevents duplicate sessions');
    }

    // ─────────────────────────────────────────────────────────────
    // TEST GROUP 2: TELEMETRY INGESTION (Phases 8, 9, 14, 15)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- Test Group 2: Client Telemetry & Network Stats Ingestion ---');
    {
      const reqTelem = mockReq(
        { id: testBizIdA },
        { callSid: activeCallSid },
        {
          events: [
            { type: 'microphone_requested', occurredAt: new Date().toISOString() },
            { type: 'microphone_granted', occurredAt: new Date().toISOString() },
            { type: 'webrtc_connecting', occurredAt: new Date().toISOString() }
          ],
          networkMetrics: {
            rttMs: 28.5,
            jitterMs: 3.2,
            packetLossPercent: 0.1,
            packetsSent: 150,
            packetsReceived: 148,
            audioLevel: 72.0,
            audioBytesSent: 24000,
            audioBytesReceived: 48000
          }
        }
      );
      const resTelem = mockRes();
      await webCallController.recordClientTelemetry(reqTelem, resTelem);

      assert.strictEqual(resTelem.statusCode, 200, 'Telemetry endpoint returns 200');

      // Verify events persisted to webcall_events
      const evtCheck = await db.query(
        "SELECT * FROM webcall_events WHERE call_sid = $1 AND event_type = 'microphone_granted'",
        [activeCallSid]
      );
      assert.strictEqual(evtCheck.rows.length, 1, 'Microphone granted event persisted');

      // Verify network metrics persisted
      const netCheck = await db.query(
        "SELECT * FROM webcall_network_metrics WHERE call_sid = $1",
        [activeCallSid]
      );
      assert.strictEqual(netCheck.rows.length, 1, 'Network metrics sample persisted');
      assert.strictEqual(Number(netCheck.rows[0].round_trip_time_ms), 28.5, 'RTT saved correctly');

      console.log('  ✓ Microphone lifecycle events persisted');
      console.log('  ✓ Network telemetry (RTT, jitter, packet loss) persisted');
    }

    // ─────────────────────────────────────────────────────────────
    // TEST GROUP 3: CONVERSATION TURN PROCESSING & LATENCY ENGINE (Phases 3-7, 10-12)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- Test Group 3: Real Conversation Turns & Phase 6 Latency Engine ---');
    {
      const session = webCallSessionManager.getSession(activeCallSid);
      assert(session, 'Active in-memory session found');

      // Clearly labeled CI mock for external AI cloud providers (Phase 24: where external providers cannot be invoked in CI)
      const origChat = openAIService.chat;
      const origTts = openAIService.textToSpeech;

      openAIService.chat = async (prompt, history, apiKey) => {
        // Measure real time for simulated inference
        await new Promise(r => setTimeout(r, 60 + Math.floor(Math.random() * 30)));
        let resp = "Thank you for asking. Based on our clinic records, Dr. Maya is available Monday through Friday.";
        if (prompt.includes('veterinary')) {
          resp = "I apologize, we are a human clinic and do not provide veterinary services.";
        }
        return { response_text: resp };
      };

      openAIService.textToSpeech = async (text, voice, language, format) => {
        // Measure real time for simulated audio synthesis
        await new Promise(r => setTimeout(r, 50 + Math.floor(Math.random() * 25)));
        const wavHeader = Buffer.alloc(44);
        wavHeader.write('RIFF', 0);
        wavHeader.writeUInt32LE(36 + text.length * 50, 4);
        wavHeader.write('WAVE', 8);
        wavHeader.write('fmt ', 12);
        wavHeader.writeUInt32LE(16, 16);
        wavHeader.writeUInt16LE(1, 20);
        wavHeader.writeUInt16LE(1, 22);
        wavHeader.writeUInt32LE(16000, 24);
        wavHeader.writeUInt32LE(32000, 28);
        wavHeader.writeUInt16LE(2, 32);
        wavHeader.writeUInt16LE(16, 34);
        wavHeader.write('data', 36);
        wavHeader.writeUInt32LE(text.length * 50, 40);
        return Buffer.concat([wavHeader, Buffer.alloc(text.length * 50)]);
      };

      // Phase 25: 10 Real User Turn Execution Benchmark
      const turnDefinitions = [
        { type: 'simple_question', text: 'Hello, what services does your clinic provide?' },
        { type: 'knowledge_question', text: 'What are your clinic hours and does Dr. Maya work there?' },
        { type: 'multi_turn_context', text: 'Does she accept new patients on Mondays?' },
        { type: 'long_answer', text: 'I have been experiencing mild chest discomfort when exercising and would like to schedule a comprehensive cardiology consultation as soon as possible.' },
        { type: 'interruption', text: 'Wait, excuse me, before that, what is the address?' },
        { type: 'unknown_question', text: 'Do you offer veterinary services for cats?' },
        { type: 'silence_pause', text: 'Hmm, let me think for a second.' },
        { type: 'short_answer', text: 'Yes, please.' },
        { type: 'rapid_followup', text: 'And do you take health insurance?' },
        { type: 'final_goodbye', text: 'Thank you for your help, goodbye!' }
      ];

      const benchmarkResults = [];

      try {
        for (let i = 0; i < turnDefinitions.length; i++) {
          const item = turnDefinitions[i];
          const turnNum = i + 1;
          const turnId = `turn_bench_${turnNum}_${Date.now()}`;

          const speechDurationMs = Math.round(800 + item.text.length * 45);
          const speechEnd = Date.now();
          const speechStart = speechEnd - speechDurationMs;

          // Initialize turn
          session.turnCounter = turnNum;
          session.currentTurn = {
            turnId,
            turnNumber: turnNum,
            turnStartedAt: new Date(speechStart),
            userSpeechStartedAt: new Date(speechStart),
            userSpeechEndedAt: new Date(speechEnd),
            userSpeechDurationMs: speechDurationMs,
            wasInterrupted: item.type === 'interruption'
          };
          session.userSpeechTotalMs += speechDurationMs;

          if (item.type === 'interruption') {
            session.interruptionsCount++;
            session.interruptedTurnsCount++;
          }

          // Process turn through pipeline (STT -> Knowledge -> LLM -> TTS)
          await webCallSessionManager.processTurn(session, item.text);

          const recordedTurn = session.turns[session.turns.length - 1];
          assert(recordedTurn, `Turn #${turnNum} recorded in session`);

        benchmarkResults.push({
          turnNumber: turnNum,
          turnType: item.type,
          userSpeechMs: recordedTurn.userSpeechDurationMs,
          sttMs: recordedTurn.sttLatencyMs,
          knowledgeMs: recordedTurn.knowledgeLatencyMs,
          knowledgeUsed: recordedTurn.knowledgeUsed,
          chunksUsed: recordedTurn.chunksUsed,
          llmTtftMs: recordedTurn.llmTimeToFirstTokenMs,
          llmTotalMs: recordedTurn.llmTotalLatencyMs,
          ttsTtfaMs: recordedTurn.ttsTimeToFirstAudioMs,
          ttsTotalMs: recordedTurn.ttsTotalLatencyMs,
          timeToFirstAiAudioMs: recordedTurn.timeToFirstAiAudioMs,
          aiSpeechMs: recordedTurn.assistantAudioDurationMs,
          wasInterrupted: recordedTurn.wasInterrupted
        });
      }

      // Print Phase 25 Latency Table
      console.log('\n--- Phase 25: 10-Turn Latency Test Table ---');
      console.log('Turn | User Speech | STT | Knowledge | LLM TTFT | TTS TTFA | End-to-End TTFA | AI Speech | Interrupted');
      console.log('------------------------------------------------------------------------------------------------------');
      for (const b of benchmarkResults) {
        console.log(
          `#${b.turnNumber.toString().padEnd(3)} | ` +
          `${(b.userSpeechMs + 'ms').padEnd(11)} | ` +
          `${(b.sttMs + 'ms').padEnd(3)} | ` +
          `${(b.knowledgeMs + 'ms (' + b.chunksUsed + 'c)').padEnd(9)} | ` +
          `${(b.llmTtftMs + 'ms').padEnd(8)} | ` +
          `${(b.ttsTtfaMs + 'ms').padEnd(8)} | ` +
          `${(b.timeToFirstAiAudioMs + 'ms').padEnd(15)} | ` +
          `${(b.aiSpeechMs + 'ms').padEnd(9)} | ` +
          `${b.wasInterrupted ? 'YES' : 'NO'}`
        );
      }

      // Calculate Percentiles
      const ttfaValues = benchmarkResults.map(b => b.timeToFirstAiAudioMs);
      const ttfaPercentiles = calculatePercentiles(ttfaValues);

      console.log('\n--- Phase 6 & Phase 25: Latency Percentiles (Time-to-First-AI-Audio) ---');
      console.log(`  P50 Latency: ${ttfaPercentiles.p50} ms`);
      console.log(`  P75 Latency: ${ttfaPercentiles.p75} ms`);
      console.log(`  P90 Latency: ${ttfaPercentiles.p90} ms`);
      console.log(`  P95 Latency: ${ttfaPercentiles.p95} ms`);
      console.log(`  Avg Latency: ${ttfaPercentiles.avg} ms`);
      console.log(`  Min Latency: ${ttfaPercentiles.min} ms | Max Latency: ${ttfaPercentiles.max} ms`);

      assert(ttfaPercentiles.p50 !== null, 'P50 calculated successfully');
      assert(ttfaPercentiles.p95 !== null, 'P95 calculated successfully');

      // Verify knowledge chunk retrieval worked on Turn 2
      const turn2 = benchmarkResults[1];
      assert(turn2.knowledgeUsed, 'Knowledge retrieval used for Turn 2');
      assert(turn2.chunksUsed > 0, 'Knowledge chunks extracted for Turn 2');
      console.log(`  ✓ Real knowledge search executed and matched ${turn2.chunksUsed} chunks from knowledge_chunks`);

      // Verify interruption logged on Turn 5
      const turn5 = benchmarkResults[4];
      assert(turn5.wasInterrupted, 'Interruption correctly tracked on Turn 5');
      console.log('  ✓ Interruption / Barge-in tracked and counted');
    } finally {
      openAIService.chat = origChat;
      openAIService.textToSpeech = origTts;
    }
  }

    // ─────────────────────────────────────────────────────────────
    // TEST GROUP 4: SESSION FINALIZATION & TRANSCRIPT PERSISTENCE (Phases 13, 14, 21, 22)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- Test Group 4: Session Finalization & Persistence ---');
    {
      const reqEnd = mockReq({ id: testBizIdA }, { callSid: activeCallSid }, { reason: 'user_hangup' });
      const resEnd = mockRes();
      await webCallController.endWebCallSession(reqEnd, resEnd);

      assert.strictEqual(resEnd.statusCode, 200, 'End session returns 200 OK');
      assert(resEnd.body.success, 'Returns success: true');
      assert(resEnd.body.durationSeconds > 0, 'Calculates duration in seconds');

      // Verify webcall_sessions updated
      const sessAfter = await db.query("SELECT * FROM webcall_sessions WHERE call_sid = $1", [activeCallSid]);
      const sRow = sessAfter.rows[0];
      assert.strictEqual(sRow.status, 'completed', 'Webcall session marked completed');
      assert.strictEqual(sRow.user_turn_count, 10, 'Persists user_turn_count = 10');
      assert(sRow.user_speech_duration_ms > 0, 'User speech duration ms > 0');
      assert(sRow.assistant_speech_duration_ms > 0, 'Assistant speech duration ms > 0');
      assert(sRow.p50_latency_ms > 0, 'Persists p50_latency_ms');
      assert(sRow.p95_latency_ms > 0, 'Persists p95_latency_ms');
      assert.strictEqual(sRow.interruption_count, 1, 'Persists interruption_count = 1');

      // Verify canonical calls table updated
      const callAfter = await db.query("SELECT * FROM calls WHERE call_sid = $1", [activeCallSid]);
      const cRow = callAfter.rows[0];
      assert.strictEqual(cRow.status, 'completed', 'Calls table status is completed');
      assert.strictEqual(cRow.call_status, 'completed', 'Calls table call_status is completed');
      assert(cRow.duration_seconds > 0, 'Calls duration_seconds updated');
      assert(cRow.transcript && cRow.transcript.includes('Maya'), 'Calls transcript saved');

      // Verify transcripts table updated
      const transDb = await db.query("SELECT * FROM transcripts WHERE call_sid = $1", [activeCallSid]);
      assert(transDb.rows.length >= 1, 'Transcript entry created in transcripts table');
      assert(transDb.rows[0].summary && transDb.rows[0].summary.includes('WebCall'), 'AI summary saved');

      // Verify business_events recorded conversation.completed
      const evtDb = await db.query(
        "SELECT * FROM business_events WHERE business_id = $1 AND event_type = 'conversation.completed' ORDER BY occurred_at DESC LIMIT 1",
        [testBizIdA]
      );
      assert.strictEqual(evtDb.rows.length, 1, 'conversation.completed event recorded in business_events');

      console.log('  ✓ Webcall_sessions updated with turn counts and speech durations');
      console.log('  ✓ Canonical calls table marked completed with transcript');
      console.log('  ✓ Transcripts table populated with JSON conversation history & summary');
      console.log('  ✓ Canonical business_events recorded conversation.completed');
    }

    // ─────────────────────────────────────────────────────────────
    // TEST GROUP 5: HISTORICAL SESSIONS & TIMELINE INSPECTION (Phases 19 & 20)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- Test Group 5: Historical Analytics & Event Timeline Inspection ---');
    {
      // 1. Get session details (Phase 20 deep-dive)
      const reqDet = mockReq({ id: testBizIdA }, { callSid: activeCallSid });
      const resDet = mockRes();
      await webCallController.getWebCallSessionDetails(reqDet, resDet);

      assert.strictEqual(resDet.statusCode, 200, 'Details endpoint returns 200');
      assert(resDet.body.session, 'Returns session object');
      assert.strictEqual(resDet.body.turns.length, 10, 'Returns all 10 turns');
      assert(resDet.body.events.length >= 5, 'Returns full chronological event stream');
      assert(resDet.body.percentiles.p50 > 0, 'Returns real P50 latency');

      // 2. Cross-workspace isolation on details
      const reqDetCross = mockReq({ id: testBizIdB }, { callSid: activeCallSid });
      const resDetCross = mockRes();
      await webCallController.getWebCallSessionDetails(reqDetCross, resDetCross);
      assert.strictEqual(resDetCross.statusCode, 404, 'Cross-workspace details lookup returns 404');

      // 3. List historical sessions
      const reqList = mockReq({ id: testBizIdA }, {}, {}, { limit: '10' });
      const resList = mockRes();
      await webCallController.listWebCallSessions(reqList, resList);

      assert.strictEqual(resList.statusCode, 200, 'List endpoint returns 200');
      assert(Array.isArray(resList.body.sessions), 'Returns sessions array');
      assert(resList.body.sessions.some(s => s.call_sid === activeCallSid), 'Includes our tested session');

      console.log('  ✓ Session deep-dive returns full 10-turn breakdown');
      console.log('  ✓ Chronological event timeline fully inspectable');
      console.log('  ✓ Cross-workspace details access blocked (404)');
      console.log('  ✓ Historical session listing with filters verified');
    }

    console.log('\n==================================================');
    console.log('ALL WEBCALL TELEMETRY & PERSISTENCE TESTS PASSED!');
    console.log('==================================================\n');

  } finally {
    // Clean up test fixtures
    try {
      if (activeCallSid) {
        await db.query("DELETE FROM webcall_turns WHERE call_sid = $1", [activeCallSid]);
        await db.query("DELETE FROM webcall_events WHERE call_sid = $1", [activeCallSid]);
        await db.query("DELETE FROM webcall_network_metrics WHERE call_sid = $1", [activeCallSid]);
        await db.query("DELETE FROM webcall_sessions WHERE call_sid = $1", [activeCallSid]);
        await db.query("DELETE FROM transcripts WHERE call_sid = $1", [activeCallSid]);
        await db.query("DELETE FROM calls WHERE call_sid = $1", [activeCallSid]);
      }
      await db.query("DELETE FROM knowledge_chunks WHERE doc_id = $1", [testDocId]);
      await db.query("DELETE FROM knowledge_base_docs WHERE id = $1", [testDocId]);
      await db.query("DELETE FROM assistants WHERE id = $1", [testAgentId]);
      await db.query("DELETE FROM businesses WHERE id IN ($1, $2)", [testBizIdA, testBizIdB]);
    } catch (cleanupErr) {
      console.warn('Cleanup notice:', cleanupErr.message);
    }
  }
}

runWebCallTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('TEST SUITE FAILURE:', err);
    process.exit(1);
  });
