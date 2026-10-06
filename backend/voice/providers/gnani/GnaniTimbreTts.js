'use strict';

const TextToSpeechProvider = require('../interfaces/TextToSpeechProvider');
const gnaniService = require('../../../services/gnaniService');

/**
 * GnaniTimbreTts — TextToSpeechProvider implementation for Gnani Timbre v2.5
 * 
 * Features:
 * - Native Indian regional voice synthesis (Tamil, Telugu, Hindi, Indian English)
 * - Outputs G.711 mu-law 8kHz mono audio for direct telephony streaming
 * - Sentence-level streaming synthesis
 * - Fast time-to-first-byte (TTFB)
 */
class GnaniTimbreTts extends TextToSpeechProvider {
  constructor(opts = {}) {
    super('GnaniTimbreTts');
    this.apiKey = opts.apiKey || process.env.GNANI_API_KEY;
    this.modelId = opts.modelId || 'timbre-v2.5';
    this.voiceGender = opts.voiceGender || 'female';
    this.language = opts.language || 'hi-IN';
    this.outputFormat = opts.outputFormat || 'mulaw_8000';
    this._queue = [];
    this._isSynthesizing = false;
    this._isCancelled = false;
  }

  async connect(opts = {}) {
    this.language = opts.language || this.language;
    this.voiceGender = opts.voiceGender || this.voiceGender;
    this.outputFormat = opts.outputFormat || this.outputFormat;
    this._isCancelled = false;
    this._queue = [];
    console.log(`[GnaniTimbreTts] Connected (lang: ${this.language}, gender: ${this.voiceGender}, fmt: ${this.outputFormat})`);
  }

  streamText(textChunk) {
    if (!textChunk || !textChunk.trim() || this._isCancelled) return;
    this._queue.push(textChunk.trim());
    this._processQueue();
  }

  async _processQueue() {
    if (this._isSynthesizing || this._queue.length === 0 || this._isCancelled) return;
    this._isSynthesizing = true;

    while (this._queue.length > 0 && !this._isCancelled) {
      const text = this._queue.shift();
      try {
        const result = await gnaniService.synthesizeWithTimbre(text, {
          language: this.language,
          voiceGender: this.voiceGender,
          outputFormat: this.outputFormat,
          apiKey: this.apiKey
        });

        if (result.audioBuffer && result.audioBuffer.length > 0 && !this._isCancelled) {
          this._emitAudioChunk(result.audioBuffer);
        }
      } catch (err) {
        console.error(`[GnaniTimbreTts] Synthesis error: ${err.message}`);
        this._emitError(err);
      }
    }

    this._isSynthesizing = false;
  }

  async flush() {
    // Wait for queue processing to finish
    while (this._isSynthesizing || this._queue.length > 0) {
      if (this._isCancelled) break;
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    if (!this._isCancelled) {
      this._emitComplete();
    }
  }

  cancel() {
    this._isCancelled = true;
    this._queue = [];
    this._isSynthesizing = false;
    console.log('[GnaniTimbreTts] Cancelled synthesis.');
  }

  async close() {
    this.cancel();
    console.log('[GnaniTimbreTts] Closed.');
  }
}

module.exports = GnaniTimbreTts;
