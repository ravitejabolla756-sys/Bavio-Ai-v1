/**
 * test-countries.js
 * ─────────────────────────────────────────────────────────────────────
 * Validates country configuration, backend signup validation, and E.164
 * normalization rules.
 */

require('dotenv').config();
const assert = require('assert');
const axios = require('axios');
const db = require('./database/db');

const PORT = 5001;
process.env.PORT = PORT.toString();
const app = require('./server');
const http = require('http');
const server = http.createServer(app);

const BASE_URL = `http://localhost:${PORT}`;

let passed = 0;
let failed = 0;

function runAssertion(name, fn) {
    try {
        fn();
        console.log(`✅ Pass: ${name}`);
        passed++;
    } catch (err) {
        console.error(`❌ Fail: ${name} ->`, err.message);
        failed++;
    }
}

async function runAsyncAssertion(name, fn) {
    try {
        await fn();
        console.log(`✅ Pass: ${name}`);
        passed++;
    } catch (err) {
        console.error(`❌ Fail: ${name} ->`, err.message);
        failed++;
    }
}

async function main() {
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log('[TEST] Server is listening.');

    // Database Setup
    const testBusinessId = '11111111-1111-1111-1111-111111111111';
    try {
        await db.query("DELETE FROM businesses WHERE id = $1", [testBusinessId]);
        await db.query(
            `INSERT INTO businesses (id, name, email, phone, status, plan, plan_name, password_hash) 
             VALUES ($1, 'Country Test Biz', 'test@bavio.in', '+15555550123', 'active', 'free', 'free_trial', 'mock_hash')`,
            [testBusinessId]
        );
        console.log('Setup: Database temporary business initialized.');
    } catch (setupErr) {
        console.error('Setup database error:', setupErr.message);
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('         BAVIO COUNTRY VALIDATION TESTS        ');
    console.log('═══════════════════════════════════════════════\n');

    // 1. Telephony Supported Countries Endpoint
    await runAsyncAssertion('GET /telephony/supported-countries returns only enabled countries', async () => {
        const response = await axios.get(`${BASE_URL}/telephony/supported-countries`);
        assert.strictEqual(response.status, 200);
        assert.ok(Array.isArray(response.data));
        
        // India should not be present
        const hasIndia = response.data.some(c => c.iso2 === 'IN');
        assert.strictEqual(hasIndia, false);

        // US, GB, AU should be present
        const hasUS = response.data.some(c => c.iso2 === 'US');
        const hasGB = response.data.some(c => c.iso2 === 'GB');
        const hasAU = response.data.some(c => c.iso2 === 'AU');
        
        assert.strictEqual(hasUS, true);
        assert.strictEqual(hasGB, true);
        assert.strictEqual(hasAU, true);
    });

    // 2. Local Utility normalization checks
    const { validateAndNormalizePhone } = require('./utils/phoneValidation');

    runAssertion('US normalizes and accepts correctly', () => {
        const result = validateAndNormalizePhone('+1 415-555-0123', 'US');
        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.normalized, '+14155550123');
    });

    runAssertion('UK normalizes local zero prefix and accepts correctly', () => {
        const result = validateAndNormalizePhone('07700900123', 'GB');
        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.normalized, '+447700900123');
    });

    runAssertion('Rejects India (+91) manually', () => {
        const result = validateAndNormalizePhone('+919876543210', 'IN');
        assert.strictEqual(result.valid, false);
        assert.ok(result.error.includes('does not support'));
    });

    runAssertion('Rejects mismatched dialing code', () => {
        const result = validateAndNormalizePhone('+447700900123', 'US');
        assert.strictEqual(result.valid, false);
        assert.ok(result.error.includes('Mismatched phone number'));
    });

    // 3. Signup API Rejection
    await runAsyncAssertion('Signup API rejects India (IN) registration attempts', async () => {
        try {
            await axios.post(`${BASE_URL}/auth/signup`, {
                email: `test-in-${Date.now()}@bavio.in`,
                password: 'Password123!',
                businessName: 'India Test Biz',
                countryCode: 'IN',
                dialCode: '+91',
                phoneNumber: '9876543210',
                businessPhone: '+919876543210'
            });
            assert.fail('Should have failed');
        } catch (err) {
            assert.strictEqual(err.response.status, 400);
            assert.ok(err.response.data.error.includes('support'));
        }
    });

    // 4. Telephony Provisioning Rejection
    await runAsyncAssertion('Virtual number allocation rejects India (IN)', async () => {
        try {
            // Setup a mock token using actual JWT_SECRET
            const jwt = require('jsonwebtoken');
            const { JWT_SECRET } = require('./middleware/auth');
            const token = jwt.sign({ id: '11111111-1111-1111-1111-111111111111', email: 'test@bavio.in' }, JWT_SECRET);

            await axios.post(`${BASE_URL}/numbers/assign`, {
                country_code: 'IN'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            assert.fail('Should have failed');
        } catch (err) {
            assert.strictEqual(err.response.status, 400);
            assert.ok(err.response.data.error.includes('support'));
        }
    });

    // Database Teardown
    try {
        await db.query("DELETE FROM businesses WHERE id = $1", [testBusinessId]);
        console.log('Cleanup: Database temporary business removed.');
    } catch (cleanErr) {
        console.error('Cleanup database error:', cleanErr.message);
    }

    server.close();
    console.log('\n═══════════════════════════════════════════════');
    console.log(`  COUNTRY TESTS RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('═══════════════════════════════════════════════\n');
    
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
});
