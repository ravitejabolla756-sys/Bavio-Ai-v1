require('dotenv').config();
const db = require('../database/db');
const authController = require('../controllers/authController');

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
const testEmail = `acceptance-${uniqueId}@bavio.in`;
const testPhone = `+1555555${String(uniqueId).substring(8, 12)}`;

async function runNewAccountTest() {
  console.log('🧪 Running default account registration validation...');

  const reqSignup = {
    body: {
      name: `Acceptance Business ${uniqueId}`,
      email: testEmail,
      phone: testPhone,
      password: 'AcceptancePassword123!',
      countryCode: 'US',
      dialCode: '+1',
      phoneNumber: testPhone.substring(2),
      industry: 'Real Estate'
    }
  };

  const resSignup = mockRes();
  await authController.signup(reqSignup, resSignup);
  
  if (resSignup.statusCode !== 201) {
    throw new Error(`Signup failed with status ${resSignup.statusCode}: ${JSON.stringify(resSignup.jsonData)}`);
  }

  const clientId = resSignup.jsonData.client_id;
  console.log(`Registered user client_id: ${clientId}`);

  // Query DB state
  const businessRes = await db.query('SELECT * FROM businesses WHERE id = $1', [clientId]);
  const user = businessRes.rows[0];

  const assistantRes = await db.query('SELECT * FROM assistants WHERE business_id = $1', [clientId]);
  const phoneRes = await db.query('SELECT * FROM phone_numbers WHERE business_id = $1', [clientId]);
  const demoRes = await db.query('SELECT * FROM demo_sessions WHERE user_id = $1', [clientId]);

  console.log('\n--- VERIFICATION ASSERTIONS ---');
  console.log('1. subscription_status:', user.subscription_status); // inactive
  console.log('2. onboarding_status:', user.onboarding_status); // pre_payment
  console.log('3. onboarding_step:', user.onboarding_step); // 0
  console.log('4. plan:', user.plan); // free
  console.log('5. plan_name:', user.plan_name); // free_trial
  console.log('6. minutes_limit:', user.minutes_limit); // 0 (unpaid)
  console.log('7. assistants count:', assistantRes.rows.length); // 0
  console.log('8. phone_numbers count:', phoneRes.rows.length); // 0
  console.log('9. demo_sessions count:', demoRes.rows.length); // 0 (eligible)

  // Verify constraints
  const assertionsPassed = 
    user.subscription_status === 'inactive' &&
    user.onboarding_status === 'pre_payment' &&
    user.onboarding_step === 0 &&
    user.plan === 'free' &&
    user.minutes_limit === 0 &&
    assistantRes.rows.length === 0 &&
    phoneRes.rows.length === 0 &&
    demoRes.rows.length === 0;

  if (assertionsPassed) {
    console.log('\n🎉 ALL NEW ACCOUNT SIGNUP STATE ASSERTIONS PASSED SUCCESSFULLY!');
  } else {
    console.error('\n❌ Assertions Failed!');
    process.exit(1);
  }

  // Cleanup
  await db.query('DELETE FROM assistants WHERE business_id = $1', [clientId]);
  await db.query('DELETE FROM phone_numbers WHERE business_id = $1', [clientId]);
  await db.query('DELETE FROM businesses WHERE id = $1', [clientId]);
  console.log('🧹 Cleaned up verification records.');
}

runNewAccountTest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
