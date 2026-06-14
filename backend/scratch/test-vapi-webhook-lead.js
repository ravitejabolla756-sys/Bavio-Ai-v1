require('dotenv').config({ path: 'c:/Startup/bavio-backend/.env' });
const db = require('../database/db');
const { handleTelephonySync } = require('../controllers/twilioCallController');

async function test() {
  const mockReq = {
    body: {
      message: {
        type: 'end-of-call-report',
        transcript: 'Caller: Hello, I would like to book an appointment.\nAssistant: Sure, what is your name and location?\nCaller: My name is John Doe and I am in New York.\nAssistant: Got it. Confirmed.\n[LEAD_CAPTURED]\n{"name":"John Doe","phone":"+917013959033","intent":"appointment booking","location":"New York"}',
        call: {
          id: 'vapi-test-call-12345',
          customer: { number: '917013959033' },
          phoneNumber: { number: '12526508586' },
          duration: 120,
          assistantId: '3620fd61-1b85-41f8-a8ff-f6f2edd4e508'
        }
      }
    }
  };

  const mockRes = {
    status: function(code) {
      console.log('Response Status:', code);
      return this;
    },
    json: function(data) {
      console.log('Response JSON:', data);
      return this;
    }
  };

  try {
    console.log('Simulating webhook...');
    await handleTelephonySync(mockReq, mockRes);
    
    console.log('\nVerifying Supabase database insertion...');
    const callRes = await db.query("SELECT * FROM calls WHERE call_sid = 'vapi-test-call-12345'");
    console.log('Inserted Call Record:', callRes.rows);

    if (callRes.rows.length > 0) {
      const callId = callRes.rows[0].id;
      const transcriptRes = await db.query("SELECT * FROM transcripts WHERE call_id = $1", [callId]);
      console.log('Inserted Transcript Record:', JSON.stringify(transcriptRes.rows, null, 2));

      const leadRes = await db.query("SELECT * FROM leads WHERE call_id = $1", [callId]);
      console.log('Inserted Lead Record:', JSON.stringify(leadRes.rows, null, 2));
      
      // Cleanup
      console.log('\nCleaning up test records...');
      await db.query("DELETE FROM usage_logs WHERE call_id = $1", [callId]);
      await db.query("DELETE FROM leads WHERE call_id = $1", [callId]);
      await db.query("DELETE FROM transcripts WHERE call_id = $1", [callId]);
      await db.query("DELETE FROM calls WHERE id = $1", [callId]);
      console.log('Cleanup complete!');
    }
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    db.pool.end();
  }
}

test();
