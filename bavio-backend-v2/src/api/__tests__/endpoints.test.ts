import request from 'supertest';
import { app } from '../../index';
import { query } from '../../db/db';

describe('Bavio Multi-Country REST API Endpoints Integration Tests', () => {
  let testUserToken = '';
  let testUserId = '';
  let testEmail = '';

  beforeAll(async () => {
    // Generate unique email for this test run
    const uuid = require('crypto').randomUUID();
    testEmail = `api-test-${uuid}@bavio.ai`;
  });

  afterAll(async () => {
    if (testUserId) {
      console.log('🧹 Cleaning up test user and related subscription logs...');
      // Cascade delete will clean up subscriptions, calls, virtual_numbers, and usage_logs
      await query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
  });

  describe('1. POST /api/auth/signup', () => {
    it('should fail if required parameters are missing', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: testEmail
          // missing password and other details
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error_code).toBe('VALIDATION_ERROR');
    });

    it('should fail with invalid country code', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: 'securePassword123',
          business_name: 'Invalid Country Corp',
          business_phone: '1234567890',
          industry: 'legal',
          country_code: 'XY' // Invalid
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Unsupported country code');
    });

    it('should sign up a user successfully and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: 'securePassword123',
          business_name: 'API Testing India Co',
          business_phone: '7569960503',
          industry: 'real_estate',
          country_code: 'IN'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.country).toBe('IN');
      expect(res.body.currency).toBe('INR');
      
      const data = res.body.data;
      expect(data.user_id).toBeDefined();
      expect(data.token).toBeDefined();
      expect(data.country_code).toBe('IN');
      expect(data.currency).toBe('INR');
      expect(data.next_step).toBe('select_plan');

      testUserId = data.user_id;
      testUserToken = data.token;
    });
  });

  describe('2. GET /api/pricing', () => {
    it('should fetch pricing tiers for India (INR)', async () => {
      const res = await request(app)
        .get('/api/pricing?country=IN');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.country).toBe('IN');
      expect(res.body.currency).toBe('INR');

      const data = res.body.data;
      expect(data.plans).toHaveLength(3); // starter, growth, scale
      expect(data.plans[0].name).toBe('starter');
      expect(data.plans[0].price).toBe(1999);
      expect(data.plans[0].currency).toBe('INR');
      expect(data.plans[0].minutes).toBe(200);
    });

    it('should fetch pricing tiers for US (USD)', async () => {
      const res = await request(app)
        .get('/api/pricing?country=US');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.country).toBe('US');
      expect(res.body.currency).toBe('USD');

      const data = res.body.data;
      expect(data.plans[0].name).toBe('starter');
      expect(data.plans[0].price).toBe(39);
      expect(data.plans[0].currency).toBe('USD');
    });
  });

  describe('3. POST /api/numbers/assign', () => {
    it('should deny unauthorized access', async () => {
      const res = await request(app)
        .post('/api/numbers/assign')
        .send({
          user_id: testUserId,
          country_code: 'IN'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Missing or invalid Authorization');
    });

    it('should assign a virtual number successfully for authenticated Indian user', async () => {
      const res = await request(app)
        .post('/api/numbers/assign')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          user_id: testUserId,
          country_code: 'IN'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.country).toBe('IN');
      
      const data = res.body.data;
      expect(data.phone_number).toBeDefined();
      expect(data.phone_number).toContain('+918080'); // Exotel India mock prefix
      expect(data.provider).toBe('exotel');
      expect(data.country).toBe('IN');
      expect(data.next_step).toBe('enable_call_forward');
    });

    it('should return the same virtual number on duplicate assign calls (prevention)', async () => {
      const res1 = await request(app)
        .post('/api/numbers/assign')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          user_id: testUserId,
          country_code: 'IN'
        });

      const res2 = await request(app)
        .post('/api/numbers/assign')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          user_id: testUserId,
          country_code: 'IN'
        });

      expect(res1.body.data.phone_number).toBe(res2.body.data.phone_number);
    });
  });

  describe('4. GET /api/calls', () => {
    it('should retrieve call logs for the user (seeding mock call first)', async () => {
      // Seed a call log manually for this test user
      const mockCallSid = `sid_call_test_${require('crypto').randomUUID()}`;
      await query(
        `INSERT INTO calls (user_id, country_code, call_sid, provider, from_number, to_number, virtual_number, duration_seconds, status, cost_amount, cost_currency) 
         VALUES ($1, 'IN', $2, 'exotel', '+919876543210', '+918080274248', '+918080274248', 240, 'completed', 2.40, 'INR')`,
        [testUserId, mockCallSid]
      );

      const res = await request(app)
        .get('/api/calls?limit=10&offset=0')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.country).toBe('IN');
      expect(res.body.currency).toBe('INR');

      const data = res.body.data;
      expect(data.user_id).toBe(testUserId);
      expect(data.country).toBe('IN');
      expect(data.calls).toHaveLength(1);
      expect(data.calls[0].from).toBe('+919876543210');
      expect(data.calls[0].duration).toBe(240);
      expect(data.calls[0].cost).toBe(2.4);
      expect(data.calls[0].currency).toBe('INR');
      expect(data.total_calls).toBe(1);
      expect(data.total_cost).toBe(2.4);
      expect(data.total_cost_currency).toBe('INR');
    });
  });

  describe('5. POST /api/billing/charge', () => {
    it('should process plan billing charge and activate subscription', async () => {
      const res = await request(app)
        .post('/api/billing/charge')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          plan: 'growth'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.country).toBe('IN');
      expect(res.body.currency).toBe('INR');

      const data = res.body.data;
      expect(data.user_id).toBe(testUserId);
      expect(data.plan).toBe('growth');
      expect(data.amount).toBe(3999);
      expect(data.currency).toBe('INR');
      expect(data.payment_method).toBe('dodo_payments');
      expect(data.status).toBe('success');
      expect(data.period_start).toBeDefined();
      expect(data.period_end).toBeDefined();
    });
  });

  describe('6. GET /api/subscription', () => {
    it('should return subscription details in user regional currency (INR)', async () => {
      const res = await request(app)
        .get('/api/subscription')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.country).toBe('IN');
      expect(res.body.currency).toBe('INR');

      const data = res.body.data;
      expect(data.user_id).toBe(testUserId);
      expect(data.country).toBe('IN');
      expect(data.current_plan).toBe('growth');
      expect(data.price).toBe(3999);
      expect(data.currency).toBe('INR');
      expect(data.minutes_limit).toBe(500); // growth plan limit
      expect(data.payment_status).toBe('active');
    });
  });
});
