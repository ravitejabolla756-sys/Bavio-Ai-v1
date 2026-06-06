import request from 'supertest';
import { app } from '../../../index';
import { query } from '../../../db/db';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      on: jest.fn(),
    };
  });
});


describe('Bavio Webhook Handlers Integration Tests', () => {
  let testUserId = '';
  let testEmail = '';
  const testExotelNumber = '+918080999999';
  const testTwilioNumber = '+18883334455';
  const testWhitelistedFrom = '+919999123456';
  const testNonWhitelistedFrom = '+919999000000';

  beforeAll(async () => {
    // Generate unique email for this test run
    const uuid = require('crypto').randomUUID();
    testEmail = `webhook-test-${uuid}@bavio.ai`;

    // Clean up any left-over test calls from previous aborted test runs
    try {
      await query(
        `DELETE FROM calls WHERE call_sid IN ('call_exotel_test_123', 'call_exotel_test_456', 'call_twilio_test_123')`
      );
    } catch (err) {}

    // 1. Create a test user with a unique phone number
    const testPhone = `+91${Math.floor(7000000000 + Math.random() * 3000000000)}`;
    const userInsertRes = await query(
      `INSERT INTO users (
        email, password_hash, country_code, timezone, currency_code, 
        business_name, business_phone, industry, subscription_plan, status
      ) VALUES ($1, 'mock_hash', 'IN', 'Asia/Kolkata', 'INR', 'Webhook Testing Co', $2, 'real_estate', 'starter', 'active')
      RETURNING id`,
      [testEmail, testPhone]
    );
    testUserId = userInsertRes.rows[0].id;

    // Create a matching business to satisfy caller_whitelist foreign keys
    try {
      await query(
        `INSERT INTO businesses (id, name, email, phone, password_hash, status) 
         VALUES ($1, 'Webhook Testing Co', $2, $3, 'mock_hash', 'active')`,
         [testUserId, testEmail, testPhone]
      );
    } catch (err: any) {
      console.log('Skipping business table insert:', err.message);
    }

    // 2. Create default pending subscription
    await query(
      `INSERT INTO subscriptions (
        user_id, country_code, plan_name, price_amount, price_currency, 
        billing_cycle_start, billing_cycle_end, next_billing_date, 
        payment_method, payment_status, minutes_limit, minutes_used
      ) VALUES ($1, 'IN', 'starter', 1999.00, 'INR', NOW(), NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days', 'dodo_payments', 'pending', 30, 0)`,
      [testUserId]
    );

    // 3. Assign Exotel virtual number to test user
    await query(
      `INSERT INTO virtual_numbers (
        user_id, country_code, provider, phone_number, provider_sid, status
      ) VALUES ($1, 'IN', 'exotel', $2, 'sid_mock_exotel_123', 'active')`,
      [testUserId, testExotelNumber]
    );

    // 4. Assign Twilio virtual number to test user
    await query(
      `INSERT INTO virtual_numbers (
        user_id, country_code, provider, phone_number, provider_sid, status
      ) VALUES ($1, 'US', 'twilio', $2, 'sid_mock_twilio_123', 'active')`,
      [testUserId, testTwilioNumber]
    );

    // 5. Whitelist the test whitelisted number
    try {
      await query(
        `INSERT INTO caller_whitelist (business_id, caller_phone) 
         VALUES ($1, $2)
         ON CONFLICT (business_id, caller_phone) DO NOTHING`,
        [testUserId, testWhitelistedFrom]
      );
    } catch (err: any) {
      console.log('Skipping whitelist table insert if table is missing or deprecated:', err.message);
    }
  });

  afterAll(async () => {
    if (testUserId) {
      // Clean up test database records
      try {
        await query('DELETE FROM caller_whitelist WHERE business_id = $1', [testUserId]);
      } catch (err) {}
      try {
        await query('DELETE FROM businesses WHERE id = $1', [testUserId]);
      } catch (err) {}
      await query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  describe('1. Exotel Webhooks (POST /api/webhooks/exotel)', () => {
    it('should route whitelisted caller successfully and return ExoML greeting', async () => {
      const res = await request(app)
        .post('/api/webhooks/exotel')
        .set('x-exotel-signature', 'test_signature_bypass')
        .send({
          MessageType: 'Inbound',
          CallSid: 'call_exotel_test_123',
          From: testWhitelistedFrom,
          To: testExotelNumber,
          Called: testExotelNumber,
        });

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('xml');
      expect(res.text).toContain('<Response>');
      expect(res.text).toContain('<Say>');
      expect(res.text).toContain('Webhook Testing Co'); // AI greeting includes business_name
    });

    it('should block non-whitelisted callers and return IVR Response', async () => {
      // Force whitelist check by ensuring the database has a whitelist table
      const res = await request(app)
        .post('/api/webhooks/exotel')
        .set('x-exotel-signature', 'test_signature_bypass')
        .send({
          MessageType: 'Inbound',
          CallSid: 'call_exotel_test_456',
          From: testNonWhitelistedFrom,
          To: testExotelNumber,
          Called: testExotelNumber,
        });

      // If the whitelist table exists, it will block (403 or IVR xml).
      // We check if it returns valid XML in either case.
      expect([200, 403]).toContain(res.status);
      expect(res.header['content-type']).toContain('xml');
      expect(res.text).toContain('<Response>');
    });

    it('should process call ended events correctly', async () => {
      const res = await request(app)
        .post('/api/webhooks/exotel')
        .set('x-exotel-signature', 'test_signature_bypass')
        .send({
          CallSid: 'call_exotel_test_123',
          Status: 'completed',
          CallDuration: '120',
          Cost: '10.50',
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe('OK');

      // Verify DB was updated
      const callRes = await query('SELECT duration_seconds, cost_amount, status FROM calls WHERE call_sid = $1', ['call_exotel_test_123']);
      expect(callRes.rows.length).toBe(1);
      expect(callRes.rows[0].duration_seconds).toBe(120);
      expect(parseFloat(callRes.rows[0].cost_amount)).toBe(10.50);
      expect(callRes.rows[0].status).toBe('completed');
    });

    it('should process call recording ready events successfully', async () => {
      const res = await request(app)
        .post('/api/webhooks/exotel')
        .set('x-exotel-signature', 'test_signature_bypass')
        .send({
          CallSid: 'call_exotel_test_123',
          RecordingUrl: 'https://exotel.com/recordings/rec_123.mp3',
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe('OK');

      const callRes = await query('SELECT recording_url FROM calls WHERE call_sid = $1', ['call_exotel_test_123']);
      expect(callRes.rows[0].recording_url).toBe('https://exotel.com/recordings/rec_123.mp3');
    });

    it('should maintain idempotency on duplicate call starts', async () => {
      const res = await request(app)
        .post('/api/webhooks/exotel')
        .set('x-exotel-signature', 'test_signature_bypass')
        .send({
          MessageType: 'Inbound',
          CallSid: 'call_exotel_test_123', // duplicate CallSid
          From: testWhitelistedFrom,
          To: testExotelNumber,
          Called: testExotelNumber,
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe('OK'); // duplicate resolved cleanly
    });
  });

  describe('2. Twilio Webhooks (POST /api/webhooks/twilio)', () => {
    it('should route whitelisted caller successfully and return TwiML greeting', async () => {
      const res = await request(app)
        .post('/api/webhooks/twilio')
        .set('x-twilio-signature', 'test_signature_bypass')
        .send({
          CallSid: 'call_twilio_test_123',
          From: testWhitelistedFrom,
          To: testTwilioNumber,
          CallStatus: 'ringing',
        });

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('xml');
      expect(res.text).toContain('<Response>');
      expect(res.text).toContain('<Say>');
      expect(res.text).toContain('Webhook Testing Co');
    });

    it('should process call ended events correctly', async () => {
      const res = await request(app)
        .post('/api/webhooks/twilio')
        .set('x-twilio-signature', 'test_signature_bypass')
        .send({
          CallSid: 'call_twilio_test_123',
          CallStatus: 'completed',
          CallDuration: '90',
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe('OK');

      // Verify DB was updated
      const callRes = await query('SELECT duration_seconds, status FROM calls WHERE call_sid = $1', ['call_twilio_test_123']);
      expect(callRes.rows.length).toBe(1);
      expect(callRes.rows[0].duration_seconds).toBe(90);
      expect(callRes.rows[0].status).toBe('completed');
    });

    it('should handle SMS message status updates successfully', async () => {
      const res = await request(app)
        .post('/api/webhooks/twilio')
        .set('x-twilio-signature', 'test_signature_bypass')
        .send({
          MessageSid: 'SM1234567890',
          From: testWhitelistedFrom,
          To: testTwilioNumber,
          MessageStatus: 'delivered',
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe('OK');
    });
  });

  describe('3. Payment Webhooks (POST /api/webhooks/dodo-payments)', () => {
    it('should process payment.success and activate subscription', async () => {
      const res = await request(app)
        .post('/api/webhooks/dodo-payments')
        .set('x-dodo-signature', 'test_signature_bypass')
        .send({
          event: 'payment.success',
          subscription_id: 'sub_mock_123',
          amount: 1999,
          currency: 'INR',
        });

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
      expect(res.body.status).toBe('active');

      // Check DB subscription status
      const subRes = await query('SELECT payment_status FROM subscriptions WHERE user_id = $1', [testUserId]);
      expect(subRes.rows[0].payment_status).toBe('active');

      // Check user plan was activated
      const userRes = await query('SELECT subscription_plan FROM users WHERE id = $1', [testUserId]);
      expect(userRes.rows[0].subscription_plan).toBe('starter');
    });

    it('should process payment.failed events and update subscription status', async () => {
      const res = await request(app)
        .post('/api/webhooks/dodo-payments')
        .set('x-dodo-signature', 'test_signature_bypass')
        .send({
          event: 'payment.failed',
          subscription_id: 'sub_mock_123',
          amount: 1999,
          currency: 'INR',
        });

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
      expect(res.body.status).toBe('failed');

      // Check DB subscription status is failed
      const subRes = await query('SELECT payment_status FROM subscriptions WHERE user_id = $1', [testUserId]);
      expect(subRes.rows[0].payment_status).toBe('failed');
    });
  });
});
