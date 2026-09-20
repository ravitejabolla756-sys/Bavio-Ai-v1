'use strict';

/**
 * Regression Test Suite: Bavio Billing Idempotency & Transactional Atomic Deductions
 *
 * Covers:
 * 1. same callSid once -> exactly one charge
 * 2. same callSid sequential twice -> exactly one charge
 * 3. same callSid concurrent twice -> exactly one charge
 * 4. different callSids -> each charges
 * 5. missing callSid on real billable call -> FAIL CLOSED, zero deduction
 * 6. transaction failure -> zero partial mutation
 * 7. telemetry failure -> core ledger remains correct
 * 8. non-US account -> correct country persisted
 * 9. business without matching users row -> handled correctly based on canonical design
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const assert = require('node:assert/strict');
const { deductCallSeconds } = require('./middleware/planEnforcement');

function createIdempotentTestDb({ failTelemetry = false, failUpdate = false } = {}) {
  // In-memory relational state simulating businesses, users, and usage_logs tables
  const users = new Set(['biz-test-1', 'biz-india-1']);

  const businesses = new Map([
    [
      'biz-test-1',
      {
        id: 'biz-test-1',
        email: 'qa@bavio.test',
        name: 'QA Business US',
        country: 'US',
        monthly_limit_seconds: 6000,
        monthly_usage_seconds: 0,
        topup_balance_seconds: 1200,
        minutes_used: 0,
      }
    ],
    [
      'biz-india-1',
      {
        id: 'biz-india-1',
        email: 'india@bavio.test',
        name: 'Bavio India Office',
        country: 'IN',
        monthly_limit_seconds: 6000,
        monthly_usage_seconds: 0,
        topup_balance_seconds: 0,
        minutes_used: 0,
      }
    ],
    [
      'biz-orphan-1',
      {
        id: 'biz-orphan-1',
        email: 'orphan@bavio.test',
        name: 'Orphan Business Without User',
        country: 'US',
        monthly_limit_seconds: 6000,
        monthly_usage_seconds: 0,
        topup_balance_seconds: 0,
        minutes_used: 0,
      }
    ]
  ]);

  const usageLogs = new Map(); // key = call_sid -> record

  // Concurrency lock for row-level locking (SELECT ... FOR UPDATE)
  let businessRowLocked = false;
  const lockQueue = [];

  async function acquireBusinessLock() {
    if (!businessRowLocked) {
      businessRowLocked = true;
      return;
    }
    await new Promise(resolve => lockQueue.push(resolve));
    businessRowLocked = true;
  }

  function releaseBusinessLock() {
    businessRowLocked = false;
    if (lockQueue.length > 0) {
      const next = lockQueue.shift();
      next();
    }
  }

  const pool = {
    connect: async () => {
      let inTx = false;
      let holdsLock = false;
      let txUsageLogsClaim = null;
      let originalBizState = null;
      let modifiedBizState = null;

      return {
        query: async (text, params = []) => {
          if (text === 'BEGIN') {
            inTx = true;
            return { rows: [] };
          }

          if (text === 'COMMIT') {
            if (holdsLock) {
              holdsLock = false;
              releaseBusinessLock();
            }
            if (modifiedBizState) {
              businesses.set(modifiedBizState.id, { ...modifiedBizState });
            }
            if (txUsageLogsClaim) {
              usageLogs.set(txUsageLogsClaim.call_sid, txUsageLogsClaim);
            }
            inTx = false;
            return { rows: [] };
          }

          if (text === 'ROLLBACK') {
            if (holdsLock) {
              holdsLock = false;
              releaseBusinessLock();
            }
            txUsageLogsClaim = null;
            modifiedBizState = null;
            inTx = false;
            return { rows: [] };
          }

          // 1. SELECT ... FROM businesses b LEFT JOIN users u ... FOR UPDATE
          if (text.includes('FROM businesses') && (text.includes('FOR UPDATE') || text.includes('FOR UPDATE OF'))) {
            const bizId = params[0];
            await acquireBusinessLock();
            holdsLock = true;
            const b = businesses.get(bizId);
            if (!b) return { rows: [] };
            originalBizState = { ...b };
            modifiedBizState = { ...b };
            const matchingUserId = users.has(bizId) ? bizId : null;
            return { rows: [{ ...b, user_id: matchingUserId }] };
          }

          // 2. INSERT INTO usage_logs (...) ON CONFLICT (call_sid) WHERE call_sid IS NOT NULL DO NOTHING RETURNING id
          if (text.includes('INSERT INTO usage_logs')) {
            const callSid = params[2];
            if (usageLogs.has(callSid)) {
              // Conflict! ON CONFLICT DO NOTHING returns 0 rows
              return { rows: [] };
            }
            const record = {
              id: `log-${Date.now()}-${Math.random()}`,
              user_id: params[0],
              country_code: params[1],
              call_sid: callSid,
              minutes_used: params[3],
              cost_total: 0,
              billing_month: params[4],
              billing_year: params[5],
              created_at: new Date()
            };
            txUsageLogsClaim = record;
            return { rows: [{ id: record.id }] };
          }

          // 3. UPDATE businesses SET monthly_usage_seconds = $1 ...
          if (text.includes('UPDATE businesses')) {
            if (failUpdate) {
              throw new Error('Database disk error during business update');
            }
            if (modifiedBizState) {
              modifiedBizState.monthly_usage_seconds = params[0];
              modifiedBizState.topup_balance_seconds = params[1];
              modifiedBizState.minutes_used = Math.ceil(params[0] / 60);
            }
            return { rows: [] };
          }

          // 4. UPDATE usage_logs SET cost_telephony = $1 ... (telemetry update)
          if (text.includes('UPDATE usage_logs')) {
            if (failTelemetry) {
              throw new Error('Telemetry column does not exist or table locked');
            }
            if (txUsageLogsClaim) {
              txUsageLogsClaim.cost_telephony = params[0];
              txUsageLogsClaim.cost_stt = params[1];
              txUsageLogsClaim.cost_tts = params[2];
              txUsageLogsClaim.cost_total = params[3];
            }
            return { rows: [] };
          }

          // 5. Notifications insert
          if (text.includes('INSERT INTO notifications')) {
            return { rows: [] };
          }

          return { rows: [] };
        },
        release: () => {
          if (holdsLock) {
            holdsLock = false;
            releaseBusinessLock();
          }
        }
      };
    },
    query: async (text, params = []) => {
      return { rows: [] };
    }
  };

  return { pool, businesses, usageLogs };
}

async function runTests() {
  console.log('--- STARTING BILLING IDEMPOTENCY REGRESSION TESTS ---\n');

  // ── TEST 1: same callSid once -> exactly one charge ─────────────────────────
  {
    const db = createIdempotentTestDb();
    const res = await deductCallSeconds('biz-test-1', 120, 'call-unique-1', null, { db });
    assert.equal(res.success, true, 'Test 1: deduction should succeed');
    assert.equal(res.alreadyCharged, false, 'Test 1: should not be marked as already charged');
    assert.equal(res.deductedSeconds, 120, 'Test 1: should deduct 120 seconds');
    assert.equal(db.businesses.get('biz-test-1').monthly_usage_seconds, 120, 'Test 1: business balance should reflect 120s deduction');
    assert.equal(db.usageLogs.has('call-unique-1'), true, 'Test 1: callSid claim ledger entry should exist');
    console.log('✅ Test 1 Passed: same callSid once -> exactly one charge');
  }

  // ── TEST 2: same callSid sequential twice -> exactly one charge ────────────
  {
    const db = createIdempotentTestDb();
    const first = await deductCallSeconds('biz-test-1', 120, 'call-dup-seq', null, { db });
    assert.equal(first.success, true);
    assert.equal(first.alreadyCharged, false);
    assert.equal(first.deductedSeconds, 120);

    const second = await deductCallSeconds('biz-test-1', 120, 'call-dup-seq', null, { db });
    assert.equal(second.success, true, 'Test 2: second call should return clean success response');
    assert.equal(second.alreadyCharged, true, 'Test 2: second call MUST be flagged as alreadyCharged');
    assert.equal(second.deductedSeconds, 0, 'Test 2: second call MUST deduct 0 seconds');
    assert.equal(db.businesses.get('biz-test-1').monthly_usage_seconds, 120, 'Test 2: usage MUST remain 120s (no double deduction)');
    console.log('✅ Test 2 Passed: same callSid sequential twice -> exactly one charge');
  }

  // ── TEST 3: same callSid concurrent twice -> exactly one charge ────────────
  {
    const db = createIdempotentTestDb();
    const [resA, resB] = await Promise.all([
      deductCallSeconds('biz-test-1', 180, 'call-concurrent-1', null, { db }),
      deductCallSeconds('biz-test-1', 180, 'call-concurrent-1', null, { db }),
    ]);

    const chargedCount = [resA, resB].filter(r => !r.alreadyCharged && r.deductedSeconds === 180).length;
    const skippedCount = [resA, resB].filter(r => r.alreadyCharged && r.deductedSeconds === 0).length;

    assert.equal(chargedCount, 1, 'Test 3: exactly ONE concurrent invocation must charge');
    assert.equal(skippedCount, 1, 'Test 3: exactly ONE concurrent invocation must be rejected as already charged');
    assert.equal(db.businesses.get('biz-test-1').monthly_usage_seconds, 180, 'Test 3: business balance must reflect exactly 180s deduction');
    console.log('✅ Test 3 Passed: same callSid concurrent twice -> exactly one charge');
  }

  // ── TEST 4: different callSids -> each charges ─────────────────────────────
  {
    const db = createIdempotentTestDb();
    const res1 = await deductCallSeconds('biz-test-1', 100, 'call-diff-1', null, { db });
    const res2 = await deductCallSeconds('biz-test-1', 200, 'call-diff-2', null, { db });

    assert.equal(res1.alreadyCharged, false);
    assert.equal(res1.deductedSeconds, 100);
    assert.equal(res2.alreadyCharged, false);
    assert.equal(res2.deductedSeconds, 200);
    assert.equal(db.businesses.get('biz-test-1').monthly_usage_seconds, 300, 'Test 4: different calls must accumulate usage (100 + 200 = 300s)');
    assert.equal(db.usageLogs.has('call-diff-1'), true);
    assert.equal(db.usageLogs.has('call-diff-2'), true);
    console.log('✅ Test 4 Passed: different callSids -> each charges');
  }

  // ── TEST 5: missing callSid on real billable call -> FAIL CLOSED, zero deduction ──
  {
    const db = createIdempotentTestDb();
    const res = await deductCallSeconds('biz-test-1', 60, null, null, { db });
    assert.equal(res.success, false, 'Test 5: missing callSid must fail');
    assert.equal(res.reason, 'BILLING_IDEMPOTENCY_KEY_MISSING', 'Test 5: must report missing idempotency key');
    assert.equal(res.deductedSeconds, 0, 'Test 5: zero seconds deducted');
    assert.equal(db.businesses.get('biz-test-1').monthly_usage_seconds, 0, 'Test 5: business usage untouched');
    assert.equal(db.usageLogs.size, 0, 'Test 5: no usage log created');
    console.log('✅ Test 5 Passed: missing callSid on real billable call -> FAIL CLOSED, zero deduction');
  }

  // ── TEST 6: transaction failure -> zero partial mutation ───────────────────
  {
    const db = createIdempotentTestDb({ failUpdate: true });
    await assert.rejects(
      async () => {
        await deductCallSeconds('biz-test-1', 300, 'call-fail-tx', null, { db });
      },
      /Database disk error during business update/,
      'Test 6: must rethrow transaction failure'
    );

    assert.equal(db.businesses.get('biz-test-1').monthly_usage_seconds, 0, 'Test 6: balance must remain 0 after rollback');
    assert.equal(db.usageLogs.has('call-fail-tx'), false, 'Test 6: claim must not be committed after rollback');
    console.log('✅ Test 6 Passed: transaction failure -> zero partial mutation');
  }

  // ── TEST 7: telemetry failure -> core ledger remains correct ───────────────
  {
    const db = createIdempotentTestDb({ failTelemetry: true });
    const detailedMetrics = {
      telephony: { billedSeconds: 150 },
      stt: { seconds: 120 },
      llm: { inputTokens: 500, outputTokens: 200 },
      tts: { characters: 1000 }
    };

    // First call: telemetry update throws, but core billing and claim must succeed
    const res1 = await deductCallSeconds('biz-test-1', 150, 'call-telemetry-fail', detailedMetrics, { db });
    assert.equal(res1.success, true, 'Test 7: deduction should succeed despite optional telemetry failure');
    assert.equal(res1.alreadyCharged, false);
    assert.equal(res1.deductedSeconds, 150);
    assert.equal(db.businesses.get('biz-test-1').monthly_usage_seconds, 150);

    // Verify core ledger record durability
    const ledger = db.usageLogs.get('call-telemetry-fail');
    assert.ok(ledger, 'Test 7: core ledger record must exist');
    assert.equal(ledger.user_id, 'biz-test-1');
    assert.equal(ledger.country_code, 'US');
    assert.equal(ledger.call_sid, 'call-telemetry-fail');
    assert.equal(ledger.minutes_used, 3); // ceil(150/60)

    // Second call with same callSid: MUST STILL BE REJECTED as already charged
    const res2 = await deductCallSeconds('biz-test-1', 150, 'call-telemetry-fail', detailedMetrics, { db });
    assert.equal(res2.alreadyCharged, true, 'Test 7: duplicate call must still be rejected');
    assert.equal(res2.deductedSeconds, 0);
    assert.equal(db.businesses.get('biz-test-1').monthly_usage_seconds, 150, 'Test 7: no secondary deduction');
    console.log('✅ Test 7 Passed: telemetry failure -> core ledger remains correct');
  }

  // ── TEST 8: non-US account -> correct country persisted ────────────────────
  {
    const db = createIdempotentTestDb();
    const res = await deductCallSeconds('biz-india-1', 120, 'call-india-1', null, { db });
    assert.equal(res.success, true);
    assert.equal(res.deductedSeconds, 120);
    assert.equal(db.businesses.get('biz-india-1').monthly_usage_seconds, 120);

    const ledger = db.usageLogs.get('call-india-1');
    assert.ok(ledger, 'Test 8: ledger must exist');
    assert.equal(ledger.country_code, 'IN', 'Test 8: must persist IN, NOT default US');
    console.log('✅ Test 8 Passed: non-US account -> correct country persisted (IN)');
  }

  // ── TEST 9: business without matching users row -> handled correctly based on canonical design ──
  {
    const db = createIdempotentTestDb();
    const res = await deductCallSeconds('biz-orphan-1', 120, 'call-orphan-1', null, { db });
    assert.equal(res.success, false, 'Test 9: must fail if business has no matching users row');
    assert.equal(res.reason, 'USER_REFERENCE_NOT_FOUND', 'Test 9: must report missing canonical user reference');
    assert.equal(res.deductedSeconds, 0);
    assert.equal(db.businesses.get('biz-orphan-1').monthly_usage_seconds, 0, 'Test 9: balance untouched');
    assert.equal(db.usageLogs.size, 0, 'Test 9: no unanchored usage log created');
    console.log('✅ Test 9 Passed: business without matching users row -> handled correctly based on canonical design');
  }

  console.log('\n🎉 ALL 9 BILLING IDEMPOTENCY REGRESSION TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
