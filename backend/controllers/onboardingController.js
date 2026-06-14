const db = require('../database/db');
const axios = require('axios');


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
      'UPDATE businesses SET onboarding_step = $1 WHERE id = $2',
      [step, clientId]
    );

    // Save step-specific data
    switch (step) {
      case 1:
        // Personal & Business Info
        await db.query(
          `UPDATE businesses SET
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
          `UPDATE businesses SET
            industry = $1,
            language = $2,
            intents = $3::jsonb
          WHERE id = $4`,
          [data.industry, data.language, JSON.stringify(data.intents), clientId]
        );
        break;

      case 3:
        // Configure AI Agent - Update both businesses and assistants
        await db.query(
          `UPDATE businesses SET
            industry = COALESCE($1, industry),
            language = COALESCE($2, language)
          WHERE id = $3`,
          [data.industry, data.language, clientId]
        );

        // Check if assistant exists
        const assistantResult = await db.query(
          'SELECT id FROM assistants WHERE business_id = $1',
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
            WHERE business_id = $8`,
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
              (business_id, name, agent_name, greeting, voice_id, faqs, industry, language, system_prompt, is_active)
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
          'UPDATE businesses SET onboarding_status = $1 WHERE id = $2',
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
    if (client_id !== requestingClientId) {
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
        created_at,
        country
      FROM businesses WHERE id = $1`,
      [client_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const business = result.rows[0];

    // Map status to step for frontend
    let step = business.onboarding_step || 0;
    if (business.onboarding_status === 'payment_pending') step = 4;
    if (business.onboarding_status === 'processing') step = 5;
    if (business.onboarding_status === 'ready') step = 5;

    res.status(200).json({
      status: business.onboarding_status || 'pending',
      step,
      twilio_number: business.twilio_number,
      business: {
        id: business.id,
        full_name: business.full_name,
        email: business.email,
        city: business.city,
        whatsapp_number: business.whatsapp_number,
        industry: business.industry,
        language: business.language,
        plan: business.plan,
        country: business.country
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
    'en-US': 'Speak in clear American English. Professional and friendly.',
    'en-GB': 'Speak in clear British English. Professional and polite.',
    'es-US': 'Speak in clear US Spanish. Professional and friendly.'
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
Always start with: "${greeting || `Hello! I am ${agent_name}, how can I help you today?`}"

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

// Complete onboarding and activate free trial
async function completeTrial(req, res) {
  try {
    const { 
      // Step 1 data
      businessName,
      industry,
      phone,
      website,
      objectives,
      // Step 2 data
      agentName,
      businessRole,
      languages,
      workingHoursFrom,
      workingHoursTo,
      greetingMessage,
      leadCapturePreferences
    } = req.body;
    
    const clientId = req.client?.id || req.user?.id;

    if (!clientId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    console.log(`[ONBOARDING] Activating Free Trial for client ${clientId}`);

    // Update business table details:
    // Sets plan = 'free', plan_name = 'free_trial', current_period_end = NOW() + 14 days, onboarding_status = 'ready', onboarding_step = 4
    await db.query(
      `UPDATE businesses SET
        name = COALESCE($1, name),
        industry = COALESCE($2, industry),
        phone = COALESCE($3, phone),
        whatsapp_number = COALESCE($3, whatsapp_number),
        website = COALESCE($4, website),
        intents = $5::jsonb,
        language = $6,
        working_hours_from = $7,
        working_hours_to = $8,
        onboarding_status = 'ready',
        onboarding_step = 4,
        plan = 'free',
        plan_name = 'free_trial',
        minutes_limit = 30,
        minutes_used = 0,
        status = 'active',
        current_period_end = NOW() + INTERVAL '14 days',
        billing_cycle_start = NOW()
      WHERE id = $9`,
      [
        businessName,
        industry,
        phone,
        website,
        JSON.stringify(objectives || []),
        Array.isArray(languages) ? languages[0] : (languages || 'en-US'),
        workingHoursFrom || '09:00:00',
        workingHoursTo || '18:00:00',
        clientId
      ]
    );

    // Build default system prompt for assistant
    const systemPrompt = buildSystemPrompt({
      agent_name: agentName || 'Bavio Agent',
      greeting: greetingMessage || `Hello! Thank you for calling ${businessName || 'us'}.`,
      industry: industry || 'other',
      language: Array.isArray(languages) ? languages[0] : (languages || 'en-US'),
      faqs: leadCapturePreferences ? [{ question: 'What details do you collect?', answer: `We collect: ${leadCapturePreferences.join(', ')}` }] : []
    });

    // Check if assistant exists
    const assistantResult = await db.query(
      'SELECT id FROM assistants WHERE business_id = $1',
      [clientId]
    );

    if (assistantResult.rows.length > 0) {
      await db.query(
        `UPDATE assistants SET
          agent_name = $1,
          greeting = $2,
          voice_id = 'meera',
          industry = $3,
          language = $4,
          system_prompt = $5,
          is_active = true
        WHERE business_id = $6`,
        [
          agentName || 'Bavio Agent',
          greetingMessage,
          industry || 'other',
          Array.isArray(languages) ? languages[0] : (languages || 'en-US'),
          systemPrompt,
          clientId
        ]
      );
    } else {
      await db.query(
        `INSERT INTO assistants
          (business_id, name, agent_name, greeting, voice_id, faqs, industry, language, system_prompt, is_active)
         VALUES ($1, $2, $3, $4, 'meera', '[]'::jsonb, $5, $6, $7, true)`,
        [
          clientId,
          agentName || 'Bavio Agent',
          agentName || 'Bavio Agent',
          greetingMessage,
          industry || 'other',
          Array.isArray(languages) ? languages[0] : (languages || 'en-US'),
          systemPrompt
        ]
      );
    }

    // Allocate a default pool number to business so it can be previewed/called immediately
    const poolNumResult = await db.query(
      "SELECT phone_number FROM phone_numbers WHERE type = 'pool' AND status = 'active' LIMIT 1"
    );
    let assignedNum = '+18005550199';
    if (poolNumResult.rows.length > 0) {
      assignedNum = poolNumResult.rows[0].phone_number;
    }

    await db.query(
      `UPDATE businesses SET
        twilio_number = $1,
        number_assigned_at = NOW()
      WHERE id = $2`,
      [assignedNum, clientId]
    );

    res.status(200).json({
      success: true,
      message: 'Guided onboarding completed. Free trial activated.',
      plan: 'free_trial',
      minutesLimit: 30,
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (err) {
    console.error('[ONBOARDING] completeTrial error:', err);
    res.status(500).json({ error: err.message });
  }
}

// Detect user's country from GeoIP
async function detectCountry(req, res) {
  try {
    let ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection.remoteAddress || 
             req.ip;

    if (ip && ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }

    console.log(`[GEOIP] Client IP detected: ${ip}`);

    // Try MaxMind if credentials exist
    const maxmindUserId = process.env.MAXMIND_USER_ID;
    const maxmindLicenseKey = process.env.MAXMIND_LICENSE_KEY;

    if (maxmindUserId && maxmindLicenseKey) {
      try {
        const auth = Buffer.from(`${maxmindUserId}:${maxmindLicenseKey}`).toString('base64');
        const response = await axios.get('https://geoip.maxmind.com/geoip/v2.1/country/' + (ip || 'me'), {
          headers: { 'Authorization': `Basic ${auth}` },
          timeout: 4000
        });
        if (response.data && response.data.country && response.data.country.iso_code) {
          let countryCode = response.data.country.iso_code.toUpperCase();
          if (countryCode === 'IN') countryCode = 'US';
          console.log(`[GEOIP] MaxMind resolved IP ${ip} to country ${countryCode}`);
          return res.status(200).json({ success: true, country_code: countryCode, method: 'maxmind' });
        }
      } catch (err) {
        console.warn('[GEOIP] MaxMind lookup failed, falling back to free GeoIP APIs:', err.message);
      }
    }

    // Try ipapi.co
    try {
      const response = await axios.get(`https://ipapi.co/${ip && ip !== '::1' && ip !== '127.0.0.1' ? ip : ''}/json/`, {
        timeout: 3000
      });
      if (response.data && response.data.country_code) {
        let countryCode = response.data.country_code.toUpperCase();
        if (countryCode === 'IN') countryCode = 'US';
        console.log(`[GEOIP] ipapi.co resolved IP to country ${countryCode}`);
        return res.status(200).json({ success: true, country_code: countryCode, method: 'geoip_fallback' });
      }
    } catch (err) {
      console.warn('[GEOIP] ipapi.co fallback failed, trying next fallback:', err.message);
    }

    // Try country.is
    try {
      const response = await axios.get('https://api.country.is/' + (ip && ip !== '::1' && ip !== '127.0.0.1' ? ip : ''), {
        timeout: 3000
      });
      if (response.data && response.data.country) {
        let countryCode = response.data.country.toUpperCase();
        if (countryCode === 'IN') countryCode = 'US';
        console.log(`[GEOIP] country.is resolved IP to country ${countryCode}`);
        return res.status(200).json({ success: true, country_code: countryCode, method: 'geoip_fallback_secondary' });
      }
    } catch (err) {
      console.warn('[GEOIP] All GeoIP fallbacks failed. Defaulting.');
    }

    // Default to US
    const defaultCountry = 'US';

    res.status(200).json({ success: true, country_code: defaultCountry, method: 'default_fallback' });
  } catch (err) {
    console.error('[GEOIP] detectCountry endpoint error:', err);
    res.status(200).json({ success: true, country_code: 'US', method: 'error_fallback' });
  }
}

// Update country_code for authenticated user
async function setCountry(req, res) {
  try {
    const { country_code } = req.body;
    const clientId = req.client?.id || req.user?.id;

    if (!country_code) {
      return res.status(400).json({ error: 'country_code is required' });
    }

    if (!clientId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const cleanedCountryCode = country_code.trim().toUpperCase().substring(0, 2);

    console.log(`[ONBOARDING] Setting country code to ${cleanedCountryCode} for client ${clientId}`);

    await db.query(
      `UPDATE businesses SET 
        country_code = $1::varchar,
        country = COALESCE(country, $1::text),
        updated_at = NOW()
       WHERE id = $2`,
      [cleanedCountryCode, clientId]
    );

    res.status(200).json({
      success: true,
      country_code: cleanedCountryCode,
      message: 'Country code updated successfully'
    });
  } catch (err) {
    console.error('[ONBOARDING] setCountry error:', err);
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

