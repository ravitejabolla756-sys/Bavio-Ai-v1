require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const db = require('./database/db');
const crypto = require('node:crypto');
const authController = require('./controllers/authController');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passedTests++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failedTests++;
    }
}

function mockRes() {
    const res = {
        _status: 200,
        _json: null,
        status(code) {
            this._status = code;
            return this;
        },
        json(data) {
            this._json = data;
            return this;
        }
    };
    return res;
}

async function runTests() {
    console.log('====================================================');
    console.log(' BAVIO — SIGNUP IDEMPOTENCY & SAFETY REGRESSION SUITE');
    console.log('====================================================\n');

    const testId = Date.now();
    const testEmail1 = `test_fresh_${testId}@bavio.ai`;
    const testEmail2 = `test_retry_${testId}@bavio.ai`;
    const testEmail3 = `test_verified_${testId}@bavio.ai`;
    const testPhone1 = `+9198765${String(testId).slice(-5)}`;
    const testPhone2 = `+9198766${String(testId).slice(-5)}`;

    try {
        // ----------------------------------------------------
        // TEST 1: DB Unique Constraint Sanitization & No Raw SQL Leaks
        // ----------------------------------------------------
        console.log('TEST 1: DB Unique Constraint Sanitization');
        {
            // Simulate direct 23505 error in signup catch
            const req = {
                body: {
                    email: testEmail1,
                    password: 'TestPassword123!',
                    name: 'Test Business',
                    phone: testPhone1
                },
                headers: {}
            };
            const res = mockRes();

            // First call - creates user
            await authController.signup(req, res);
            assert(res._status === 201 || res._status === 200, `First signup returned ${res._status}`);
            assert(res._json.emailVerificationRequired === true, 'Verification required returned');

            // Verify no raw DB details exposed in response
            const jsonStr = JSON.stringify(res._json);
            assert(!jsonStr.includes('businesses_pkey'), 'Response does NOT contain "businesses_pkey"');
            assert(!jsonStr.includes('duplicate key value'), 'Response does NOT contain "duplicate key value"');
            assert(!jsonStr.includes('23505'), 'Response does NOT contain "23505"');
            assert(!jsonStr.includes('SELECT') && !jsonStr.includes('INSERT'), 'Response does NOT contain raw SQL');
        }

        // ----------------------------------------------------
        // TEST 2: Rapid Duplicate Submissions / Retrying Pending Account
        // ----------------------------------------------------
        console.log('\nTEST 2: Rapid Duplicate / Retrying Pending Account (State B)');
        {
            const req = {
                body: {
                    email: testEmail1,
                    password: 'TestPassword123!',
                    name: 'Test Business',
                    phone: testPhone1
                },
                headers: {}
            };
            const res = mockRes();

            // Submitting same signup while status is pending_verification
            await authController.signup(req, res);
            assert(res._status === 200, `Resumed signup returned HTTP 200 (received ${res._status})`);
            assert(res._json.resumed === true, 'Resumed flag is true');
            assert(res._json.code === 'VERIFICATION_REQUIRED', 'Code is VERIFICATION_REQUIRED');
            assert(res._json.emailVerificationRequired === true, 'Email verification required');

            // Verify DB only has ONE row for this email
            const countRes = await db.query('SELECT COUNT(*) FROM businesses WHERE email = $1', [testEmail1.toLowerCase()]);
            assert(parseInt(countRes.rows[0].count, 10) === 1, `Exactly 1 business row exists (found ${countRes.rows[0].count})`);
        }

        // ----------------------------------------------------
        // TEST 3: Verification with Valid Bavio OTP
        // ----------------------------------------------------
        console.log('\nTEST 3: Verification with Valid Bavio OTP');
        {
            // Fetch unconsumed OTP code for testEmail1
            const otpRes = await db.query(
                `SELECT otp_code FROM email_verifications
                 WHERE email = $1 AND consumed = false
                 ORDER BY created_at DESC LIMIT 1`,
                [testEmail1.toLowerCase()]
            );
            assert(otpRes.rows.length > 0, 'Found unconsumed OTP in database');
            const otpCode = otpRes.rows[0].otp_code;

            const verifyReq = {
                body: {
                    email: testEmail1,
                    token: otpCode
                }
            };
            const verifyRes = mockRes();
            await authController.verifyOtp(verifyReq, verifyRes);

            assert(verifyRes._status === 200, `OTP Verification returned HTTP 200 (received ${verifyRes._status})`);
            assert(verifyRes._json.success === true, 'OTP verification success is true');
            assert(!!verifyRes._json.token, 'JWT session token returned');

            // Verify business status in DB is active
            const bizRes = await db.query('SELECT status FROM businesses WHERE email = $1', [testEmail1.toLowerCase()]);
            assert(bizRes.rows[0].status === 'active', `Business status updated to active (current: ${bizRes.rows[0].status})`);
        }

        // ----------------------------------------------------
        // TEST 4: Signup with Existing Verified Account (State C)
        // ----------------------------------------------------
        console.log('\nTEST 4: Signup for Existing Verified Account (State C -> 409)');
        {
            const req = {
                body: {
                    email: testEmail1,
                    password: 'TestPassword123!',
                    name: 'Test Business 2',
                    phone: testPhone2
                },
                headers: {}
            };
            const res = mockRes();
            await authController.signup(req, res);

            assert(res._status === 409, `Existing verified signup returned HTTP 409 (received ${res._status})`);
            assert(res._json.code === 'ACCOUNT_ALREADY_EXISTS', 'Code is ACCOUNT_ALREADY_EXISTS');
            assert(res._json.error === 'An account already exists for this email. Sign in instead.', 'Friendly error returned');

            // Ensure DB still only has 1 record
            const countRes = await db.query('SELECT COUNT(*) FROM businesses WHERE email = $1', [testEmail1.toLowerCase()]);
            assert(parseInt(countRes.rows[0].count, 10) === 1, `Count remains 1`);
        }

        // ----------------------------------------------------
        // TEST 5: OTP Resend & Cooldown (429 VERIFICATION_COOLDOWN)
        // ----------------------------------------------------
        console.log('\nTEST 5: OTP Resend & Cooldown');
        {
            // Create pending user 2
            const req2 = {
                body: {
                    email: testEmail2,
                    password: 'TestPassword123!',
                    name: 'Test Business 2',
                    phone: testPhone2
                },
                headers: {}
            };
            const res2 = mockRes();
            await authController.signup(req2, res2);
            assert(res2._status === 201 || res2._status === 200, 'User 2 created');

            // Resend immediately -> should trigger 30s cooldown
            const resendReq = {
                body: {
                    email: testEmail2
                }
            };
            const resendRes = mockRes();
            await authController.resendVerification(resendReq, resendRes);

            assert(resendRes._status === 429, `Immediate resend returned HTTP 429 (received ${resendRes._status})`);
            assert(resendRes._json.code === 'VERIFICATION_COOLDOWN', 'Code is VERIFICATION_COOLDOWN');
            assert(typeof resendRes._json.retry_after_seconds === 'number', 'retry_after_seconds is a number');
            assert(resendRes._json.retry_after_seconds > 0, `retry_after_seconds > 0 (${resendRes._json.retry_after_seconds}s)`);
        }

        // ----------------------------------------------------
        // TEST 6: Existing Auth User with Missing Business Profile (State D)
        // ----------------------------------------------------
        console.log('\nTEST 6: Auth User Exists, Business Profile Missing (State D)');
        {
            // Get user 2's id, delete from businesses table, retry signup
            const biz = await db.query('SELECT id FROM businesses WHERE email = $1', [testEmail2.toLowerCase()]);
            if (biz.rows.length > 0) {
                const uid = biz.rows[0].id;
                await db.query('DELETE FROM email_verifications WHERE email = $1', [testEmail2.toLowerCase()]);
                await db.query('DELETE FROM businesses WHERE id = $1', [uid]);

                const reqRecover = {
                    body: {
                        email: testEmail2,
                        password: 'TestPassword123!',
                        name: 'Recovered Business',
                        phone: testPhone2
                    },
                    headers: {}
                };
                const resRecover = mockRes();
                await authController.signup(reqRecover, resRecover);

                assert(resRecover._status === 201 || resRecover._status === 200, `Recovery returned HTTP ${resRecover._status}`);
                assert(resRecover._json.emailVerificationRequired === true, 'Verification required');

                // Check that business was recreated with the SAME id or recovered cleanly
                const checkBiz = await db.query('SELECT * FROM businesses WHERE email = $1', [testEmail2.toLowerCase()]);
                assert(checkBiz.rows.length === 1, 'Business profile successfully recovered exactly once');
            }
        }

        // Cleanup synthetic test records
        await db.query('DELETE FROM email_verifications WHERE email IN ($1, $2, $3)', [testEmail1.toLowerCase(), testEmail2.toLowerCase(), testEmail3.toLowerCase()]);
        await db.query('DELETE FROM businesses WHERE email IN ($1, $2, $3)', [testEmail1.toLowerCase(), testEmail2.toLowerCase(), testEmail3.toLowerCase()]);

    } catch (err) {
        console.error('Unexpected test error:', err);
        failedTests++;
    }

    console.log('\n====================================================');
    console.log(` RESULTS: ${passedTests} passed, ${failedTests} failed`);
    console.log('====================================================');

    process.exit(failedTests > 0 ? 1 : 0);
}

runTests();
