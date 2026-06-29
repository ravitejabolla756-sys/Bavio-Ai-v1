require('dotenv').config();
const db = require('../database/db');
const vapiService = require('../services/vapiService');

async function test() {
  try {
    console.log('Fetching latest business from database...');
    const bizRes = await db.query(
      `SELECT id, name, email, twilio_number, assistant_id 
       FROM businesses 
       ORDER BY created_at DESC 
       LIMIT 1`
    );
    
    if (bizRes.rows.length === 0) {
      console.log('No businesses found in database.');
      return;
    }
    
    const business = bizRes.rows[0];
    console.log(`\nSelected Business: ${business.name} (${business.email})`);
    console.log(`Twilio Number in DB: ${business.twilio_number}`);
    console.log(`Assistant ID in DB: ${business.assistant_id}`);
    
    if (!business.assistant_id) {
      console.log('No assistant configuration exists for this business. Creating a local assistant first...');
      const agentName = 'Sarah';
      const greeting = `Hello. This is ${agentName} from ${business.name}. How can I help you today?`;
      const systemPrompt = `You are ${agentName}, an AI assistant for ${business.name}.`;
      
      const newAssistant = await db.query(
        `INSERT INTO assistants (business_id, name, agent_name, greeting, first_message, system_prompt, voice_id, language, is_active)
         VALUES ($1, $2, $2, $3, $3, $4, 'meera', 'en-US', true)
         RETURNING id`,
        [business.id, agentName, greeting, systemPrompt]
      );
      
      const assistantId = newAssistant.rows[0].id;
      await db.query(
        'UPDATE businesses SET assistant_id = $1 WHERE id = $2',
        [assistantId, business.id]
      );
      console.log(`Created local assistant: ${assistantId}`);
    }

    console.log('\nRunning syncVapiAssistantAndPhone on Vapi...');
    const vapiAsstId = await vapiService.syncVapiAssistantAndPhone(business.id);
    console.log(`\nResult Vapi Assistant ID: ${vapiAsstId}`);
    
    if (vapiAsstId && !vapiAsstId.startsWith('vapi_asst_mock_')) {
      console.log('✅ Success! Assistant created/synced on Vapi platform.');
    } else {
      console.log('❌ Failed to sync to Vapi platform.');
    }

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    process.exit(0);
  }
}

test();
