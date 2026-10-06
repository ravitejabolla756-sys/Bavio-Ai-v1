'use strict';

const SpeechToTextProvider = require('../interfaces/SpeechToTextProvider');
const gnaniService = require('../../../services/gnaniService');

/**
 * GnaniPrismaStt — SpeechToTextProvider implementation for Gnani Prisma v2.5
 * 
 * Provides:
 * - Telephony audio buffering & chunked speech transcription
 * - High accuracy recognition for Tamil, Telugu, Hindi, and Indian English
 * - Voice Activity Detection (VAD) / speech start for barge-in
 * - End of turn detection and emit to conversational pipeline
 */
class GnaniPrismaStt extends SpeechToTextProvider {
  constructor(opts = {}) {
    super('GnaniPrismaStt');
    this.apiKey = opts.apiKey || process.env.GNANI_API_KEY;
    this.language = opts.language || 'hi-IN';
    this.model = opts.model || 'prisma-v2.5';
    this._audioChunks = [];
    this._isConnected = false;
    this._turnSilenceTimer = null;
    this._hasSpokenInTurn = false;
    this._lastChunkTime = null;
    this._silenceThresholdMs = opts.silenceThresholdMs || 700; // Fast endpointing
  }

  async connect(opts = {}) {
    this.language = opts.language || this.language;
    this.encoding = opts.encoding || 'mulaw';
    this.sampleRate = opts.sampleRate || 8000;
    this._isConnected = true;
    this._audioChunks = [];
    this._hasSpokenInTurn = false;
    console.log(`[GnaniPrismaStt] Connected (model: ${this.model}, lang: ${this.language}, encoding: ${this.encoding})`);
  }

  sendAudio(audioChunk) {
    if (!this._isConnected || !audioChunk || audioChunk.length === 0) return;

    this._audioChunks.push(audioChunk);
    this._lastChunkTime = Date.now();

    // Check simple energy threshold to trigger VAD speech started event (barge-in)
    if (!this._hasSpokenInTurn) {
      let sum = 0;
      for (let i = 0; i < Math.min(audioChunk.length, 100); i++) {
        sum += Math.abs(audioChunk[i] - 128); // 8-bit mulaw baseline
      }
      if (sum / 100 > 12) {
        this._hasSpokenInTurn = true;
        this._emitSpeechStarted();
      }
    }

    // Reset silence timer on every new audio packet
    if (this._turnSilenceTimer) {
      clearTimeout(this._turnSilenceTimer);
    }

    // If caller has spoken, trigger endpoint detection after silence threshold
    if (this._hasSpokenInTurn) {
      this._turnSilenceTimer = setTimeout(() => {
        this._processTurnAudio();
      }, this._silenceThresholdMs);
    }
  }

  async _processTurnAudio() {
    if (this._audioChunks.length === 0) return;

    const fullBuffer = Buffer.concat(this._audioChunks);
    this._audioChunks = [];
    this._hasSpokenInTurn = false;

    // Emit eager end of turn signal
    this._emitEagerEndOfTurn();

    try {
      const result = await gnaniService.transcribeWithPrisma(fullBuffer, {
        language: this.language,
        encoding: this.encoding,
        sampleRate: this.sampleRate,
        apiKey: this.apiKey
      });

      const transcript = result.transcript;
      if (transcript && transcript.trim().length > 0) {
        this._emitFinalTranscript(transcript);
        this._emitEndOfTurn(transcript);
      }
    } catch (err) {
      console.error(`[GnaniPrismaStt] Transcription error: ${err.message}`);
    }
  }

  async close() {
    this._isConnected = false;
    if (this._turnSilenceTimer) {
      clearTimeout(this._turnSilenceTimer);
      this._turnSilenceTimer = null;
    }
    this._audioChunks = [];
    console.log('[GnaniPrismaStt] Closed.');
  }
}

module.exports = GnaniPrismaStt;
