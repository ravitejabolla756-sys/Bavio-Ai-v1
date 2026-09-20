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
      chatModel: process.env.GROQ_CHAT_MODEL || 'groq/compound',
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

// -- G.711 mu-law / u-law compressor & decimation downsampler ----------------
function linearToMuLaw(sample) {
  const BIAS = 0x84;
  const CLIP = 32635;
  let sign = 0;
  if (sample < 0) {
    sample = -sample;
    sign = 0x80;
  }
  if (sample > CLIP) {
    sample = CLIP;
  }
  sample += BIAS;
  let exponent = 7;
  for (let mask = 0x4000; (sample & mask) === 0; mask >>= 1) {
    exponent--;
  }
  let mantissa = (sample >> (exponent + 3)) & 0x0F;
  return ~(sign | (exponent << 4) | mantissa) & 0xFF;
}

function convertPcm24kToMuLaw8k(pcmBuffer) {
  const numSamples24k = pcmBuffer.length / 2;
  const numSamples8k = Math.floor(numSamples24k / 3);
  const muLawBuffer = Buffer.alloc(numSamples8k);

  for (let i = 0; i < numSamples8k; i++) {
    // Downsample by taking every 3rd sample from the 24kHz buffer
    const offset = i * 3 * 2;
    if (offset + 1 < pcmBuffer.length) {
      const sample = pcmBuffer.readInt16LE(offset);
      muLawBuffer[i] = linearToMuLaw(sample);
    }
  }
  return muLawBuffer;
}

/**
 * Convert text to speech using OpenAI TTS.
 *
 * @param {string} text         - Text to synthesize
 * @param {string} voiceId      - OpenAI voice name (e.g. 'alloy', 'shimmer', 'echo', etc.)
 * @param {string} language     - BCP-47 language code (unused, for compatibility)
 * @param {string} outputFormat - Output format (e.g. 'ulaw_8000' or 'mp3')
 * @param {string} apiKey       - Optional custom OpenAI API key
 * @returns {Promise<Buffer>}   - Audio buffer
 */
async function textToSpeech(text, voiceId = 'alloy', language = 'en-IN', outputFormat = 'mp3', apiKey = null) {
  const key = apiKey || OPENAI_API_KEY;
  if (!key) {
    throw new Error('[OpenAI TTS] OpenAI API key is not configured.');
  }
  if (!text || text.trim().length === 0) {
    throw new Error('[OpenAI TTS] Empty text provided');
  }

  const voice = (voiceId || 'alloy').toLowerCase();
  const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  const openaiVoice = validVoices.includes(voice) ? voice : 'alloy';

  const isUlaw = outputFormat.toLowerCase().includes('ulaw');
  const responseFormat = isUlaw ? 'pcm' : 'mp3';

  console.log(`[OpenAI TTS] Synthesizing ${text.length} chars | voice: ${openaiVoice} | format: ${responseFormat} (target: ${outputFormat})`);

  const response = await axios.post(
    `${OPENAI_BASE_URL}/audio/speech`,
    {
      model: 'tts-1',
      input: text,
      voice: openaiVoice,
      response_format: responseFormat
    },
    {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer',
      timeout: 20000
    }
  );

  const rawBuffer = Buffer.from(response.data);

  if (isUlaw) {
    console.log(`[OpenAI TTS] Converting 24kHz PCM to 8kHz mu-law (${rawBuffer.length} bytes input)`);
    return convertPcm24kToMuLaw8k(rawBuffer);
  }

  console.log(`[OpenAI TTS] Done - ${rawBuffer.length} bytes`);
  return rawBuffer;
}

/**
 * Synthesize speech - returns object compatible with callers expecting { audioBase64, audioBuffer }.
 * Respects Bavio canonical voice architecture:
 * - Indian supported voices -> Sarvam when configured
 * - Global voices -> ElevenLabs when configured
 * - OpenAI TTS as isolated fallback
 * - Provider details remain strictly hidden from customer UI
 */
async function synthesizeSpeech(text, language = 'en-IN', voiceId = 'alloy', apiKey = null) {
  const isIndianLang = ['hi-IN', 'hi-en', 'te-IN', 'ta-IN'].includes(language);
  const sarvamKey = process.env.SARVAM_API_KEY;
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

  // 1. Indian language routing: Sarvam when configured
  if (isIndianLang && sarvamKey && !sarvamKey.includes('your_')) {
    try {
      const targetLang = language === 'hi-en' ? 'hi-IN' : language;
      const resp = await axios.post(
        'https://api.sarvam.ai/text-to-speech',
        {
          inputs: [text],
          target_language_code: targetLang,
          speaker: 'aditi',
          pitch: 0,
          pace: 1.05,
          loudness: 1.5,
          speech_sample_rate: 8000,
          enable_preprocessing: true,
          model: 'bulbul-v3',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': sarvamKey,
          },
          timeout: 10000,
        }
      );
      const base64Audio = resp.data?.audios?.[0] || resp.data?.audio || '';
      if (base64Audio) {
        const audioBuffer = Buffer.from(base64Audio, 'base64');
        return { audioBuffer, audioBase64: base64Audio };
      }
    } catch (sarvamErr) {
      console.warn('[TTS] Sarvam synthesis failed, attempting fallback:', sarvamErr.message);
    }
  }

  // 2. Global voice routing: ElevenLabs when configured
  if (elevenLabsKey && !elevenLabsKey.includes('your_')) {
    try {
      const providerVoiceId = isIndianLang ? 'pNInz6obpgDQGcFmaJgB' : 'EXAVITQu4vr4xnSDxMaL';
      const modelId = isIndianLang ? 'eleven_multilingual_v2' : 'eleven_flash_v2_5';
      const resp = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${providerVoiceId}`,
        {
          text,
          model_id: modelId,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        },
        {
          headers: {
            'xi-api-key': elevenLabsKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 10000,
        }
      );
      const audioBuffer = Buffer.from(resp.data);
      return {
        audioBuffer,
        audioBase64: audioBuffer.toString('base64'),
      };
    } catch (elErr) {
      console.warn('[TTS] ElevenLabs synthesis failed, attempting fallback:', elErr.message);
    }
  }

  // 3. Fallback to OpenAI TTS if external provider keys unavailable or failed
  try {
    const audioBuffer = await textToSpeech(text, voiceId, language, 'mp3', apiKey);
    return {
      audioBuffer,
      audioBase64: audioBuffer.toString('base64'),
    };
  } catch (openAiErr) {
    console.error('[TTS] All speech synthesis options failed:', openAiErr.message);
    throw openAiErr;
  }
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
4. Keep responses EXTREMELY SHORT - maximum 1 sentence, and under 15 words per turn. NEVER output long paragraphs or explanations. Be crisp, brief, and to-the-point.
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

async function chatCompletion(messages, model = 'gpt-5.4-mini', temperature = 0.7) {
  const config = getProviderConfig();
  if (!config.apiKey) {
    throw new Error(`[${config.providerName} LLM] API key is not configured.`);
  }

  const response = await axios.post(
    `${config.baseUrl}/chat/completions`,
    {
      model: config.chatModel || model,
      max_tokens: 500,
      temperature,
      messages,
    },
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    }
  );

  return response.data?.choices?.[0]?.message?.content || '';
}

module.exports = {
  transcribeAudio,
  chat,
  chatCompletion,
  generateResponse,
  buildSystemPrompt,
  textToSpeech,
  synthesizeSpeech
};
