require('dotenv').config();
const axios = require('axios');
const db = require('../database/db');

const BASE_URL = 'http://localhost:5000';

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('   BAVIO BILLING SUBSCRIBE ROUTE UNIT TESTS    ');
  console.log('═══════════════════════════════════════════════\n');

  let testBusinessId = null;
  let testEmail = `billing-test-${Math.random().toString(36).substring(2, 10)}@bavio.in`;
  let token = null;

  try {
    // ── 1. TEST 401: No JWT Token ──
    console.log('📋 TEST 1: Request without JWT token');
    try {
      await axios.post(`${BASE_URL}/billing/subscribe`, {
        plan: 'growth',
        billingCycle: 'monthly'
      });
      console.error('❌ Failed: Expected 401 error, but request succeeded.');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log(`✅ Passed: Status 401 returned. Message: "${err.response.data.error}"`);
      } else {
        console.error('❌ Failed: Unexpected response:', err.response?.status, err.response?.data);
      }
    }

    // ── 2. Create a test user via signup to get a valid token ──
    const randomPhone = '+1555' + Math.floor(1000000 + Math.random() * 9000000);
    console.log(`\nCreating test user for auth tests with email ${testEmail} and phone ${randomPhone}...`);
    const signupRes = await axios.post(`${BASE_URL}/auth/signup`, {
      name: 'Billing Test Business',
      email: testEmail,
      phone: randomPhone,
      password: 'Password123!',
      country_code: 'US'
    });

    if (signupRes.data && signupRes.data.token) {
      token = signupRes.data.token;
      testBusinessId = signupRes.data.client_id;
      console.log(`✅ Test user created. Token obtained. Business ID: ${testBusinessId}`);
    } else {
      throw new Error('Failed to create test user.');
    }

    const authHeaders = { Authorization: `Bearer ${token}` };

    // ── 3. TEST 400: Invalid Plan ──
    console.log('\n📋 TEST 2: Request with invalid plan');
    try {
      await axios.post(
        `${BASE_URL}/billing/subscribe`,
        { plan: 'invalid_plan_type', billingCycle: 'monthly' },
        { headers: authHeaders }
      );
      console.error('❌ Failed: Expected 400 error, but request succeeded.');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`✅ Passed: Status 400 returned. Message: "${err.response.data.error}"`);
      } else {
        console.error('❌ Failed: Unexpected response:', err.response?.status, err.response?.data);
      }
    }

    // ── 4. TEST 400: Invalid Billing Cycle ──
    console.log('\n📋 TEST 3: Request with invalid billing cycle');
    try {
      await axios.post(
        `${BASE_URL}/billing/subscribe`,
        { plan: 'growth', billingCycle: 'weekly' },
        { headers: authHeaders }
      );
      console.error('❌ Failed: Expected 400 error, but request succeeded.');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`✅ Passed: Status 400 returned. Message: "${err.response.data.error}"`);
      } else {
        console.error('❌ Failed: Unexpected response:', err.response?.status, err.response?.data);
      }
    }

    // ── 5. TEST 201: Success case (Growth plan, Monthly) ──
    console.log('\n📋 TEST 4: Successful subscription checkout (Growth, Monthly)');
    const successRes = await axios.post(
      `${BASE_URL}/billing/subscribe`,
      { plan: 'growth', billingCycle: 'monthly' },
      { headers: authHeaders }
    );

    if (successRes.status === 201 && successRes.data.success) {
      console.log('✅ Passed: Subscription checkout created successfully.');
      console.log('  Response checkout_url:', successRes.data.checkout_url);
      console.log('  Response plan:', successRes.data.plan);
      console.log('  Response billingCycle:', successRes.data.billingCycle);

      // Verify Database records
      // a. Check businesses record
      const bizRes = await db.query('SELECT plan, plan_name, status, billing_cycle, assistant_id FROM businesses WHERE id = $1', [testBusinessId]);
      const biz = bizRes.rows[0];
      console.log('\n🔍 Database Business record:');
      console.log(`  - plan: ${biz.plan} (expected: pro)`);
      console.log(`  - plan_name: ${biz.plan_name} (expected: growth)`);
      console.log(`  - status: ${biz.status} (expected: active)`);
      console.log(`  - billing_cycle: ${biz.billing_cycle} (expected: monthly)`);

      if (biz.plan === 'pro' && biz.status === 'active' && biz.billing_cycle === 'monthly') {
        console.log('✅ Passed: Business record correctly updated in DB.');
      } else {
        console.error('❌ Failed: Business record mismatch in DB:', biz);
      }

      // b. Check assistant provisioned
      const astRes = await db.query('SELECT name, agent_name, language, greeting, first_message, system_prompt, industry FROM assistants WHERE business_id = $1', [testBusinessId]);
      const ast = astRes.rows[0];
      console.log('\n🔍 Database Assistant record:');
      console.log(`  - name: "${ast.name}" (expected: "AI Receptionist - GROWTH")`);
      console.log(`  - language: "${ast.language}" (expected: "en")`);
      console.log(`  - greeting / first_message: "${ast.first_message}" (expected: "Hello! How can I help you?")`);

      if (ast && ast.language === 'en' && ast.first_message === 'Hello! How can I help you?') {
        console.log('✅ Passed: Default assistant successfully provisioned and saved.');
      } else {
        console.error('❌ Failed: Assistant record mismatch or not found in DB.');
      }

      // c. Check subscription intent saved
      const intentRes = await db.query('SELECT * FROM subscription_intents WHERE business_id = $1', [testBusinessId]);
      const intent = intentRes.rows[0];
      console.log('\n🔍 Database Subscription Intent record:');
      console.log(`  - plan: ${intent.plan} (expected: growth)`);
      console.log(`  - billing_cycle: ${intent.billing_cycle} (expected: monthly)`);
      console.log(`  - status: ${intent.status} (expected: pending)`);

      if (intent && intent.plan === 'growth' && intent.status === 'pending') {
        console.log('✅ Passed: Subscription intent successfully recorded.');
      } else {
        console.error('❌ Failed: Subscription intent record mismatch in DB:', intent);
      }

    } else {
      throw new Error(`Failed to create checkout: ${successRes.status} ${JSON.stringify(successRes.data)}`);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.response?.data || error.message);
  } finally {
    if (testBusinessId) {
      console.log('\n🧹 Cleaning up test data...');
      await db.query('DELETE FROM assistants WHERE business_id = $1', [testBusinessId]);
      await db.query('DELETE FROM subscription_intents WHERE business_id = $1', [testBusinessId]);
      await db.query('DELETE FROM businesses WHERE id = $1', [testBusinessId]);
      console.log('  Clean up completed.');
    }
    await db.pool.end();
    console.log('\n═══════════════════════════════════════════════');
    console.log('   TEST RUN COMPLETED');
    console.log('═══════════════════════════════════════════════');
  }
}

main();
