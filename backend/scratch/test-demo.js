require('dotenv').config();
const db = require('../database/db');
const demoRoutes = require('../routes/demo');

// Helper to find a route handler by path and method
function getRouteHandler(path, method) {
  const layer = demoRoutes.stack.find(l => l.route && l.route.path === path && l.route.methods[method]);
  if (!layer) throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
  // The last handler in the stack is the route logic
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

const mockUser = { id: '22222222-2222-2222-2222-222222222222', email: 'demotester@bavio.in' };

async function runDemoTests() {
  console.log('🧪 Starting Pure-JS Demo Session Logic Verification...');
  
  try {
    await db.query('DELETE FROM demo_sessions WHERE user_id = $1', [mockUser.id]);
    console.log('✅ Cleaned up old test demo sessions.');

    const getStatus = getRouteHandler('/status', 'get');
    const startDemo = getRouteHandler('/start', 'post');
    const hangupDemo = getRouteHandler('/hangup', 'post');

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
      res.type = (t) => {
        res.contentType = t;
        return res;
      };
      return res;
    };

    // --- TEST 1: Initial status check ---
    const req1 = { user: mockUser };
    const res1 = mockRes();
    await getStatus(req1, res1);
    console.log('TEST 1 - GET /demo/status:', res1.statusCode || 200, res1.jsonData);
    if (res1.jsonData.eligible !== true) {
      throw new Error('Initial status eligibility check failed');
    }
    console.log('✅ TEST 1 PASSED: Fresh account is eligible for demo.');

    // --- TEST 2: Start demo with invalid number ---
    const req2 = { user: mockUser, body: { phoneNumber: '1234' } };
    const res2 = mockRes();
    await startDemo(req2, res2);
    console.log('TEST 2 - POST /demo/start (invalid):', res2.statusCode, res2.jsonData);
    if (res2.statusCode !== 400 || res2.jsonData.error !== 'invalid_phone') {
      throw new Error('Should reject invalid phone format');
    }
    console.log('✅ TEST 2 PASSED: Rejects invalid phone numbers.');

    // --- TEST 3: Start demo with valid number ---
    const req3 = { user: mockUser, body: { phoneNumber: '+15555550100', countryCode: 'US' }, headers: { host: 'localhost:5001' } };
    const res3 = mockRes();
    await startDemo(req3, res3);
    console.log('TEST 3 - POST /demo/start (valid):', res3.statusCode || 200, res3.jsonData);
    
    // Check if session was created in DB
    const dbCheck = await db.query('SELECT * FROM demo_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [mockUser.id]);
    if (dbCheck.rows.length === 0) {
      throw new Error('Failed to insert demo session into DB');
    }
    console.log('✅ TEST 3 PASSED: Demo session inserted in DB successfully.');

    // Force demo status to 'active' for testing hangup (since outbound call might fail in mock environment)
    const session = dbCheck.rows[0];
    await db.query("UPDATE demo_sessions SET demo_status = 'active', termination_reason = 'CA_mock_sid' WHERE id = $1", [session.id]);
    console.log('ℹ️ Manually activated demo session for downstream test flow.');

    // --- TEST 4: Status check during active call ---
    const req4 = { user: mockUser };
    const res4 = mockRes();
    await getStatus(req4, res4);
    console.log('TEST 4 - GET /demo/status (active):', res4.statusCode || 200, res4.jsonData);
    if (res4.jsonData.eligible !== true || res4.jsonData.session.demo_status !== 'active') {
      throw new Error('Active call status check failed');
    }
    console.log('✅ TEST 4 PASSED: Status correctly reflects active call.');

    // --- TEST 5: Trigger hangup ---
    const req5 = { user: mockUser };
    const res5 = mockRes();
    await hangupDemo(req5, res5);
    console.log('TEST 5 - POST /demo/hangup:', res5.statusCode || 200, res5.jsonData);
    if (res5.jsonData.success !== true) {
      throw new Error('Hangup request failed');
    }
    console.log('✅ TEST 5 PASSED: Hangup endpoint succeeded.');

    // --- TEST 6: Status check post-hangup ---
    const req6 = { user: mockUser };
    const res6 = mockRes();
    await getStatus(req6, res6);
    console.log('TEST 6 - GET /demo/status (completed):', res6.statusCode || 200, res6.jsonData);
    if (res6.jsonData.eligible !== false || res6.jsonData.session.demo_status !== 'completed' || res6.jsonData.session.demo_used !== true) {
      throw new Error('Post-hangup status check failed');
    }
    console.log('✅ TEST 6 PASSED: Session updated to completed and demo_used set to true.');

    // --- TEST 7: Attempt to start demo again after completion ---
    const req7 = { user: mockUser, body: { phoneNumber: '+15555550100', countryCode: 'US' } };
    const res7 = mockRes();
    await startDemo(req7, res7);
    console.log('TEST 7 - POST /demo/start (re-run check):', res7.statusCode, res7.jsonData);
    if (res7.statusCode !== 400 || res7.jsonData.error !== 'demo_already_used') {
      throw new Error('Should reject starting another demo if used');
    }
    console.log('✅ TEST 7 PASSED: Blocked from running multiple demo sessions.');

    console.log('\n🎉 ALL PURE-JS DEMO SESSION LOGIC VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');

    // Final database cleanup
    await db.query('DELETE FROM demo_sessions WHERE user_id = $1', [mockUser.id]);
  } catch (err) {
    console.error('❌ Test execution failed:', err.message);
    process.exit(1);
  } finally {
    db.pool.end();
  }
}

runDemoTests();
