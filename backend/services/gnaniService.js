'use strict';

const axios = require('axios');
const FormData = require('form-data');

/**
 * gnaniService.js — Core Client for Gnani AI Models (Vachana Platform)
 * 
 * Official Platform: Vachana by Gnani AI
 * Primary Host: https://api.vachana.ai
 * 
 * Models:
 * 1. Gnani Prisma v2.5 (Speech-to-Text / STT): POST /stt/v3
 * 2. Gnani Timbre v2.5 (Text-to-Speech / TTS): POST /v1/tts/inference
 * 3. Gnani Evon v3.3 (Reasoning LLM): Open-weight 30B MoE foundation model (Hugging Face / Self-hosted)
 * 
 * Authentication:
 * Header: X-API-Key-ID: <GNANI_API_KEY>
 * Header: Authorization: Bearer <GNANI_API_KEY>
 */

const GNANI_API_KEY = process.env.GNANI_API_KEY || process.env.GNANI_PRISMA_KEY || '';

// Resolve Base URL: default to official active API host 'https://api.vachana.ai'
function getBaseUrl() {
  const configured = (process.env.GNANI_BASE_URL || '').trim();
  if (configured && !configured.includes('api.gnani.ai')) {
    return configured.replace(/\/+$/, '');
  }
  // api.gnani.ai has no active DNS record; Vachana is Gnani's speech API host
  return 'https://api.vachana.ai';
}

const GNANI_EVON_ENDPOINT = process.env.GNANI_EVON_ENDPOINT || '';

// Standard ISO / BCP-47 to Gnani language code mappings
const LANGUAGE_MAP_SHORT = {
  'ta': 'ta',
  'ta-in': 'ta',
  'tamil': 'ta',
  'te': 'te',
  'te-in': 'te',
  'telugu': 'te',
  'hi': 'hi',
  'hi-in': 'hi',
  'hindi': 'hi',
  'en': 'en',
  'en-in': 'en',
  'en-us': 'en',
  'english': 'en'
};

const LANGUAGE_MAP_FULL = {
  'ta': 'ta-IN',
  'ta-in': 'ta-IN',
  'tamil': 'ta-IN',
  'te': 'te-IN',
  'te-in': 'te-IN',
  'telugu': 'te-IN',
  'hi': 'hi-IN',
  'hi-in': 'hi-IN',
  'hindi': 'hi-IN',
  'en': 'en-IN',
  'en-in': 'en-IN',
  'en-us': 'en-IN',
  'english': 'en-IN'
};

const DEFAULT_VOICES = {
  'ta': 'Brinda',
  'te': 'Brinda',
  'hi': 'Nalini',
  'en': 'Brinda'
};

function normalizeLanguageCodeShort(lang = 'hi-IN') {
  const normalized = (lang || '').toLowerCase().trim();
  return LANGUAGE_MAP_SHORT[normalized] || 'hi';
}

function normalizeLanguageCodeFull(lang = 'hi-IN') {
  const normalized = (lang || '').toLowerCase().trim();
  return LANGUAGE_MAP_FULL[normalized] || 'hi-IN';
}

/**
 * 1. GNANI PRISMA v2.5 — Speech-to-Text (ASR)
 * Official endpoint: POST https://api.vachana.ai/stt/v3
 */
async function transcribeWithPrisma(audioBuffer, {
  language = 'hi-IN',
  encoding = 'wav',
  sampleRate = 8000,
  apiKey = null
} = {}) {
  const key = apiKey || GNANI_API_KEY;
  const langCode = normalizeLanguageCodeFull(language);
  const baseUrl = getBaseUrl();
  const startTime = Date.now();

  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('[Gnani Prisma] Cannot transcribe empty audio buffer');
  }

  if (key && !key.startsWith('your_') && !key.startsWith('mock_')) {
    try {
      const form = new FormData();
      form.append('audio_file', audioBuffer, {
        filename: 'audio.wav',
        contentType: encoding === 'mulaw' ? 'audio/basic' : 'audio/wav'
      });
      form.append('language_code', langCode);
      form.append('model', process.env.GNANI_STT_MODEL || 'prisma-2.5');

      const response = await axios.post(`${baseUrl}/stt/v3`, form, {
        headers: {
          'X-API-Key-ID': key,
          'x-api-key-id': key,
          'Authorization': `Bearer ${key}`,
          ...form.getHeaders()
        },
        timeout: 15000
      });

      const latencyMs = Date.now() - startTime;
      const data = response.data || {};
      const transcript = (
        data.transcript ||
        data.text ||
        data.result?.transcript ||
        data.result?.text ||
        ''
      ).trim();

      return {
        transcript,
        language: langCode,
        confidence: data.confidence || 0.95,
        latencyMs,
        provider: 'gnani_prisma_v2.5',
        httpStatus: response.status
      };
    } catch (err) {
      const status = err.response?.status;
      const errDetail = err.response?.data?.detail?.message || err.response?.data?.message || err.message;
      throw new Error(`Gnani Prisma STT Error (HTTP ${status || 'ERR'}): ${errDetail}`);
    }
  }

  const latencyMs = Date.now() - startTime;
  return {
    transcript: '',
    language: langCode,
    confidence: 1.0,
    latencyMs,
    provider: 'gnani_prisma_v2.5',
    isSimulation: true
  };
}

/**
 * 2. GNANI TIMBRE v2.5 — Text-to-Speech (TTS)
 * Official endpoint: POST https://api.vachana.ai/v1/tts/inference
 */
async function synthesizeWithTimbre(text, {
  language = 'hi-IN',
  voice = null,
  voiceGender = 'female',
  sampleRate = 8000,
  outputFormat = 'mulaw_8000',
  apiKey = null
} = {}) {
  const key = apiKey || GNANI_API_KEY;
  const langShort = normalizeLanguageCodeShort(language);
  const selectedVoice = voice || DEFAULT_VOICES[langShort] || 'Brinda';
  const model = process.env.GNANI_TTS_MODEL || 'timbre-2.5';
  const baseUrl = getBaseUrl();
  const startTime = Date.now();

  if (!text || !text.trim()) {
    throw new Error('[Gnani Timbre] Cannot synthesize empty text');
  }

  if (key && !key.startsWith('your_') && !key.startsWith('mock_')) {
    try {
      const response = await axios.post(
        `${baseUrl}/v1/tts/inference`,
        {
          model,
          language: langShort,
          voice: selectedVoice,
          sample_rate: sampleRate,
          text: text.trim()
        },
        {
          headers: {
            'X-API-Key-ID': key,
            'x-api-key-id': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 15000
        }
      );

      const latencyMs = Date.now() - startTime;
      let audioBuffer;

      // Check if response is raw binary or JSON with base64 audio
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        try {
          const json = JSON.parse(response.data.toString());
          const base64Audio = json.audio || json.audio_content || json.data || '';
          audioBuffer = Buffer.from(base64Audio, 'base64');
        } catch {
          audioBuffer = Buffer.from(response.data);
        }
      } else {
        audioBuffer = Buffer.from(response.data);
      }

      return {
        audioBuffer,
        audioBase64: audioBuffer.toString('base64'),
        format: outputFormat,
        latencyMs,
        provider: 'gnani_timbre_v2.5',
        httpStatus: response.status
      };
    } catch (err) {
      const status = err.response?.status;
      let errDetail = err.message;
      if (err.response?.data) {
        try {
          const parsed = JSON.parse(err.response.data.toString());
          errDetail = parsed.detail?.message || parsed.message || err.message;
        } catch {
          errDetail = err.response.data.toString() || err.message;
        }
      }
      throw new Error(`Gnani Timbre TTS Error (HTTP ${status || 'ERR'}): ${errDetail}`);
    }
  }

  const latencyMs = Date.now() - startTime;
  return {
    audioBuffer: Buffer.alloc(0),
    audioBase64: '',
    format: outputFormat,
    latencyMs,
    provider: 'gnani_timbre_v2.5',
    isSimulation: true
  };
}

/**
 * 3. GNANI EVON v3.3 — Reasoning Engine
 * Official Availability: Open-weight 30B MoE foundation model (gnani/gnani-evon-v3.3-30B-A3B on Hugging Face).
 * Requires self-hosting on GPU instance (e.g. AWS EC2 g5 instance with vLLM) or private Plexus deployment.
 */
async function generateEvonCompletion(messages, {
  systemPrompt = '',
  retrievedContext = '',
  temperature = 0.3,
  maxTokens = 256,
  apiKey = null,
  stream = false,
  onChunk = null
} = {}) {
  const key = apiKey || GNANI_API_KEY;
  const startTime = Date.now();
  let firstTokenTime = null;

  let finalSystemPrompt = systemPrompt;
  if (retrievedContext) {
    finalSystemPrompt += `\n\n=== VERIFIED KNOWLEDGE BASE CONTEXT (STRICT GROUNDING) ===\n${retrievedContext}\n\nINSTRUCTION: You must answer based ONLY on the verified context above. If the exact answer is not in the context, explicitly say in the caller's language that verified information is not currently available at this helpline. Never make up scheme details.`;
  }

  const promptMessages = [
    { role: 'system', content: finalSystemPrompt },
    ...messages
  ];

  // If a dedicated self-hosted Evon endpoint is configured in environment:
  if (GNANI_EVON_ENDPOINT && GNANI_EVON_ENDPOINT.trim().length > 0) {
    try {
      const response = await axios.post(
        GNANI_EVON_ENDPOINT,
        {
          model: process.env.GNANI_EVON_MODEL || 'gnani-evon-v3.3',
          messages: promptMessages,
          temperature,
          max_tokens: maxTokens,
          stream
        },
        {
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          responseType: stream ? 'stream' : 'json',
          timeout: 20000
        }
      );

      if (stream && onChunk) {
        return new Promise((resolve, reject) => {
          let fullText = '';
          response.data.on('data', (chunk) => {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  const delta = data.choices?.[0]?.delta?.content || '';
                  if (delta) {
                    if (!firstTokenTime) firstTokenTime = Date.now();
                    fullText += delta;
                    onChunk(delta);
                  }
                } catch {}
              }
            }
          });
          response.data.on('end', () => {
            const totalLatencyMs = Date.now() - startTime;
            const ttftMs = firstTokenTime ? (firstTokenTime - startTime) : totalLatencyMs;
            resolve({
              text: fullText.trim(),
              provider: 'gnani_evon_v3.3',
              ttftMs,
              totalLatencyMs
            });
          });
          response.data.on('error', reject);
        });
      }

      const totalLatencyMs = Date.now() - startTime;
      const text = response.data?.choices?.[0]?.message?.content || '';
      return {
        text: text.trim(),
        provider: 'gnani_evon_v3.3',
        ttftMs: totalLatencyMs,
        totalLatencyMs
      };
    } catch (err) {
      throw new Error(`Gnani Evon LLM Error: ${err.response?.data?.message || err.message}`);
    }
  }

  // When GNANI_EVON_ENDPOINT is not configured:
  const totalLatencyMs = Date.now() - startTime;
  return {
    text: '',
    provider: 'gnani_evon_v3.3',
    ttftMs: totalLatencyMs,
    totalLatencyMs,
    isSimulation: true,
    note: 'Evon v3.3 is an open-weight foundation model requiring self-hosted GPU endpoint'
  };
}

const LANGUAGE_MAP_ISO3 = {
  'ta': 'tam',
  'ta-in': 'tam',
  'tamil': 'tam',
  'te': 'tel',
  'te-in': 'tel',
  'telugu': 'tel',
  'hi': 'hin',
  'hi-in': 'hin',
  'hindi': 'hin',
  'en': 'eng',
  'en-in': 'eng',
  'en-us': 'eng',
  'english': 'eng'
};

function normalizeLanguageCode(lang = 'hi-IN') {
  const normalized = (lang || '').toLowerCase().trim();
  return LANGUAGE_MAP_ISO3[normalized] || 'hin';
}

module.exports = {
  transcribeWithPrisma,
  synthesizeWithTimbre,
  generateEvonCompletion,
  normalizeLanguageCode,
  normalizeLanguageCodeShort,
  normalizeLanguageCodeFull,
  getBaseUrl,
  DEFAULT_VOICES
};
