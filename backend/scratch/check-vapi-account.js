require('dotenv').config();
const axios = require('axios');

async function test() {
  try {
    const vapiApiKey = process.env.VAPI_API_KEY;
    const headers = {
      'Authorization': `Bearer ${vapiApiKey}`
    };
    
    console.log('Querying Vapi workspace details for API Key...');
    
    const res = await axios.get('https://api.vapi.ai/assistant', { headers });
    console.log('\n=== ASSISTANTS LIST ON VAPI ===');
    if (Array.isArray(res.data)) {
      console.log(`Found ${res.data.length} assistants:`);
      res.data.forEach(asst => {
        console.log(`- ID: ${asst.id}, Name: ${asst.name}, Created: ${asst.createdAt}`);
      });
    } else {
      console.log(res.data);
    }

  } catch (err) {
    console.error('Failed to get Vapi details:', err.response?.data || err.message);
  } finally {
    process.exit(0);
  }
}

test();
