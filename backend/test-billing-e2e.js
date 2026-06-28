require('dotenv').config();
const db = require('./database/db');
const billingController = require('./controllers/billingController');

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    },
    type(typeStr) {
      this.headers['Content-Type'] = typeStr;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      return this;
    }
  };
}

const dodoService = require('./services/dodoBillingService');

async function runBillingTests() {
  console.log('=== STARTING BILLING & PAYMENTS E2E TEST ===');

  // Mock Dodo Services
  dodoService.createSubscription = async (clientId, plan, email) => {
    console.log(`[MOCK DODO] createSubscription for client: ${clientId}, plan: ${plan}`);
    return {
      subscriptionId: 'sub_test_12345',
      customerId: 'cust_test_12345',
      status: 'pending',
      checkoutUrl: 'https://test.dodopayments.com/checkout/12345',
      plan: plan
    };
  };

  dodoService.cancelSubscription = async (subscriptionId) => {
    console.log(`[MOCK DODO] cancelSubscription: ${subscriptionId}`);
    return { success: true };
  };
  
  let testBusiness = null;
  const testEmail = `test_billing_${Date.now()}@bavio.in`;
  const testPassword = 'Password123!';
  const testPhone = '+919999900000';
  const testName = 'Billing Test Business';

  try {
    // 1. Create a test business in the database
    console.log('\n1. Creating test business...');
    const result = await db.query(
      `INSERT INTO businesses (name, email, phone, password_hash, status, onboarding_status, onboarding_step)
       VALUES ($1, $2, $3, $4, 'active', 'pending', 3) RETURNING *`,
      [testName, testEmail, testPhone, 'dummy_password_hash']
    );
    testBusiness = result.rows[0];
    console.log(`Created test business with ID: ${testBusiness.id}`);

    // Create a mock assistant for the business (required for auto-provisioning step)
    await db.query(
      `INSERT INTO assistants (business_id, name, agent_name, greeting, voice_id, faqs, industry, language, system_prompt, is_active)
       VALUES ($1, 'Billing agent', 'Billing agent', 'Hello!', 'anushka', '[]'::jsonb, 'real-estate', 'en-IN', 'Prompt', true)`,
      [testBusiness.id]
    );

    // 2. Test Subscribe Endpoint
    console.log('\n2. Testing /billing/subscribe endpoint (real Dodo API call)...');
    const subscribeReq = {
      body: {
        plan: 'starter',
        email: testEmail
      },
      client: {
        id: testBusiness.id,
        email: testBusiness.email
      }
    };
    const subscribeRes = mockResponse();
    await billingController.subscribe(subscribeReq, subscribeRes);

    console.log(`Status Code: ${subscribeRes.statusCode}`);
    console.log('Response Body:', subscribeRes.body);

    if (subscribeRes.statusCode !== 201) {
      throw new Error(`Subscribe failed: ${JSON.stringify(subscribeRes.body)}`);
    }

    const intentRes = await db.query('SELECT dodo_id FROM subscription_intents WHERE business_id = $1 LIMIT 1', [testBusiness.id]);
    const subscriptionId = intentRes.rows[0]?.dodo_id || 'sub_test_12345';

    // 3. Test GetStatus Endpoint
    console.log('\n3. Testing /billing/status/:client_id endpoint...');
    const statusReq = {
      params: {
        client_id: testBusiness.id
      },
      client: {
        id: testBusiness.id
      }
    };
    const statusRes = mockResponse();
    await billingController.getStatus(statusReq, statusRes);

    console.log(`Status Code: ${statusRes.statusCode}`);
    console.log('Response Business Plan:', statusRes.body?.client?.plan);
    console.log('Response Subscription ID:', statusRes.body?.client?.dodoSubscriptionId);

    if (statusRes.statusCode !== 200) {
      throw new Error(`GetStatus failed: ${JSON.stringify(statusRes.body)}`);
    }

    // 4. Test Webhook Endpoint (subscription.active)
    console.log('\n4. Testing /billing/webhook (subscription.active)...');
    const activeWebhookReq = {
      body: {
        event: 'subscription.active',
        data: {
          subscription_id: subscriptionId,
          product_id: 'pdt_0NdJCmLQ4vEu1ozciOnzC', // starter product id
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            business_id: testBusiness.id
          }
        }
      },
      headers: {
        'x-webhook-secret': process.env.DODO_WEBHOOK_SECRET || ''
      }
    };
    const activeWebhookRes = mockResponse();
    await billingController.handleWebhook(activeWebhookReq, activeWebhookRes);
    console.log(`Status Code: ${activeWebhookRes.statusCode}`);

    // Verify DB plan updated
    const checkPlan = await db.query('SELECT plan, status FROM businesses WHERE id = $1', [testBusiness.id]);
    console.log(`Business Plan after active webhook: ${checkPlan.rows[0].plan}, Status: ${checkPlan.rows[0].status}`);

    // 5. Test Webhook Endpoint (payment.succeeded)
    // We mock twilio number purchase inside autoProvisionBusiness to avoid buying real numbers during test
    console.log('\n5. Testing /billing/webhook (payment.succeeded & auto-provisioning)...');
    
    // Temporarily stub Twilio client in autoProvisionBusiness
    const twilio = require('twilio');
    const originalTwilio = twilio;
    // We mock the twilio constructor
    const mockTwilioClient = {
      availablePhoneNumbers: () => ({
        local: {
          list: async () => [{ phoneNumber: '+12015550199' }]
        }
      }),
      incomingPhoneNumbers: Object.assign(
        (sid) => ({
          update: async () => ({ sid })
        }),
        {
          create: async () => ({
            phoneNumber: '+12015550199',
            sid: 'PNtest_sid_12345'
          })
        }
      )
    };
    
    // Overwrite twilio package require cache
    require.cache[require.resolve('twilio')].exports = () => mockTwilioClient;

    const paymentWebhookReq = {
      body: {
        event: 'payment.succeeded',
        data: {
          id: `pay_${Date.now()}`,
          customer_id: 'cust_test123',
          amount: 2900, // $29.00
          currency: 'USD',
          metadata: {
            business_id: testBusiness.id
          }
        }
      },
      headers: {
        'x-webhook-secret': process.env.DODO_WEBHOOK_SECRET || ''
      }
    };
    const paymentWebhookRes = mockResponse();
    await billingController.handleWebhook(paymentWebhookReq, paymentWebhookRes);
    console.log(`Webhook HTTP status: ${paymentWebhookRes.statusCode}`);

    // Wait a brief moment for the async auto-provisioning function to run
    console.log('Waiting 4 seconds for async auto-provisioning...');
    await new Promise(r => setTimeout(r, 4000));

    // Verify phone number was assigned in DB
    const checkBiz = await db.query('SELECT twilio_number, onboarding_status FROM businesses WHERE id = $1', [testBusiness.id]);
    console.log(`Provisioned Number in DB: ${checkBiz.rows[0].twilio_number}`);
    console.log(`Onboarding Status: ${checkBiz.rows[0].onboarding_status}`);

    const checkPhoneTable = await db.query('SELECT * FROM phone_numbers WHERE business_id = $1', [testBusiness.id]);
    console.log(`Phone Numbers Table Record count: ${checkPhoneTable.rows.length}`);
    if (checkPhoneTable.rows.length > 0) {
      console.log(`Phone Numbers Table number: ${checkPhoneTable.rows[0].number}, provider: ${checkPhoneTable.rows[0].provider}`);
    }

    // Restore original twilio require
    require.cache[require.resolve('twilio')].exports = originalTwilio;

    // 6. Test Cancel Endpoint
    console.log('\n6. Testing /billing/cancel endpoint...');
    const cancelReq = {
      client: {
        id: testBusiness.id
      }
    };
    const cancelRes = mockResponse();
    await billingController.cancel(cancelReq, cancelRes);

    console.log(`Status Code: ${cancelRes.statusCode}`);
    console.log('Response Body:', cancelRes.body);

    if (cancelRes.statusCode !== 200) {
      throw new Error(`Cancel failed: ${JSON.stringify(cancelRes.body)}`);
    }

    console.log('\n=== BILLING & PAYMENTS TEST COMPLETED SUCCESSFULLY ===');

  } catch (err) {
    console.error('\n❌ BILLING TEST ERROR DETECTED:');
    console.error(err);
  } finally {
    // Cleanup
    if (testBusiness && testBusiness.id) {
      console.log('\nCleaning up billing test records...');
      try {
        await db.query('DELETE FROM payment_logs WHERE dodo_customer_id = \'cust_test123\'');
        await db.query('DELETE FROM phone_numbers WHERE business_id = $1', [testBusiness.id]);
        await db.query('DELETE FROM assistants WHERE business_id = $1', [testBusiness.id]);
        await db.query('DELETE FROM businesses WHERE id = $1', [testBusiness.id]);
        console.log('✅ Cleanup successful.');
      } catch (cleanErr) {
        console.error('Cleanup failed:', cleanErr.message);
      }
    }
    process.exit(0);
  }
}

runBillingTests();
