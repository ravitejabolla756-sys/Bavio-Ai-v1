'use strict';

const assert = require('assert');
const { modelRouter, CUSTOMER_TIER_PRICING, TIER_INFRA_TARGETS, USD_TO_INR_RATE } = require('./services/modelRouter');
const db = require('./database/db');
const assistantService = require('./services/assistantService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bavio_secret';

async function runTests() {
  console.log('🧪 Starting Model Tier & Routing Layer Test Suite...\n');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  // --- UNIT TESTS: MODEL ROUTER ---
  console.log('--- SECTION 1: Model Router Abstraction Tests ---');

  test('1.1: Swift Tier Resolution (English)', () => {
    const stack = modelRouter.resolveModelStack({ tier: 'swift', language: 'en-US' });
    assert.strictEqual(stack.effectiveTier, 'swift');
    assert.strictEqual(stack.intelligence.model, 'gpt-5.4-mini');
    assert.strictEqual(stack.stt.provider, 'elevenlabs');
    assert.strictEqual(stack.tts.provider, 'elevenlabs');
    assert.strictEqual(stack.tts.model, 'flash-v2.5');
  });

  test('1.2: Swift Tier Resolution (Indic / Hindi / Telugu)', () => {
    const stackHi = modelRouter.resolveModelStack({ tier: 'swift', language: 'hi-IN' });
    assert.strictEqual(stackHi.effectiveTier, 'swift');
    assert.strictEqual(stackHi.intelligence.model, 'sarvam-30b');
    assert.strictEqual(stackHi.stt.model, 'saaras-v3');
    assert.strictEqual(stackHi.tts.model, 'bulbul-v3');

    const stackTe = modelRouter.resolveModelStack({ tier: 'swift', language: 'telugu' });
    assert.strictEqual(stackTe.intelligence.model, 'sarvam-30b');
  });

  test('1.3: Core Tier Resolution (Default & Recommended)', () => {
    const stack = modelRouter.resolveModelStack({ tier: 'core', language: 'en-US' });
    assert.strictEqual(stack.effectiveTier, 'core');
    assert.strictEqual(stack.intelligence.model, 'gpt-5.4');
    assert.strictEqual(stack.tts.model, 'multilingual-v2');

    const stackIndic = modelRouter.resolveModelStack({ tier: 'core', language: 'hi-IN' });
    assert.strictEqual(stackIndic.intelligence.model, 'sarvam-105b');
    assert.strictEqual(stackIndic.stt.model, 'saaras-v3');
  });

  test('1.4: Prime Tier Resolution (Advanced Reasoning)', () => {
    const stack = modelRouter.resolveModelStack({ tier: 'prime', language: 'en-US' });
    assert.strictEqual(stack.effectiveTier, 'prime');
    assert.strictEqual(stack.intelligence.model, 'gpt-5.5');
    assert.strictEqual(stack.tts.model, 'multilingual-v2');
  });

  test('1.5: Auto Tier Dynamic Selection', () => {
    // High complexity -> routes to Prime
    const stackComplex = modelRouter.resolveModelStack({ tier: 'auto', complexity: 'high' });
    assert.strictEqual(stackComplex.effectiveTier, 'prime');
    assert.strictEqual(stackComplex.isAuto, true);

    // Low complexity -> routes to Swift
    const stackSimple = modelRouter.resolveModelStack({ tier: 'auto', complexity: 'low' });
    assert.strictEqual(stackSimple.effectiveTier, 'swift');

    // Normal complexity -> routes to Core
    const stackNormal = modelRouter.resolveModelStack({ tier: 'auto', complexity: 'normal' });
    assert.strictEqual(stackNormal.effectiveTier, 'core');
  });

  test('1.6: Advanced Manual Overrides', () => {
    const stack = modelRouter.resolveModelStack({
      tier: 'swift',
      language: 'en-US',
      overrides: {
        intelligence_provider: 'anthropic',
        intelligence_model: 'claude-opus-5',
        stt_provider: 'sarvam',
        stt_model: 'saaras-v3',
      },
    });
    assert.strictEqual(stack.intelligence.provider, 'anthropic');
    assert.strictEqual(stack.intelligence.model, 'claude-opus-5');
    assert.strictEqual(stack.stt.provider, 'sarvam');
    assert.strictEqual(stack.stt.model, 'saaras-v3');
  });

  test('1.7: Cost & Telemetry Calculation Engine', () => {
    const cost = modelRouter.calculateCallCost({
      tier: 'core',
      durationSeconds: 120, // 2 minutes
      inputTokens: 500,
      outputTokens: 200,
      ttsCharacters: 600,
      llmProvider: 'openai',
      llmModel: 'gpt-5.4',
      sttProvider: 'elevenlabs',
      sttModel: 'scribe-v2-realtime',
      ttsProvider: 'elevenlabs',
      ttsModel: 'multilingual-v2',
      telephonyProvider: 'twilio',
    });

    assert.strictEqual(cost.durationMinutes, 2.0);
    assert(cost.estimatedCostUsd > 0, 'USD cost must be positive');
    assert(cost.estimatedCostInr > 0, 'INR cost must be positive');
    assert.strictEqual(cost.customerPriceInr, 36.0, '2 mins @ ₹18/min = ₹36.00');
    assert(cost.grossMarginPercent > 50, 'Margin must be healthy');
  });

  // --- DATABASE & PERSISTENCE TESTS ---
  console.log('\n--- SECTION 2: Database & Telemetry Persistence Tests ---');

  let testBizId;
  let testAssistantId;

  await asyncTest('2.1: Fetch or Create Test Business', async () => {
    const res = await db.query('SELECT id FROM businesses LIMIT 1');
    if (res.rows.length > 0) {
      testBizId = res.rows[0].id;
    } else {
      const ins = await db.query(
        "INSERT INTO businesses (name, email) VALUES ('Model Tier Test Co', 'tier-test@bavio.in') RETURNING id"
      );
      testBizId = ins.rows[0].id;
    }
    assert(testBizId, 'Must have a valid businessId');
  });

  await asyncTest('2.2: Create AI Employee with Swift Tier', async () => {
    const ast = await assistantService.createAssistant({
      business_id: testBizId,
      name: 'Swift Telephony Rep',
      system_prompt: 'You are a fast customer qualification agent.',
      language: 'en-US',
      intelligence_tier: 'swift',
    });
    testAssistantId = ast.id;
    assert.strictEqual(ast.intelligence_tier, 'swift');
    assert.strictEqual(ast.name, 'Swift Telephony Rep');
  });

  await asyncTest('2.3: Update AI Employee to Prime Tier with Advanced Overrides', async () => {
    const updated = await assistantService.updateAssistant(testAssistantId, testBizId, {
      intelligence_tier: 'prime',
      intelligence_provider: 'openai',
      intelligence_model: 'gpt-5.5',
      stt_provider: 'elevenlabs',
      stt_model: 'scribe-v2-realtime',
      tts_provider: 'elevenlabs',
      tts_model: 'multilingual-v2',
    });
    assert.strictEqual(updated.intelligence_tier, 'prime');
    assert.strictEqual(updated.intelligence_model, 'gpt-5.5');
  });

  await asyncTest('2.4: Record Granular Call Cost Telemetry Log', async () => {
    const logRes = await modelRouter.recordCallCostLog({
      workspaceId: testBizId,
      businessId: testBizId,
      aiEmployeeId: testAssistantId,
      callId: `test_call_${Date.now()}`,
      tier: 'prime',
      language: 'en-US',
      provider: 'openai',
      model: 'gpt-5.5',
      sttProvider: 'elevenlabs',
      sttModel: 'scribe-v2-realtime',
      ttsProvider: 'elevenlabs',
      ttsModel: 'multilingual-v2',
      durationSeconds: 180, // 3-minute demo limit
      inputTokens: 1200,
      outputTokens: 450,
      ttsCharacters: 1100,
      sttLatencyMs: 140,
      llmFirstTokenMs: 280,
      ttsFirstAudioMs: 210,
      totalTtfbMs: 630,
    });

    assert.strictEqual(logRes.success, true);
    assert(logRes.logId, 'Must return generated logId');

    // Verify row in database
    const dbRow = await db.query('SELECT * FROM call_cost_logs WHERE id = $1', [logRes.logId]);
    assert.strictEqual(dbRow.rows.length, 1);
    const row = dbRow.rows[0];
    assert.strictEqual(row.tier, 'prime');
    assert.strictEqual(row.model, 'gpt-5.5');
    assert.strictEqual(parseFloat(row.duration_seconds), 180);
    assert(parseFloat(row.customer_price_inr) > 0);
  });

  // --- CLEANUP ---
  await db.query('DELETE FROM assistants WHERE id = $1', [testAssistantId]);

  console.log(`\n======================================================`);
  console.log(`TEST RESULTS: ${passed}/${total} TESTS PASSED`);
  console.log(`======================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
