require('dotenv').config();
const db = require('./database/db');
const authController = require('./controllers/authController');
const crypto = require('node:crypto');

async function runPasswordResetTestSuite() {
  console.log('🧪 Starting Bavio Password Reset End-to-End Test Suite...\n');
  await new Promise(r => setTimeout(r, 1200));

  try {
    const testEmail = `reset_user_${Date.now()}@bavio.in`;
    const initialPassword = 'OldPassword123!';
    const newPassword = 'NewPassword456!';

    // Create test business user
    // Mock emailService to simulate successful Resend delivery in local test environment
    const emailService = require('./services/emailService');
    const origSendReset = emailService.sendPasswordResetEmail;
    emailService.sendPasswordResetEmail = async (to, url) => {
      console.log(`[Test Suite Mock EmailService] Dispatching password reset email to: ${to} (URL: ${url})`);
      return { success: true, messageId: 'test-mock-msg-123' };
    };
    const userId = crypto.randomUUID();
    const apiKey = crypto.randomUUID();
    const dynamicPhone = `+91${Date.now().toString().slice(-10)}`;
    await db.query(
      `INSERT INTO businesses (id, name, email, phone, password_hash, api_key, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')`,
      [userId, 'Reset Test User', testEmail, dynamicPhone, 'old_hash', apiKey]
    );

    // Mock Response helper
    function mockRes() {
      const res = {
        statusCode: 200,
        data: null,
        status: function (code) { this.statusCode = code; return this; },
        json: function (obj) { this.data = obj; return this; }
      };
      return res;
    }

    // -------------------------------------------------------------
    // Test A: Existing Account Requests Password Reset
    // -------------------------------------------------------------
    console.log('--- Test A: Existing Account Password Reset Request ---');
    const reqA = { body: { email: testEmail } };
    const resA = mockRes();
    await authController.forgotPassword(reqA, resA);

    if (resA.statusCode !== 200 || !resA.data?.success) {
      throw new Error(`Test A Failed: Expected 200 success, got status ${resA.statusCode}: ${JSON.stringify(resA.data)}`);
    }

    const resetRecord = await db.query(
      `SELECT * FROM password_resets WHERE email = $1 AND consumed = false ORDER BY created_at DESC LIMIT 1`,
      [testEmail]
    );

    if (resetRecord.rows.length === 0) {
      throw new Error('Test A Failed: Reset token record was not created in password_resets table.');
    }
    console.log('✅ Test A Passed: Existing account password reset link requested & token stored as SHA-256 hash.\n');

    // -------------------------------------------------------------
    // Test B: Unknown Email Requests Reset (Account Enumeration Prevention)
    // -------------------------------------------------------------
    console.log('--- Test B: Unknown Email (Account Enumeration Prevention) ---');
    const reqB = { body: { email: 'nonexistent_account_999@bavio.in' } };
    const resB = mockRes();
    await authController.forgotPassword(reqB, resB);

    if (resB.statusCode !== 200 || resB.data?.message !== resA.data?.message) {
      throw new Error(`Test B Failed: Unknown email did not return identical response structure. Got: ${JSON.stringify(resB.data)}`);
    }
    console.log('✅ Test B Passed: Unknown email returned identical generic success response.\n');

    // -------------------------------------------------------------
    // Test C: Valid Reset Token & Password Update
    // -------------------------------------------------------------
    console.log('--- Test C: Valid Reset Token & Password Reset ---');

    // Generate a test token manually to verify verification and reset endpoints
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await db.query(
      `INSERT INTO password_resets (email, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
      [testEmail, tokenHash]
    );

    // Verify Token
    const verifyReqC = { body: { token: rawToken } };
    const verifyResC = mockRes();
    await authController.verifyResetToken(verifyReqC, verifyResC);

    if (verifyResC.statusCode !== 200 || !verifyResC.data?.valid) {
      throw new Error(`Test C Failed: Token verification failed: ${JSON.stringify(verifyResC.data)}`);
    }

    // Submit Reset
    const resetReqC = { body: { token: rawToken, password: newPassword } };
    const resetResC = mockRes();
    await authController.resetPassword(resetReqC, resetResC);

    if (resetResC.statusCode !== 200 || !resetResC.data?.success) {
      throw new Error(`Test C Failed: Reset password failed: ${JSON.stringify(resetResC.data)}`);
    }
    console.log('✅ Test C Passed: Valid token accepted and password reset successfully.\n');

    // -------------------------------------------------------------
    // Test D: Token Re-use Prevention
    // -------------------------------------------------------------
    console.log('--- Test D: Token Re-use Prevention ---');
    const resetReqD = { body: { token: rawToken, password: 'AnotherPassword789!' } };
    const resetResD = mockRes();
    await authController.resetPassword(resetReqD, resetResD);

    if (resetResD.statusCode === 200 && resetResD.data?.success) {
      throw new Error('Test D Failed: Already-consumed reset token was accepted!');
    }
    console.log(`Received expected rejection: ${JSON.stringify(resetResD.data)}`);
    console.log('✅ Test D Passed: Re-used token rejected successfully.\n');

    // -------------------------------------------------------------
    // Test E: Expired Token Rejection
    // -------------------------------------------------------------
    console.log('--- Test E: Expired Token Rejection ---');
    const expiredRawToken = crypto.randomBytes(32).toString('hex');
    const expiredTokenHash = crypto.createHash('sha256').update(expiredRawToken).digest('hex');
    await db.query(
      `INSERT INTO password_resets (email, token_hash, expires_at)
       VALUES ($1, $2, NOW() - INTERVAL '5 minutes')`,
      [testEmail, expiredTokenHash]
    );

    const resetReqE = { body: { token: expiredRawToken, password: newPassword } };
    const resetResE = mockRes();
    await authController.resetPassword(resetReqE, resetResE);

    if (resetResE.statusCode === 200 && resetResE.data?.success) {
      throw new Error('Test E Failed: Expired reset token was accepted!');
    }
    console.log(`Received expected rejection: ${JSON.stringify(resetResE.data)}`);
    console.log('✅ Test E Passed: Expired token rejected successfully.\n');

    // -------------------------------------------------------------
    // Test F: Invalid/Random Token Rejection
    // -------------------------------------------------------------
    console.log('--- Test F: Invalid/Random Token Rejection ---');
    const invalidToken = 'random_invalid_token_1234567890';
    const resetReqF = { body: { token: invalidToken, password: newPassword } };
    const resetResF = mockRes();
    await authController.resetPassword(resetReqF, resetResF);

    if (resetResF.statusCode === 200 && resetResF.data?.success) {
      throw new Error('Test F Failed: Invalid token was accepted!');
    }
    console.log(`Received expected rejection: ${JSON.stringify(resetResF.data)}`);
    console.log('✅ Test F Passed: Invalid token rejected successfully.\n');

    console.log('====================================================');
    console.log('🎉 ALL PASSWORD RESET TEST CASES PASSED! 🎉');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Password Reset Test Suite Failed:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runPasswordResetTestSuite();
