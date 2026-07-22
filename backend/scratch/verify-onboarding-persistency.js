require('dotenv').config();
const db = require('../database/db');
const onboardingController = require('../controllers/onboardingController');

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
  id: '77777777-7777-7777-7777-777777777777',
  email: 'acceptance-realty@bavio.in'
};

async function runPersistencyTest() {
  console.log('🧪 Running Onboarding Configuration Persistency Validation...');

  // Setup/clean test business
  await db.query('DELETE FROM assistants WHERE business_id = $1', [mockUser.id]);
  await db.query('DELETE FROM phone_numbers WHERE business_id = $1', [mockUser.id]);
  await db.query('DELETE FROM businesses WHERE id = $1', [mockUser.id]);
  
  await db.query(
    `INSERT INTO businesses (id, name, email, phone, password_hash, status, subscription_status, onboarding_status, onboarding_step)
     VALUES ($1, 'Draft Realty', $2, '+15555550777', 'placeholder_hash', 'active', 'active', 'pending', 0)`,
    [mockUser.id, mockUser.email]
  );

  // 1. STEP 1 - Business details save
  const reqStep1 = {
    user: mockUser,
    body: {
      businessName: 'Bavio Acceptance Realty',
      industry: 'Real Estate',
      businessDescription: 'Premium residential agency.',
      website: 'https://bavioacceptancerealty.com',
      country: 'US',
      timezone: 'EST',
      businessPhone: '+15555550777',
      officeHours: '9 AM - 6 PM Daily',
      locationsServed: 'Boston metro',
      servicesProvided: 'Residential sales and property management'
    }
  };
  const resStep1 = mockRes();
  await onboardingController.saveBusinessStep(reqStep1, resStep1);
  if (resStep1.statusCode !== 200) {
    throw new Error('Step 1 failed: ' + JSON.stringify(resStep1.jsonData));
  }

  // 2. STEP 2 - Knowledge base save
  const reqStep2 = {
    user: mockUser,
    body: {
      faqs: [
        { question: 'What is your fee?', answer: 'Our fee is 5%.' }
      ],
      serviceDetails: 'Sales and leasing.',
      pricingGuidance: 'Consultations are free.',
      policies: 'No cancellation fee.',
      importantInstructions: 'Have ID ready.',
      qualificationQuestions: 'What is your budget?',
      doNotInvent: 'Do not promise discounts.'
    }
  };
  const resStep2 = mockRes();
  await onboardingController.saveKnowledgeStep(reqStep2, resStep2);
  if (resStep2.statusCode !== 200) {
    throw new Error('Step 2 failed: ' + JSON.stringify(resStep2.jsonData));
  }

  // 3. STEP 3 - Agent configuration save
  const reqStep3 = {
    user: mockUser,
    body: {
      assistantName: 'Sarah Acceptance',
      language: 'en-US',
      voice: 'rachel',
      greeting: 'Welcome to Bavio Acceptance Realty, this is Sarah.',
      tone: 'professional and courteous',
      mainResponsibilities: 'Filter incoming real estate leads.',
      leadInfoToCapture: 'Budget, location, timeline',
      escalationRules: 'Forward high value clients to our team.',
      humanContactNumber: '+15559021100'
    }
  };
  const resStep3 = mockRes();
  await onboardingController.saveAgentStep(reqStep3, resStep3);
  if (resStep3.statusCode !== 200) {
    throw new Error('Step 3 failed: ' + JSON.stringify(resStep3.jsonData));
  }

  // Verification lookup from DB
  const businessRes = await db.query('SELECT * FROM businesses WHERE id = $1', [mockUser.id]);
  const assistantsRes = await db.query('SELECT * FROM assistants WHERE business_id = $1', [mockUser.id]);

  const biz = businessRes.rows[0];
  const agent = assistantsRes.rows[0];
  const intents = typeof biz.intents === 'string' ? JSON.parse(biz.intents) : (biz.intents || {});

  console.log('\n--- VERIFYING PERSISTED VALUES ---');
  console.log('Business Name:', biz.business_name);
  console.log('Industry:', biz.industry);
  console.log('Hours:', intents.officeHours);
  console.log('Locations:', intents.locationsServed);
  console.log('Agent Name:', agent.agent_name);
  console.log('Greeting:', agent.greeting);
  console.log('Voice ID:', agent.voice_id);
  console.log('Faqs count:', agent.faqs.length);

  const assertionsPassed = 
    biz.business_name === 'Bavio Acceptance Realty' &&
    biz.industry === 'Real Estate' &&
    intents.officeHours === '9 AM - 6 PM Daily' &&
    intents.locationsServed === 'Boston metro' &&
    agent.agent_name === 'Sarah Acceptance' &&
    agent.greeting === 'Welcome to Bavio Acceptance Realty, this is Sarah.' &&
    agent.voice_id === 'rachel' &&
    agent.faqs.length === 1 &&
    agent.faqs[0].question === 'What is your fee?';

  if (assertionsPassed) {
    console.log('\n🎉 ALL PAID ONBOARDING PERSISTENCY ASSERTIONS PASSED SUCCESSFULLY!');
  } else {
    console.error('\n❌ Persistency Assertions Failed!');
    process.exit(1);
  }

  // Cleanup
  await db.query('DELETE FROM assistants WHERE business_id = $1', [mockUser.id]);
  await db.query('DELETE FROM businesses WHERE id = $1', [mockUser.id]);
  console.log('🧹 Cleaned up verification records.');
}

runPersistencyTest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
