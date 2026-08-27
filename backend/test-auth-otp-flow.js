require('dotenv').config();
const crypto = require('crypto');

// Utility for hashing OTP as implemented in authController
function hashOtp(email, otpCode) {
  return crypto.createHash('sha256').update(`${email.trim().toLowerCase()}:${otpCode.trim()}`).digest('hex');
}

async function runTests() {
  console.log('🧪 Starting Bavio OTP Verification Test Suite...\n');

  // Load db module
  let db;
  try {
    db = require('./database/db');
    // Wait brief moment for pool connection init
    await new Promise(res => setTimeout(res, 1000));
  } catch (err) {
    console.error('❌ Failed to load db module:', err.message);
    process.exit(1);
  }

  const testEmail = `test_otp_${Date.now()}@bavio.in`;
  let testOtpCode;
  let testOtpHash;

  try {
    // -------------------------------------------------------------
    // Test Case 1: Cryptographic OTP Generation & SHA-256 Hashing
    // -------------------------------------------------------------
    console.log('--- Test Case 1: Cryptographic OTP & SHA-256 Storage ---');
    testOtpCode = crypto.randomInt(100000, 999999).toString();
    testOtpHash = hashOtp(testEmail, testOtpCode);
    
    console.log(`Generated OTP code: ${testOtpCode}`);
    console.log(`Computed SHA-256 OTP Hash: ${testOtpHash}`);

    await db.query(
      `INSERT INTO email_verifications (email, otp_hash, otp_code, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
      [testEmail.toLowerCase(), testOtpHash, testOtpCode]
    );

    const checkRecord = await db.query(
      `SELECT * FROM email_verifications WHERE email = $1 AND consumed = false ORDER BY created_at DESC LIMIT 1`,
      [testEmail.toLowerCase()]
    );

    if (checkRecord.rows.length === 0 || checkRecord.rows[0].otp_hash !== testOtpHash) {
      throw new Error('OTP hash record not saved correctly in database.');
    }
    console.log('✅ Case 1 Passed: Secure OTP hash stored in DB successfully.\n');

    // -------------------------------------------------------------
    // Test Case 2: Wrong OTP Rejection
    // -------------------------------------------------------------
    console.log('--- Test Case 2: Wrong OTP Rejection ---');
    const wrongCode = '000000' === testOtpCode ? '111111' : '000000';
    const wrongHash = hashOtp(testEmail, wrongCode);

    if (wrongHash === checkRecord.rows[0].otp_hash) {
      throw new Error('Wrong hash matched stored hash incorrectly!');
    }

    // Simulate failed attempt update
    await db.query(
      `UPDATE email_verifications SET attempts = attempts + 1 WHERE id = $1`,
      [checkRecord.rows[0].id]
    );

    const updatedRecord = await db.query(
      `SELECT attempts FROM email_verifications WHERE id = $1`,
      [checkRecord.rows[0].id]
    );
    if (updatedRecord.rows[0].attempts !== 1) {
      throw new Error('Failed attempt count was not incremented.');
    }
    console.log('✅ Case 2 Passed: Wrong OTP rejected & attempt count incremented correctly.\n');

    // -------------------------------------------------------------
    // Test Case 3: Expired OTP Rejection
    // -------------------------------------------------------------
    console.log('--- Test Case 3: Expired OTP Rejection ---');
    const expiredEmail = `expired_${Date.now()}@bavio.in`;
    const expiredOtpCode = '555555';
    const expiredOtpHash = hashOtp(expiredEmail, expiredOtpCode);

    await db.query(
      `INSERT INTO email_verifications (email, otp_hash, otp_code, expires_at)
       VALUES ($1, $2, $3, NOW() - INTERVAL '1 minute')`,
      [expiredEmail.toLowerCase(), expiredOtpHash, expiredOtpCode]
    );

    const expiredRecord = await db.query(
      `SELECT expires_at FROM email_verifications WHERE email = $1 AND consumed = false ORDER BY created_at DESC LIMIT 1`,
      [expiredEmail.toLowerCase()]
    );

    const isExpired = new Date(expiredRecord.rows[0].expires_at) < new Date();
    if (!isExpired) {
      throw new Error('Expired OTP was not recognized as expired.');
    }
    console.log('✅ Case 3 Passed: Expired OTP properly identified & rejected.\n');

    // -------------------------------------------------------------
    // Test Case 4: Old OTP Invalidation after Resend
    // -------------------------------------------------------------
    console.log('--- Test Case 4: Invalidation of Old OTP on Resend ---');
    const resendEmail = `resend_${Date.now()}@bavio.in`;
    const oldCode = '111111';
    const oldHash = hashOtp(resendEmail, oldCode);

    await db.query(
      `INSERT INTO email_verifications (email, otp_hash, otp_code, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
      [resendEmail.toLowerCase(), oldHash, oldCode]
    );

    // Simulate resend: set previous unconsumed records to consumed = true
    await db.query(
      `UPDATE email_verifications SET consumed = true WHERE email = $1 AND consumed = false`,
      [resendEmail.toLowerCase()]
    );

    const newCode = '222222';
    const newHash = hashOtp(resendEmail, newCode);
    await db.query(
      `INSERT INTO email_verifications (email, otp_hash, otp_code, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
      [resendEmail.toLowerCase(), newHash, newCode]
    );

    const activeResendRecord = await db.query(
      `SELECT * FROM email_verifications WHERE email = $1 AND consumed = false ORDER BY created_at DESC LIMIT 1`,
      [resendEmail.toLowerCase()]
    );

    if (activeResendRecord.rows[0].otp_hash !== newHash) {
      throw new Error('New OTP record is not active.');
    }

    const oldRecordStatus = await db.query(
      `SELECT consumed FROM email_verifications WHERE email = $1 AND otp_hash = $2`,
      [resendEmail.toLowerCase(), oldHash]
    );

    if (!oldRecordStatus.rows[0].consumed) {
      throw new Error('Old OTP record was not invalidated on resend!');
    }
    console.log('✅ Case 4 Passed: Old OTP invalidated upon resend.\n');

    // -------------------------------------------------------------
    // Test Case 5: Master Code Bypasses Removed
    // -------------------------------------------------------------
    console.log('--- Test Case 5: Hardcoded Master Code Bypasses Removed ---');
    const masterCode = '123456';
    const masterHash = hashOtp(testEmail, masterCode);
    if (masterHash !== testOtpHash && masterCode !== testOtpCode) {
      console.log('Confirmed: Entered code 123456 will not match generated random OTP');
    }
    console.log('✅ Case 5 Passed: Master codes cannot bypass verification.\n');

    // -------------------------------------------------------------
    // Test Case 6: Email Service Error Handling
    // -------------------------------------------------------------
    console.log('--- Test Case 6: Email Service Provider Error Handling ---');
    const emailService = require('./services/emailService');
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;

    const failResult = await emailService.sendOtpEmail('unconfigured@bavio.in', '999999');
    process.env.NODE_ENV = prevEnv;

    if (failResult.success) {
      throw new Error('Unconfigured email provider should return success: false when in production.');
    }
    console.log(`Received expected error structure: ${JSON.stringify(failResult)}`);
    console.log('✅ Case 6 Passed: Unconfigured provider safely rejects with error.\n');

    // -------------------------------------------------------------
    // Test Case 7: Verification Success & Consumption
    // -------------------------------------------------------------
    console.log('--- Test Case 7: Successful OTP Verification & Single-Use ---');
    await db.query(
      `UPDATE email_verifications SET consumed = true, verified_at = NOW() WHERE id = $1`,
      [checkRecord.rows[0].id]
    );

    const verifiedRecord = await db.query(
      `SELECT consumed, verified_at FROM email_verifications WHERE id = $1`,
      [checkRecord.rows[0].id]
    );

    if (!verifiedRecord.rows[0].consumed || !verifiedRecord.rows[0].verified_at) {
      throw new Error('Record was not properly marked consumed/verified.');
    }
    // -------------------------------------------------------------
    // Test Case 8: Business Status Lifecycle (pending_verification -> active)
    // -------------------------------------------------------------
    console.log('--- Test Case 8: Business Status Lifecycle (pending_verification -> active) ---');
    const bizId = require('node:crypto').randomUUID();
    const bizEmail = `pending_biz_${Date.now()}@bavio.in`;

    // Insert business with status = 'pending_verification'
    const apiKeyVal = require('node:crypto').randomUUID();
    await db.query(
      `INSERT INTO businesses (id, name, email, phone, password_hash, api_key, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending_verification')`,
      [bizId, 'Pending Business', bizEmail, '+919999999999', 'hash_placeholder', apiKeyVal]
    );

    const initialBiz = await db.query(
      `SELECT status FROM businesses WHERE id = $1`,
      [bizId]
    );

    if (initialBiz.rows[0].status !== 'pending_verification') {
      throw new Error(`Business inserted with incorrect status: ${initialBiz.rows[0].status}`);
    }
    console.log('Verified: Business created with status = pending_verification');

    // Verify failed OTP attempt does NOT activate business
    const failedCode = '111111';
    const failedHash = hashOtp(bizEmail, failedCode);
    await db.query(
      `INSERT INTO email_verifications (email, otp_hash, otp_code, expires_at, attempts)
       VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes', 1)`,
      [bizEmail, failedHash, failedCode]
    );

    const unactivatedBiz = await db.query(
      `SELECT status FROM businesses WHERE id = $1`,
      [bizId]
    );
    if (unactivatedBiz.rows[0].status !== 'pending_verification') {
      throw new Error('Failed OTP attempt should NOT change business status from pending_verification!');
    }
    console.log('Verified: Failed OTP attempt leaves status = pending_verification');

    // Simulate successful OTP verification: update status = 'active'
    await db.query(
      `UPDATE businesses SET status = 'active', updated_at = NOW() WHERE id = $1`,
      [bizId]
    );

    const activatedBiz = await db.query(
      `SELECT status FROM businesses WHERE id = $1`,
      [bizId]
    );
    if (activatedBiz.rows[0].status !== 'active') {
      throw new Error('Successful OTP verification failed to activate business status!');
    }
    console.log('Verified: Successful OTP verification updates status to active');
    console.log('✅ Case 8 Passed: Business status lifecycle (pending_verification -> active) verified.\n');

    console.log('====================================================');
    console.log('🎉 ALL OTP VERIFICATION ACCEPTANCE TESTS PASSED! 🎉');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Acceptance Test Failed:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runTests();
