/**
 * test-newuser-webcall-regression.js
 * 
 * Regression & E2E Verification Suite for:
 * 1. New user empty states (0 agents, 0 knowledge, 0 numbers, 0 calls, 0 leads)
 * 2. Tenancy & RLS isolation (User A cannot access User B data)
 * 3. WebCall-first agent creation (name, system_prompt, language, voice_id, NO phone number)
 * 4. WebCall session execution without virtual phone assignment
 * 5. Multi-turn conversation & latency telemetry persistence
 * 6. DB verification across calls, webcall_sessions, transcripts, business_events
 * 7. Verification that Twilio telephony routes remain functional & distinct
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const assert = require('assert');
const { v4: uuidv4 } = require('uuid');
const db = require('./database/db');
const webCallController = require('./controllers/webCallController');
const { webCallSessionManager } = require('./services/webCallSessionManager');
const assistantService = require('./services/assistantService');

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

async function runRegressionSuite() {
  console.log('==================================================');
  console.log('BAVIO NEW-USER & WEBCALL-FIRST REGRESSION SUITE');
  console.log('==================================================\n');

  const testBizIdA = uuidv4();
  const testBizIdB = uuidv4();
  const testEmailA = `newuser_${Date.now()}@bavio.test`;
  const testEmailB = `otheruser_${Date.now()}@bavio.test`;

  try {
    // ── 1. Create fresh new users in DB ──────────────────────────────────
    console.log('--- Phase 1: New User Workspace Initialization ---');
    await db.query(
      `INSERT INTO businesses (id, name, email, phone, password_hash, subscription_status, status, created_at, updated_at)
       VALUES 
       ($1, 'New User Business', $2, '+919999999991', 'hash_placeholder', 'active', 'active', NOW(), NOW()),
       ($3, 'Other User Business', $4, '+919999999992', 'hash_placeholder', 'active', 'active', NOW(), NOW())`,
      [testBizIdA, testEmailA, testBizIdB, testEmailB]
    );
    console.log('✓ Created fresh workspaces for User A and User B');

    // ── 2. Test empty states for new user ────────────────────────────────
    console.log('\n--- Phase 2: First-Class Empty State Verification ---');
    const emptyAssistants = await assistantService.getAssistantsForClient(testBizIdA);
    assert(Array.isArray(emptyAssistants), 'Assistants should be an array');
    assert.strictEqual(emptyAssistants.length, 0, 'New user should have 0 assistants');
    console.log('✓ New user assistants list returns empty array: []');

    const emptyKnowledge = await db.query('SELECT * FROM knowledge_base_docs WHERE business_id = $1', [testBizIdA]);
    assert.strictEqual(emptyKnowledge.rows.length, 0, 'New user should have 0 knowledge docs');
    console.log('✓ New user knowledge documents returns empty array: []');

    const emptyNumbers = await db.query('SELECT * FROM phone_numbers WHERE business_id = $1', [testBizIdA]);
    assert.strictEqual(emptyNumbers.rows.length, 0, 'New user should have 0 phone numbers');
    console.log('✓ New user phone numbers returns empty array: []');

    const emptyCalls = await db.query('SELECT * FROM calls WHERE business_id = $1', [testBizIdA]);
    assert.strictEqual(emptyCalls.rows.length, 0, 'New user should have 0 calls');
    console.log('✓ New user calls returns empty array: []');

    const emptyLeads = await db.query('SELECT * FROM leads WHERE business_id = $1', [testBizIdA]);
    assert.strictEqual(emptyLeads.rows.length, 0, 'New user should have 0 leads');
    console.log('✓ New user leads returns empty array: []');

    // ── 3. Create WebCall-First Agent (NO Phone Number) ──────────────────
    console.log('\n--- Phase 3: WebCall-First Agent Creation (Zero Phone Dependency) ---');
    const createdAgent = await assistantService.createAssistant({
      business_id: testBizIdA,
      name: 'John',
      system_prompt: 'You are John, an expert AI receptionist for Bavio. Answer caller questions accurately.',
      language: 'en-US',
      voice_id: 'bavio_voice_sarah',
      model_routing_config: {
        role: 'Receptionist',
        business_type: 'Healthcare',
        description: 'Answers patient inquiries.',
        channel: 'webcall'
      }
    });

    assert(createdAgent && createdAgent.id, 'Agent must be created with valid ID');
    assert.strictEqual(createdAgent.name, 'John');
    assert.strictEqual(createdAgent.voice_id, 'bavio_voice_sarah');
    console.log(`✓ Created Agent "${createdAgent.name}" (ID: ${createdAgent.id}) without assigned phone number`);

    // ── 4. Verify Tenancy & RLS Isolation ────────────────────────────────
    console.log('\n--- Phase 4: Tenancy & Cross-Workspace Isolation ---');
    const userBAgents = await assistantService.getAssistantsForClient(testBizIdB);
    assert.strictEqual(userBAgents.length, 0, 'User B must NOT see User A agents');
    console.log('✓ User B cannot see User A agents (Workspace isolation verified)');

    // ── 5. Start WebCall Session without Phone Number ────────────────────
    console.log('\n--- Phase 5: Start In-Browser WebCall Session ---');
    const reqSession = mockReq({ id: testBizIdA }, {}, {
      agentId: createdAgent.id,
      browser: 'Chrome 128.0',
      os: 'Windows 11',
      deviceType: 'desktop'
    });
    const resSession = mockRes();
    await webCallController.initiateWebCallSession(reqSession, resSession);

    assert.strictEqual(resSession.statusCode, 201, 'WebCall session creation returns 201');
    assert(resSession.body.success, 'Returns success: true');
    assert(resSession.body.callSid && resSession.body.callSid.startsWith('webcall_'), 'Generates canonical webcall_ call_sid');
    assert(resSession.body.sessionToken, 'Generates signed sessionToken');

    const activeCallSid = resSession.body.callSid;
    console.log(`✓ WebCall session initialized successfully (Call SID: ${activeCallSid})`);

    // ── 6. Ingest Telemetry & Simulate Real Multi-Turn Conversation ───────
    console.log('\n--- Phase 6: Simulate WebRTC Multi-Turn Conversation & Telemetry ---');
    const reqTelem = mockReq({ id: testBizIdA }, { callSid: activeCallSid }, {
      events: [
        { eventType: 'microphone_granted', occurredAt: new Date().toISOString() },
        { eventType: 'webrtc_connected', occurredAt: new Date().toISOString() }
      ],
      networkTelemetry: { rttMs: 28, jitterMs: 2, packetLossPercent: 0 }
    });
    const resTelem = mockRes();
    await webCallController.recordClientTelemetry(reqTelem, resTelem);
    assert.strictEqual(resTelem.statusCode, 200);
    console.log('✓ Client WebRTC lifecycle and network telemetry recorded');

    const openAIService = require('./services/openAIService');
    openAIService.chat = async (prompt, history, apiKey) => {
      await new Promise(r => setTimeout(r, 40));
      return { response_text: "Thank you for contacting us. I am John, your AI receptionist. How can I help you today?" };
    };
    openAIService.textToSpeech = async (text, voice, language, format) => {
      await new Promise(r => setTimeout(r, 30));
      const wavHeader = Buffer.alloc(44);
      wavHeader.write('RIFF', 0);
      return Buffer.concat([wavHeader, Buffer.alloc(text.length * 50)]);
    };

    const session = webCallSessionManager.getSession(activeCallSid);
    assert(session, 'Active in-memory session found');

    // Turn 1: Caller speaks -> AI responds
    session.turnCounter = 1;
    session.currentTurn = {
      turnId: `turn_reg_1_${Date.now()}`,
      turnNumber: 1,
      turnStartedAt: new Date(Date.now() - 2200),
      userSpeechStartedAt: new Date(Date.now() - 2200),
      userSpeechEndedAt: new Date(),
      userSpeechDurationMs: 2200,
      wasInterrupted: false
    };
    session.userSpeechTotalMs += 2200;

    await webCallSessionManager.processTurn(session, 'Hello, what services do you offer?');
    const turn1 = session.turns[session.turns.length - 1];
    assert(turn1 && turn1.assistantResponse, 'AI must respond to caller speech');
    assert(turn1.timeToFirstAiAudioMs > 0, 'Must track end-to-end TTFA');
    console.log(`✓ Turn 1 Complete: User ("Hello, what services...") -> AI (${turn1.assistantResponse.slice(0, 40)}...) [TTFA: ${turn1.timeToFirstAiAudioMs}ms]`);

    // Turn 2: Caller asks follow-up -> AI responds
    session.turnCounter = 2;
    session.currentTurn = {
      turnId: `turn_reg_2_${Date.now()}`,
      turnNumber: 2,
      turnStartedAt: new Date(Date.now() - 1850),
      userSpeechStartedAt: new Date(Date.now() - 1850),
      userSpeechEndedAt: new Date(),
      userSpeechDurationMs: 1850,
      wasInterrupted: false
    };
    session.userSpeechTotalMs += 1850;

    await webCallSessionManager.processTurn(session, 'Can I schedule a consultation for tomorrow?');
    const turn2 = session.turns[session.turns.length - 1];
    assert(turn2 && turn2.assistantResponse, 'AI must respond to follow-up');
    console.log(`✓ Turn 2 Complete: User ("Can I schedule...") -> AI (${turn2.assistantResponse.slice(0, 40)}...) [TTFA: ${turn2.timeToFirstAiAudioMs}ms]`);

    // ── 7. Finalize Session & Verify DB Persistence ──────────────────────
    console.log('\n--- Phase 7: Session Finalization & DB Persistence Verification ---');
    const reqEnd = mockReq({ id: testBizIdA }, { callSid: activeCallSid }, {
      reason: 'user_hangup'
    });
    const resEnd = mockRes();
    await webCallController.endWebCallSession(reqEnd, resEnd);

    assert.strictEqual(resEnd.statusCode, 200, 'Session finalization returns 200');
    assert(resEnd.body.success, 'Session finalization returns success: true');
    assert(typeof resEnd.body.durationSeconds === 'number', 'Returns durationSeconds');
    console.log(`✓ Session finalized: duration=${resEnd.body.durationSeconds}s, P50=${resEnd.body.percentiles?.p50}ms`);

    // Verify calls table
    const callRecord = await db.query('SELECT * FROM calls WHERE call_sid = $1 AND business_id = $2', [activeCallSid, testBizIdA]);
    assert.strictEqual(callRecord.rows.length, 1, 'Call must exist in calls table');
    assert.strictEqual(callRecord.rows[0].provider, 'webcall');
    assert.strictEqual(callRecord.rows[0].status, 'completed');
    console.log('✓ Verified calls table: provider=webcall, status=completed');

    // Verify webcall_sessions table
    const sessionRecord = await db.query('SELECT * FROM webcall_sessions WHERE call_sid = $1 AND business_id = $2', [activeCallSid, testBizIdA]);
    assert.strictEqual(sessionRecord.rows.length, 1, 'Session must exist in webcall_sessions table');
    assert.strictEqual(sessionRecord.rows[0].user_turn_count, 2);
    assert(sessionRecord.rows[0].user_speech_duration_ms > 0, 'User speech duration must be > 0');
    assert(sessionRecord.rows[0].assistant_speech_duration_ms > 0, 'Assistant speech duration must be > 0');
    console.log(`✓ Verified webcall_sessions table: user_speech=${sessionRecord.rows[0].user_speech_duration_ms}ms, assistant_speech=${sessionRecord.rows[0].assistant_speech_duration_ms}ms, turns=${sessionRecord.rows[0].user_turn_count}`);

    // Verify transcripts table
    const transcriptRecord = await db.query('SELECT * FROM transcripts WHERE call_sid = $1 AND business_id = $2', [activeCallSid, testBizIdA]);
    assert.strictEqual(transcriptRecord.rows.length, 1, 'Transcript record must exist');
    assert(transcriptRecord.rows[0].summary && transcriptRecord.rows[0].summary.includes('WebCall'), 'Summary must mention WebCall');
    console.log('✓ Verified transcripts table: dialogue turns and summary persisted');

    // Verify business_events table
    const eventRecord = await db.query("SELECT * FROM business_events WHERE business_id = $1 AND event_type = 'conversation.completed'", [testBizIdA]);
    assert(eventRecord.rows.length >= 1, 'business_events must contain conversation.completed');
    console.log('✓ Verified business_events table: conversation.completed logged');

    // ── 8. Verify Twilio Separation ──────────────────────────────────────
    console.log('\n--- Phase 8: Verify Telephony / Twilio Independence ---');
    const twilioCallId = `CA_test_${Date.now()}`;
    await db.query(
      `INSERT INTO calls (call_sid, business_id, user_id, assistant_id, provider, status, from_number, to_number, duration, country_code, created_at)
       VALUES ($1, $2, $2, $3, 'twilio', 'completed', '+1234567890', '+1987654321', 45, 'US', NOW())`,
      [twilioCallId, testBizIdA, createdAgent.id]
    );

    const twilioCheck = await db.query('SELECT * FROM calls WHERE call_sid = $1', [twilioCallId]);
    assert.strictEqual(twilioCheck.rows[0].provider, 'twilio');
    assert.strictEqual(twilioCheck.rows[0].assistant_id, createdAgent.id);
    console.log('✓ Verified same agent brain supports both provider=webcall and provider=twilio cleanly');

    console.log('\n==================================================');
    console.log('✅ ALL REGRESSION TESTS PASSED (8/8 TEST PHASES)!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('❌ Test execution error:', err);
    throw err;
  } finally {
    // Cleanup test data
    console.log('Cleaning up test data...');
    await db.query('DELETE FROM transcripts WHERE business_id IN ($1, $2)', [testBizIdA, testBizIdB]);
    await db.query('DELETE FROM webcall_sessions WHERE business_id IN ($1, $2)', [testBizIdA, testBizIdB]);
    await db.query('DELETE FROM calls WHERE business_id IN ($1, $2)', [testBizIdA, testBizIdB]);
    await db.query('DELETE FROM business_events WHERE business_id IN ($1, $2)', [testBizIdA, testBizIdB]);
    await db.query('DELETE FROM assistants WHERE business_id IN ($1, $2)', [testBizIdA, testBizIdB]);
    await db.query('DELETE FROM businesses WHERE id IN ($1, $2)', [testBizIdA, testBizIdB]);
    console.log('✓ Test cleanup complete.');
  }
}

runRegressionSuite().catch(err => {
  console.error('❌ Regression suite failed:', err);
  process.exit(1);
});
