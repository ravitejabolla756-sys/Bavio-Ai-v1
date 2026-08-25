'use strict';

/**
 * SarvamTts — Sarvam Bulbul v3 TTS Adapter
 * Specialized for Hindi, Indian English, and regional Indic speech synthesis.
 */

const axios = require('axios');
const TextToSpeechProvider = require('../interfaces/TextToSpeechProvider');

class SarvamTts extends TextToSpeechProvider {
  constructor({ apiKey = process.env.SARVAM_API_KEY, model = 'bulbul-v3' } = {}) {
    super('SarvamTts');
    this._apiKey = apiKey;
    this._model = model;
    this._textBuffer = [];
  }

  async connect({ voiceId = 'aditi', modelId = 'bulbul-v3', language = 'hi-IN' } = {}) {
    this._voiceId = voiceId;
    this._model = modelId;
    this._language = language;
    this._textBuffer = [];
  }

  streamText(textChunk) {
    if (textChunk) {
      this._textBuffer.push(textChunk);
    }
  }

  async synthesize(text, language = this._language) {
    if (!this._apiKey) {
      throw new Error('[SarvamTts] SARVAM_API_KEY is not configured');
    }

    const response = await axios.post(
      'https://api.sarvam.ai/text-to-speech',
      {
        inputs: [text],
        target_language_code: language || 'hi-IN',
        speaker: this._voiceId || 'aditi',
        pitch: 0,
        pace: 1.05,
        loudness: 1.5,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: this._model,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': this._apiKey,
        },
        timeout: 10000,
      }
    );

    const base64Audio = response.data?.audios?.[0] || response.data?.audio || '';
    return Buffer.from(base64Audio, 'base64');
  }

  async flush() {
    if (this._textBuffer.length === 0) return;
    const fullText = this._textBuffer.join(' ').trim();
    this._textBuffer = [];

    try {
      const audioBuffer = await this.synthesize(fullText);
      this._emitAudioChunk(audioBuffer);
      this._emitComplete();
    } catch (err) {
      console.error('[SarvamTts] Synthesis error:', err.message);
      this._emitError(err);
    }
  }

  cancel() {
    this._textBuffer = [];
  }

  async close() {
    this._textBuffer = [];
  }
}

module.exports = SarvamTts;
