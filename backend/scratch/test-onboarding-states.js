require('dotenv').config();
const db = require('../database/db');
const billingController = require('../controllers/billingController');
const authController = require('../controllers/authController');
const onboardingController = require('../controllers/onboardingController');

// Helper to mock Express response
const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

const mockUser = {
  id: '99999999-9999-9999-9999-999999999999',
  email: 'paymentlaunchtester@bavio.in',
  phone: '+15555550199'
};

async function runOnboardingStateTests() {
  console.log('🧪 Starting Pure-JS Payment-First State Machine Verification...');
  
  // Save original Supabase create user function to restore later
  const originalCreateUser = db.supabase?.auth?.admin?.createUser;
  if (db.supabase?.auth?.admin) {
    db.supabase.auth.admin.createUser = async (params) => {
      return {
        data: {
          user: {
            id: mockUser.id,
            email: params.email,
            phone: params.phone,
            user_metadata: params.user_metadata
          }
        },
        error: null
      };
    };
  }

  try {
    // 0. Clean up previous test runs
    await db.query('DELETE FROM assistants WHERE business_id = $1', [mockUser.id]);
    await db.query('DELETE FROM phone_numbers WHERE business_id = $1', [mockUser.id]);
    await db.query('DELETE FROM payment_logs WHERE business_id = $1', [mockUser.id]);
    await db.query('DELETE FROM subscription_intents WHERE business_id = $1', [mockUser.id]);
    await db.query('DELETE FROM demo_sessions WHERE user_id = $1', [mockUser.id]);
    await db.query('DELETE FROM businesses WHERE id = $1', [mockUser.id]);
    console.log('✅ Cleaned up old test database records.');

    // ─── TEST 1: Pricing Endpoint USD Config ───
    const resPricing = mockRes();
    await billingController.getPricing({}, resPricing);
    console.log('TEST 1 - GET /billing/pricing:', resPricing.statusCode || 200, resPricing.jsonData);
    
    const starterPlan = resPricing.jsonData.plans.find(p => p.id === 'starter');
    if (!starterPlan || starterPlan.currency !== 'USD' || starterPlan.monthlyPrice !== 19) {
      throw new Error('Pricing configuration not set to USD or price values incorrect');
    }
    console.log('✅ TEST 1 PASSED: Pricing config is correct and set to USD.');

    // ─── TEST 2: Signup Initial States ───
    const reqSignup = {
      body: {
        name: 'Test Business Corp',
        email: mockUser.email,
        phone: mockUser.phone,
        password: 'Password123!',
        countryCode: 'US',
        dialCode: '+1',
        phoneNumber: '5555550199',
        industry: 'Healthcare'
      }
    };
    const resSignup = mockRes();
    await authController.signup(reqSignup, resSignup);
    console.log('TEST 2 - POST /auth/signup:', resSignup.statusCode || 201, resSignup.jsonData);
    
    // Verify DB states
    const bizCheck = await db.query('SELECT status, subscription_status, onboarding_status, onboarding_step, minutes_limit FROM businesses WHERE id = $1', [mockUser.id]);
    const biz = bizCheck.rows[0];
    console.log('TEST 2 - Initial Business Row:', biz);
    
    if (biz.status !== 'active' || biz.subscription_status !== 'inactive' || biz.onboarding_status !== 'pre_payment' || biz.onboarding_step !== 0 || Number(biz.minutes_limit) !== 0) {
      throw new Error('Initial account states did not match target registration settings');
    }
    console.log('✅ TEST 2 PASSED: Initial account states set correctly.');

    // ─── TEST 3: Pre-payment Profile Routing ───
    const reqProfile = { user: mockUser };
    const resProfile = mockRes();
    await authController.getProfile(reqProfile, resProfile);
    console.log('TEST 3 - GET /auth/profile (Pre-payment):', resProfile.statusCode || 200, resProfile.jsonData);
    if (resProfile.jsonData.nextRoute !== '/demo' || resProfile.jsonData.subscription_status !== 'inactive' || resProfile.jsonData.onboarding_status !== 'pre_payment' || resProfile.jsonData.account_status !== 'registered' || resProfile.jsonData.status !== 'registered') {
      throw new Error('Pre-payment routing verification failed');
    }
    console.log('✅ TEST 3 PASSED: Pre-payment profile routing correctly resolves to /demo.');

    // ─── TEST 4: Telephony Assignment Rejection (Pre-payment) ───
    const reqPhone = {
      user: mockUser,
      body: { country: 'US' }
    };
    const resPhone = mockRes();
    await onboardingController.assignPhone(reqPhone, resPhone);
    console.log('TEST 4 - POST /onboarding/assign-phone (Pre-payment):', resPhone.statusCode, resPhone.jsonData);
    if (resPhone.statusCode !== 403 || resPhone.jsonData.error !== 'subscription_required') {
      throw new Error('Pre-payment telephone provisioning was not rejected');
    }
    console.log('✅ TEST 4 PASSED: Blocked number provisioning for unpaid account.');

    // ─── TEST 5: Simulate Dodo Payment Webhook ───
    const reqWebhook = {
      body: {
        event: 'order.completed',
        orderId: 'sub_test_order_12345',
        customerId: 'cust_test_dodo_123',
        status: 'SUCCESS',
        metadata: {
          business_id: mockUser.id,
          plan: 'growth',
          billing_cycle: 'monthly'
        }
      }
    };
    const resWebhook = mockRes();
    await billingController.handleDodoWebhook(reqWebhook, resWebhook);
    console.log('TEST 5 - Dodo Webhook (order.completed):', resWebhook.statusCode || 200, resWebhook.jsonData);

    // Verify DB states after webhook
    const bizWebhookCheck = await db.query('SELECT status, subscription_status, onboarding_status, onboarding_step, minutes_limit, plan_name, twilio_number FROM businesses WHERE id = $1', [mockUser.id]);
    const bizWeb = bizWebhookCheck.rows[0];
    console.log('TEST 5 - Business Row Post-webhook:', bizWeb);
    
    if (bizWeb.status !== 'active' || bizWeb.subscription_status !== 'active' || bizWeb.onboarding_status !== 'pending' || bizWeb.onboarding_step !== 0 || Number(bizWeb.minutes_limit) !== 500) {
      throw new Error('Subscription active webhook DB transitions failed');
    }
    if (bizWeb.twilio_number !== null) {
      throw new Error('Twilio number was purchased during webhook processing');
    }
    console.log('✅ TEST 5 PASSED: Webhook updated subscription and did NOT provision number.');

    // ─── TEST 6: Active Subscription Profile Routing ───
    const resProfilePost = mockRes();
    await authController.getProfile(reqProfile, resProfilePost);
    console.log('TEST 6 - GET /auth/profile (Post-payment):', resProfilePost.statusCode || 200, resProfilePost.jsonData);
    if (resProfilePost.jsonData.nextRoute !== '/onboarding' || resProfilePost.jsonData.subscription_status !== 'active' || resProfilePost.jsonData.onboarding_status !== 'pending') {
      throw new Error('Post-payment routing verification failed');
    }
    console.log('✅ TEST 6 PASSED: Post-payment profile routing correctly resolves to /onboarding.');

    // ─── TEST 7: Telephony Assignment Acceptance (Post-payment) ───
    const resPhonePost = mockRes();
    await onboardingController.assignPhone(reqPhone, resPhonePost);
    console.log('TEST 7 - POST /onboarding/assign-phone (Post-payment):', resPhonePost.statusCode || 200, resPhonePost.jsonData);
    
    const finalBizCheck = await db.query('SELECT twilio_number FROM businesses WHERE id = $1', [mockUser.id]);
    console.log('TEST 7 - Provisioned Phone Number:', finalBizCheck.rows[0].twilio_number);
    if (!finalBizCheck.rows[0].twilio_number) {
      throw new Error('Telephony provisioning failed after active subscription verification');
    }
    console.log('✅ TEST 7 PASSED: Telephony provisioning successful for active subscriber.');

  } finally {
    // Restore original createUser function
    if (db.supabase?.auth?.admin && originalCreateUser) {
      db.supabase.auth.admin.createUser = originalCreateUser;
    }
  }

  console.log('\n🎉 ALL ONBOARDING STATE MACHINE TESTS PASSED SUCCESSFULLY!');
}

runOnboardingStateTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Integration Tests Failed:', err);
    process.exit(1);
  });
