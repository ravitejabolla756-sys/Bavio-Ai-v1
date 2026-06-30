const axios = require('axios');
const FormData = require('form-data');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

/**
 * Dynamically resolves the provider config.
 * Groq keys start with 'gsk_' and use Groq's low-latency endpoints.
 */
function getProviderConfig(apiKey) {
  const key = apiKey || OPENAI_API_KEY;
  if (key && key.startsWith('gsk_')) {
    return {
      baseUrl: 'https://api.groq.com/openai/v1',
      chatModel: process.env.GROQ_CHAT_MODEL || 'llama-3.3-70b-versatile',
      sttModel: 'whisper-large-v3',
      apiKey: key,
      providerName: 'Groq'
    };
  }
  return {
    baseUrl: OPENAI_BASE_URL,
    chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o',
    sttModel: 'whisper-1',
    apiKey: key,
    providerName: 'OpenAI'
  };
}

// -- Whisper STT ---------------------------------------------------------------

/**
 * Transcribe audio using Whisper (OpenAI or Groq).
 * @param {Buffer} audioBuffer - Raw audio buffer (WAV, MP3, etc.)
 * @param {string} language    - BCP-47 language code e.g. 'en-IN', 'hi-IN'
 * @param {string} apiKey      - Optional custom API key (OpenAI or Groq)
 * @returns {Promise<{text: string, transcript: string, language_code: string}>}
 */
async function transcribeAudio(audioBuffer, language = 'en', apiKey = null) {
  const config = getProviderConfig(apiKey);
  if (!config.apiKey) {
    throw new Error(`[${config.providerName} STT] API key is not configured.`);
  }

  const form = new FormData();
  form.append('file', audioBuffer, {
    filename: 'audio.wav',
    contentType: 'audio/wav'
  });
  form.append('model', config.sttModel);
  
  // Whisper accepts ISO-639-1 only (e.g. 'hi', 'en', 'es')
  const lang = language.split('-')[0].toLowerCase();
  form.append('language', lang);
  form.append('response_format', 'text');

  console.log(`[${config.providerName} STT] Transcribing ${audioBuffer.length} bytes (lang: ${lang})`);

  const response = await axios.post(`${config.baseUrl}/audio/transcriptions`, form, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      ...form.getHeaders()
    },
    timeout: 30000
  });

  const transcript = (typeof response.data === 'string'
    ? response.data
    : response.data?.text || ''
  ).trim();

  console.log(`[${config.providerName} STT] Transcript: "${transcript.slice(0, 120)}"`);
  return {
    text: transcript,
    transcript: transcript,
    language_code: language
  };
}

// -- Chat Completions -----------------------------------------------------------

/**
 * Generate a conversational AI response using LLM (GPT-4o or Llama 3.3).
 *
 * @param {string} systemPrompt          - System role instructions
 * @param {Array<{role,content}>} history - Conversation history (includes latest user msg)
 * @param {string} apiKey                - Optional custom API key (OpenAI or Groq)
 * @returns {Promise<{response_text: string, lead_data: any, should_end: boolean}>}
 */
async function chat(systemPrompt, history = [], apiKey = null) {
  const config = getProviderConfig(apiKey);
  if (!config.apiKey) {
    throw new Error(`[${config.providerName} LLM] API key is not configured.`);
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content?.trim() || '(silence)'
    }))
  ];

  console.log(`[${config.providerName} LLM] Sending ${messages.length} messages to ${config.chatModel}`);

  const response = await axios.post(
    `${config.baseUrl}/chat/completions`,
    {
      model: config.chatModel,
      max_tokens: 256,
      temperature: 0.7,
      messages
    },
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    }
  );

  let rawText = response.data?.choices?.[0]?.message?.content || '';
  console.log(`[${config.providerName} LLM] Raw (${rawText.length} chars): "${rawText.slice(0, 120)}"`);

  // -- Extract lead data ------------------------------------------------------
  let lead_data = null;
  if (rawText.includes('[LEAD_CAPTURED]')) {
    try {
      const jsonMatch = rawText.match(/\[LEAD_CAPTURED\]\s*(\{[\s\S]*?\})/);
      if (jsonMatch) {
        lead_data = JSON.parse(jsonMatch[1]);
        console.log(`[${config.providerName} LLM] Lead captured:`, lead_data);
      }
    } catch (e) {
      console.error(`[${config.providerName} LLM] Failed to parse lead JSON:`, e.message);
    }
    rawText = rawText.replace(/\[LEAD_CAPTURED\][\s\S]*?(\{[\s\S]*?\})?/g, '').trim();
  }

  // Discard empty/placeholder lead fields
  if (lead_data) {
    const hasRealData = Object.entries(lead_data).some(([, val]) =>
      val && val !== '...' && val !== 'Unknown' &&
      !String(val).toLowerCase().includes('not collected') &&
      String(val).trim() !== ''
    );
    if (!hasRealData) {
      console.log(`[${config.providerName} LLM] Discarding placeholder lead data`);
      lead_data = null;
    }
  }

  // -- Strip key-value lines (never spoken aloud) -----------------------------
  rawText = rawText.split('\n').filter(line => {
    const lower = line.toLowerCase();
    return !(
      lower.includes('name:') || lower.includes('phone:') ||
      lower.includes('intent:') || lower.includes('budget:') ||
      lower.includes('location:') || lower.includes('not collected') ||
      lower.includes('[lead_captured]')
    );
  }).join('\n').trim();

  // -- End-call signal --------------------------------------------------------
  let should_end = rawText.includes('[END_CALL]');
  if (should_end) {
    const isPremature = history.length <= 2 ||
      (rawText.includes('Thank you for calling') && !lead_data);
    if (isPremature) {
      console.log(`[${config.providerName} LLM] Ignoring premature END_CALL`);
      should_end = false;
    }
    rawText = rawText.replace('[END_CALL]', '').trim();
  }

  return { response_text: rawText.trim(), lead_data, should_end };
}

/**
 * Drop-in wrapper compatibility function for controllers that call generateResponse()
 */
async function generateResponse(messages, systemPrompt, apiKey = null) {
  return chat(systemPrompt, messages, apiKey);
}

// Re-export buildSystemPrompt (provider-agnostic)
const { buildSystemPrompt } = require('./sarvam/llm');

module.exports = { transcribeAudio, chat, generateResponse, buildSystemPrompt };
