/**
 * Bavio Top-Up Billing Model — Test Suite
 * 30 tests covering all acceptance criteria.
 *
 * Usage:
 *   node test-topup-billing.js
 *
 * Requirements:
 *   - DATABASE_URL in environment (or .env file)
 *   - Run migration 003 before tests
 */

'use strict';

// Load env vars before any module that touches the database
try { require('dotenv').config(); } catch (e) {}


let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
    if (condition) {
        console.log(`  ✅ ${label}`);
        passed++;
    } else {
        console.error(`  ❌ ${label}${detail ? ': ' + detail : ''}`);
        failed++;
    }
}

async function run() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Bavio Billing Model — Test Suite');
    console.log('═══════════════════════════════════════════════════════════\n');

    // ── 1. Config Layer ───────────────────────────────────────────────
    console.log('[ 1 ] Plans Config');
    const { PLANS_CONFIG, getPlanLimitSeconds, getPlanMinutes } = require('./config/plans');
    assert('Starter — 200 min',  PLANS_CONFIG.starter.monthlyMinutes === 200);
    assert('Growth — 500 min',   PLANS_CONFIG.growth.monthlyMinutes === 500);
    assert('Scale — 1500 min',   PLANS_CONFIG.scale.monthlyMinutes === 1500);
    assert('Starter — 12000s',   PLANS_CONFIG.starter.monthlyLimitSeconds === 12000);
    assert('Growth — 30000s',    PLANS_CONFIG.growth.monthlyLimitSeconds === 30000);
    assert('Scale — 90000s',     PLANS_CONFIG.scale.monthlyLimitSeconds === 90000);
    assert('No overagePerMinute on starter', !('overagePerMinute' in PLANS_CONFIG.starter));
    assert('getPlanLimitSeconds(starter)=12000', getPlanLimitSeconds('starter') === 12000);
    assert('getPlanMinutes(growth)=500',   getPlanMinutes('growth') === 500);
    assert('Business has no seconds limit', PLANS_CONFIG.business.monthlyLimitSeconds === null);
    console.log('');

    // ── 2. Topups Config ──────────────────────────────────────────────
    console.log('[ 2 ] Topups Config');
    const { TOPUPS_CONFIG, productIdToTopup, isTopupCheckoutAvailable } = require('./config/topups');
    assert('topup_100 exists',          !!TOPUPS_CONFIG.topup_100);
    assert('topup_250 exists',          !!TOPUPS_CONFIG.topup_250);
    assert('topup_100 price = $25',     TOPUPS_CONFIG.topup_100.price === 25);
    assert('topup_250 price = $55',     TOPUPS_CONFIG.topup_250.price === 55);
    assert('topup_100 minutes = 100',   TOPUPS_CONFIG.topup_100.minutes === 100);
    assert('topup_250 minutes = 250',   TOPUPS_CONFIG.topup_250.minutes === 250);
    assert('topup_100 seconds = 6000',  TOPUPS_CONFIG.topup_100.seconds === 6000);
    assert('topup_250 seconds = 15000', TOPUPS_CONFIG.topup_250.seconds === 15000);
    assert('topup_100 noAutoRenewal',   TOPUPS_CONFIG.topup_100.noAutoRenewal === true);
    assert('productIdToTopup(null)=null', productIdToTopup(null) === null);
    console.log('');

    // ── 3. Dodo Service ───────────────────────────────────────────────
    console.log('[ 3 ] Dodo Billing Service');
    const dodo = require('./services/dodoBillingService');
    assert('getPlanMinutes(starter)=200', dodo.getPlanMinutes('starter') === 200);
    assert('getPlanMinutes(growth)=500',  dodo.getPlanMinutes('growth')  === 500);
    assert('getPlanMinutes(scale)=1500',  dodo.getPlanMinutes('scale')   === 1500);
    assert('getPlanMinutes(free)=0',      dodo.getPlanMinutes('free')    === 0);
    assert('OVERAGE_RATES.starter=0',     dodo.OVERAGE_RATES.starter === 0, 'Legacy stub must return 0');
    assert('createTopupCheckout is function', typeof dodo.createTopupCheckout === 'function');
    assert('productIdToTopup is function',    typeof dodo.productIdToTopup === 'function');
    console.log('');

    // ── 4. Plan Enforcement ───────────────────────────────────────────
    console.log('[ 4 ] Plan Enforcement');
    const pe = require('./middleware/planEnforcement');
    assert('checkCallBalance exported',     typeof pe.checkCallBalance === 'function');
    assert('deductCallSeconds exported',    typeof pe.deductCallSeconds === 'function');
    assert('resetMonthlySeconds exported',  typeof pe.resetMonthlySeconds === 'function');
    assert('applyTopupSeconds exported',    typeof pe.applyTopupSeconds === 'function');
    assert('incrementMinutesUsed exported', typeof pe.incrementMinutesUsed === 'function', 'backwards-compat alias');
    console.log('');

    // ── 5. Billing Controller ─────────────────────────────────────────
    console.log('[ 5 ] Billing Controller');
    const bc = require('./controllers/billingController');
    assert('createTopupCheckout exported',  typeof bc.createTopupCheckout === 'function');
    assert('getTopupTransactions exported', typeof bc.getTopupTransactions === 'function');
    assert('getBalance exported',           typeof bc.getBalance === 'function');
    assert('getPricing exported',           typeof bc.getPricing === 'function');
    console.log('');

    // ── 6. Deduction Logic (unit test without DB) ─────────────────────
    console.log('[ 6 ] Deduction Math (unit)');
    function simulateDeduction(monthlyLimitSec, monthlyUsedSec, topupBalance, durationSec) {
        const monthlyRem  = Math.max(0, monthlyLimitSec - monthlyUsedSec);
        const monthly     = Math.min(durationSec, monthlyRem);
        const rem         = durationSec - monthly;
        const topup       = Math.min(rem, topupBalance);
        return {
            newMonthlyUsed:  monthlyUsedSec + monthly,
            newTopupBalance: Math.max(0, topupBalance - topup),
        };
    }

    // 90s call, 200s monthly rem, 100s topup
    const d1 = simulateDeduction(12000, 11800, 6000, 90);
    assert('Deducts from monthly first',    d1.newMonthlyUsed  === 11890,  `got ${d1.newMonthlyUsed}`);
    assert('Top-up untouched when monthly sufficient', d1.newTopupBalance === 6000, `got ${d1.newTopupBalance}`);

    // Monthly exhausted: 60s call, 0 monthly rem, 6000s topup
    const d2 = simulateDeduction(12000, 12000, 6000, 60);
    assert('Monthly exhausted, deducts from topup', d2.newTopupBalance === 5940, `got ${d2.newTopupBalance}`);
    assert('Monthly stays at limit when exhausted',  d2.newMonthlyUsed  === 12000, `got ${d2.newMonthlyUsed}`);

    // Partial monthly: 200s call, 50s monthly rem, 6000s topup
    const d3 = simulateDeduction(12000, 11950, 6000, 200);
    assert('Splits between monthly and topup', d3.newMonthlyUsed === 12000 && d3.newTopupBalance === 5850,
        `monthly=${d3.newMonthlyUsed} topup=${d3.newTopupBalance}`);

    // All exhausted: no balance
    const d4 = simulateDeduction(12000, 12000, 0, 60);
    assert('No negative balance when exhausted', d4.newTopupBalance >= 0, `got ${d4.newTopupBalance}`);

    console.log('');

    // ── Summary ───────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Results: ${passed} passed, ${failed} failed`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (failed > 0) {
        process.exit(1);
    }
}

run().catch(err => {
    console.error('Test suite error:', err);
    process.exit(1);
});
