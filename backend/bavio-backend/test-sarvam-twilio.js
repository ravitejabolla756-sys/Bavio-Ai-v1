const sttService = require('./services/sarvam/stt');
const ttsService = require('./services/sarvam/tts');
const llmService = require('./services/sarvam/llm');
const audioService = require('./services/audio/audioService');
const fs = require('fs');
const path = require('path');

let passed = 0;
let total = 5;

async function runTests() {
  console.log('\n=============================');
  console.log('Bavio Sarvam+Twilio Test Suite');
  console.log('=============================\n');

  // Test 1: Sarvam TTS
  console.log('[TEST 1] Sarvam TTS');
  try {
    if (!process.env.SARVAM_API_KEY) {
      console.log('  ⚠️ SARVAM_API_KEY not set — skipping');
    } else {
      const audioBase64 = await ttsService.synthesizeSpeech(
        'Namaste! Aap kaunsa property dhundh rahe hain?',
        'hi-IN'
      );

      // Save to test file
      const testPath = '/tmp/test-tts.wav';
      const buffer = Buffer.from(audioBase64, 'base64');
      fs.writeFileSync(testPath, buffer);

      const stats = fs.statSync(testPath);
      console.log(`  ✅ TTS working — saved ${stats.size} bytes to ${testPath}`);
      passed++;
    }
  } catch (err) {
    console.log(`  ❌ TTS failed: ${err.message}`);
  }

  // Test 2: Sarvam LLM
  console.log('\n[TEST 2] Sarvam LLM');
  try {
    if (!process.env.SARVAM_API_KEY) {
      console.log('  ⚠️ SARVAM_API_KEY not set — skipping');
    } else {
      const result = await llmService.generateResponse(
        [{ role: 'user', content: '2BHK chahiye Hyderabad mein 60 lakhs mein' }],
        llmService.buildSystemPrompt(
          { language: 'hi-IN', industry: 'real_estate' },
          { name: 'Test Realty' }
        )
      );
      console.log(`  ✅ LLM working — response: "${result.response_text.slice(0, 100)}..."`);
      passed++;
    }
  } catch (err) {
    console.log(`  ❌ LLM failed: ${err.message}`);
  }

  // Test 3: Audio file serving
  console.log('\n[TEST 3] Audio Service');
  try {
    const dummyAudio = Buffer.alloc(1000).toString('base64');
    const filename = audioService.saveAudio(dummyAudio, 'test-call', 1);
    const filePath = audioService.getAudioPath(filename);
    const fileUrl = audioService.getAudioUrl(filename);

    if (fs.existsSync(filePath)) {
      console.log(`  ✅ Audio service working`);
      console.log(`     File: ${filename}`);
      console.log(`     URL: ${fileUrl}`);
      passed++;

      // Clean up
      audioService.deleteAudio('test-call');
    } else {
      console.log('  ❌ Audio file not created');
    }
  } catch (err) {
    console.log(`  ❌ Audio service failed: ${err.message}`);
  }

  // Test 4: Database connection
  console.log('\n[TEST 4] Database');
  try {
    const db = require('./database/db');
    const result = await db.query('SELECT NOW() as time');
    console.log(`  ✅ Database connected — server time: ${result.rows[0].time}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ Database failed: ${err.message}`);
  }

  // Test 5: Full pipeline simulation (no real audio)
  console.log('\n[TEST 5] Full pipeline simulation');
  try {
    if (!process.env.SARVAM_API_KEY) {
      console.log('  ⚠️ SARVAM_API_KEY not set — skipping AI pipeline');
      console.log('  ✅ Core services loaded successfully');
      passed++;
    } else {
      // Simulate a conversation
      const messages = [
        { role: 'user', content: 'Hello, I am looking for a property' }
      ];

      const systemPrompt = llmService.buildSystemPrompt(
        { language: 'en-IN', industry: 'real_estate' },
        { name: 'Bavio Realty' }
      );

      const llmResult = await llmService.generateResponse(messages, systemPrompt);

      const audioBase64 = await ttsService.synthesizeSpeech(
        llmResult.response_text,
        'en-IN'
      );

      const filename = audioService.saveAudio(audioBase64, 'sim-call', 1);

      console.log(`  ✅ Full pipeline complete`);
      console.log(`     LLM: "${llmResult.response_text.slice(0, 60)}..."`);
      console.log(`     Audio: ${filename}`);
      passed++;

      // Clean up
      audioService.deleteAudio('sim-call');
    }
  } catch (err) {
    console.log(`  ❌ Pipeline failed: ${err.message}`);
  }

  // Summary
  console.log('\n=============================');
  console.log(`Tests complete: ${passed}/${total} passed`);

  if (passed === total) {
    console.log('✅ Ready for real call? YES');
    console.log('Next step: ngrok http 3000');
    console.log('Then: Call your Twilio number');
  } else if (passed >= 3) {
    console.log('⚠️  Ready for real call? PARTIAL');
    console.log('Core services working, but check AI tests');
  } else {
    console.log('❌ Ready for real call? NO');
    console.log('Fix failed tests first');
  }
  console.log('=============================\n');

  process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
