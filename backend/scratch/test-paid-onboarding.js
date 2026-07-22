require('dotenv').config();
const db = require('../database/db');
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
  id: '88888888-8888-8888-8888-888888888888',
  email: 'paidonboardingtester@bavio.in',
  phone: '+15555550299'
};

async function runPaidOnboardingTests() {
  console.log('🧪 Starting Pure-JS Paid Onboarding & Access Control Verification...');

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
    await db.query('DELETE FROM knowledge_base_docs WHERE business_id = $1', [mockUser.id]);
    await db.query('DELETE FROM payment_logs WHERE business_id = $1', [mockUser.id]);
    await db.query('DELETE FROM businesses WHERE id = $1', [mockUser.id]);
    console.log('✅ Cleaned up test database records.');

    // 1. Signup fresh user (inactive subscription)
    const reqSignup = {
      body: {
        name: 'Apex Health Clinic',
        email: mockUser.email,
        phone: mockUser.phone,
        password: 'Password123!',
        countryCode: 'US',
        dialCode: '+1',
        phoneNumber: '5555550299',
        industry: 'Healthcare'
      }
    };
    const resSignup = mockRes();
    await authController.signup(reqSignup, resSignup);
    console.log('TEST 1 - Account Registration:', resSignup.statusCode || 201);

    // 2. Test Access Control Block (Unpaid access to /onboarding/business)
    const reqUnpaid = { user: mockUser, body: { businessName: 'Apex Health', industry: 'Healthcare' } };
    const resUnpaid = mockRes();
    await onboardingController.saveBusinessStep(reqUnpaid, resUnpaid);
    console.log('TEST 2 - Access Control Block (Unpaid):', resUnpaid.statusCode, resUnpaid.jsonData);

    if (resUnpaid.statusCode !== 403 || resUnpaid.jsonData.error !== 'subscription_required') {
      throw new Error('Access control failed to block unpaid user from onboarding API');
    }
    console.log('✅ TEST 2 PASSED: Access control blocked unpaid account with 403 Forbidden.');

    // 3. Simulate Active Subscription
    await db.query("UPDATE businesses SET status = 'active', subscription_status = 'active', plan = 'pro', plan_name = 'growth' WHERE id = $1", [mockUser.id]);
    console.log('ℹ️ Subscription activated for test user.');

    // 4. STEP 1 — BUSINESS (/onboarding/business)
    const reqStep1 = {
      user: mockUser,
      body: {
        businessName: 'Apex Health Clinic',
        industry: 'Healthcare',
        businessDescription: 'Leading medical and wellness provider.',
        website: 'https://apexhealth.com',
        country: 'US',
        timezone: 'EST',
        businessPhone: '+15555550299',
        officeHours: 'Mon-Fri 9AM-5PM',
        locationsServed: 'Greater Boston Area',
        servicesProvided: 'General Consultations, Urgent Care'
      }
    };
    const resStep1 = mockRes();
    await onboardingController.saveBusinessStep(reqStep1, resStep1);
    console.log('TEST 3 - Step 1 Business:', resStep1.statusCode || 200, resStep1.jsonData);
    if (!resStep1.jsonData.success || resStep1.jsonData.nextStep !== '/onboarding/knowledge') {
      throw new Error('Step 1 Business save failed');
    }
    console.log('✅ TEST 3 PASSED: Step 1 Business details saved.');

    // 5. STEP 2 — KNOWLEDGE (/onboarding/knowledge)
    const reqStep2 = {
      user: mockUser,
      body: {
        faqs: [
          { question: 'Do you accept insurance?', answer: 'Yes, we accept major insurance providers.' }
        ],
        serviceDetails: 'Full outpatient services and wellness checkups.',
        pricingGuidance: 'Consultations start at $99.',
        policies: '24-hour cancellation required.',
        importantInstructions: 'Bring photo ID and insurance card.',
        qualificationQuestions: 'Are you a new or existing patient?',
        doNotInvent: 'Never promise free treatment.'
      }
    };
    const resStep2 = mockRes();
    await onboardingController.saveKnowledgeStep(reqStep2, resStep2);
    console.log('TEST 4 - Step 2 Knowledge:', resStep2.statusCode || 200, resStep2.jsonData);
    if (!resStep2.jsonData.success || resStep2.jsonData.nextStep !== '/onboarding/agent') {
      throw new Error('Step 2 Knowledge save failed');
    }
    console.log('✅ TEST 4 PASSED: Step 2 Knowledge base saved.');

    // 6. STEP 3 — AGENT (/onboarding/agent)
    const reqStep3 = {
      user: mockUser,
      body: {
        assistantName: 'Sarah',
        language: 'en-US',
        voice: 'meera',
        greeting: 'Hello! Thank you for calling Apex Health Clinic. I am Sarah. How can I help you today?',
        tone: 'warm and professional',
        mainResponsibilities: 'Schedule appointments and capture patient inquiries.',
        leadInfoToCapture: 'Full Name, Phone Number, Service Needed',
        escalationRules: 'Transfer urgent calls immediately.',
        humanContactNumber: '+15559021100'
      }
    };
    const resStep3 = mockRes();
    await onboardingController.saveAgentStep(reqStep3, resStep3);
    console.log('TEST 5 - Step 3 Agent:', resStep3.statusCode || 200, resStep3.jsonData);
    if (!resStep3.jsonData.success || resStep3.jsonData.nextStep !== '/onboarding/phone') {
      throw new Error('Step 3 Agent save failed');
    }
    console.log('✅ TEST 5 PASSED: Step 3 AI Agent persona saved.');

    // 7. STEP 4 — PHONE (/onboarding/phone)
    const reqStep4 = {
      user: mockUser,
      body: { country: 'US' }
    };
    const resStep4 = mockRes();
    await onboardingController.assignPhone(reqStep4, resStep4);
    console.log('TEST 6 - Step 4 Phone:', resStep4.statusCode || 200, resStep4.jsonData);
    if (!resStep4.jsonData.success || !resStep4.jsonData.phoneNumber || resStep4.jsonData.nextStep !== '/onboarding/test-call') {
      throw new Error('Step 4 Phone provisioning failed');
    }
    console.log('✅ TEST 6 PASSED: Step 4 Twilio virtual line provisioned & mapped.');

    // 8. STEP 5 — TEST CALL (/onboarding/test-call)
    const reqStep5 = { user: mockUser };
    const resStep5 = mockRes();
    await onboardingController.testCallStep(reqStep5, resStep5);
    console.log('TEST 7 - Step 5 Test Call:', resStep5.statusCode || 200, resStep5.jsonData);
    if (!resStep5.jsonData.success || resStep5.jsonData.nextStep !== '/onboarding/complete') {
      throw new Error('Step 5 Test call step failed');
    }
    console.log('✅ TEST 7 PASSED: Step 5 Test call step verified.');

    // 9. STEP 6 — COMPLETE (/onboarding/complete)
    const reqStep6 = { user: mockUser };
    const resStep6 = mockRes();
    await onboardingController.completeOnboardingStep(reqStep6, resStep6);
    console.log('TEST 8 - Step 6 Complete:', resStep6.statusCode || 200, resStep6.jsonData);
    if (!resStep6.jsonData.success || resStep6.jsonData.nextRoute !== '/dashboard') {
      throw new Error('Step 6 Complete step failed');
    }
    console.log('✅ TEST 8 PASSED: Step 6 Onboarding complete & summary verified.');

  } finally {
    if (db.supabase?.auth?.admin && originalCreateUser) {
      db.supabase.auth.admin.createUser = originalCreateUser;
    }
  }

  console.log('\n🎉 ALL PAID ONBOARDING INTEGRATION TESTS PASSED SUCCESSFULLY!');
}

runPaidOnboardingTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Integration Tests Failed:', err);
    process.exit(1);
  });
