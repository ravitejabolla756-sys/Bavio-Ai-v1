'use strict';

/**
 * DeepgramStt — Deepgram Flux live-streaming STT provider
 *
 * Uses the Deepgram v1/listen WebSocket API:
 *   wss://api.deepgram.com/v1/listen?model=…&encoding=mulaw&sample_rate=8000…
 *
 * Key advantages over the current batch approach:
 *   - No 1.2 s silence accumulation buffer required.
 *   - UtteranceEnd event provides onEagerEndOfTurn signal.
 *   - Deepgram endpointing handles VAD natively.
 *   - Partial transcripts enable UI streaming effects.
 *
 * Status: IMPLEMENTED — feature-flagged behind modular_v1.
 *
 * Required env:  DEEPGRAM_API_KEY, DEEPGRAM_MODEL
 */

const WebSocket            = require('ws');
const SpeechToTextProvider = require('../interfaces/SpeechToTextProvider');

// Deepgram response event types
const DG_RESULT_FINAL       = 'Results';
const DG_SPEECH_STARTED     = 'SpeechStarted';
const DG_UTTERANCE_END      = 'UtteranceEnd';
const DG_METADATA           = 'Metadata';
const DG_ERROR              = 'Error';

const DEEPGRAM_STT_URL      = 'wss://api.deepgram.com/v1/listen';

class DeepgramStt extends SpeechToTextProvider {
  /**
   * @param {object} opts
   * @param {string} opts.apiKey    Deepgram API key (required)
   * @param {string} opts.model     Deepgram model name (e.g. 'nova-2')
   */
  constructor({ apiKey, model = 'nova-2' }) {
    super('DeepgramStt');
    if (!apiKey) throw new Error('[DeepgramStt] apiKey is required');
    this._apiKey         = apiKey;
    this._model          = model;
    this._ws             = null;
    this._connected      = false;
    this._finalTranscript = '';
  }

  // ── SpeechToTextProvider implementation ───────────────────────────────────

  async connect({ language = 'en-US', encoding = 'mulaw', sampleRate = 8000, channels = 1 } = {}) {
    const lang = language.split('-')[0].toLowerCase();   // Deepgram uses 'en', not 'en-US'
    const url  = (
      `${DEEPGRAM_STT_URL}` +
      `?model=${encodeURIComponent(this._model)}` +
      `&language=${encodeURIComponent(lang)}` +
      `&encoding=${encodeURIComponent(encoding)}` +
      `&sample_rate=${sampleRate}` +
      `&channels=${channels}` +
      `&smart_format=true` +
      `&punctuate=true` +
      `&interim_results=true` +
      `&utterance_end_ms=800` +   // Eager end-of-turn at 800 ms silence
      `&vad_events=true`          // SpeechStarted events
    );

    return new Promise((resolve, reject) => {
      this._ws = new WebSocket(url, {
        headers: { Authorization: `Token ${this._apiKey}` },
      });

      this._ws.once('open',  () => {
        this._connected = true;
        console.log(`[DeepgramStt] Connected — model=${this._model} lang=${lang} enc=${encoding} sr=${sampleRate}`);
        resolve();
      });

      this._ws.once('error', (err) => {
        console.error(`[DeepgramStt] Connection error: ${err.message}`);
        reject(err);
      });

      this._ws.on('message', (data) => this._handleMessage(data));

      this._ws.on('close', (code, reason) => {
        this._connected = false;
        console.log(`[DeepgramStt] Connection closed — code=${code} reason=${reason}`);
      });
    });
  }

  sendAudio(audioChunk) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(audioChunk);
    }
  }

  async close() {
    if (this._ws) {
      // Send CloseStream message per Deepgram spec
      if (this._ws.readyState === WebSocket.OPEN) {
        this._ws.send(JSON.stringify({ type: 'CloseStream' }));
      }
      await new Promise(resolve => setTimeout(resolve, 200));
      this._ws.terminate();
      this._ws = null;
    }
    this._connected = false;
  }

  // ── Internal message handler ──────────────────────────────────────────────

  _handleMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case DG_METADATA:
        // Connection confirmed
        break;

      case DG_SPEECH_STARTED:
        // VAD onset — trigger barge-in
        this._emitSpeechStarted();
        break;

      case DG_RESULT_FINAL: {
        const alt        = msg.channel?.alternatives?.[0];
        const transcript = alt?.transcript || '';
        const isFinal    = msg.is_final === true;

        if (!transcript) break;

        if (isFinal) {
          this._finalTranscript += (this._finalTranscript ? ' ' : '') + transcript;
          this._emitFinalTranscript(transcript);
        } else {
          this._emitPartialTranscript(transcript);
        }
        break;
      }

      case DG_UTTERANCE_END:
        // Deepgram's native end-of-turn signal — fire both eager and definitive
        this._emitEagerEndOfTurn();
        this._emitEndOfTurn(this._finalTranscript.trim());
        this._finalTranscript = '';   // Reset for next turn
        break;

      case DG_ERROR:
        console.error(`[DeepgramStt] Server error: ${JSON.stringify(msg)}`);
        break;

      default:
        break;
    }
  }
}

module.exports = DeepgramStt;
