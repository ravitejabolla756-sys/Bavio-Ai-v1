'use strict';

const WebSocket           = require('ws');
const TextToSpeechProvider = require('../interfaces/TextToSpeechProvider');

const ELEVENLABS_WS_URL = 'wss://api.elevenlabs.io/v1/text-to-speech';
const DEFAULT_VOICE_ID   = 'EXAVITQu4vr4xnSDxMaL'; // Sarah
const DEFAULT_MODEL_ID   = 'eleven_flash_v2_5';
const OUTPUT_FORMAT_ULAW = 'ulaw_8000';

/**
 * Normalizes abbreviation, currency, date, time and phone formats into speakable words.
 */
function normalizeTtsText(text) {
  if (!text) return '';
  let normalized = text;

  // 1. Currency normalization
  // $123.45 -> 123.45 dollars
  normalized = normalized.replace(/\$(\d+(?:\.\d+)?)/g, '$1 dollars');
  // ₹123 -> 123 rupees, Rs. 123 -> 123 rupees
  normalized = normalized.replace(/(?:₹|Rs\.?\s*)(\d+(?:\.\d+)?)/g, '$1 rupees');

  // 2. Phone numbers normalization
  // Matches +1-555-019-9234 or +91 99999 88888 or (555) 019-9234
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  normalized = normalized.replace(phoneRegex, (match) => {
    return match
      .replace(/[^\d+]/g, '') // keep digits and plus
      .split('')
      .map(char => char === '+' ? 'plus ' : char + ' ')
      .join('')
      .trim();
  });

  // 3. Time normalization (10:30 AM / PM)
  normalized = normalized.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi, (match, hh, mm, ampm) => {
    return `${hh} ${mm} ${ampm.split('').join(' ')}`;
  });

  // 4. Date normalization (YYYY-MM-DD)
  normalized = normalized.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (match, y, m, d) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[parseInt(m, 10) - 1] || m;
    return `${month} ${parseInt(d, 10)}, ${y}`;
  });

  // 5. Abbreviations & Address short-forms
  const abbreviations = {
    '\\bSt\\b\\.?': 'Street',
    '\\bRd\\b\\.?': 'Road',
    '\\bAve\\b\\.?': 'Avenue',
    '\\bApt\\b\\.?': 'Apartment',
    '\\bDr\\b\\.?': 'Doctor',
    '\\bAI\\b': 'A I',
    '\\bSMS\\b': 'S M S',
    '\\bURL\\b': 'U R L',
    '\\bPIN\\b': 'P I N',
    '\\bZIP\\b': 'Z I P',
    '\\betc\\b\\.?': 'et cetera',
    '\\bvs\\b\\.?': 'versus'
  };

  for (const [key, val] of Object.entries(abbreviations)) {
    const regex = new RegExp(key, 'g');
    normalized = normalized.replace(regex, val);
  }

  return normalized;
}

class ElevenLabsTts extends TextToSpeechProvider {
  constructor({ apiKey, modelId = DEFAULT_MODEL_ID } = {}) {
    super('ElevenLabsTts');
    if (!apiKey) throw new Error('[ElevenLabsTts] apiKey is required');
    this._apiKey    = apiKey;
    this._modelId   = modelId;
    this._voiceId   = DEFAULT_VOICE_ID;
    this._ws        = null;
    this._open      = false;
    this._cancelled = false;
    this._language  = 'en-US';

    this._currentResponseId = null;

    // Metrics tracking
    this.metrics = {
      tts_request_started_at : null,
      tts_first_audio_at     : null,
      tts_audio_chunks       : 0,
      tts_characters         : 0,
      tts_cancelled_at       : null,
      tts_completed_at       : null,
      tts_reconnect_count    : 0,
      tts_error_code         : null
    };
  }

  async connect({ voiceId = DEFAULT_VOICE_ID, modelId, language } = {}) {
    this._voiceId   = voiceId;
    this._cancelled = false;
    if (modelId) this._modelId = modelId;
    if (language) this._language = language;

    const url = (
      `${ELEVENLABS_WS_URL}/${encodeURIComponent(this._voiceId)}/stream-input` +
      `?model_id=${encodeURIComponent(this._modelId)}` +
      `&output_format=${OUTPUT_FORMAT_ULAW}` +
      (this._language ? `&language_code=${encodeURIComponent(this._language)}` : '')
    );

    return new Promise((resolve, reject) => {
      this._ws = new WebSocket(url, {
        headers: { 'xi-api-key': this._apiKey },
      });

      this._ws.once('open', () => {
        // Initial setup payload to warm up connection
        this._ws.send(JSON.stringify({
          text                : ' ',
          voice_settings      : { stability: 0.5, similarity_boost: 0.75 },
          generation_config   : { chunk_length_schedule: [120, 160, 250, 290] },
        }));

        this._open = true;
        console.log(`[ElevenLabsTts] Connected — voice=${this._voiceId} model=${this._modelId}`);
        resolve();
      });

      this._ws.once('error', (err) => {
        console.error(`[ElevenLabsTts] Connection error: ${err.message}`);
        this.metrics.tts_error_code = err.code || err.message;
        reject(err);
      });

      this._ws.on('message', (data) => this._handleMessage(data));

      this._ws.on('close', (code) => {
        this._open = false;
        if (code !== 1000 && !this._cancelled) {
          console.warn(`[ElevenLabsTts] Closed with code ${code}. Recovering connection...`);
          this._recoverConnection();
        }
      });
    });
  }

  streamText(textChunk, responseId = null) {
    if (responseId !== null) {
      this._currentResponseId = responseId;
    }
    
    if (!this._open || this._cancelled) return;
    if (!textChunk) return;

    if (this.metrics.tts_request_started_at === null) {
      this.metrics.tts_request_started_at = Date.now();
    }

    const normalized = normalizeTtsText(textChunk);
    this.metrics.tts_characters += normalized.length;

    this._ws.send(JSON.stringify({ text: normalized }));
  }

  async flush() {
    if (!this._open || this._cancelled) return;
    this._ws.send(JSON.stringify({ text: '' }));

    return new Promise((resolve) => {
      const originalComplete = this._onComplete;
      this._onComplete = () => {
        this.metrics.tts_completed_at = Date.now();
        if (originalComplete) originalComplete();
        resolve();
      };
    });
  }

  cancel() {
    this._cancelled = true;
    this.metrics.tts_cancelled_at = Date.now();
    
    // Increment the active response ID to discard any in-flight chunks instantly
    this._currentResponseId = `stale_${Date.now()}`;

    // Close the current socket to flush the server-side text buffers
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.close(1000, 'cancelled');
    }
    
    // Instantly reopen the connection in background to maintain low startup latency for next response
    this._open = false;
    this._cancelled = false;
    this.connect({ voiceId: this._voiceId, modelId: this._modelId, language: this._language })
      .catch(err => console.error(`[ElevenLabsTts] Pre-connect connection recovery failed: ${err.message}`));
  }

  async close() {
    this._open      = false;
    this._cancelled = true;
    if (this._ws) {
      this._ws.terminate();
      this._ws = null;
    }
  }

  // ── Connection Recovery ───────────────────────────────────────────────────

  async _recoverConnection() {
    this.metrics.tts_reconnect_count++;
    console.log(`[ElevenLabsTts] Connection recovery attempt #${this.metrics.tts_reconnect_count}`);
    
    const backoff = Math.min(1000 * Math.pow(2, this.metrics.tts_reconnect_count - 1), 8000);
    await new Promise(resolve => setTimeout(resolve, backoff));

    try {
      await this.connect({ voiceId: this._voiceId, modelId: this._modelId, language: this._language });
      console.log(`[ElevenLabsTts] Connection recovered successfully.`);
    } catch (err) {
      console.error(`[ElevenLabsTts] Connection recovery failed: ${err.message}`);
    }
  }

  // ── Message Handler ───────────────────────────────────────────────────────

  _handleMessage(data) {
    let msg;
    try {
      if (Buffer.isBuffer(data)) {
        if (!this._cancelled) {
          if (this.metrics.tts_first_audio_at === null) {
            this.metrics.tts_first_audio_at = Date.now();
          }
          this.metrics.tts_audio_chunks++;
          this._emitAudioChunk(data, this._currentResponseId);
        }
        return;
      }
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (msg.audio) {
      const audioBuffer = Buffer.from(msg.audio, 'base64');
      if (!this._cancelled) {
        if (this.metrics.tts_first_audio_at === null) {
          this.metrics.tts_first_audio_at = Date.now();
        }
        this.metrics.tts_audio_chunks++;
        this._emitAudioChunk(audioBuffer, this._currentResponseId);
      }
    }

    if (msg.isFinal === true || msg.message === 'EOS') {
      this._emitComplete();
    }

    if (msg.error) {
      console.error(`[ElevenLabsTts] Server error: ${msg.error}`);
      this.metrics.tts_error_code = msg.error;
      this._emitError(new Error(msg.error));
    }
  }
}

module.exports = ElevenLabsTts;
