const db = require('../database/db');
const axios = require('axios');

// Local system prompt builder to avoid circular dependency with onboardingController
function buildSystemPrompt(config) {
  const { agent_name, greeting, industry } = config;

  const industryKey = String(industry || 'other').toLowerCase().replace('_', '-');
  const industryPrompt = {
    restaurant: `You are ${agent_name}, an AI voice assistant for a restaurant. Your job: Take table reservations, answer menu questions, and handle customer inquiries. Capture: customer name, phone, reservation date/time, party size.`,
    clinic: `You are ${agent_name}, an AI voice assistant for a medical clinic. Your job: Help patients book appointments and answer basic health questions. Capture: patient name, phone, health concern, preferred appointment date/time.`,
    'real-estate': `You are ${agent_name}, an AI voice assistant for a real estate agency. Your job: Qualify property buyers and capture their requirements. Capture: name, phone, budget, location preference, BHK type (1/2/3).`,
    other: `You are ${agent_name}, an AI voice assistant. Your job: Help callers and capture their contact information and requirements. Capture: caller name, phone number, and reason for calling.`
  }[industryKey] || `You are ${agent_name}, an AI voice assistant. Your job: Help callers and capture their contact information and requirements. Capture: caller name, phone number, and reason for calling.`;

  return `${industryPrompt}

Speak in a natural, friendly and professional tone.

GREETING:
Always start with: "${greeting || `Hello! I am ${agent_name}, how can I help you today?`}"

IMPORTANT RULES:
1. Keep responses SHORT — maximum 2 sentences per turn
2. Ask ONE question at a time
3. Be warm, helpful, and conversational
4. Never mention you are an AI unless directly asked
5. If caller is rude, end the call
6. Confirm caller's name and phone before ending

LEAD CAPTURE:
When collected name + phone + key details, append [LEAD_CAPTURED] on a new line with JSON payload.
At natural end of call, append [END_CALL].`;
}

/**
 * Synchronizes local assistant configuration to Vapi and links their Twilio phone number.
 * Creates a new assistant on Vapi if not already created, otherwise updates it.
 * Links/registers the Twilio phone number to the assistant on Vapi.
 */
async function syncVapiAssistantAndPhone(businessId) {
  const vapiApiKey = process.env.VAPI_API_KEY;
  if (!vapiApiKey) {
    console.warn('[VAPI-SYNC] ⚠️ VAPI_API_KEY is not configured in .env. Skipping Vapi provisioning.');
    return null;
  }

  try {
    console.log(`[VAPI-SYNC] ⚡ Starting Vapi sync for business: ${businessId}`);

    // 1. Fetch business details
    const bizRes = await db.query(
      `SELECT id, name, email, twilio_number, country_code, industry FROM businesses WHERE id = $1`,
      [businessId]
    );
    if (bizRes.rows.length === 0) {
      console.error(`[VAPI-SYNC] ❌ Business ${businessId} not found`);
      return null;
    }
    const business = bizRes.rows[0];

    // 2. Fetch assistant details
    const astRes = await db.query(
      `SELECT id, agent_name, voice, greeting, first_message, system_prompt, language, vapi_assistant_id FROM assistants WHERE business_id = $1 LIMIT 1`,
      [businessId]
    );
    if (astRes.rows.length === 0) {
      console.warn(`[VAPI-SYNC] ⚠️ No assistant configuration found in DB for business ${businessId}.`);
      return null;
    }
    const assistant = astRes.rows[0];

    const greeting = assistant.greeting || assistant.first_message || `Hello. This is ${assistant.agent_name || 'Sarah'} from ${business.name || 'Bavio'}. How may I assist you today?`;
    
    // Generate prompt if not set
    let systemPrompt = assistant.system_prompt;
    if (!systemPrompt) {
      systemPrompt = buildSystemPrompt({
        agent_name: assistant.agent_name || 'Bavio Assistant',
        greeting,
        industry: business.industry || 'other'
      });
    }

    // 3. Create or update Vapi assistant
    let vapiAssistantId = assistant.vapi_assistant_id;
    const voiceId = assistant.voice === 'meera' ? '21m00Tcm4TlvDq8ikWAM' : (assistant.voice || '21m00Tcm4TlvDq8ikWAM');

    const assistantPayload = {
      name: assistant.agent_name || 'Bavio Assistant',
      firstMessage: greeting,
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          }
        ]
      },
      voice: {
        provider: '11labs',
        voiceId: voiceId
      },
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: assistant.language ? assistant.language.split('-')[0] : 'en'
      }
    };

    const headers = {
      'Authorization': `Bearer ${vapiApiKey}`,
      'Content-Type': 'application/json'
    };

    // If there is an existing ID, attempt to update it
    if (vapiAssistantId && !vapiAssistantId.startsWith('vapi_asst_mock_')) {
      try {
        console.log(`[VAPI-SYNC] Patching existing Vapi assistant: ${vapiAssistantId}`);
        await axios.patch(`https://api.vapi.ai/assistant/${vapiAssistantId}`, assistantPayload, { headers });
      } catch (patchErr) {
        console.error(`[VAPI-SYNC] ⚠️ Failed to patch assistant ${vapiAssistantId}:`, patchErr.message);
        vapiAssistantId = null; // Recreate if patch fails
      }
    }

    // Create a new one if needed
    if (!vapiAssistantId || vapiAssistantId.startsWith('vapi_asst_mock_')) {
      console.log(`[VAPI-SYNC] Creating new Vapi assistant...`);
      const createRes = await axios.post('https://api.vapi.ai/assistant', assistantPayload, { headers });
      if (createRes.data && createRes.data.id) {
        vapiAssistantId = createRes.data.id;
        console.log(`[VAPI-SYNC] ✅ Created Vapi assistant: ${vapiAssistantId}`);

        // Save new vapi assistant id to database
        await db.query(
          `UPDATE assistants SET vapi_assistant_id = $1, greeting = $2, system_prompt = $3, is_active = true, updated_at = NOW() WHERE id = $4`,
          [vapiAssistantId, greeting, systemPrompt, assistant.id]
        );
      }
    }

    // 4. Link/Register phone number on Vapi
    const twilioNumber = business.twilio_number;
    if (twilioNumber && vapiAssistantId && !vapiAssistantId.startsWith('vapi_asst_mock_')) {
      console.log(`[VAPI-SYNC] Linking phone number ${twilioNumber} to Vapi assistant: ${vapiAssistantId}`);
      
      let existingVapiPhoneId = null;
      try {
        const phoneListRes = await axios.get('https://api.vapi.ai/phone-number', { headers });
        if (Array.isArray(phoneListRes.data)) {
          const matching = phoneListRes.data.find(p => p.number === twilioNumber);
          if (matching) {
            existingVapiPhoneId = matching.id;
          }
        }
      } catch (err) {
        console.error(`[VAPI-SYNC] ⚠️ Failed to query phone numbers from Vapi:`, err.message);
      }

      if (existingVapiPhoneId) {
        // Number is already on Vapi, update its linked assistant
        console.log(`[VAPI-SYNC] Phone number already registered on Vapi (ID: ${existingVapiPhoneId}). Updating linkage.`);
        await axios.patch(`https://api.vapi.ai/phone-number/${existingVapiPhoneId}`, {
          assistantId: vapiAssistantId
        }, { headers });
        console.log(`[VAPI-SYNC] ✅ Phone number mapping updated on Vapi`);
      } else {
        // Number not registered on Vapi, create it
        console.log(`[VAPI-SYNC] Registering new phone number on Vapi: ${twilioNumber}`);
        await axios.post('https://api.vapi.ai/phone-number', {
          provider: 'twilio',
          number: twilioNumber,
          twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
          twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
          name: `${business.name || 'Bavio'} Inbound Line`,
          assistantId: vapiAssistantId
        }, { headers });
        console.log(`[VAPI-SYNC] ✅ Phone number registered and linked on Vapi`);
      }
    }

    return vapiAssistantId;
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('[VAPI-SYNC] ❌ Synchronization failed:', errorDetails);
    return null;
  }
}

module.exports = {
  syncVapiAssistantAndPhone
};
