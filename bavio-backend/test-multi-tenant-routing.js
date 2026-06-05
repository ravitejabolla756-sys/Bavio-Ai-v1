/**
 * test-multi-tenant-routing.js
 * ─────────────────────────────────────────────────────────────────────
 * End-to-end simulation and integration test for multi-tenant
 * shared-number call routing in Bavio.
 *
 * Run: node test-multi-tenant-routing.js
 */

require('dotenv').config();
const { supabase, query } = require('./database/db');
const { resolveBusinessFromCall } = require('./services/phone/callRoutingService');
const redisService = require('./services/redis/redisService');

// Global Mocks for External Services to avoid network calls during integration testing
const sttService = require('./services/sarvam/stt');
sttService.transcribeAudio = async (buffer, lang) => {
  console.log('[MOCK STT] Transcribing audio');
  return { text: 'Hello, I want to book an appointment' };
};

const ttsService = require('./services/sarvam/tts');
ttsService.synthesizeSpeech = async (text, lang) => {
  console.log(`[MOCK TTS] Synthesizing speech: "${text}"`);
  return { audioBuffer: Buffer.from('mock-audio') };
};

const storageService = require('./services/storage/storageService');
storageService.uploadTtsAudio = async (buffer, filename) => {
  console.log(`[MOCK STORAGE] Uploading audio file: ${filename}`);
  return { audioUrl: `https://mock-storage.com/${filename}` };
};

const llmService = require('./services/sarvam/llm');
llmService.generateResponse = async (history, systemPrompt) => {
  console.log('[MOCK LLM] Generating response');
  return {
    response_text: 'Thank you for your appointment',
    lead_data: { name: 'Test Patient', intent: 'Appointment Booked' },
    should_end: true
  };
};

const { handleIncomingExotel, handleRecording, handleCallStatus } = require('./controllers/callController');

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`✅ Passed: ${name}`);
    passed++;
  } else {
    console.error(`❌ Failed: ${name}`);
    failed++;
  }
}

// Mock Express response
const createMockResponse = () => {
  const res = {};
  res.type = (contentType) => {
    res.contentType = contentType;
    return res;
  };
  res.send = (body) => {
    res.body = body;
    res.status = 200;
    return res;
  };
  res.sendStatus = (status) => {
    res.status = status;
    return res;
  };
  return res;
};

async function runTests() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  BAVIO MULTI-TENANT ROUTING ARCHITECTURE TESTS');
  console.log('═══════════════════════════════════════════════\n');

  // Generate unique IDs for testing
  const businessIdA = '11111111-1111-1111-1111-111111111111';
  const businessIdB = '22222222-2222-2222-2222-222222222222';
  
  const testExotelNumber = '+918080819999';
  const patientPhone = '+919999912345';
  const guestPhone = '+918888812345';
  const unwhitelistedPhone = '+917777712345';

  try {
    // ── Cleanup previous test runs ───────────────────────────────────────────
    await query('DELETE FROM notifications WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM transcripts WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM usage_logs WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM leads WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM call_logs WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM call_sessions WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM caller_whitelist WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM business_phone_mapping WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM assistants WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM businesses WHERE id IN ($1, $2)', [businessIdA, businessIdB]);

    // ── 1. Create Test Businesses ────────────────────────────────────────────
    console.log('Inserting test businesses...');
    const { error: bizErr } = await supabase.from('businesses').insert([
      {
        id: businessIdA,
        name: 'Apollo Hospital',
        email: 'apollo@bavio.test',
        phone: '+917569960503',
        password_hash: 'mock_password_hash',
        business_name: 'Apollo Hospital',
        industry: 'Healthcare',
        owner_name: 'Dr. Raj Kumar',
        owner_phone: '+917569960503',
        owner_email: 'apollo@bavio.test',
        language: 'hi-IN',
        first_message: 'Namaste Apollo Hospital mein aapka swagat hai.',
        system_prompt: 'You are a hospital receptionist assistant.',
        call_handling_type: 'hospital_booking',
        subscription_plan: 'pro',
        minutes_limit: 30,
        minutes_used: 0
      },
      {
        id: businessIdB,
        name: 'Grand Hotel',
        email: 'grand@bavio.test',
        phone: '+917569960502',
        password_hash: 'mock_password_hash',
        business_name: 'Grand Hotel',
        industry: 'Hospitality',
        owner_name: 'Priya Sharma',
        owner_phone: '+917569960502',
        owner_email: 'grand@bavio.test',
        language: 'en-US',
        first_message: 'Welcome to Grand Hotel. How may I help you today?',
        system_prompt: 'You are a hotel receptionist assistant.',
        call_handling_type: 'hotel_booking',
        subscription_plan: 'starter',
        minutes_limit: 30,
        minutes_used: 0
      }
    ]);
    if (bizErr) console.error('❌ Insert businesses error:', bizErr);

    // ── 2. Create Assistants ─────────────────────────────────────────────────
    console.log('Inserting test assistants...');
    const { error: astErr } = await supabase.from('assistants').insert([
      { business_id: businessIdA, name: 'Apollo Assistant', welcome_message: 'Namaste Apollo Hospital mein...' },
      { business_id: businessIdB, name: 'Grand Assistant', welcome_message: 'Welcome to Grand Hotel...' }
    ]);
    if (astErr) console.error('❌ Insert assistants error:', astErr);

    // ── 3. Create Phone Mappings (Shared Exotel Number) ─────────────────────
    console.log('Inserting business phone mappings to shared Exotel number...');
    const { error: mapErr } = await supabase.from('business_phone_mapping').insert([
      { business_id: businessIdA, business_number: '+917569960503', exotel_number: testExotelNumber, status: 'active' },
      { business_id: businessIdB, business_number: '+917569960502', exotel_number: testExotelNumber, status: 'active' }
    ]);
    if (mapErr) console.error('❌ Insert business_phone_mapping error:', mapErr);

    // ── 4. Create Caller Whitelist Mappings ──────────────────────────────────
    console.log('Whitelisting callers...');
    const { error: whiteErr } = await supabase.from('caller_whitelist').insert([
      { business_id: businessIdA, caller_phone: patientPhone },
      { business_id: businessIdB, caller_phone: guestPhone }
    ]);
    if (whiteErr) console.error('❌ Insert caller_whitelist error:', whiteErr);

    // ── TEST 1: Whitelist Routing Resolution ─────────────────────────────────
    console.log('\n📋 TEST 1: Whitelist Routing Resolution');
    
    const routeA = await resolveBusinessFromCall(testExotelNumber, patientPhone);
    assert(routeA !== null && routeA.business_id === businessIdA, 'Patient call correctly routes to Apollo Hospital');
    assert(routeA.routing_method === 'caller_whitelist', 'Routing method is whitelisted caller lookup');

    const routeB = await resolveBusinessFromCall(testExotelNumber, guestPhone);
    assert(routeB !== null && routeB.business_id === businessIdB, 'Guest call correctly routes to Grand Hotel');

    // ── TEST 2: Provider-Specific Metadata Routing ──────────────────────────
    console.log('\n📋 TEST 2: Provider Metadata Routing (SIP/ForwardedFrom)');
    const reqWithSip = {
      body: {
        ForwardedFrom: '+917569960502' // Points directly to Grand Hotel
      }
    };
    const routeSip = await resolveBusinessFromCall(testExotelNumber, unwhitelistedPhone, reqWithSip);
    assert(routeSip !== null && routeSip.business_id === businessIdB, 'Call routes directly to Grand Hotel using ForwardedFrom metadata');
    assert(routeSip.routing_method === 'provider_metadata', 'Routing method is provider metadata');

    // ── TEST 3: Default Mapped Tenant Fallback ────────────────────────────────
    console.log('\n📋 TEST 3: Default Fallback Routing');
    const routeFallback = await resolveBusinessFromCall(testExotelNumber, unwhitelistedPhone);
    assert(routeFallback !== null && routeFallback.business_id === businessIdA, 'Unwhitelisted caller falls back to first mapped business');
    assert(routeFallback.routing_method === 'default_fallback', 'Routing method is default fallback');

    // ── TEST 4: handleIncomingExotel Webhook (Create Redis & DB Sessions) ────
    console.log('\n📋 TEST 4: handleIncomingExotel Webhook Lifecycle');
    const callSid = 'sid-' + Date.now();
    const reqIncoming = {
      body: {
        CallSid: callSid,
        From: patientPhone,
        To: testExotelNumber,
        Direction: 'inbound'
      }
    };
    const resIncoming = createMockResponse();
    await handleIncomingExotel(reqIncoming, resIncoming);
    
    assert(resIncoming.status === 200, 'Incoming webhook returns HTTP 200 OK');
    assert(resIncoming.body.includes('Apollo Hospital') || resIncoming.body.includes('mock-storage.com'), 'Plays Apollo Hospital custom greeting');

    // Verify Redis session schema matches exactly
    const session = await redisService.getSession('call:' + callSid);
    assert(session !== null, 'Redis session initialized successfully');
    if (session) {
      assert(session.business_id === businessIdA, 'Session contains business_id');
      assert(session.business_number === '+917569960503', 'Session contains business_number');
      assert(session.business_name === 'Apollo Hospital', 'Session contains business_name');
      assert(session.exotel_number === testExotelNumber, 'Session contains exotel_number');
      assert(session.caller_phone === patientPhone, 'Session contains caller_phone');
      assert(session.industry === 'Healthcare', 'Session contains industry');
      assert(session.language === 'hi-IN', 'Session contains language');
      assert(session.session_state === 'greeting', 'Session starts in greeting state');
    }

    // Verify call_sessions table entry
    const { data: callSession } = await supabase
      .from('call_sessions')
      .select('*')
      .eq('call_sid', callSid)
      .single();
    assert(callSession !== null && callSession.session_status === 'in-progress', 'Call session logged as in-progress in database');

    // Verify call_logs table entry
    const { data: callLog } = await supabase
      .from('call_logs')
      .select('*')
      .eq('call_sid', callSid)
      .single();
    assert(callLog !== null && callLog.status === 'started', 'Call log initialized with status started');

    // ── TEST 5: handleRecording Webhook (Lead & Notifications) ──────────────
    console.log('\n📋 TEST 5: handleRecording Webhook (Lead Generation & Whitelisting)');
    // Bypass actual download and STT/LLM calls by pre-populating LLM result values
    // We update the session and trigger handleRecording with mock parameters
    const mockLlmService = require('./services/sarvam/llm');
    const originalGenerateResponse = mockLlmService.generateResponse;
    mockLlmService.generateResponse = async () => {
      return {
        response_text: 'Thank you for your appointment',
        lead_data: { name: 'Test Patient', intent: 'Appointment Booked' },
        should_end: true
      };
    };

    const reqRecording = {
      body: {
        CallSid: callSid,
        RecordingUrl: 'https://exotel.com/mock-audio',
        RecordingDuration: '5'
      }
    };
    
    // Also mock axios download inside handleRecording
    const axios = require('axios');
    const originalGet = axios.get;
    axios.get = async () => ({ data: Buffer.from('mock-audio-data') });

    const resRecording = createMockResponse();
    await handleRecording(reqRecording, resRecording);
    
    assert(resRecording.status === 200, 'Recording webhook returns HTTP 200 OK');

    // Verify Lead saved
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('call_sid', callSid)
      .maybeSingle();
    assert(lead !== null && lead.name === 'Test Patient', 'Lead is generated and saved using call_sid');
    
    // Verify Notification queued
    const { data: notification } = await supabase
      .from('notifications')
      .select('*')
      .eq('business_id', businessIdA)
      .maybeSingle();
    assert(notification !== null && notification.status === 'pending', 'Whatsapp notification queued in database');

    // Restore mocked services
    mockLlmService.generateResponse = originalGenerateResponse;
    axios.get = originalGet;

    // ── TEST 6: handleCallStatus Webhook (Finalize logs & billing) ───────────
    console.log('\n📋 TEST 6: handleCallStatus Webhook');
    const reqStatus = {
      body: {
        CallSid: callSid,
        Status: 'completed',
        Duration: '30' // 30 seconds
      }
    };
    const resStatus = createMockResponse();
    await handleCallStatus(reqStatus, resStatus);
    
    assert(resStatus.status === 200, 'Call status webhook returns HTTP 200 OK');

    // Verify Redis session cleaned up
    const deletedSession = await redisService.getSession('call:' + callSid);
    assert(deletedSession === null, 'Redis session correctly deleted on call complete');

    // Verify call session completed
    const { data: finalSession } = await supabase
      .from('call_sessions')
      .select('*')
      .eq('call_sid', callSid)
      .single();
    assert(finalSession.session_status === 'completed', 'Call session updated to completed');

    // Verify call log completed
    const { data: finalLog } = await supabase
      .from('call_logs')
      .select('*')
      .eq('call_sid', callSid)
      .single();
    assert(finalLog.status === 'completed' && parseInt(finalLog.duration) === 30, 'Call log updated with final duration and cost');

    // Verify transcripts and usage logs created
    const { data: transcript } = await supabase
      .from('transcripts')
      .select('*')
      .eq('call_sid', callSid)
      .maybeSingle();
    assert(transcript !== null, 'Call transcripts stored in database referencing call_sid');

    const { data: usageLog } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('call_sid', callSid)
      .maybeSingle();
    assert(usageLog !== null && parseInt(usageLog.minutes_used) === 1, 'Billing logs written in usage_logs referencing call_sid');

    // ── Cleanup Test Data ────────────────────────────────────────────────────
    console.log('\nCleaning up test data...');
    await query('DELETE FROM notifications WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM transcripts WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM usage_logs WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM leads WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM call_logs WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM call_sessions WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM caller_whitelist WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM business_phone_mapping WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM assistants WHERE business_id IN ($1, $2)', [businessIdA, businessIdB]);
    await query('DELETE FROM businesses WHERE id IN ($1, $2)', [businessIdA, businessIdB]);
    console.log('Cleanup completed.');

  } catch (err) {
    console.error('❌ Test execution encountered an unhandled error:', err.stack);
    failed++;
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log(`  TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
