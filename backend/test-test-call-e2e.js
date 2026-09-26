'use strict';

require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('./database/db');
const testCallController = require('./controllers/testCallController');

const JWT_SECRET = process.env.JWT_SECRET || '7e0341f2ee874653ce795be1851359683e92e769db290b69965697ae80da0a5e5745972bd30e6b51088fbc878ea141f97acec678ca57855eb024064f44f4d220';

// Mock Express req/res
function mockReq(user, params = {}, body = {}, headers = {}) {
  return {
    user,
    params,
    body,
    headers: { host: 'localhost:4000', ...headers },
    protocol: 'http',
    secure: false,
  };
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      return this;
    },
  };
  return res;
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('BAVIO STEP 6 "TEST YOUR AI RECEPTIONIST" TEST SUITE');
  console.log('==================================================\n');

  // Test identifiers
  const testBizIdA = '11111111-2222-3333-4444-555555555551';
  const testBizIdB = '11111111-2222-3333-4444-555555555552';
  const testAstIdA = '22222222-3333-4444-5555-666666666661';
  const testAstIdIncomplete = '22222222-3333-4444-5555-666666666662';
  const testAstIdB = '22222222-3333-4444-5555-666666666663';
  const testPhoneIdA = '33333333-4444-5555-6666-777777777771';

  try {
    // Cleanup prior test artifacts
    await db.query("DELETE FROM calls WHERE user_id IN ($1, $2) OR business_id IN ($1, $2)", [testBizIdA, testBizIdB]);
    await db.query("DELETE FROM phone_numbers WHERE id = $1", [testPhoneIdA]);
    await db.query("DELETE FROM assistants WHERE id IN ($1, $2, $3)", [testAstIdA, testAstIdIncomplete, testAstIdB]);
    await db.query("DELETE FROM businesses WHERE id IN ($1, $2)", [testBizIdA, testBizIdB]);

    // Setup Test Business A & B
    await db.query(
      `INSERT INTO businesses (id, name, email, phone, password_hash, subscription_status, status)
       VALUES ($1, 'Test Clinic A', 'testa@bavio.local', '+15551234567', 'hash123', 'active', 'active'),
              ($2, 'Test Salon B', 'testb@bavio.local', '+15559876543', 'hash123', 'active', 'active')`,
      [testBizIdA, testBizIdB]
    );

    // Setup Complete Assistant for Business A
    await db.query(
      `INSERT INTO assistants (id, business_id, name, system_prompt, language, voice_id, is_active)
       VALUES ($1, $2, 'Maya Receptionist', 'You are Maya, receptionist at Test Clinic.', 'en-US', 'alloy', true)`,
      [testAstIdA, testBizIdA]
    );

    // Setup Incomplete Assistant for Business A (Missing voice and language)
    await db.query(
      `INSERT INTO assistants (id, business_id, name, system_prompt, voice_id, voice, language, is_active)
       VALUES ($1, $2, 'Incomplete Bot', 'Some prompt', null, null, null, true)`,
      [testAstIdIncomplete, testBizIdA]
    );

    // Setup Assistant for Business B
    await db.query(
      `INSERT INTO assistants (id, business_id, name, system_prompt, language, voice_id, is_active)
       VALUES ($1, $2, 'Salon Bot B', 'You are salon bot.', 'en-US', 'shimmer', true)`,
      [testAstIdB, testBizIdB]
    );

    // Setup Assigned Phone Number for Assistant A
    await db.query(
      `INSERT INTO phone_numbers (id, business_id, client_id, assistant_id, number, phone_number, provider, status)
       VALUES ($1, $2, $2, $3, '+15551234567', '+15551234567', 'twilio', 'active')`,
      [testPhoneIdA, testBizIdA, testAstIdA]
    );

    console.log('--- Test Group 1: Phone Normalization & Validation ---');
    {
      const r1 = testCallController.normalizeToE164('+919876543210');
      assert(r1.valid && r1.normalized === '+919876543210', 'E.164 with +91 normalizes properly');

      const r2 = testCallController.normalizeToE164('+15559876543');
      assert(r2.valid && r2.normalized === '+15559876543', 'E.164 with +1 normalizes properly');

      const r3 = testCallController.normalizeToE164('9876543210');
      assert(r3.valid && r3.normalized === '+919876543210', '10-digit national number defaults to +91');

      const r4 = testCallController.normalizeToE164('123');
      assert(!r4.valid, 'Invalid short number is rejected');

      const r5 = testCallController.normalizeToE164('');
      assert(!r5.valid, 'Empty phone number is rejected');

      const masked = testCallController.maskPhoneNumber('+919876543210');
      assert(masked.startsWith('+91') && masked.endsWith('3210') && masked.includes('•'), `Masking preserves privacy: ${masked}`);
    }

    console.log('\n--- Test Group 2: Authorization & Workspace Isolation ---');
    {
      // 1. Unauthenticated
      const reqNoAuth = mockReq(null, { id: testAstIdA }, { phoneNumber: '+919876543210' });
      const resNoAuth = mockRes();
      await testCallController.initiateTestCall(reqNoAuth, resNoAuth);
      assert(resNoAuth.statusCode === 401, 'Unauthenticated request returns 401 Unauthorized');

      // 2. Cross-tenant access (User B trying to test Assistant A)
      const reqCross = mockReq({ id: testBizIdB }, { id: testAstIdA }, { phoneNumber: '+919876543210' });
      const resCross = mockRes();
      await testCallController.initiateTestCall(reqCross, resCross);
      assert(resCross.statusCode === 404, 'Cross-workspace agent access returns 404 Not Found');

      // 3. Status check authorization
      const reqStatusCross = mockReq({ id: testBizIdB }, { id: testAstIdA, callSid: 'CA_nonexistent' });
      const resStatusCross = mockRes();
      await testCallController.getTestCallStatus(reqStatusCross, resStatusCross);
      assert(resStatusCross.statusCode === 404, 'Cross-workspace call status lookup returns 404');
    }

    console.log('\n--- Test Group 3: Agent Readiness Validation ---');
    {
      // Missing voice and language
      const reqIncomplete = mockReq({ id: testBizIdA }, { id: testAstIdIncomplete }, { phoneNumber: '+919876543210' });
      const resIncomplete = mockRes();
      await testCallController.initiateTestCall(reqIncomplete, resIncomplete);
      assert(resIncomplete.statusCode === 400 && resIncomplete.body.error === 'missing_voice', 'Incomplete assistant returns missing_voice error');

      // Unassigned phone number
      const reqNoPhone = mockReq({ id: testBizIdB }, { id: testAstIdB }, { phoneNumber: '+919876543210' });
      const resNoPhone = mockRes();
      await testCallController.initiateTestCall(reqNoPhone, resNoPhone);
      assert(resNoPhone.statusCode === 400 && resNoPhone.body.error === 'phone_unassigned', 'Assistant with no phone assignment returns phone_unassigned error');
    }

    console.log('\n--- Test Group 4: Provider Availability & Safe Failure Handling ---');
    {
      const reqValid = mockReq({ id: testBizIdA }, { id: testAstIdA }, { phoneNumber: '+919876543210' });
      const resValid = mockRes();
      await testCallController.initiateTestCall(reqValid, resValid);

      // When the telephony provider is suspended or authentication fails (Twilio code 20003),
      // it MUST return a structured 503 provider_unavailable response and NOT crash or expose raw credentials.
      assert(
        resValid.statusCode === 503 || resValid.statusCode === 200,
        `Provider returns structured status code: ${resValid.statusCode}`
      );

      if (resValid.statusCode === 503) {
        assert(resValid.body.error === 'provider_unavailable', 'Provider suspension returns provider_unavailable error code');
        assert(typeof resValid.body.message === 'string' && resValid.body.message.includes('unavailable'), 'Customer-friendly message returned');
        assert(!JSON.stringify(resValid.body).includes('AC0dbc998f65f789136acbc25184ebd008'), 'Twilio credentials not leaked in response');
        assert(!JSON.stringify(resValid.body).includes('8d4c3e69033f0b1f135eaa5468511d2b'), 'Twilio auth token not leaked in response');
      }
    }

    console.log('\n--- Test Group 5: Backend Idempotency & Active Call Prevention ---');
    {
      // Insert a mock active call
      const activeCallSid = 'CA_test_active_12345';
      await db.query(
        `INSERT INTO calls (user_id, business_id, assistant_id, country_code, call_sid, provider, from_number, virtual_number, caller_number, status, call_status, started_at, is_test)
         VALUES ($1, $1, $2, 'US', $3, 'twilio', '+15551234567', '+15551234567', '+919876543210', 'in-progress', 'in_progress', NOW(), true)`,
        [testBizIdA, testAstIdA, activeCallSid]
      );

      const reqDup = mockReq({ id: testBizIdA }, { id: testAstIdA }, { phoneNumber: '+919876543210' });
      const resDup = mockRes();
      await testCallController.initiateTestCall(reqDup, resDup);

      assert(resDup.statusCode === 200 && resDup.body.duplicate === true, 'Duplicate call attempt detected and blocked (idempotent)');
      assert(resDup.body.callSid === activeCallSid, 'Returns existing active call identifier');

      // Clean up mock active call
      await db.query("DELETE FROM calls WHERE call_sid = $1", [activeCallSid]);
    }

    console.log('\n--- Test Group 6: Call Status, Transcript & Summary Retrieval ---');
    {
      // Insert a completed call with transcript and summary
      const completedCallSid = 'CA_test_completed_67890';
      const insertCall = await db.query(
        `INSERT INTO calls (user_id, business_id, assistant_id, country_code, call_sid, provider, from_number, virtual_number, caller_number, status, call_status, duration_seconds, started_at, ended_at, is_test)
         VALUES ($1, $1, $2, 'US', $3, 'twilio', '+15551234567', '+15551234567', '+919876543210', 'completed', 'completed', 74, NOW() - INTERVAL '2 minutes', NOW(), true)
         RETURNING id`,
        [testBizIdA, testAstIdA, completedCallSid]
      );
      const callDbId = insertCall.rows[0].id;

      const mockTranscript = [
        { role: 'assistant', content: 'Hello! Thank you for calling Test Clinic. How can I help you today?' },
        { role: 'user', content: 'Hi, I would like to check if Dr. Smith is available tomorrow at 10 AM.' },
        { role: 'assistant', content: 'Yes, Dr. Smith has an opening tomorrow at 10:00 AM. Would you like me to book it?' }
      ];

      await db.query(
        `INSERT INTO transcripts (call_id, business_id, transcript, summary, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [callDbId, testBizIdA, JSON.stringify(mockTranscript), 'Caller inquired about Dr. Smith appointment availability for tomorrow at 10 AM. Agent confirmed slot.']
      );

      const reqStatus = mockReq({ id: testBizIdA }, { id: testAstIdA, callSid: completedCallSid });
      const resStatus = mockRes();
      await testCallController.getTestCallStatus(reqStatus, resStatus);

      assert(resStatus.statusCode === 200, 'Status endpoint returns 200 OK');
      assert(resStatus.body.status === 'completed', 'Status returns completed');
      assert(resStatus.body.durationSeconds === 74, 'Duration matches real call seconds');
      assert(Array.isArray(resStatus.body.transcript) && resStatus.body.transcript.length === 3, 'Transcript successfully retrieved');
      assert(resStatus.body.summary.includes('Dr. Smith'), 'AI test summary successfully retrieved');
      assert(resStatus.body.agentName === 'Maya Receptionist', 'Agent name included in status response');

      // Clean up
      await db.query("DELETE FROM transcripts WHERE call_id = $1", [callDbId]);
      await db.query("DELETE FROM calls WHERE call_sid = $1", [completedCallSid]);
    }

    console.log('\n--- Test Group 7: Hangup Endpoint ---');
    {
      const mockCallSidToHangup = 'CA_test_hangup_99999';
      await db.query(
        `INSERT INTO calls (user_id, business_id, assistant_id, country_code, call_sid, provider, from_number, virtual_number, caller_number, status, call_status, started_at, is_test)
         VALUES ($1, $1, $2, 'US', $3, 'twilio', '+15551234567', '+15551234567', '+919876543210', 'in-progress', 'in_progress', NOW(), true)`,
        [testBizIdA, testAstIdA, mockCallSidToHangup]
      );

      const reqHangup = mockReq({ id: testBizIdA }, { id: testAstIdA, callSid: mockCallSidToHangup });
      const resHangup = mockRes();
      await testCallController.hangupTestCall(reqHangup, resHangup);

      assert(resHangup.statusCode === 200 && resHangup.body.success === true, 'Hangup endpoint terminates active call cleanly');

      const verifyCall = await db.query("SELECT status FROM calls WHERE call_sid = $1", [mockCallSidToHangup]);
      assert(verifyCall.rows[0]?.status === 'completed', 'Call status updated to completed in DB');

      // Clean up
      await db.query("DELETE FROM calls WHERE call_sid = $1", [mockCallSidToHangup]);
    }

  } finally {
    // Final cleanup of test fixtures
    await db.query("DELETE FROM calls WHERE user_id IN ($1, $2) OR business_id IN ($1, $2)", [testBizIdA, testBizIdB]);
    await db.query("DELETE FROM phone_numbers WHERE id = $1", [testPhoneIdA]);
    await db.query("DELETE FROM assistants WHERE id IN ($1, $2, $3)", [testAstIdA, testAstIdIncomplete, testAstIdB]);
    await db.query("DELETE FROM businesses WHERE id IN ($1, $2)", [testBizIdA, testBizIdB]);
  }

  console.log('\n==================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
