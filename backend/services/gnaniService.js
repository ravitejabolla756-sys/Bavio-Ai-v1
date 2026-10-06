'use strict';

const axios = require('axios');
const FormData = require('form-data');

/**
 * gnaniService.js — Core Client for Gnani AI Models
 * 
 * Target Models:
 * 1. Gnani Prisma v2.5 (Speech-to-Text / ASR)
 * 2. Gnani Evon v3.3 (Reasoning / Indian Language LLM)
 * 3. Gnani Timbre v2.5 (Text-to-Speech / TTS)
 * 
 * Supports:
 * - Languages: Tamil (ta-IN / tam), Telugu (te-IN / tel), Hindi (hi-IN / hin), Indian English (en-IN / eng)
 * - Telephony Audio: 8kHz G.711 mu-law / 16kHz PCM
 * - Streaming & Chunked synthesis
 * - Telemetry & Latency Profiling
 */

const GNANI_API_KEY = process.env.GNANI_API_KEY || '';
const GNANI_BASE_URL = process.env.GNANI_BASE_URL || 'https://api.gnani.ai/v2';
const GNANI_EVON_ENDPOINT = process.env.GNANI_EVON_ENDPOINT || '';

// Standard ISO / BCP-47 to Gnani language code mappings
const LANGUAGE_MAP = {
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
  return LANGUAGE_MAP[normalized] || 'hin';
}

/**
 * 1. GNANI PRISMA v2.5 — Speech-to-Text (ASR)
 * Transcribes telephony / streaming audio buffers into text with Indian dialect support.
 */
async function transcribeWithPrisma(audioBuffer, {
  language = 'hi-IN',
  encoding = 'mulaw',
  sampleRate = 8000,
  apiKey = null
} = {}) {
  const key = apiKey || GNANI_API_KEY || process.env.GNANI_PRISMA_KEY;
  const langCode = normalizeLanguageCode(language);
  const startTime = Date.now();

  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('[Gnani Prisma] Cannot transcribe empty audio buffer');
  }

  // If Gnani API key is configured, call Gnani Prisma endpoint
  if (key && !key.startsWith('your_') && !key.startsWith('mock_')) {
    try {
      const form = new FormData();
      form.append('audio', audioBuffer, {
        filename: 'audio.wav',
        contentType: encoding === 'mulaw' ? 'audio/basic' : 'audio/wav'
      });
      form.append('language', langCode);
      form.append('model', process.env.GNANI_PRISMA_MODEL || 'prisma-v2.5');
      form.append('encoding', encoding);
      form.append('sample_rate', String(sampleRate));

      const response = await axios.post(`${GNANI_BASE_URL}/asr/transcribe`, form, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'x-gnani-api-key': key,
          ...form.getHeaders()
        },
        timeout: 10000
      });

      const latencyMs = Date.now() - startTime;
      const transcript = response.data?.transcript || response.data?.text || '';

      return {
        transcript: transcript.trim(),
        language: langCode,
        confidence: response.data?.confidence || 0.95,
        latencyMs,
        provider: 'gnani_prisma_v2.5'
      };
    } catch (err) {
      console.warn(`[Gnani Prisma] Live API call failed (${err.message}). Checking fallback/resilience.`);
      // If error occurs, propagate or handle gracefully
      throw new Error(`Gnani Prisma STT Error: ${err.response?.data?.message || err.message}`);
    }
  }

  // Fallback for development/simulated environment with high fidelity
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
 * 2. GNANI EVON v3.3 — LLM Reasoning Engine
 * Reasoning model specifically optimized for Indian regional languages and context.
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
  const key = apiKey || GNANI_API_KEY || process.env.GNANI_EVON_KEY;
  const startTime = Date.now();
  let firstTokenTime = null;

  // Build grounded prompt with RAG context
  let finalSystemPrompt = systemPrompt;
  if (retrievedContext) {
    finalSystemPrompt += `\n\n=== VERIFIED KNOWLEDGE BASE CONTEXT (STRICT GROUNDING) ===\n${retrievedContext}\n\nINSTRUCTION: You must answer based ONLY on the verified context above. If the exact answer is not in the context, explicitly say in the caller's language that verified information is not currently available at this helpline. Never make up scheme details.`;
  }

  const promptMessages = [
    { role: 'system', content: finalSystemPrompt },
    ...messages
  ];

  // If a self-hosted Evon endpoint or Gnani hosted endpoint is available:
  const endpoint = GNANI_EVON_ENDPOINT || `${GNANI_BASE_URL}/llm/chat/completions`;

  if (key && !key.startsWith('your_') && !key.startsWith('mock_')) {
    try {
      const response = await axios.post(
        endpoint,
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
            'x-gnani-api-key': key,
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
      console.warn(`[Gnani Evon] Primary LLM call failed (${err.message}).`);
      throw new Error(`Gnani Evon LLM Error: ${err.response?.data?.message || err.message}`);
    }
  }

  // Resilient fallback execution for local/demo orchestration
  const totalLatencyMs = Date.now() - startTime;
  return {
    text: '',
    provider: 'gnani_evon_v3.3',
    ttftMs: totalLatencyMs,
    totalLatencyMs,
    isSimulation: true
  };
}

/**
 * 3. GNANI TIMBRE v2.5 — Text-to-Speech (TTS)
 * Generates natural Indian regional speech in G.711 mu-law 8kHz for telephony.
 */
async function synthesizeWithTimbre(text, {
  language = 'hi-IN',
  voiceGender = 'female',
  outputFormat = 'mulaw_8000',
  apiKey = null
} = {}) {
  const key = apiKey || GNANI_API_KEY || process.env.GNANI_TIMBRE_KEY;
  const langCode = normalizeLanguageCode(language);
  const startTime = Date.now();

  if (!text || !text.trim()) {
    throw new Error('[Gnani Timbre] Cannot synthesize empty text');
  }

  if (key && !key.startsWith('your_') && !key.startsWith('mock_')) {
    try {
      const response = await axios.post(
        `${GNANI_BASE_URL}/tts/synthesize`,
        {
          text: text.trim(),
          language: langCode,
          model: process.env.GNANI_TIMBRE_MODEL || 'timbre-v2.5',
          gender: voiceGender,
          format: outputFormat.includes('mulaw') ? 'mulaw' : 'wav',
          sample_rate: 8000
        },
        {
          headers: {
            'Authorization': `Bearer ${key}`,
            'x-gnani-api-key': key,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 10000
        }
      );

      const audioBuffer = Buffer.from(response.data);
      const latencyMs = Date.now() - startTime;

      return {
        audioBuffer,
        audioBase64: audioBuffer.toString('base64'),
        format: outputFormat,
        latencyMs,
        provider: 'gnani_timbre_v2.5'
      };
    } catch (err) {
      console.warn(`[Gnani Timbre] Live TTS API failed (${err.message}).`);
      throw new Error(`Gnani Timbre TTS Error: ${err.response?.data?.message || err.message}`);
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

module.exports = {
  transcribeWithPrisma,
  generateEvonCompletion,
  synthesizeWithTimbre,
  normalizeLanguageCode,
  LANGUAGE_MAP
};
