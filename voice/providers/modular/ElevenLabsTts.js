'use strict';

/**
 * ElevenLabsTts — ElevenLabs Flash v2.5 streaming TTS provider
 *
 * Uses ElevenLabs WebSocket streaming API:
 *   wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input
 *
 * Key advantage: native output_format=ulaw_8000 eliminates the
 * PCM→mu-law codec conversion currently done in openAIService.js.
 *
 * Sentence-level streaming: text chunks arrive as the LLM generates them.
 * Audio chunks are emitted before the full LLM response is ready.
 *
 * Status: IMPLEMENTED — feature-flagged behind modular_v1.
 *
 * Required env: ELEVENLABS_API_KEY, ELEVENLABS_MODEL_ID
 */

const WebSocket           = require('ws');
const TextToSpeechProvider = require('../interfaces/TextToSpeechProvider');

const ELEVENLABS_WS_URL = 'wss://api.elevenlabs.io/v1/text-to-speech';

// Default voice IDs for ElevenLabs
const DEFAULT_VOICE_ID   = 'EXAVITQu4vr4xnSDxMaL'; // Sarah (en-US, female)
const DEFAULT_MODEL_ID   = 'eleven_flash_v2_5';
const OUTPUT_FORMAT_ULAW = 'ulaw_8000';               // Native G.711 mu-law 8 kHz

class ElevenLabsTts extends TextToSpeechProvider {
  /**
   * @param {object} opts
   * @param {string} opts.apiKey   ElevenLabs API key (required)
   * @param {string} opts.modelId  ElevenLabs model ID
   */
  constructor({ apiKey, modelId = DEFAULT_MODEL_ID } = {}) {
    super('ElevenLabsTts');
    if (!apiKey) throw new Error('[ElevenLabsTts] apiKey is required');
    this._apiKey    = apiKey;
    this._modelId   = modelId;
    this._voiceId   = DEFAULT_VOICE_ID;
    this._ws        = null;
    this._open      = false;
    this._cancelled = false;
  }

  // ── TextToSpeechProvider implementation ───────────────────────────────────

  async connect({ voiceId = DEFAULT_VOICE_ID, modelId, language } = {}) {
    this._voiceId   = voiceId;
    this._cancelled = false;

    if (modelId) this._modelId = modelId;

    const url = (
      `${ELEVENLABS_WS_URL}/${encodeURIComponent(this._voiceId)}/stream-input` +
      `?model_id=${encodeURIComponent(this._modelId)}` +
      `&output_format=${OUTPUT_FORMAT_ULAW}` +
      (language ? `&language_code=${encodeURIComponent(language)}` : '')
    );

    return new Promise((resolve, reject) => {
      this._ws = new WebSocket(url, {
        headers: { 'xi-api-key': this._apiKey },
      });

      this._ws.once('open', () => {
        // ElevenLabs expects a BOS (Begin of Sequence) message on open
        this._ws.send(JSON.stringify({
          text                : ' ',
          voice_settings      : { stability: 0.5, similarity_boost: 0.75 },
          generation_config   : { chunk_length_schedule: [120, 160, 250, 290] },
          xi_api_key          : undefined,   // Already in header, do not repeat in body
        }));

        this._open = true;
        console.log(`[ElevenLabsTts] Connected — voice=${this._voiceId} model=${this._modelId}`);
        resolve();
      });

      this._ws.once('error', (err) => {
        console.error(`[ElevenLabsTts] Connection error: ${err.message}`);
        reject(err);
      });

      this._ws.on('message', (data) => this._handleMessage(data));

      this._ws.on('close', (code) => {
        this._open = false;
        if (code !== 1000) {
          console.warn(`[ElevenLabsTts] Closed with code ${code}`);
        }
      });
    });
  }

  streamText(textChunk) {
    if (!this._open || this._cancelled) return;
    if (!textChunk) return;

    this._ws.send(JSON.stringify({ text: textChunk }));
  }

  async flush() {
    if (!this._open || this._cancelled) return;

    // Send EOS (End of Sequence) to signal end of turn
    this._ws.send(JSON.stringify({ text: '' }));

    // Wait for ElevenLabs to send all remaining audio
    return new Promise((resolve) => {
      const originalComplete = this._onComplete;
      this._onComplete = () => {
        if (originalComplete) originalComplete();
        resolve();
      };
    });
  }

  cancel() {
    this._cancelled = true;
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      // Abort streaming — close and re-open for next turn
      this._ws.close(1000, 'cancelled');
    }
  }

  async close() {
    this._open      = false;
    this._cancelled = true;
    if (this._ws) {
      this._ws.terminate();
      this._ws = null;
    }
  }

  // ── Internal message handler ──────────────────────────────────────────────

  _handleMessage(data) {
    let msg;
    try {
      // ElevenLabs sends binary audio OR JSON control messages
      if (Buffer.isBuffer(data)) {
        if (!this._cancelled) this._emitAudioChunk(data);
        return;
      }
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (msg.audio) {
      // Base64-encoded audio chunk (ulaw_8000)
      const audioBuffer = Buffer.from(msg.audio, 'base64');
      if (!this._cancelled) this._emitAudioChunk(audioBuffer);
    }

    if (msg.isFinal === true || msg.message === 'EOS') {
      this._emitComplete();
    }

    if (msg.error) {
      console.error(`[ElevenLabsTts] Server error: ${msg.error}`);
      this._emitError(new Error(msg.error));
    }
  }
}

module.exports = ElevenLabsTts;
