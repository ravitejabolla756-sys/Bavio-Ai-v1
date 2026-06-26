const db = require('../database/db');
const axios = require('axios');

// Save onboarding step data (Step 1, Step 2, Step 3)
async function saveStep(req, res) {
  try {
    const { step, data } = req.body;
    const clientId = req.client?.id || req.user?.id;

    if (!step || !data) {
      return res.status(400).json({ error: 'step and data are required' });
    }

    if (!clientId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log(`[ONBOARDING] Saving step ${step} for client ${clientId}`);

    await db.query(
      'UPDATE businesses SET onboarding_step = $1 WHERE id = $2',
      [step, clientId]
    );

    switch (step) {
      case 1: {
        // Step 1 — Country Selection
        const countryCode = (data.country_code || 'US').trim().toUpperCase().substring(0, 2);
        let currencyCode = 'USD';
        if (countryCode === 'IN') currencyCode = 'INR';
        if (countryCode === 'GB') currencyCode = 'GBP';

        await db.query(
          `UPDATE businesses SET
            country_code = $1::varchar,
            country = $1::text,
            updated_at = NOW()
          WHERE id = $2`,
          [countryCode, clientId]
        );
        break;
      }

      case 2: {
        // Step 2 — Subscription Plan
        const plan = (data.plan || 'starter').toLowerCase();
        await db.query(
          `UPDATE businesses SET
            plan = $1,
            plan_name = $1,
            updated_at = NOW()
          WHERE id = $2`,
          [plan, clientId]
        );
        break;
      }

      case 3: {
        // Step 3 — Business & AI Agent Setup
        const { businessName, industry, ownerMobile, agentName, voice, pdfs } = data;

        // Update business details
        await db.query(
          `UPDATE businesses SET
            name = $1,
            industry = $2,
            owner_mobile = $3,
            phone = $3,
            updated_at = NOW()
          WHERE id = $4`,
          [businessName, industry, ownerMobile, clientId]
        );

        // Check if assistant exists
        const assistantResult = await db.query(
          'SELECT id FROM assistants WHERE business_id = $1',
          [clientId]
        );

        const systemPrompt = buildSystemPrompt({
          agent_name: agentName,
          greeting: `Hello. This is ${agentName} from ${businessName}. How may I assist you today?`,
          industry: industry,
          language: 'en-US',
          faqs: []
        });

        let assistantId;
        if (assistantResult.rows.length > 0) {
          assistantId = assistantResult.rows[0].id;
          await db.query(
            `UPDATE assistants SET
              agent_name = $1,
              name = $1,
              voice = $2,
              voice_id = $2,
              industry = $3,
              system_prompt = $4,
              updated_at = NOW()
            WHERE business_id = $5`,
            [agentName, voice || 'meera', industry, systemPrompt, clientId]
          );
        } else {
          const insertResult = await db.query(
            `INSERT INTO assistants
              (business_id, name, agent_name, greeting, voice, voice_id, industry, language, system_prompt, is_active)
             VALUES ($1, $2, $2, $3, $4, $4, $5, 'en-US', $6, false)
             RETURNING id`,
            [
              clientId,
              agentName,
              `Hello. This is ${agentName} from ${businessName}. How may I assist you today?`,
              voice || 'meera',
              industry,
              systemPrompt
            ]
          );
          assistantId = insertResult.rows[0].id;
        }

        // Link assistant to business
        await db.query(
          'UPDATE businesses SET assistant_id = $1 WHERE id = $2',
          [assistantId, clientId]
        );

        // Handle PDF uploads (max 5)
        if (Array.isArray(pdfs) && pdfs.length > 0) {
          // Clear older docs
          await db.query('DELETE FROM knowledge_base_docs WHERE business_id = $1', [clientId]);
          
          // Insert new ones (up to 5)
          const docsToInsert = pdfs.slice(0, 5);
          for (const pdf of docsToInsert) {
            await db.query(
              `INSERT INTO knowledge_base_docs (business_id, name, content)
               VALUES ($1, $2, $3)`,
              [clientId, pdf.name || 'document.pdf', pdf.content || 'Uploaded PDF document.']
            );
          }
        }
        break;
      }

      default:
        return res.status(400).json({ error: 'Invalid step number' });
    }

    res.status(200).json({
      success: true,
      step,
      message: `Step ${step} saved successfully`
    });

  } catch (err) {
    console.error('[ONBOARDING] saveStep error:', err);
    res.status(500).json({ error: err.message });
  }
}

// Get onboarding status
async function getStatus(req, res) {
  try {
    const { client_id } = req.params;
    const requestingClientId = req.client?.id || req.user?.id;

    if (client_id !== requestingClientId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await db.query(
      `SELECT 
        id,
        name,
        email,
        industry,
        plan,
        twilio_number,
        onboarding_status,
        onboarding_step,
        country_code,
        owner_mobile,
        assistant_id,
        phone_number_id
      FROM businesses WHERE id = $1`,
      [client_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const business = result.rows[0];

    // Fetch assistant details if linked
    let assistant = null;
    if (business.assistant_id) {
      const astRes = await db.query('SELECT agent_name, voice, greeting FROM assistants WHERE id = $1', [business.assistant_id]);
      if (astRes.rows.length > 0) {
        assistant = astRes.rows[0];
      }
    }

    res.status(200).json({
      status: business.onboarding_status || 'pending',
      step: business.onboarding_step || 1,
      twilio_number: business.twilio_number,
      business: {
        id: business.id,
        name: business.name,
        email: business.email,
        industry: business.industry,
        plan: business.plan,
        country_code: business.country_code,
        owner_mobile: business.owner_mobile,
        assistant_name: assistant?.agent_name || '',
        voice: assistant?.voice || '',
        greeting: assistant?.greeting || ''
      }
    });

  } catch (err) {
    console.error('[ONBOARDING] getStatus error:', err);
    res.status(500).json({ error: err.message });
  }
}

// Build system prompt from onboarding data
function buildSystemPrompt(config) {
  const {
    agent_name,
    greeting,
    industry,
    language
  } = config;

  const industryPrompt = {
    restaurant: `You are ${agent_name}, an AI voice assistant for a restaurant. Your job: Take table reservations, answer menu questions, and handle customer inquiries. Capture: customer name, phone, reservation date/time, party size.`,
    clinic: `You are ${agent_name}, an AI voice assistant for a medical clinic. Your job: Help patients book appointments and answer basic health questions. Capture: patient name, phone, health concern, preferred appointment date/time.`,
    'real-estate': `You are ${agent_name}, an AI voice assistant for a real estate agency. Your job: Qualify property buyers and capture their requirements. Capture: name, phone, budget, location preference, BHK type (1/2/3).`,
    other: `You are ${agent_name}, an AI voice assistant. Your job: Help callers and capture their contact information and requirements. Capture: caller name, phone number, and reason for calling.`
  }[industry] || `You are ${agent_name}, an AI voice assistant. Your job: Help callers and capture their contact information and requirements. Capture: caller name, phone number, and reason for calling.`;

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

// Complete onboarding flow (simulated or direct trigger for local testing / bypass)
async function completeTrial(req, res) {
  // Mock endpoint to simulate successful payment and trigger auto-provisioning
  try {
    const clientId = req.client?.id || req.user?.id;
    if (!clientId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { autoProvisionBusiness } = require('./billingController');
    await autoProvisionBusiness(clientId);

    res.status(200).json({
      success: true,
      message: 'Onboarding and automated setup completed successfully.'
    });
  } catch (err) {
    console.error('[ONBOARDING] completeTrial error:', err);
    res.status(500).json({ error: err.message });
  }
}

// Detect user's country
async function detectCountry(req, res) {
  res.status(200).json({ success: true, country_code: 'US', method: 'default_fallback' });
}

// Update country
async function setCountry(req, res) {
  try {
    const { country_code } = req.body;
    const clientId = req.client?.id || req.user?.id;

    if (!country_code || !clientId) {
      return res.status(400).json({ error: 'Missing details' });
    }

    await db.query(
      'UPDATE businesses SET country_code = $1::varchar, country = $1::text, updated_at = NOW() WHERE id = $2',
      [country_code, clientId]
    );

    res.status(200).json({ success: true, country_code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  saveStep,
  getStatus,
  buildSystemPrompt,
  completeTrial,
  detectCountry,
  setCountry
};
