require('dotenv').config();
const db = require('../database/db');
const twilioCallController = require('../controllers/twilioCallController');
const { randomUUID } = require('crypto');

// Helper to construct express response mock
function mockResponse() {
  const res = {
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
  return res;
}

async function runTests() {
  console.log('\n================================================');
  console.log('   RUNNING TELEPHONY SYNC & SAVE LEAD TESTS');
  console.log('================================================\n');

  const testBusinessId = randomUUID();
  const testEmail = `test_telephony_${Date.now()}@bavio.ai`;
  const testPhone = '+15125550199';
  const testOriginalPhone = '+1' + Math.floor(1000000000 + Math.random() * 9000000000);
  const testVirtualPhone = '+1' + Math.floor(1000000000 + Math.random() * 9000000000);

  try {
    // ── TEST 1: DATABASE TRIGGER SYNC ─────────────────────────────────────────
    console.log('TEST 1: Testing PostgreSQL businesses -> users auto-sync trigger...');
    
    // Insert into businesses
    await db.query(
      `INSERT INTO businesses (id, name, email, phone, password_hash, api_key, country_code, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')`,
      [testBusinessId, 'Telephony Test Co', testEmail, testPhone, 'mock_pass', randomUUID(), 'US']
    );

    // Query users table to verify replication
    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [testBusinessId]);
    if (userResult.rows.length === 0) {
      throw new Error('❌ PostgreSQL trigger failed: No corresponding row in users table.');
    }
    const user = userResult.rows[0];
    console.log(`✅ Trigger works! Found synced user: email="${user.email}", country_code="${user.country_code}"`);

    // ── TEST 2: PHONE NUMBER SETUP MAPPING ────────────────────────────────────
    console.log('\nTEST 2: Inserting mock phone numbers mapping...');
    const phoneId = randomUUID();
    const assistantId = randomUUID();

    // Create a mock assistant first
    await db.query(
      `INSERT INTO assistants (id, business_id, name, agent_name, greeting, is_active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [assistantId, testBusinessId, 'Bulbul', 'Bulbul', 'Welcome! How can I help you?']
    );

    // Insert phone number mapping with user_original_number
    await db.query(
      `INSERT INTO phone_numbers (id, business_id, client_id, phone_number, number, provider, type, user_original_number, country_code, status, assistant_id)
       VALUES ($1, $2, $2, $3, $3, 'twilio', 'forwarding', $4, 'US', 'active', $5)`,
      [phoneId, testBusinessId, testVirtualPhone, testOriginalPhone, assistantId]
    );
    console.log(`✅ Mapped virtual number ${testVirtualPhone} to owner original number ${testOriginalPhone} under business ${testBusinessId}`);

    // ── TEST 3: handleTelephonySync via Virtual Number ─────────────────────────
    console.log('\nTEST 3: Simulating handleTelephonySync end-of-call webhook (virtual number call)...');
    const callSid1 = `sync_vapi_${Date.now()}`;
    const syncReq1 = {
      body: {
        message: {
          type: 'end-of-call-report',
          call: {
            id: callSid1,
            customer: { number: '15125550100' },
            phoneNumber: { number: testVirtualPhone.replace('+', '') },
            duration: 85,
            transcript: 'User: Hello\nAssistant: Welcome!',
            analysis: {
              summary: 'Short inquiry.'
            }
          }
        }
      }
    };
    const syncRes1 = mockResponse();
    await twilioCallController.handleTelephonySync(syncReq1, syncRes1);

    if (syncRes1.statusCode !== 200) {
      throw new Error(`Telephony Sync failed with status ${syncRes1.statusCode}: ${JSON.stringify(syncRes1.body)}`);
    }
    console.log(`✅ Telephony Sync webhook responded with HTTP ${syncRes1.statusCode}`);

    // Verify call inserted into calls table partition
    const checkCall1 = await db.query('SELECT * FROM calls WHERE call_sid = $1', [callSid1]);
    if (checkCall1.rows.length === 0) {
      throw new Error('❌ Call record was not found in partition calls_us!');
    }
    console.log(`✅ Call record inserted successfully: id=${checkCall1.rows[0].id}, country_code=${checkCall1.rows[0].country_code}, status=${checkCall1.rows[0].status}`);

    // ── TEST 4: handleTelephonySync via Owner Original Number ──────────────────
    console.log('\nTEST 4: Simulating handleTelephonySync end-of-call webhook (original owner phone number call)...');
    const callSid2 = `sync_owner_${Date.now()}`;
    const syncReq2 = {
      body: {
        message: {
          type: 'end-of-call-report',
          call: {
            id: callSid2,
            customer: { number: '15125550100' },
            phoneNumber: { number: testOriginalPhone.replace('+', '') }, // Resolves to original phone
            duration: 45,
            transcript: 'User: Hi there\nAssistant: How can I help?',
            analysis: {
              summary: 'Inquiry on original line.'
            }
          }
        }
      }
    };
    const syncRes2 = mockResponse();
    await twilioCallController.handleTelephonySync(syncReq2, syncRes2);

    if (syncRes2.statusCode !== 200) {
      throw new Error(`Telephony Sync on original number failed with status ${syncRes2.statusCode}: ${JSON.stringify(syncRes2.body)}`);
    }

    // Verify call mapped to correct business via user_original_number lookup
    const checkCall2 = await db.query('SELECT * FROM calls WHERE call_sid = $1', [callSid2]);
    if (checkCall2.rows.length === 0) {
      throw new Error('❌ Call record not found in database!');
    }
    if (checkCall2.rows[0].user_id !== testBusinessId) {
      throw new Error(`❌ Call mapped to incorrect business ID: ${checkCall2.rows[0].user_id} (expected ${testBusinessId})`);
    }
    console.log(`✅ Call successfully mapped via original number: user_id=${checkCall2.rows[0].user_id}, country_code=${checkCall2.rows[0].country_code}`);

    // ── TEST 5: handleSaveLeadTool (Vapi tool call) ───────────────────────────
    console.log('\nTEST 5: Simulating handleSaveLeadTool tool call webhook...');
    const callSid3 = `save_lead_tool_${Date.now()}`;
    const leadReq = {
      body: {
        message: {
          type: 'tool-calls',
          call: {
            id: callSid3,
            customer: { number: '15125550100' },
            phoneNumber: { number: testOriginalPhone.replace('+', '') } // Resolves to original phone
          },
          toolCalls: [
            {
              id: 'call_save_lead_1',
              function: {
                name: 'save_lead',
                arguments: {
                  name: 'Alice Mercer',
                  phone: '+15125550100',
                  intent: 'buy property',
                  location: 'Austin',
                  appointment_time: '2026-06-15T10:00:00Z'
                }
              }
            }
          ]
        }
      }
    };
    const leadRes = mockResponse();
    await twilioCallController.handleSaveLeadTool(leadReq, leadRes);

    if (leadRes.statusCode !== 200) {
      throw new Error(`Save Lead Tool failed with status ${leadRes.statusCode}: ${JSON.stringify(leadRes.body)}`);
    }
    console.log(`✅ Save Lead Tool responded successfully with HTTP ${leadRes.statusCode}`);

    // Verify lead created in database
    const checkLead = await db.query(
      'SELECT * FROM leads WHERE call_id = (SELECT id FROM calls WHERE call_sid = $1)',
      [callSid3]
    );
    if (checkLead.rows.length === 0) {
      throw new Error('❌ Lead record was not found in leads table!');
    }
    const leadRecord = checkLead.rows[0];
    if (leadRecord.business_id !== testBusinessId) {
      throw new Error(`❌ Lead mapped to incorrect business ID: ${leadRecord.business_id} (expected ${testBusinessId})`);
    }
    console.log(`✅ Lead captured successfully: name="${leadRecord.name}", intent="${leadRecord.intent}", location="${leadRecord.location}", phone="${leadRecord.phone}"`);

    console.log('\n================================================');
    console.log(' 🎉 ALL TELEPHONY SYNC & SAVE LEAD TESTS PASSED! 🎉');
    console.log('================================================\n');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILURE DETECTED:');
    console.error(error);
  } finally {
    // Cleanup
    console.log('Cleaning up test records from database...');
    try {
      await db.query('DELETE FROM usage_logs WHERE user_id = $1', [testBusinessId]);
      await db.query('DELETE FROM leads WHERE business_id = $1', [testBusinessId]);
      await db.query('DELETE FROM transcripts WHERE business_id = $1', [testBusinessId]);
      await db.query('DELETE FROM calls WHERE user_id = $1', [testBusinessId]);
      await db.query('DELETE FROM phone_numbers WHERE business_id = $1', [testBusinessId]);
      await db.query('DELETE FROM assistants WHERE business_id = $1', [testBusinessId]);
      await db.query('DELETE FROM businesses WHERE id = $1', [testBusinessId]);
      console.log('✅ Cleanup finished successfully.');
    } catch (cleanErr) {
      console.error('Cleanup failed:', cleanErr.message);
    }
    process.exit(0);
  }
}

runTests();
