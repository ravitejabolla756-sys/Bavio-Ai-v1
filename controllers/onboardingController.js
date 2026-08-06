const db = require('../database/db');
const axios = require('axios');

// Helper function to verify active subscription
async function verifyActiveSubscription(clientId) {
  if (!clientId) {
    return { authorized: false, error: 'unauthorized', message: 'Authentication required', status: 401 };
  }

  const bizRes = await db.query(
    'SELECT id, subscription_status, plan, plan_name, onboarding_status, onboarding_step, country_code FROM businesses WHERE id = $1',
    [clientId]
  );

  if (bizRes.rows.length === 0) {
    return { authorized: false, error: 'business_not_found', message: 'Business record not found', status: 404 };
  }

  const business = bizRes.rows[0];
  const subStatus = business.subscription_status || 'inactive';

  if (subStatus !== 'active') {
    return {
      authorized: false,
      error: 'subscription_required',
      message: 'An active paid subscription is required to access paid onboarding.',
      status: 403
    };
  }

  return { authorized: true, business };
}

// Build system prompt from onboarding data
function buildSystemPrompt(config) {
  const {
    agent_name,
    greeting,
    industry,
    language,
    tone = 'professional',
    mainResponsibilities = '',
    leadInfoToCapture = '',
    escalationRules = '',
    humanContactNumber = '',
    knowledge = {}
  } = config;

  const baseRole = `You are ${agent_name || 'Bavio Assistant'}, an AI receptionist representing the business (${industry || 'general'}).`;

  let prompt = `${baseRole} Tone: ${tone}.

GREETING:
Always start with: "${greeting || `Hello! I am ${agent_name}, how can I help you today?`}"

MAIN RESPONSIBILITIES:
${mainResponsibilities || 'Answer caller questions, provide accurate business information, and capture qualified leads.'}

LEAD INFORMATION TO CAPTURE:
${leadInfoToCapture || 'Caller Name, Phone Number, Email, and Reason for Calling.'}

ESCALATION & HUMAN CONTACT:
${escalationRules ? escalationRules : 'If caller demands a human representative, notify them that a senior manager will call them back shortly.'} ${humanContactNumber ? `Transfer/Contact Number: ${humanContactNumber}` : ''}
`;

  if (knowledge) {
    if (knowledge.serviceDetails) prompt += `\nSERVICE DETAILS:\n${knowledge.serviceDetails}\n`;
    if (knowledge.pricingGuidance) prompt += `\nPRICING GUIDANCE:\n${knowledge.pricingGuidance}\n`;
    if (knowledge.policies) prompt += `\nPOLICIES:\n${knowledge.policies}\n`;
    if (knowledge.importantInstructions) prompt += `\nIMPORTANT INSTRUCTIONS:\n${knowledge.importantInstructions}\n`;
    if (knowledge.qualificationQuestions) prompt += `\nQUALIFICATION QUESTIONS:\n${knowledge.qualificationQuestions}\n`;
    if (knowledge.doNotInvent) prompt += `\nINFORMATION NEVER TO INVENT (STRICT RULE):\n${knowledge.doNotInvent}\n`;
    if (Array.isArray(knowledge.faqs) && knowledge.faqs.length > 0) {
      prompt += `\nFREQUENTLY ASKED QUESTIONS:\n` + knowledge.faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n') + '\n';
    }
  }

  prompt += `
STRICT OPERATIONAL RULES:
1. Keep responses concise (maximum 2 sentences per turn).
2. Ask ONE clarifying question at a time.
3. NEVER invent prices, addresses, or commitments not explicitly stated in the knowledge base.
4. When lead information is fully captured, output [LEAD_CAPTURED] on a separate line with lead JSON.
5. Conclude calls politely and output [END_CALL].`;

  return prompt;
}

// STEP 1 — BUSINESS
async function saveBusinessStep(req, res) {
  try {
    const clientId = req.client?.id || req.user?.id;
    const check = await verifyActiveSubscription(clientId);
    if (!check.authorized) {
      return res.status(check.status).json({ error: check.error, message: check.message });
    }

    const {
      businessName,
      industry,
      businessDescription,
      website,
      country,
      timezone,
      businessPhone,
      officeHours,
      locationsServed,
      servicesProvided
    } = req.body;

    if (!businessName || !industry) {
      return res.status(400).json({ error: 'invalid_input', message: 'Business name and industry are required' });
    }

    const countryCode = (country || 'US').trim().toUpperCase().substring(0, 2);
    const intentsObj = {
      officeHours: officeHours || '',
      locationsServed: locationsServed || '',
      servicesProvided: servicesProvided || '',
      timezone: timezone || 'UTC'
    };

    await db.query(
      `UPDATE businesses SET
        name = $1,
        business_name = $2,
        industry = $3,
        business_description = $4,
        website = $5,
        country_code = $6,
        country = $7,
        phone = COALESCE($8, phone),
        intents = $9,
        onboarding_step = GREATEST(onboarding_step, 1),
        updated_at = NOW()
      WHERE id = $10`,
      [
        businessName.trim(),
        businessName.trim(),
        industry.trim(),
        (businessDescription || '').trim(),
        (website || '').trim(),
        countryCode,
        countryCode,
        businessPhone ? businessPhone.trim() : null,
        JSON.stringify(intentsObj),
        clientId
      ]
    );

    return res.status(200).json({
      success: true,
      step: 1,
      nextStep: '/onboarding/knowledge',
      message: 'Business details saved successfully'
    });
  } catch (err) {
    console.error('[ONBOARDING] saveBusinessStep error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

// STEP 2 — KNOWLEDGE
async function saveKnowledgeStep(req, res) {
  try {
    const clientId = req.client?.id || req.user?.id;
    const check = await verifyActiveSubscription(clientId);
    if (!check.authorized) {
      return res.status(check.status).json({ error: check.error, message: check.message });
    }

    const {
      faqs,
      serviceDetails,
      pricingGuidance,
      policies,
      importantInstructions,
      qualificationQuestions,
      doNotInvent
    } = req.body;

    // Clear previous knowledge docs for clean manual entry update
    await db.query('DELETE FROM knowledge_base_docs WHERE business_id = $1', [clientId]);

    const knowledgeItems = [
      { name: 'Service Details', content: serviceDetails },
      { name: 'Pricing Guidance', content: pricingGuidance },
      { name: 'Policies', content: policies },
      { name: 'Important Instructions', content: importantInstructions },
      { name: 'Qualification Questions', content: qualificationQuestions },
      { name: 'Do Not Invent Rules', content: doNotInvent }
    ];

    for (const item of knowledgeItems) {
      if (item.content && item.content.trim()) {
        await db.query(
          `INSERT INTO knowledge_base_docs (business_id, name, content) VALUES ($1, $2, $3)`,
          [clientId, item.name, item.content.trim()]
        );
      }
    }

    const formattedFaqs = Array.isArray(faqs) ? faqs.filter(f => f && f.question && f.answer) : [];

    const intentsRes = await db.query('SELECT intents FROM businesses WHERE id = $1', [clientId]);
    let currentIntents = {};
    try {
      currentIntents = typeof intentsRes.rows[0]?.intents === 'string'
        ? JSON.parse(intentsRes.rows[0].intents)
        : (intentsRes.rows[0]?.intents || {});
    } catch (e) {}

    currentIntents.faqs = formattedFaqs;
    currentIntents.serviceDetails = serviceDetails || '';
    currentIntents.pricingGuidance = pricingGuidance || '';
    currentIntents.policies = policies || '';
    currentIntents.importantInstructions = importantInstructions || '';
    currentIntents.qualificationQuestions = qualificationQuestions || '';
    currentIntents.doNotInvent = doNotInvent || '';

    await db.query(
      `UPDATE businesses SET
        intents = $1,
        onboarding_step = GREATEST(onboarding_step, 2),
        updated_at = NOW()
      WHERE id = $2`,
      [JSON.stringify(currentIntents), clientId]
    );

    await db.query(
      `UPDATE assistants SET faqs = $1, updated_at = NOW() WHERE business_id = $2`,
      [JSON.stringify(formattedFaqs), clientId]
    );

    return res.status(200).json({
      success: true,
      step: 2,
      nextStep: '/onboarding/agent',
      message: 'Knowledge base saved successfully'
    });
  } catch (err) {
    console.error('[ONBOARDING] saveKnowledgeStep error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

// STEP 3 — AGENT
async function saveAgentStep(req, res) {
  try {
    const clientId = req.client?.id || req.user?.id;
    const check = await verifyActiveSubscription(clientId);
    if (!check.authorized) {
      return res.status(check.status).json({ error: check.error, message: check.message });
    }

    const {
      assistantName,
      language,
      voice,
      greeting,
      tone,
      mainResponsibilities,
      leadInfoToCapture,
      escalationRules,
      humanContactNumber
    } = req.body;

    const agentName = (assistantName || 'Bavio Assistant').trim();
    const voiceId = (voice || 'meera').trim();
    const lang = (language || 'en-US').trim();

    const bizRes = await db.query('SELECT name, industry, intents FROM businesses WHERE id = $1', [clientId]);
    const biz = bizRes.rows[0] || {};

    let intents = {};
    try {
      intents = typeof biz.intents === 'string' ? JSON.parse(biz.intents) : (biz.intents || {});
    } catch (e) {}

    const customGreeting = (greeting || `Hello. This is ${agentName} from ${biz.name || 'our business'}. How may I assist you today?`).trim();

    const systemPrompt = buildSystemPrompt({
      agent_name: agentName,
      greeting: customGreeting,
      industry: biz.industry || 'general',
      language: lang,
      tone: tone || 'professional',
      mainResponsibilities,
      leadInfoToCapture,
      escalationRules,
      humanContactNumber,
      knowledge: intents
    });

    const astRes = await db.query('SELECT id FROM assistants WHERE business_id = $1', [clientId]);
    let assistantId;

    if (astRes.rows.length > 0) {
      assistantId = astRes.rows[0].id;
      await db.query(
        `UPDATE assistants SET
          name = $1,
          agent_name = $2,
          greeting = $3,
          voice = $4,
          voice_id = $4,
          language = $5,
          system_prompt = $6,
          faqs = $7,
          is_active = true,
          updated_at = NOW()
        WHERE id = $8`,
        [agentName, agentName, customGreeting, voiceId, lang, systemPrompt, JSON.stringify(intents.faqs || []), assistantId]
      );
    } else {
      const insRes = await db.query(
        `INSERT INTO assistants (business_id, name, agent_name, greeting, system_prompt, voice_id, voice, language, faqs, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, true)
         RETURNING id`,
        [clientId, agentName, agentName, customGreeting, systemPrompt, voiceId, lang, JSON.stringify(intents.faqs || [])]
      );
      assistantId = insRes.rows[0].id;
    }

    await db.query(
      `UPDATE businesses SET
        assistant_id = $1,
        onboarding_step = GREATEST(onboarding_step, 3),
        updated_at = NOW()
      WHERE id = $2`,
      [assistantId, clientId]
    );

    return res.status(200).json({
      success: true,
      step: 3,
      assistantId,
      nextStep: '/onboarding/phone',
      message: 'AI Agent configured successfully'
    });
  } catch (err) {
    console.error('[ONBOARDING] saveAgentStep error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

// STEP 4 — PHONE (Search & purchase Twilio number)
async function assignPhone(req, res) {
  try {
    const clientId = req.client?.id || req.user?.id;
    const check = await verifyActiveSubscription(clientId);
    if (!check.authorized) {
      return res.status(check.status).json({ error: check.error, message: check.message });
    }

    const { country } = req.body;
    const bizRes = await db.query(
      'SELECT id, name, twilio_number, country_code, assistant_id FROM businesses WHERE id = $1',
      [clientId]
    );

    if (bizRes.rows.length === 0) {
      return res.status(404).json({ error: 'business_not_found', message: 'Business profile missing' });
    }

    const business = bizRes.rows[0];

    // Require assistant to exist prior to number purchase
    if (!business.assistant_id) {
      return res.status(400).json({ error: 'assistant_required', message: 'Please configure your AI Agent prior to purchasing a phone number.' });
    }

    const targetCountry = (country || business.country_code || 'US').trim().toUpperCase();

    // Disallow unsupported or India country code for Twilio provisioning
    if (targetCountry === 'IN') {
      return res.status(400).json({ error: 'unsupported_country', message: 'Indian virtual numbers are currently unavailable.' });
    }

    if (business.twilio_number) {
      await db.query(
        `UPDATE businesses SET onboarding_step = GREATEST(onboarding_step, 4), updated_at = NOW() WHERE id = $1`,
        [clientId]
      );

      return res.status(200).json({
        success: true,
        phoneNumber: business.twilio_number,
        country: targetCountry,
        provider: 'TWILIO',
        status: 'ACTIVE',
        monthlyCharge: 1,
        currency: 'USD',
        nextStep: '/onboarding/test-call'
      });
    }

    let assignedPhone = null;
    let providerSid = null;

    try {
      const twilioProvider = require('../providers/twilio');
      console.log(`[PROVISION] Purchasing dedicated Twilio number for country: ${targetCountry}...`);
      const twilioResult = await twilioProvider.buyNumberWithDetails(targetCountry);
      assignedPhone = twilioResult.phoneNumber;
      providerSid = twilioResult.sid;
      console.log(`[PROVISION] Successfully purchased dedicated Twilio number: ${assignedPhone} (SID: ${providerSid})`);
    } catch (e) {
      console.error(`[PROVISION] Twilio purchase failed: ${e.message}`);
      return res.status(500).json({
        error: 'provisioning_failed',
        message: `Failed to purchase a phone number for ${targetCountry} via Twilio: ${e.message}. Do not assign mock numbers.`
      });
    }

    // Insert into phone_numbers table
    const phoneNumRes = await db.query(
      `INSERT INTO phone_numbers (business_id, phone_number, country_code, provider, status, type, is_active, twilio_sid)
       VALUES ($1, $2, $3, 'twilio', 'active', 'dedicated', true, $4)
       RETURNING id`,
      [clientId, assignedPhone, targetCountry, providerSid || 'PN_twilio_real']
    );
    const phoneId = phoneNumRes.rows[0].id;

    // Update business record
    await db.query(
      `UPDATE businesses 
       SET twilio_number = $1, 
           twilio_number_sid = $2,
           phone_number_id = $3, 
           onboarding_step = GREATEST(onboarding_step, 4),
           updated_at = NOW()
       WHERE id = $4`,
      [assignedPhone, providerSid || 'PN_twilio_real', phoneId, clientId]
    );

    return res.status(200).json({
      success: true,
      phoneNumber: assignedPhone,
      country: targetCountry,
      provider: 'TWILIO',
      status: 'ACTIVE',
      monthlyCharge: 1,
      currency: 'USD',
      nextStep: '/onboarding/test-call'
    });

  } catch (err) {
    console.error('[ONBOARDING] assignPhone error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

// Preview TTS Greeting
async function previewTts(req, res) {
  try {
    const { text, voice } = req.body;
    return res.status(200).json({
      success: true,
      text: text || 'Hello! Thank you for calling.',
      voice: voice || 'meera',
      audioUrl: null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// STEP 5 — TEST CALL
async function testCallStep(req, res) {
  try {
    const clientId = req.client?.id || req.user?.id;
    const check = await verifyActiveSubscription(clientId);
    if (!check.authorized) {
      return res.status(check.status).json({ error: check.error, message: check.message });
    }

    const bizRes = await db.query(
      `SELECT b.twilio_number, b.name, a.agent_name, a.greeting, a.system_prompt
       FROM businesses b
       LEFT JOIN assistants a ON b.assistant_id = a.id
       WHERE b.id = $1`,
      [clientId]
    );
    const business = bizRes.rows[0];

    if (!business || !business.twilio_number) {
      return res.status(400).json({ error: 'phone_required', message: 'Please provision a phone number first.' });
    }

    await db.query(
      `UPDATE businesses SET onboarding_step = GREATEST(onboarding_step, 5), updated_at = NOW() WHERE id = $1`,
      [clientId]
    );

    return res.status(200).json({
      success: true,
      step: 5,
      twilioNumber: business.twilio_number,
      businessName: business.name,
      assistantName: business.agent_name || 'Bavio Assistant',
      greeting: business.greeting,
      nextStep: '/onboarding/complete',
      message: 'Test call step verified'
    });
  } catch (err) {
    console.error('[ONBOARDING] testCallStep error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

// STEP 6 — COMPLETE
async function completeOnboardingStep(req, res) {
  try {
    const clientId = req.client?.id || req.user?.id;
    const check = await verifyActiveSubscription(clientId);
    if (!check.authorized) {
      return res.status(check.status).json({ error: check.error, message: check.message });
    }

    await db.query(
      `UPDATE businesses SET onboarding_status = 'completed', onboarding_step = 6, updated_at = NOW() WHERE id = $1`,
      [clientId]
    );

    const bizRes = await db.query(
      `SELECT b.name, b.industry, b.country_code, b.twilio_number, b.plan_name, a.agent_name, a.voice, a.language
       FROM businesses b
       LEFT JOIN assistants a ON b.assistant_id = a.id
       WHERE b.id = $1`,
      [clientId]
    );

    const summary = bizRes.rows[0] || {};

    return res.status(200).json({
      success: true,
      step: 6,
      summary: {
        businessName: summary.name || 'Your Business',
        industry: summary.industry || 'General',
        country: summary.country_code || 'US',
        phoneNumber: summary.twilio_number || 'Not assigned',
        assistantName: summary.agent_name || 'Bavio Assistant',
        voice: summary.voice || 'meera',
        language: summary.language || 'en-US',
        plan: (summary.plan_name || 'growth').toUpperCase(),
        status: 'Active'
      },
      nextRoute: '/dashboard'
    });
  } catch (err) {
    console.error('[ONBOARDING] completeOnboardingStep error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

// Legacy saveStep compatibility method
async function saveStep(req, res) {
  const { step } = req.body;
  if (step === 1) return saveBusinessStep(req, res);
  if (step === 2) return saveKnowledgeStep(req, res);
  if (step === 3) return saveAgentStep(req, res);
  if (step === 4) return assignPhone(req, res);
  if (step === 5) return testCallStep(req, res);
  if (step === 6) return completeOnboardingStep(req, res);
  return res.status(400).json({ error: 'invalid_step' });
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
        phone_number_id,
        subscription_status
      FROM businesses WHERE id = $1`,
      [client_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const business = result.rows[0];

    let assistant = null;
    if (business.assistant_id) {
      const astRes = await db.query('SELECT agent_name, voice, greeting, language FROM assistants WHERE id = $1', [business.assistant_id]);
      if (astRes.rows.length > 0) {
        assistant = astRes.rows[0];
      }
    }

    res.status(200).json({
      status: business.onboarding_status || 'pending',
      step: business.onboarding_step || 1,
      subscription_status: business.subscription_status || 'inactive',
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
        greeting: assistant?.greeting || '',
        language: assistant?.language || 'en-US'
      }
    });

  } catch (err) {
    console.error('[ONBOARDING] getStatus error:', err);
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
  saveBusinessStep,
  saveKnowledgeStep,
  saveAgentStep,
  assignPhone,
  previewTts,
  testCallStep,
  completeOnboardingStep,
  saveStep,
  getStatus,
  detectCountry,
  setCountry
};
