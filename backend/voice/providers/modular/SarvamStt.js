'use strict';

/**
 * SarvamStt — Sarvam Saaras v3 STT Adapter
 * Supports Hindi (hi-IN), Indian English (en-IN), and regional Indian languages.
 */

const axios = require('axios');
const FormData = require('form-data');
const SpeechToTextProvider = require('../interfaces/SpeechToTextProvider');

class SarvamStt extends SpeechToTextProvider {
  constructor({ apiKey = process.env.SARVAM_API_KEY, model = 'saaras-v3' } = {}) {
    super('SarvamStt');
    this._apiKey = apiKey;
    this._model = model;
    this._connected = false;
    this._audioBuffer = [];
  }

  async connect({ language = 'hi-IN', encoding = 'mulaw', sampleRate = 8000 } = {}) {
    this._language = language;
    this._encoding = encoding;
    this._sampleRate = sampleRate;
    this._connected = true;
    this._audioBuffer = [];
  }

  sendAudio(audioChunk) {
    if (audioChunk && Buffer.isBuffer(audioChunk)) {
      this._audioBuffer.push(audioChunk);
    }
  }

  async transcribeBuffer(buffer, language = this._language) {
    if (!this._apiKey) {
      throw new Error('[SarvamStt] SARVAM_API_KEY is not configured');
    }

    const form = new FormData();
    form.append('file', buffer, { filename: 'audio.wav', contentType: 'audio/wav' });
    form.append('model', this._model);
    form.append('language_code', language || 'hi-IN');

    const response = await axios.post('https://api.sarvam.ai/speech-to-text', form, {
      headers: {
        ...form.getHeaders(),
        'api-subscription-key': this._apiKey,
      },
      timeout: 10000,
    });

    const transcript = response.data?.transcript || response.data?.text || '';
    this._emitFinalTranscript(transcript);
    this._emitEndOfTurn(transcript);
    return transcript;
  }

  async close() {
    this._connected = false;
    if (this._audioBuffer.length > 0) {
      const fullBuffer = Buffer.concat(this._audioBuffer);
      this._audioBuffer = [];
      await this.transcribeBuffer(fullBuffer);
    }
  }
}

module.exports = SarvamStt;
