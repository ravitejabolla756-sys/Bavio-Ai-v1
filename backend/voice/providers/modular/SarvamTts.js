'use strict';

/**
 * SarvamTts — Sarvam Bulbul v3 persistent WebSocket TTS adapter.
 *
 * Emits G.711 mu-law 8 kHz chunks so Twilio can play audio without an
 * intermediate resample/transcode step.
 */

const WebSocket = require('ws');
const TextToSpeechProvider = require('../interfaces/TextToSpeechProvider');

const SARVAM_WS_URL = 'wss://api.sarvam.ai/text-to-speech/ws';
const DEFAULT_MODEL = 'bulbul:v3';
const DEFAULT_SPEAKER = 'shubh';

class SarvamTts extends TextToSpeechProvider {
  constructor({ apiKey = process.env.SARVAM_API_KEY, model = DEFAULT_MODEL, speaker = DEFAULT_SPEAKER } = {}) {
    super('SarvamTts');
    if (!apiKey) throw new Error('[SarvamTts] SARVAM_API_KEY is not configured');

    this._apiKey = apiKey;
    this._model = model;
    this._speaker = speaker;
    this._language = 'hi-IN';
    this._ws = null;
    this._open = false;
    this._cancelled = false;
    this._flushResolver = null;
    this._keepalive = null;
  }

  async connect({ voiceId, modelId, language = 'hi-IN' } = {}) {
    const speaker = voiceId || this._speaker || DEFAULT_SPEAKER;
    const model = modelId || this._model || DEFAULT_MODEL;

    if (
      this._open &&
      this._ws &&
      this._ws.readyState === WebSocket.OPEN &&
      this._speaker === speaker &&
      this._model === model &&
      this._language === language
    ) {
      this._cancelled = false;
      return;
    }

    await this.close().catch(() => {});

    this._speaker = speaker;
    this._model = model;
    this._language = language;
    this._cancelled = false;

    const url =
      `${SARVAM_WS_URL}?model=${encodeURIComponent(this._model)}&send_completion_event=true`;

    return new Promise((resolve, reject) => {
      this._ws = new WebSocket(url, {
        headers: {
          'Api-Subscription-Key': this._apiKey,
        },
      });

      this._ws.once('open', () => {
        this._open = true;

        // Sarvam requires configuration before any text messages.
        this._ws.send(JSON.stringify({
          type: 'config',
          data: {
            language_code: this._language,
            speaker: this._speaker,
            pace: 1.0,
            speech_sample_rate: 8000,
            min_buffer_size: 30,
            max_chunk_length: 150,
            output_audio_codec: 'mulaw',
          },
        }));

        console.log(
          `[SarvamTts] Connected — speaker=${this._speaker} model=${this._model} language=${this._language}`
        );

        this._keepalive = setInterval(() => {
          if (this._ws?.readyState === WebSocket.OPEN) {
            this._ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);

        resolve();
      });

      this._ws.once('error', (err) => {
        reject(err);
      });

      this._ws.on('message', (data) => this._handleMessage(data));

      this._ws.on('close', () => {
        this._open = false;
        if (this._keepalive) {
          clearInterval(this._keepalive);
          this._keepalive = null;
        }
        if (this._flushResolver) {
          const resolveFlush = this._flushResolver;
          this._flushResolver = null;
          resolveFlush();
        }
      });
    });
  }

  streamText(textChunk) {
    if (!textChunk || !this._open || this._cancelled) return;

    this._ws.send(JSON.stringify({
      type: 'text',
      data: { text: textChunk },
    }));
  }

  async flush() {
    if (!this._open || this._cancelled) return;

    this._ws.send(JSON.stringify({ type: 'flush' }));

    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        this._flushResolver = null;
        resolve();
      };

      this._flushResolver = done;
      setTimeout(done, 10000);
    });
  }

  cancel() {
    this._cancelled = true;

    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.close(1000, 'cancelled');
    }

    this._open = false;
  }

  async close() {
    this._cancelled = true;
    this._open = false;
    if (this._keepalive) {
      clearInterval(this._keepalive);
      this._keepalive = null;
    }

    if (this._ws) {
      try {
        this._ws.terminate();
      } catch {}
      this._ws = null;
    }
  }

  _handleMessage(data) {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (msg.type === 'audio' && msg.data?.audio) {
      if (!this._cancelled) {
        this._emitAudioChunk(Buffer.from(msg.data.audio, 'base64'));
      }
      return;
    }

    const eventName =
      msg.event ||
      msg.data?.event ||
      msg.data?.event_type ||
      msg.type;

    if (
      (msg.type === 'event' && msg.data?.event_type === 'final') ||
      eventName === 'completion' ||
      eventName === 'complete' ||
      eventName === 'completed' ||
      eventName === 'done'
    ) {
      this._emitComplete();
      if (this._flushResolver) {
        const resolveFlush = this._flushResolver;
        this._flushResolver = null;
        resolveFlush();
      }
      return;
    }

    if (msg.type === 'error' || msg.error) {
      const err = new Error(
        msg.error?.message ||
        msg.message ||
        JSON.stringify(msg.error || msg)
      );
      this._emitError(err);
    }
  }
}

module.exports = SarvamTts;
