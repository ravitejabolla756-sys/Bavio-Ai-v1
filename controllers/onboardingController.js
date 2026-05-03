const db = require('../database/db');

// Save onboarding step data
async function saveStep(req, res) {
  try {
    const { step, data } = req.body;
    const clientId = req.client?.id;

    if (!step || !data) {
      return res.status(400).json({ error: 'step and data are required' });
    }

    console.log(`[ONBOARDING] Saving step ${step} for client ${clientId}`);

    // Update onboarding step progress
    await db.query(
      'UPDATE clients SET onboarding_step = $1 WHERE id = $2',
      [step, clientId]
    );

    // Save step-specific data
    switch (step) {
      case 1:
        // Personal & Business Info
        await db.query(
          `UPDATE clients SET
            full_name = $1,
            email = COALESCE($2, email),
            city = $3,
            whatsapp_number = $4,
            business_description = $5,
            working_hours_from = $6,
            working_hours_to = $7
          WHERE id = $8`,
          [
            data.full_name,
            data.email,
            data.city,
            data.whatsapp_number,
            data.business_description,
            data.working_hours_from,
            data.working_hours_to,
            clientId
          ]
        );
        break;

      case 2:
        // Industry & Language
        await db.query(
          `UPDATE clients SET
            industry = $1,
            language = $2,
            intents = $3::jsonb
          WHERE id = $4`,
          [data.industry, data.language, JSON.stringify(data.intents), clientId]
        );
        break;

      case 3:
        // Configure AI Agent - Update both clients and assistants
        await db.query(
          `UPDATE clients SET
            industry = COALESCE($1, industry),
            language = COALESCE($2, language)
          WHERE id = $3`,
          [data.industry, data.language, clientId]
        );

        // Check if assistant exists
        const assistantResult = await db.query(
          'SELECT id FROM assistants WHERE client_id = $1',
          [clientId]
        );

        const systemPrompt = buildSystemPrompt({
          agent_name: data.agent_name,
          greeting: data.greeting,
          industry: data.industry,
          language: data.language,
          faqs: data.faqs
        });

        if (assistantResult.rows.length > 0) {
          // Update existing assistant
          await db.query(
            `UPDATE assistants SET
              agent_name = $1,
              greeting = $2,
              voice_id = $3,
              faqs = $4::jsonb,
              industry = $5,
              language = $6,
              system_prompt = $7
            WHERE client_id = $8`,
            [
              data.agent_name,
              data.greeting,
              data.voice_id,
              JSON.stringify(data.faqs),
              data.industry,
              data.language,
              systemPrompt,
              clientId
            ]
          );
        } else {
          // Create new assistant
          await db.query(
            `INSERT INTO assistants
              (client_id, name, agent_name, greeting, voice_id, faqs, industry, language, system_prompt, is_active)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, false)`,
            [
              clientId,
              data.agent_name,
              data.agent_name,
              data.greeting,
              data.voice_id,
              JSON.stringify(data.faqs),
              data.industry,
              data.language,
              systemPrompt
            ]
          );
        }
        break;

      case 4:
        // Plan selection - handled by billing/subscribe
        // Just mark step as complete
        await db.query(
          'UPDATE clients SET onboarding_status = $1 WHERE id = $2',
          ['payment_pending', clientId]
        );
        break;

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
    const requestingClientId = req.client?.id;

    // Security check
    if (parseInt(client_id) !== requestingClientId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await db.query(
      `SELECT 
        id,
        full_name,
        email,
        city,
        whatsapp_number,
        industry,
        language,
        plan,
        twilio_number,
        onboarding_status,
        onboarding_step,
        created_at
      FROM clients WHERE id = $1`,
      [client_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = result.rows[0];

    // Map status to step for frontend
    let step = client.onboarding_step || 0;
    if (client.onboarding_status === 'payment_pending') step = 4;
    if (client.onboarding_status === 'processing') step = 5;
    if (client.onboarding_status === 'ready') step = 5;

    res.status(200).json({
      status: client.onboarding_status || 'pending',
      step,
      twilio_number: client.twilio_number,
      business: {
        id: client.id,
        full_name: client.full_name,
        email: client.email,
        city: client.city,
        whatsapp_number: client.whatsapp_number,
        industry: client.industry,
        language: client.language,
        plan: client.plan
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
    language,
    faqs
  } = config;

  const langInstruction = {
    'hi-IN': 'Hinglish mein baat karo (Hindi + English mix). Natural aur friendly tone.',
    'en-IN': 'Speak in Indian English. Warm and professional tone.',
    'hinglish': 'Hinglish mein baat karo (Hindi + English mix). Natural aur friendly tone.',
    'en-US': 'Speak in clear American English. Professional and friendly.'
  }[language] || 'Speak in a natural, friendly and professional tone.';

  const industryPrompt = {
    restaurant: `You are ${agent_name}, an AI voice assistant for a restaurant.
Your job: Take table reservations, answer menu questions, and handle customer inquiries.
Capture: customer name, phone, reservation date/time, party size.`,

    clinic: `You are ${agent_name}, an AI voice assistant for a medical clinic.
Your job: Help patients book appointments and answer basic health questions.
Capture: patient name, phone, health concern, preferred appointment date/time.`,

    'real-estate': `You are ${agent_name}, an AI voice assistant for a real estate agency.
Your job: Qualify property buyers and capture their requirements.
Capture: name, phone, budget, location preference, BHK type (1/2/3).`,

    education: `You are ${agent_name}, an AI voice assistant for an education institute.
Your job: Help students with course enquiries and enrollment.
Capture: student name, phone, course interested in, current qualification.`,

    salon: `You are ${agent_name}, an AI voice assistant for a beauty salon.
Your job: Book appointments for hair, skin, and spa services.
Capture: customer name, phone, service type, preferred date/time.`,

    gym: `You are ${agent_name}, an AI voice assistant for a fitness gym.
Your job: Handle membership enquiries and class bookings.
Capture: name, phone, fitness goals, preferred membership type.`,

    finance: `You are ${agent_name}, an AI voice assistant for a financial services firm.
Your job: Schedule consultations and answer basic finance questions.
Capture: name, phone, service type (loan/investment/insurance), preferred time.`,

    legal: `You are ${agent_name}, an AI voice assistant for a law firm.
Your job: Schedule legal consultations and categorize case types.
Capture: name, phone, legal issue type, urgency level, preferred time.`,

    retail: `You are ${agent_name}, an AI voice assistant for a retail store.
Your job: Handle product enquiries and order tracking.
Capture: customer name, phone, product interest, order number if any.`,

    other: `You are ${agent_name}, an AI voice assistant.
Your job: Help callers and capture their contact information and requirements.
Capture: caller name, phone number, and reason for calling.`
  }[industry] || `You are ${agent_name}, an AI voice assistant.
Your job: Help callers and capture their contact information.
Capture: caller name, phone number, and reason for calling.`;

  let faqSection = '';
  if (faqs && faqs.length > 0) {
    faqSection = '\n\nCOMMON QUESTIONS AND ANSWERS:\n' +
      faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
  }

  return `${industryPrompt}

${langInstruction}${faqSection}

GREETING:
Always start with: "${greeting || `Hello! Main ${agent_name} bol raha hoon.`}"

IMPORTANT RULES:
1. Keep responses SHORT — maximum 2 sentences per turn
2. Ask ONE question at a time — never multiple questions
3. Be warm, helpful, and conversational
4. Never mention you are an AI unless directly asked
5. If caller is rude or abusive, politely end the call
6. Always confirm the caller's name and phone number before ending

LEAD CAPTURE:
When you have collected: name + phone + at least one key detail (budget / location / appointment time / course / issue),
add this EXACTLY at the end of your response on a NEW LINE:
[LEAD_CAPTURED]
{"name":"...","phone":"...","intent":"...","budget":"...","location":"..."}

END CALL:
When the conversation is naturally complete (lead captured + goodbye exchanged), add:
[END_CALL]`;
}

module.exports = {
  saveStep,
  getStatus,
  buildSystemPrompt
};
