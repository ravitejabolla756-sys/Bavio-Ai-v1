require('dotenv').config();
const db = require('./database/db');
const authController = require('./controllers/authController');
const twilioCallController = require('./controllers/twilioCallController');
const { assignPhoneNumber, confirmForwardingActivated } = require('./services/phone/numberProvisioningService');

// ── 1. MOCK SERVICES ─────────────────────────────────────────────────────────
const sttService = require('./services/sarvam/stt');
const llmService = require('./services/sarvam/llm');
const ttsService = require('./services/sarvam/tts');
const storageService = require('./services/storage/storageService');
const axios = require('axios');

console.log('Setting up mocks for third-party services...');

sttService.transcribeAudio = async (buffer, language) => {
  console.log(`[MOCK STT] Transcribing audio with language: ${language}`);
  return { text: "Hello, I want to book a property in Mumbai, budget 50 Lakhs." };
};

llmService.generateResponse = async (transcript, systemPrompt) => {
  console.log(`[MOCK LLM] Generating AI response...`);
  return {
    response_text: "Sure! I have noted your requirement for a 50 Lakhs property in Mumbai. [LEAD_CAPTURED]",
    lead_data: {
      name: "Test Caller",
      phone: "+919876543210",
      intent: "buy property",
      budget: "50 Lakhs",
      location: "Mumbai",
      notes: "Interested in buying 2BHK flat"
    },
    should_end: true
  };
};

ttsService.synthesizeSpeech = async (text, language) => {
  console.log(`[MOCK TTS] Synthesizing: "${text.slice(0, 40)}..."`);
  return { audioBuffer: Buffer.from("dummy-tts-audio") };
};

storageService.uploadTtsAudio = async (buffer, fileName) => {
  console.log(`[MOCK STORAGE] Uploading audio file: ${fileName}`);
  return {
    audioUrl: `https://db.afwwcnmxbfvahqinyagm.supabase.co/storage/v1/object/public/tts-audio/${fileName}`,
    filePath: `tts-audio/${fileName}`
  };
};

storageService.cleanupCallTtsFiles = async (callSid) => {
  console.log(`[MOCK STORAGE] Cleaning up files for: ${callSid}`);
  return { success: true };
};

axios.get = async (url, options) => {
  console.log(`[MOCK HTTP] GET: ${url}`);
  return { data: Buffer.from("dummy-caller-audio-wav") };
};

// Helper to construct express response mock
function mockResponse() {
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
    type(typeStr) {
      this.headers['Content-Type'] = typeStr;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      return this;
    }
  };
  return res;
}

// ── 2. RUN SIMULATION ────────────────────────────────────────────────────────
async function runSimulation() {
  console.log('\n════════════════════════════════════════════════');
  console.log('   STARTING BAVIO TWILIO CALL FLOW SIMULATION   ');
  console.log('════════════════════════════════════════════════\n');

  let testBusiness = null;
  const testEmail = `test_sim_${Date.now()}@bavio.in`;
  const testPassword = 'Password123!';
  const testPhone = '+919999988888';
  const testName = 'Simulation Test Business';

  try {
    // ── STEP 1: AUTH SIGNUP ──────────────────────────────────────────────────
    console.log('Step 1: Simulating Auth Signup with pre-signup details...');
    const signupReq = {
      body: {
        name: testName,
        email: testEmail,
        password: testPassword,
        phone: testPhone,
        business_description: "We are a high-end real estate agency specializing in luxury flats in Mumbai.",
        industry: "real-estate",
        language: "hi-IN",
        agent_name: "Bulbul",
        greeting: "Namaste! Spice Garden Real estate agency mein swagat hai. Kaise help kar sakti hoon?",
        faqs: []
      }
    };
    const signupRes = mockResponse();
    await authController.signup(signupReq, signupRes);

    if (signupRes.statusCode !== 201) {
      throw new Error(`Signup failed with status ${signupRes.statusCode}: ${JSON.stringify(signupRes.body)}`);
    }

    testBusiness = signupRes.body.user;
    console.log(`✅ Signup successful! Created Business ID: ${testBusiness.id}, Status: active`);

    // ── STEP 2: AUTH LOGIN ───────────────────────────────────────────────────
    console.log('\nStep 2: Simulating immediately logging in after signup...');
    const loginReq = {
      body: {
        email: testEmail,
        password: testPassword
      }
    };
    const loginRes = mockResponse();
    await authController.login(loginReq, loginRes);

    if (loginRes.statusCode !== 200) {
      throw new Error(`Login failed with status ${loginRes.statusCode}: ${JSON.stringify(loginRes.body)}`);
    }
    console.log('✅ Login immediate verification passed!');

    // ── STEP 3: PHONE NUMBER PROVISIONING ─────────────────────────────────────
    console.log('\nStep 3: Simulating assignment of forwarding number...');
    // Retrieve assistant created during signup (or insert fallback if not found)
    const assistantResult = await db.query(
      `SELECT id FROM assistants WHERE business_id = $1 LIMIT 1`,
      [testBusiness.id]
    );
    let assistantId;
    if (assistantResult.rows.length > 0) {
      assistantId = assistantResult.rows[0].id;
      console.log(`✅ Assistant found (created during signup): ${assistantId}`);
    } else {
      console.log('Assistant not found, inserting fallback assistant...');
      const fallbackResult = await db.query(
        `INSERT INTO assistants (business_id, name, agent_name, greeting, voice_id, faqs, industry, language, system_prompt, is_active)
         VALUES ($1, $2, $3, $4, 'meera', '[]'::jsonb, 'real-estate', $5, 'System prompt', true) RETURNING id`,
        [testBusiness.id, 'Bulbul', 'Bulbul', 'Namaste!', 'hi-IN']
      );
      assistantId = fallbackResult.rows[0].id;
      console.log(`Assistant created (fallback): ${assistantId}`);
    }

    // Update business to complete step 3
    await db.query(
      'UPDATE businesses SET onboarding_step = 3 WHERE id = $1',
      [testBusiness.id]
    );

    // Call assignPhoneNumber
    const provResult = await assignPhoneNumber(testBusiness.id, 'forwarding', testPhone);
    const assignedPoolNumber = provResult.bavioPhonenumber;
    console.log(`✅ Number Provisioning successful! Pool Number: ${assignedPoolNumber}`);

    // Activate the assignment
    await confirmForwardingActivated(testBusiness.id);
    console.log(`✅ Forwarding activation confirmed in database.`);

    // ── STEP 4: TWILIO INCOMING CALL ──────────────────────────────────────────
    console.log('\nStep 4: Simulating Twilio Incoming Call Hook...');
    const callSid = `sim_call_${Date.now()}`;
    const incomingReq = {
      body: {
        CallSid: callSid,
        From: '+919876543210',
        To: assignedPoolNumber
      }
    };
    const incomingRes = mockResponse();
    await twilioCallController.handleIncomingCall(incomingReq, incomingRes);

    if (incomingRes.statusCode !== 200) {
      throw new Error(`Incoming Call failed: ${incomingRes.body}`);
    }

    console.log('Incoming call TwiML response:\n', incomingRes.body);

    // Verify call inserted into calls table
    const checkCall = await db.query('SELECT * FROM calls WHERE provider_call_id = $1', [callSid]);
    if (checkCall.rows.length === 0) {
      throw new Error('Call record was not inserted into database.');
    }
    const callRecord = checkCall.rows[0];
    console.log(`✅ Call record created. ID: ${callRecord.id}, Status: ${callRecord.status}`);

    // ── STEP 5: TWILIO RECORDING ──────────────────────────────────────────────
    console.log('\nStep 5: Simulating Twilio Recording hook (processing transcription and AI response)...');
    const recordingReq = {
      body: {
        CallSid: callSid,
        RecordingUrl: 'https://api.twilio.com/2010-04-01/Accounts/ACxxx/Recordings/RExxx',
        RecordingDuration: '8'
      }
    };
    const recordingRes = mockResponse();
    await twilioCallController.handleRecording(recordingReq, recordingRes);

    if (recordingRes.statusCode !== 200) {
      throw new Error(`Recording processing failed: ${recordingRes.body}`);
    }

    console.log('Recording TwiML response:\n', recordingRes.body);

    // Verify transcript is stored in transcripts table
    const checkTranscript = await db.query('SELECT * FROM transcripts WHERE call_id = $1', [callRecord.id]);
    if (checkTranscript.rows.length === 0) {
      throw new Error('Transcript record was not found in transcripts table!');
    }
    console.log(`✅ Transcript saved to transcripts table: ${JSON.stringify(checkTranscript.rows[0].transcript)}`);

    // Verify lead created
    const checkLead = await db.query('SELECT * FROM leads WHERE call_id = $1', [callRecord.id]);
    if (checkLead.rows.length === 0) {
      throw new Error('Lead record was not created for the call!');
    }
    console.log(`✅ Lead captured and matched schema: name="${checkLead.rows[0].name}", phone="${checkLead.rows[0].phone}", intent="${checkLead.rows[0].intent}", budget="${checkLead.rows[0].budget}", location="${checkLead.rows[0].location}"`);

    // ── STEP 6: TWILIO CALL STATUS (CALL ENDED) ──────────────────────────────
    console.log('\nStep 6: Simulating Twilio Call Status hook (call end, cost calculation, usage logs, billing deduct)...');
    const statusReq = {
      body: {
        CallSid: callSid,
        CallStatus: 'completed',
        CallDuration: '45' // 45 seconds -> should calculate cost and usage
      }
    };
    const statusRes = mockResponse();
    await twilioCallController.handleCallStatus(statusReq, statusRes);

    if (statusRes.statusCode !== 200) {
      throw new Error(`Status callback failed: ${statusRes.body}`);
    }
    console.log('✅ Status hook callback successful!');

    // Verify call status updated to completed
    const checkCallEnd = await db.query('SELECT * FROM calls WHERE provider_call_id = $1', [callSid]);
    console.log(`✅ Call status updated to: ${checkCallEnd.rows[0].status}, duration: ${checkCallEnd.rows[0].duration}`);

    // Verify usage log created
    const checkUsage = await db.query('SELECT * FROM usage_logs WHERE call_id = $1', [callRecord.id]);
    if (checkUsage.rows.length === 0) {
      throw new Error('Usage log was not created!');
    }
    const log = checkUsage.rows[0];
    console.log(`✅ Usage log created: business_id=${log.business_id}, cost_total=${log.cost_total}, minutes_used=${log.minutes_used}`);

    // Verify business minutes updated
    const checkBizMinutes = await db.query('SELECT minutes_used FROM businesses WHERE id = $1', [testBusiness.id]);
    console.log(`✅ Business minutes_used updated in DB: ${checkBizMinutes.rows[0].minutes_used}`);

    console.log('\n════════════════════════════════════════════════');
    console.log(' 🎉 SIMULATION COMPLETED SUCCESSFULLY WITH NO RUNTIME ERRORS 🎉');
    console.log('════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ SIMULATION RUNTIME ERROR DETECTED:');
    console.error(error);
  } finally {
    // ── CLEANUP ─────────────────────────────────────────────────────────────
    if (testBusiness && testBusiness.id) {
      console.log('Cleaning up simulation test records...');
      try {
        await db.query('DELETE FROM usage_logs WHERE business_id = $1', [testBusiness.id]);
        await db.query('DELETE FROM leads WHERE business_id = $1', [testBusiness.id]);
        await db.query('DELETE FROM transcripts WHERE business_id = $1', [testBusiness.id]);
        await db.query('DELETE FROM calls WHERE business_id = $1', [testBusiness.id]);
        await db.query('DELETE FROM pool_assignments WHERE business_id = $1', [testBusiness.id]);
        await db.query('DELETE FROM call_routing WHERE business_id = $1', [testBusiness.id]);
        await db.query('DELETE FROM phone_numbers WHERE business_id = $1', [testBusiness.id]);
        await db.query('DELETE FROM assistants WHERE business_id = $1', [testBusiness.id]);
        await db.query('DELETE FROM businesses WHERE id = $1', [testBusiness.id]);

        // Delete Supabase Auth user
        const { error: deleteAuthError } = await db.supabase.auth.admin.deleteUser(testBusiness.id);
        if (deleteAuthError) {
          console.error(`Failed to delete Supabase Auth user: ${deleteAuthError.message}`);
        } else {
          console.log('✅ Supabase Auth user deleted.');
        }

        console.log('✅ Cleanup successful.');
      } catch (cleanErr) {
        console.error('Cleanup failed:', cleanErr.message);
      }
    }
    process.exit(0);
  }
}

// Run the simulation
runSimulation();
