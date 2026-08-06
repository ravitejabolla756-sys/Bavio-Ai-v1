require('dotenv').config();
const db = require('../database/db');
const authController = require('../controllers/authController');
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

const uniqueId = Date.now();
const testEmail = `unpaid-security-${uniqueId}@bavio.in`;
const testPhone = `+1555555${String(uniqueId).substring(8, 12)}`;

async function runUnpaidAccessTest() {
  console.log('🧪 Running unpaid account access control verification...');

  // Signup unpaid user
  const reqSignup = {
    body: {
      name: `Unpaid Security Real Estate`,
      email: testEmail,
      phone: testPhone,
      password: 'SecurityPassword123!',
      countryCode: 'US',
      dialCode: '+1',
      phoneNumber: testPhone.substring(2),
      industry: 'Real Estate'
    }
  };

  const resSignup = mockRes();
  await authController.signup(reqSignup, resSignup);
  
  if (resSignup.statusCode !== 201) {
    throw new Error('Signup failed');
  }

  const clientId = resSignup.jsonData.client_id;
  const mockUser = { id: clientId, email: testEmail };

  // 1. Attempt business step save
  const req1 = { user: mockUser, body: { businessName: 'Apex' } };
  const res1 = mockRes();
  await onboardingController.saveBusinessStep(req1, res1);

  // 2. Attempt knowledge step save
  const req2 = { user: mockUser, body: { serviceDetails: 'Full outpatient services' } };
  const res2 = mockRes();
  await onboardingController.saveKnowledgeStep(req2, res2);

  // 3. Attempt agent step save
  const req3 = { user: mockUser, body: { assistantName: 'Sarah' } };
  const res3 = mockRes();
  await onboardingController.saveAgentStep(req3, res3);

  // 4. Attempt phone provisioning
  const req4 = { user: mockUser, body: { country: 'US' } };
  const res4 = mockRes();
  await onboardingController.assignPhone(req4, res4);

  console.log('\n--- SECURITY API CHECK RESULTS ---');
  console.log('1. /onboarding/business status:', res1.statusCode, res1.jsonData);
  console.log('2. /onboarding/knowledge status:', res2.statusCode, res2.jsonData);
  console.log('3. /onboarding/agent status:', res3.statusCode, res3.jsonData);
  console.log('4. /onboarding/phone status:', res4.statusCode, res4.jsonData);

  const passed = 
    res1.statusCode === 403 && res1.jsonData.error === 'subscription_required' &&
    res2.statusCode === 403 && res2.jsonData.error === 'subscription_required' &&
    res3.statusCode === 403 && res3.jsonData.error === 'subscription_required' &&
    res4.statusCode === 403 && res4.jsonData.error === 'subscription_required';

  if (passed) {
    console.log('\n🎉 ALL UNPAID ACCESS CONTROL ASSERTIONS PASSED SUCCESSFULLY!');
  } else {
    console.error('\n❌ Unpaid Access Control Failed!');
    process.exit(1);
  }

  // Cleanup
  await db.query('DELETE FROM businesses WHERE id = $1', [clientId]);
  console.log('🧹 Cleaned up unpaid verification records.');
}

runUnpaidAccessTest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
