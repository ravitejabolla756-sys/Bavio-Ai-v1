require('dotenv').config();
const db = require('../database/db');

async function test() {
  try {
    console.log('Querying latest 5 businesses in the database...');
    const bizRes = await db.query(
      `SELECT id, name, email, twilio_number, phone_number_id, assistant_id, country_code, created_at 
       FROM businesses 
       ORDER BY created_at DESC 
       LIMIT 5`
    );
    
    if (bizRes.rows.length === 0) {
      console.log('No businesses found in the database.');
      return;
    }
    
    for (const business of bizRes.rows) {
      console.log('\n=== BUSINESS ===');
      console.log(`ID: ${business.id}`);
      console.log(`Name: ${business.name}`);
      console.log(`Email: ${business.email}`);
      console.log(`Country: ${business.country_code}`);
      console.log(`Twilio Number: ${business.twilio_number}`);
      console.log(`Phone Number ID: ${business.phone_number_id}`);
      console.log(`Assistant ID: ${business.assistant_id}`);
      console.log(`Created At: ${business.created_at}`);

      if (business.assistant_id) {
        const astRes = await db.query(
          `SELECT id, name, agent_name, voice_id, language, vapi_assistant_id, created_at 
           FROM assistants 
           WHERE id = $1`,
          [business.assistant_id]
        );
        if (astRes.rows.length > 0) {
          const assistant = astRes.rows[0];
          console.log(`  Assistant ID: ${assistant.id}`);
          console.log(`  Agent Name: ${assistant.agent_name}`);
          console.log(`  Vapi Assistant ID: ${assistant.vapi_assistant_id}`);
        }
      }
    }
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    process.exit(0);
  }
}

test();
