const axios = require('axios');

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

async function generateResponse(messages, systemPrompt) {

  if (!SARVAM_API_KEY) {
    throw new Error('[LLM] SARVAM_API_KEY not set in .env');
  }

  console.log(`[LLM] Sending ${messages.length} messages to Sarvam`);

  const response = await axios.post(
    process.env.SARVAM_LLM_URL ||
      'https://api.sarvam.ai/v1/chat/completions',
    {
      model: process.env.SARVAM_LLM_MODEL || 'sarvam-30b',
      max_tokens: 1024,
      temperature: 0.7,
      reasoning_effort: null,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content?.trim() || '(silence)'
        }))
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${SARVAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    }
  );

  let rawText = response.data?.choices?.[0]?.message?.content || '';
  console.log(`[LLM] Raw response (${rawText.length} chars): "${rawText.slice(0, 120)}"`);

  // Strip complete thinking tags if present
  rawText = rawText.replace(/<thinking>.*?<\/thinking>/gs, '');
  rawText = rawText.replace(/<think>.*?<\/think>/gs, '');
  
  // Strip any unclosed thinking tags
  const thinkStart = rawText.indexOf('<think>');
  if (thinkStart !== -1) {
    rawText = rawText.slice(0, thinkStart);
  }
  const thinkingStart = rawText.indexOf('<thinking>');
  if (thinkingStart !== -1) {
    rawText = rawText.slice(0, thinkingStart);
  }
  
  rawText = rawText.trim();

  // Extract lead data if present
  let lead_data = null;
  if (rawText.includes('[LEAD_CAPTURED]')) {
    try {
      const jsonMatch = rawText.match(/\[LEAD_CAPTURED\]\s*(\{[\s\S]*?\})/);
      if (jsonMatch) {
        lead_data = JSON.parse(jsonMatch[1]);
        console.log('[LLM] Lead captured:', lead_data);
      }
    } catch (e) {
      console.error('[LLM] Failed to parse lead JSON:', e.message);
    }
    rawText = rawText.replace(/\[LEAD_CAPTURED\][\s\S]*?(\{[\s\S]*?\})?/g, '').trim();
  }

  // Filter out empty or placeholder lead data
  if (lead_data) {
    const hasRealData = Object.entries(lead_data).some(([key, val]) => {
      return val && val !== '...' && val !== 'Unknown' && !String(val).toLowerCase().includes('not collected') && String(val).trim() !== '';
    });
    if (!hasRealData) {
      console.log('[LLM] Discarding empty/placeholder lead data:', lead_data);
      lead_data = null;
    }
  }

  // Strip any lines containing key-value pairs (like name: ..., phone: ...) or lead fields
  // so the TTS never speaks them out loud
  rawText = rawText.split('\n').filter(line => {
    const lower = line.toLowerCase();
    if (lower.includes('name:') || lower.includes('phone:') || lower.includes('intent:') || lower.includes('budget:') || lower.includes('location:')) {
      return false;
    }
    if (lower.includes('not collected') || lower.includes('[lead_captured]')) {
      return false;
    }
    return true;
  }).join('\n').trim();

  // Check if call should end
  let should_end = rawText.includes('[END_CALL]');
  if (should_end) {
    // Prevent premature end-call if it's the first turn or if the lead data was a placeholder
    const isPremature = messages.length <= 2 || (rawText.includes('Thank you for calling') && !lead_data);
    if (isPremature) {
      console.log('[LLM] Ignoring premature end call');
      should_end = false;
      rawText = rawText.replace('[END_CALL]', '').trim();
    } else {
      rawText = rawText.replace('[END_CALL]', '').trim();
      console.log('[LLM] End call detected');
    }
  }

  return {
    response_text: rawText.trim(),
    lead_data,
    should_end
  };
}

// Build system prompt per industry
function buildSystemPrompt(assistant, business) {
  const lang = assistant?.language || 'en-US';
  const industry = assistant?.industry || 'general';
  const bizName = business?.name || 'this business';

  const langInstruction = {
    'en-US': 'Speak in clear American English. Professional and friendly.',
    'en-GB': 'Speak in clear British English. Professional and polite.',
    'es-US': 'Speak in clear US Spanish. Professional and friendly.'
  }[lang] || 'Speak naturally and professionally.';

  const industryPrompt = {
    real_estate: `You are an AI assistant for ${bizName}, a real estate agency.
Your job: qualify property buyers and capture their requirements.
Capture: budget (e.g. $600,000), location preference, bedroom count (1/2/3 bedrooms),
ready-to-move or under construction, and their name and phone number.
Example opener: "Hello! How can I help you find your dream property today?"`,

    clinic: `You are an AI assistant for ${bizName}, a medical clinic.
Your job: help patients book appointments.
Capture: patient name, phone number, health issue/doctor needed,
preferred appointment date and time.
Example opener: "Hello! Are you looking to book an appointment with one of our doctors?"`,

    edtech: `You are an AI assistant for ${bizName}, an education institute.
Your job: help students with course enquiries.
Capture: student name, phone, course interested in,
current qualification, and budget.
Example opener: "Hello! Which course or program are you interested in?"`,

    restaurant: `You are an AI assistant for ${bizName}, a restaurant.
Your job: take table reservations.
Capture: customer name, phone, reservation date and time, party size.
Example opener: "Hello! Are you looking to make a table reservation today?"`,

    general: `You are an AI assistant for ${bizName}.
Your job: help callers and capture their contact information.
Capture: caller name, phone number, and reason for calling.
Example opener: "Hello! Thanks for calling ${bizName}. How can I assist you today?"`
  }[industry] || `You are an AI assistant for ${bizName}.`;

  const customPrompt = assistant?.system_prompt
    ? `\n\nAdditional instructions:\n${assistant.system_prompt}`
    : '';

  return `${industryPrompt}

${langInstruction}

IMPORTANT RULES & CONVERSATION PHASES:
1. Phase 1: Natural Conversation (First 2-3 turns of the call). Greet the caller naturally, discuss their requirements or interest, and talk naturally. DO NOT ask for their name, location preference, or budget during this phase.
2. Phase 2: Sequential Information Gathering. After the first 2-3 turns of conversation, collect these details ONE BY ONE in this exact sequence:
   - First, ask for their Name. (e.g., "May I have your name, please?")
   - Once they answer with their Name, ask for their Location preference. (e.g., "Which neighborhood or location are you looking in?")
   - Once they answer with their Location, ask for their Budget. (e.g., "What is your budget range?")
   - NEVER ask for more than one piece of information at a time.
3. Phase 3: Confirmation. Before completing the call, you MUST summarize and repeat all collected details (Name, Location, Budget) back to the caller to confirm they are correct (e.g., "So, your name is [Name], you are looking in [Location], and your budget is [Budget]. Is that correct?").
4. Keep responses EXTREMELY SHORT — maximum 1 sentence, and under 15 words per turn. NEVER output long paragraphs or explanations. Be crisp, brief, and to-the-point.
5. Be warm, helpful, and conversational.
6. Never mention you are an AI unless directly asked.
7. If caller is rude or abusive, politely end the call.

LEAD CAPTURE:
When you have collected all details (name + phone + budget / location), and confirmed them with the caller in Phase 3, add this EXACTLY at the end of your response on a NEW LINE:
[LEAD_CAPTURED]
{"name":"...","phone":"...","intent":"...","budget":"...","location":"..."}

END CALL:
When you have confirmed the details, got their confirmation, and exchanged final goodbyes, add:
[END_CALL]
${customPrompt}`;
}

module.exports = { generateResponse, buildSystemPrompt };
