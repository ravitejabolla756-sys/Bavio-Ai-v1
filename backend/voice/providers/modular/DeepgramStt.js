'use strict';

/**
 * DeepgramStt — Deepgram Flux v2 Streaming STT & Turn Detection
 *
 * Endpoint: wss://api.deepgram.com/v2/listen
 * Models:   flux-general-en (English) | flux-general-multi (Multilingual / Hindi)
 *
 * Implements:
 *   - Live connection persisting across the full call
 *   - Continuous Twilio mu-law 8 kHz audio streaming
 *   - V2 event handlers (StartOfTurn, EagerEndOfTurn, TurnResumed, EndOfTurn)
 *   - Dynamic EOT thresholds configuration via thresholds payload command
 *   - Reconnection logic (3 attempts with exponential backoff)
 */

const WebSocket            = require('ws');
const SpeechToTextProvider = require('../interfaces/SpeechToTextProvider');

const DEEPGRAM_V2_URL      = 'wss://api.deepgram.com/v2/listen';

class DeepgramStt extends SpeechToTextProvider {
  constructor({ apiKey, model = 'flux-general-en', eagerEotThreshold = 0.4, eotThreshold = 0.7, eotTimeoutMs = 6000, audioChunkMs = 80 } = {}) {
    super('DeepgramStt');
    if (!apiKey) throw new Error('[DeepgramStt] apiKey is required');
    this._apiKey         = apiKey;
    this._model          = model;
    this._ws             = null;
    this._connected      = false;
    this._options        = null;
    this._eagerEotThreshold = eagerEotThreshold;
    this._eotThreshold = eotThreshold;
    this._eotTimeoutMs = eotTimeoutMs;
    this._audioChunkMs = audioChunkMs;
    this._audioBuffer = Buffer.alloc(0);
    this._closing = false;

    // Metrics & Reconnection counters
    this.reconnectCount  = 0;
    this.errorCode       = null;
    this.partialCount    = 0;

    // Custom Callback
    this._onTurnResumed  = null;
  }

  // ── SpeechToTextProvider implementation ───────────────────────────────────

  async connect({ language = 'en-US', encoding = 'mulaw', sampleRate = 8000, channels = 1 } = {}) {
    this._closing = false;
    this._options = { language, encoding, sampleRate, channels };

    // Select correct Flux model identifier based on language
    const lang = language.split('-')[0].toLowerCase();
    if (lang === 'en') {
      this._model = 'flux-general-en';
    } else {
      // Use flux-general-multi for Hindi/Hinglish and multilingual
      this._model = 'flux-general-multi';
    }

    const url = (
      `${DEEPGRAM_V2_URL}` +
      `?model=${encodeURIComponent(this._model)}` +
      `&encoding=${encodeURIComponent(encoding)}` +
      `&sample_rate=${sampleRate}` +
      `&eot_threshold=${encodeURIComponent(this._eotThreshold)}` +
      `&eager_eot_threshold=${encodeURIComponent(this._eagerEotThreshold)}` +
      `&eot_timeout_ms=${encodeURIComponent(this._eotTimeoutMs)}`
    );

    return this._connectToUrl(url);
  }

  sendAudio(audioChunk) {
    if (!audioChunk || audioChunk.length === 0) return;
    this._audioBuffer = Buffer.concat([this._audioBuffer, audioChunk]);

    // Twilio sends 20 ms / 160-byte mu-law frames. Flux performs best when
    // frames are coalesced into ~80 ms chunks instead of forwarding every 20 ms.
    const bytesPerMs = (this._options?.sampleRate || 8000) / 1000; // 1 byte/sample for mu-law
    const targetBytes = Math.max(160, Math.round(bytesPerMs * this._audioChunkMs));

    while (this._audioBuffer.length >= targetBytes) {
      const chunk = this._audioBuffer.subarray(0, targetBytes);
      this._audioBuffer = this._audioBuffer.subarray(targetBytes);
      if (this._ws && this._ws.readyState === WebSocket.OPEN) {
        this._ws.send(chunk);
      }
    }
  }

  async close() {
    this._closing = true;
    this._connected = false;

    const ws = this._ws;
    this._ws = null;
    if (!ws) return;

    if (ws.readyState === WebSocket.OPEN) {
      if (this._audioBuffer.length > 0) ws.send(this._audioBuffer);
      this._audioBuffer = Buffer.alloc(0);
      ws.send(JSON.stringify({ type: 'CloseStream' }));

      await new Promise((resolve) => {
        const timer = setTimeout(() => {
          try { ws.terminate(); } catch {}
          resolve();
        }, 750);

        ws.once('close', () => {
          clearTimeout(timer);
          resolve();
        });

        try {
          ws.close(1000, 'client_close');
        } catch {
          clearTimeout(timer);
          resolve();
        }
      });
      return;
    }

    try { ws.terminate(); } catch {}
  }

  // ── Realtime Dynamic EOT Threshold Configuration ──────────────────────────

  /**
   * Update end-of-turn thresholds dynamically during a call turn.
   * Useful to increase patience (e.g. for phone numbers, PIN codes).
   */
  configureThresholds({ eotThreshold, eagerEotThreshold, eotTimeoutMs }) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return;

    const payload = {
      type: 'Configure',
      thresholds: {}
    };

    if (eotThreshold !== undefined)      payload.thresholds.eot_threshold = eotThreshold;
    if (eagerEotThreshold !== undefined) payload.thresholds.eager_eot_threshold = eagerEotThreshold;
    if (eotTimeoutMs !== undefined)      payload.thresholds.eot_timeout_ms = eotTimeoutMs;

    console.log(`[DeepgramStt] Sending dynamic thresholds:`, JSON.stringify(payload));
    this._ws.send(JSON.stringify(payload));
  }

  // ── Callbacks ─────────────────────────────────────────────────────────────

  onTurnResumed(cb) {
    this._onTurnResumed = cb;
    return this;
  }

  // ── Reconnection Logic ───────────────────────────────────────────────────

  async _connectToUrl(url) {
    return new Promise((resolve, reject) => {
      let opened = false;
      console.log(`[DeepgramStt] Connecting to Deepgram v2: ${url}`);
      this._ws = new WebSocket(url, {
        headers: { Authorization: `Token ${this._apiKey}` },
      });

      this._ws.once('open', () => {
        opened = true;
        this._connected = true;
        this.reconnectCount = 0;
        console.log(`[DeepgramStt] Connection established successfully.`);
        resolve();
      });

      this._ws.once('error', (err) => {
        console.error(`[DeepgramStt] Connection error: ${err.message}`);
        this.errorCode = err.code || err.message;
        reject(err);
      });

      this._ws.on('message', (data) => this._handleMessage(data));

      this._ws.on('close', async (code, reason) => {
        this._connected = false;
        console.log(`[DeepgramStt] Connection closed. Code: ${code}, Reason: ${reason}`);

        // Try reconnect if closed unexpectedly and we are still active
        if (opened && !this._closing && code !== 1000 && this.reconnectCount < 3) {
          this.reconnectCount++;
          const delay = Math.pow(2, this.reconnectCount) * 500;
          console.warn(`[DeepgramStt] Reconnecting in ${delay}ms (attempt ${this.reconnectCount}/3)...`);
          await new Promise(r => setTimeout(r, delay));
          try {
            await this._connectToUrl(url);
          } catch (reconnectErr) {
            console.error(`[DeepgramStt] Reconnection attempt failed:`, reconnectErr.message);
          }
        }
      });
    });
  }

  // ── Internal Message Handler ──────────────────────────────────────────────

  _handleMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    // Flux v2 wire protocol uses type='TurnInfo'.
    if (msg.type === 'TurnInfo') {
      const eventType  = msg.event;
      const transcript = msg.transcript || '';

      switch (eventType) {
        case 'StartOfTurn':
          this._emitSpeechStarted();
          break;

        case 'Update':
          // Partial transcript updates
          this.partialCount++;
          this._emitPartialTranscript(transcript);
          break;

        case 'EagerEndOfTurn':
          this._emitEagerEndOfTurn(transcript);
          break;

        case 'TurnResumed':
          if (this._onTurnResumed) this._onTurnResumed();
          break;

        case 'EndOfTurn':
          this._emitFinalTranscript(transcript);
          this._emitEndOfTurn(transcript);
          break;

        default:
          break;
      }
    } else if (msg.type === 'Error') {
      console.error(`[DeepgramStt] Fatal server error received: ${msg.code || 'ERROR'} ${msg.description || ''}`);
      this.errorCode = msg.code || 'fatal_error';
    }
  }
}

module.exports = DeepgramStt;
