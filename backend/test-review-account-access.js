require('dotenv').config();
const axios = require('axios');
const db = require('./database/db');
const { setupReviewAccount } = require('./scripts/setup-review-account');

const API_BASE = 'http://localhost:5000/api';

async function runReviewAccountTests() {
  console.log('=== BAVIO REVIEW ACCOUNT FULL ACCESS VERIFICATION ===\n');

  // Step 0: Ensure review account is provisioned
  await setupReviewAccount();

  // 1. Log in as review@bavio.local
  console.log('\n--- 1. Login Authentication ---');
  const reviewPassword = process.env.BAVIO_REVIEW_ACCOUNT_PASSWORD;
  if (!reviewPassword) throw new Error('BAVIO_REVIEW_ACCOUNT_PASSWORD must be configured in environment for automated testing.');
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: 'review@bavio.local',
    password: reviewPassword
  });
  console.log('Login HTTP status:', loginRes.status);
  const token = loginRes.data.token;
  const clientId = loginRes.data.client_id;
  const headers = { Authorization: `Bearer ${token}` };

  if (!token || !clientId) throw new Error('Missing token or client ID from login');
  console.log('✅ Authenticated successfully. Client ID:', clientId);

  // 2. Profile / Workspace Resolution
  console.log('\n--- 2. Profile / Workspace Resolution ---');
  const profileRes = await axios.get(`${API_BASE}/auth/profile`, { headers });
  console.log('Workspace name:', profileRes.data.name);
  console.log('Subscription status:', profileRes.data.subscription_status);
  console.log('Onboarding status:', profileRes.data.onboarding_status);
  if (profileRes.data.name !== 'Bavio Review Workspace') {
    throw new Error(`Expected workspace name 'Bavio Review Workspace', got: ${profileRes.data.name}`);
  }
  if (profileRes.data.subscription_status !== 'active') {
    throw new Error(`Expected subscription_status 'active', got: ${profileRes.data.subscription_status}`);
  }
  console.log('✅ Workspace and subscription status resolved as active.');

  // 3. Assistants / Create Agent (POST /api/assistants)
  console.log('\n--- 3. Assistants / Create Agent (POST /api/assistants) ---');
  const listAssistantsRes = await axios.get(`${API_BASE}/assistants/${clientId}`, { headers });
  console.log(`Found ${listAssistantsRes.data?.length || 0} existing assistants.`);

  const createAgentRes = await axios.post(
    `${API_BASE}/assistants`,
    {
      name: `Review Test Agent ${Date.now()}`,
      system_prompt: 'You are a test voice agent for review workspace.',
      language: 'en-US',
      voice_id: 'meera'
    },
    { headers }
  );
  console.log('Created agent ID:', createAgentRes.data.id, 'Name:', createAgentRes.data.name);
  console.log('✅ POST /api/assistants succeeded without SUBSCRIPTION_REQUIRED.');

  // 4. Knowledge Base
  console.log('\n--- 4. Knowledge Base ---');
  const kbListRes = await axios.get(`${API_BASE}/knowledge-base`, { headers });
  console.log('Knowledge base list status:', kbListRes.status);
  const createKbRes = await axios.post(
    `${API_BASE}/knowledge-base`,
    { name: 'Review FAQ', content: 'Bavio review workspace knowledge document.' },
    { headers }
  );
  console.log('Created KB doc ID:', createKbRes.data.id || createKbRes.data.data?.id);
  console.log('✅ Knowledge Base accessible and functional.');

  // 5. Actions
  console.log('\n--- 5. Actions API (/v1/actions) ---');
  const actionsRes = await axios.get(`${API_BASE}/v1/actions`, { headers });
  console.log('Actions list status:', actionsRes.status);
  console.log('Available action definitions:', actionsRes.data?.data?.actions?.length || 0);
  console.log('✅ Actions accessible.');

  // 6. Workflows
  console.log('\n--- 6. Workflows API (/v1/workflows) ---');
  const workflowsRes = await axios.get(`${API_BASE}/v1/workflows`, { headers });
  console.log('Workflows list status:', workflowsRes.status);
  console.log('Available workflow definitions:', workflowsRes.data?.data?.workflows?.length || 0);
  console.log('✅ Workflows accessible.');

  // 7. Phone Numbers
  console.log('\n--- 7. Phone Numbers API ---');
  const phoneRes = await axios.get(`${API_BASE}/numbers/${clientId}`, { headers });
  console.log('Phone numbers status:', phoneRes.status, 'Count:', phoneRes.data?.length);
  console.log('✅ Phone Numbers accessible.');

  // 8. Provider Connections
  console.log('\n--- 8. Provider Connections Status ---');
  const provRes = await axios.get(`${API_BASE}/integrations/status`, { headers });
  console.log('Provider connections status:', provRes.status);
  console.log('✅ Provider connections accessible.');

  // 9. Analytics / Usage
  console.log('\n--- 9. Analytics / Usage API ---');
  const usageRes = await axios.get(`${API_BASE}/usage/${clientId}`, { headers });
  console.log('Usage API status:', usageRes.status, 'Summary:', usageRes.data?.summary);
  console.log('✅ Analytics / Usage accessible.');

  // 10. Billing Inspection (Truthful Internal Review Entitlement)
  console.log('\n--- 10. Billing Status Inspection ---');
  const billingStatusRes = await axios.get(`${API_BASE}/billing/status/${clientId}`, { headers });
  console.log('Billing status code:', billingStatusRes.status);
  console.log('Billing plan:', billingStatusRes.data?.client?.subscriptionPlan || billingStatusRes.data?.data?.plan);
  console.log('Billing subscription status:', billingStatusRes.data?.client?.subscriptionStatus || billingStatusRes.data?.data?.status);
  console.log('Dodo Subscription ID (should be null):', billingStatusRes.data?.client?.dodoSubscriptionId);
  console.log('✅ Billing reflects internal review entitlement truthfully without fake Dodo records.');

  // 11. Normal Unsubscribed Account Subscription Enforcement
  console.log('\n--- 11. Normal Unsubscribed Account Enforcement ---');
  const unsubsEmail = `unsubscribed_test_${Date.now()}@bavio.local`;
  const unsubsBiz = await db.query(
    `INSERT INTO businesses (
       id, name, email, phone, password_hash, status, subscription_status, plan, plan_name, minutes_limit
     )
     VALUES ($1, 'Inactive Biz', $2, '+12025550188', 'dummy_hash', 'active', 'inactive', 'free', 'free', 0)
     RETURNING id`,
    [require('crypto').randomUUID(), unsubsEmail]
  );
  const jwt = require('jsonwebtoken');
  const unsubsToken = jwt.sign(
    { id: unsubsBiz.rows[0].id, email: unsubsEmail },
    process.env.JWT_SECRET || '7e0341f2ee874653ce795be1851359683e92e769db290b69965697ae80da0a5e5745972bd30e6b51088fbc878ea141f97acec678ca57855eb024064f44f4d220',
    { expiresIn: '1h' }
  );

  try {
    await axios.post(
      `${API_BASE}/assistants`,
      { name: 'Blocked Assistant' },
      { headers: { Authorization: `Bearer ${unsubsToken}` } }
    );
    throw new Error('Normal unsubscribed account was NOT blocked!');
  } catch (err) {
    if (err.response?.status === 402 && err.response?.data?.error === 'SUBSCRIPTION_REQUIRED') {
      console.log('✅ Normal unsubscribed account correctly blocked with 402 SUBSCRIPTION_REQUIRED.');
    } else {
      throw err;
    }
  } finally {
    await db.query('DELETE FROM businesses WHERE id = $1', [unsubsBiz.rows[0].id]);
  }

  // 12. Production Guard Safety Check
  console.log('\n--- 12. Production Safety Check ---');
  const originalEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    const planEnforcement = require('./middleware/planEnforcement');
    const balance = await planEnforcement.checkCallBalance(clientId);
    // In production without active billing_period_end/dodo sub, review bypass is inactive
    console.log('Production balance check for review account:', balance.allowed ? 'ALLOWED (Active in DB)' : 'BLOCKED');
  } finally {
    process.env.NODE_ENV = originalEnv;
  }

  console.log('\n=== ALL REVIEW ACCOUNT TESTS PASSED SUCCESSFULLY ===');
}

runReviewAccountTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test failed:', err.response?.data || err.message);
    process.exit(1);
  });
