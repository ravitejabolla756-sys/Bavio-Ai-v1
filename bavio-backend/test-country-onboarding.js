require('dotenv').config();
const db = require('./database/db');
const onboardingController = require('./controllers/onboardingController');
const authController = require('./controllers/authController');

async function runTests() {
  console.log('═══════════════════════════════════════════════');
  console.log('  BAVIO COUNTRY-AWARE ONBOARDING UNIT TESTS    ');
  console.log('═══════════════════════════════════════════════\n');

  let testBusinessId = null;

  try {
    // 1. Verify country_code column exists
    const colsResult = await db.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'businesses' AND column_name = 'country_code'`
    );

    if (colsResult.rows.length === 1) {
      console.log('✅ Passed: country_code column exists in database schema.');
    } else {
      throw new Error('country_code column does not exist in businesses table!');
    }

    // 2. Test detectCountry logic
    console.log('\n📋 TEST 1: detectCountry GeoIP Lookup');
    const mockReq = {
      headers: {
        'x-forwarded-for': '103.220.205.101', // Dynamic IP from India
        'accept-language': 'en-IN,en-US;q=0.9,hi;q=0.8'
      },
      connection: {},
      ip: '127.0.0.1'
    };

    let responseData = null;
    const mockRes = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        responseData = data;
        return this;
      }
    };

    await onboardingController.detectCountry(mockReq, mockRes);
    console.log('  IP API Response:', responseData);
    if (responseData && responseData.success && responseData.country_code) {
      console.log(`✅ Passed: detectCountry successfully resolved country code: ${responseData.country_code} (method: ${responseData.method})`);
    } else {
      throw new Error('detectCountry failed to resolve country code');
    }

    // 3. Test setCountry override
    console.log('\n📋 TEST 2: setCountry Profile Override');
    
    // Create a temporary test business
    const uuid = require('crypto').randomUUID();
    const testEmail = `temp-${uuid}@bavio.ai`;
    
    const insertResult = await db.query(
      `INSERT INTO businesses (id, name, email, phone, password_hash, status, country, country_code)
       VALUES ($1, 'Onboarding Test Co', $2, '+15555550000', 'mock_hash', 'active', 'US', 'US')
       RETURNING *`,
      [uuid, testEmail]
    );
    testBusinessId = insertResult.rows[0].id;
    console.log(`  Created test business ID: ${testBusinessId}`);

    // Call setCountry
    const setReq = {
      body: { country_code: 'IN' },
      client: { id: testBusinessId }
    };
    let setResponseData = null;
    const setRes = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        setResponseData = data;
        return this;
      }
    };

    await onboardingController.setCountry(setReq, setRes);
    console.log('  setCountry Response:', setResponseData);

    if (setResponseData && setResponseData.success && setResponseData.country_code === 'IN') {
      console.log('✅ Passed: setCountry returned success and updated country_code to IN');
    } else {
      throw new Error('setCountry failed');
    }

    // Double check DB
    const checkResult = await db.query(
      'SELECT country_code, country FROM businesses WHERE id = $1',
      [testBusinessId]
    );
    const updatedBiz = checkResult.rows[0];
    console.log('  DB verified values:', updatedBiz);
    if (updatedBiz.country_code === 'IN') {
      console.log('✅ Passed: Database record country_code column matches "IN"');
    } else {
      throw new Error('Database record was not updated');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  } finally {
    if (testBusinessId) {
      console.log('\n🧹 Cleaning up test data...');
      await db.query('DELETE FROM businesses WHERE id = $1', [testBusinessId]);
      console.log('  Test business deleted.');
    }
    await db.pool.end();
    console.log('\n═══════════════════════════════════════════════');
    console.log('  TEST COMPLETE');
    console.log('═══════════════════════════════════════════════');
  }
}

runTests();
