'use strict';

class TurnDetectionProvider {
  constructor(providerName) {
    if (new.target === TurnDetectionProvider) {
      throw new TypeError('TurnDetectionProvider is abstract and cannot be instantiated directly.');
    }
    this.providerName         = providerName;
    this._onSpeechStart       = null;
    this._onSpeechEnd         = null;
    this._onEagerEndOfTurn    = null;
  }

  async start(opts) {
    throw new Error(`${this.providerName}.start() not implemented`);
  }

  pushAudio(audioChunk) {
    throw new Error(`${this.providerName}.pushAudio() not implemented`);
  }

  setAiSpeaking() {}
  setAiSilent() {}

  async stop() {
    throw new Error(`${this.providerName}.stop() not implemented`);
  }

  onSpeechStart(cb) {
    this._onSpeechStart = cb;
    return this;
  }

  onSpeechEnd(cb) {
    this._onSpeechEnd = cb;
    return this;
  }

  onEagerEndOfTurn(cb) {
    this._onEagerEndOfTurn = cb;
    return this;
  }

  _emitSpeechStart()    { if (this._onSpeechStart)    this._onSpeechStart(); }
  _emitSpeechEnd()      { if (this._onSpeechEnd)      this._onSpeechEnd(); }
  _emitEagerEndOfTurn() { if (this._onEagerEndOfTurn) this._onEagerEndOfTurn(); }
}

module.exports = TurnDetectionProvider;
