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

const DEEPGRAM_V2_URL      = 'wss://api.api.deepgram.com/v2/listen'; // v2 endpoint

class DeepgramStt extends SpeechToTextProvider {
  constructor({ apiKey, model = 'flux-general-en' }) {
    super('DeepgramStt');
    if (!apiKey) throw new Error('[DeepgramStt] apiKey is required');
    this._apiKey         = apiKey;
    this._model          = model;
    this._ws             = null;
    this._connected      = false;
    this._options        = null;

    // Metrics & Reconnection counters
    this.reconnectCount  = 0;
    this.errorCode       = null;
    this.partialCount    = 0;

    // Custom Callback
    this._onTurnResumed  = null;
  }

  // ── SpeechToTextProvider implementation ───────────────────────────────────

  async connect({ language = 'en-US', encoding = 'mulaw', sampleRate = 8000, channels = 1 } = {}) {
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
      `wss://api.deepgram.com/v2/listen` +
      `?model=${encodeURIComponent(this._model)}` +
      `&encoding=${encodeURIComponent(encoding)}` +
      `&sample_rate=${sampleRate}` +
      `&channels=${channels}` +
      `&eot_threshold=0.7` +            // Initial normal EOT threshold
      `&eager_eot_threshold=0.4` +      // Initial eager EOT threshold
      `&eot_timeout_ms=2000`            // Default EOT timeout
    );

    return this._connectToUrl(url);
  }

  sendAudio(audioChunk) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(audioChunk);
    }
  }

  async close() {
    this._connected = false;
    if (this._ws) {
      if (this._ws.readyState === WebSocket.OPEN) {
        // Send close stream control message
        this._ws.send(JSON.stringify({ type: 'CloseStream' }));
      }
      this._ws.terminate();
      this._ws = null;
    }
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
      console.log(`[DeepgramStt] Connecting to Deepgram v2: ${url}`);
      this._ws = new WebSocket(url, {
        headers: { Authorization: `Token ${this._apiKey}` },
      });

      this._ws.once('open', () => {
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
        if (code !== 1000 && this.reconnectCount < 3) {
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

    // Flux v2 endpoint sends event packets as ListenV2TurnInfo
    if (msg.type === 'ListenV2TurnInfo') {
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
    } else if (msg.type === 'ListenV2FatalError') {
      console.error(`[DeepgramStt] Fatal server error received:`, msg.error);
      this.errorCode = msg.error_code || 'fatal_error';
    }
  }
}

module.exports = DeepgramStt;
