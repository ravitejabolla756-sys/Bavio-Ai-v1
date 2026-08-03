'use strict';

class SpeechToTextProvider {
  constructor(providerName) {
    if (new.target === SpeechToTextProvider) {
      throw new TypeError('SpeechToTextProvider is abstract and cannot be instantiated directly.');
    }
    this.providerName = providerName;
    this._onPartialTranscript  = null;
    this._onFinalTranscript    = null;
    this._onSpeechStarted      = null;
    this._onEagerEndOfTurn     = null;
    this._onEndOfTurn          = null;
  }

  async connect(opts) {
    throw new Error(`${this.providerName}.connect() not implemented`);
  }

  sendAudio(audioChunk) {
    throw new Error(`${this.providerName}.sendAudio() not implemented`);
  }

  async close() {
    throw new Error(`${this.providerName}.close() not implemented`);
  }

  onPartialTranscript(cb) {
    this._onPartialTranscript = cb;
    return this;
  }

  onFinalTranscript(cb) {
    this._onFinalTranscript = cb;
    return this;
  }

  onSpeechStarted(cb) {
    this._onSpeechStarted = cb;
    return this;
  }

  onEagerEndOfTurn(cb) {
    this._onEagerEndOfTurn = cb;
    return this;
  }

  onEndOfTurn(cb) {
    this._onEndOfTurn = cb;
    return this;
  }

  _emitPartialTranscript(text) {
    if (this._onPartialTranscript) this._onPartialTranscript(text);
  }

  _emitFinalTranscript(text) {
    if (this._onFinalTranscript) this._onFinalTranscript(text);
  }

  _emitSpeechStarted() {
    if (this._onSpeechStarted) this._onSpeechStarted();
  }

  _emitEagerEndOfTurn() {
    if (this._onEagerEndOfTurn) this._onEagerEndOfTurn();
  }

  onEndOfTurn(cb) {
    this._onEndOfTurn = cb;
    return this;
  }

  onTurnResumed(cb) {
    this._onTurnResumed = cb;
    return this;
  }

  _emitSpeechStarted() {
    if (this._onSpeechStarted) this._onSpeechStarted();
  }

  _emitEagerEndOfTurn() {
    if (this._onEagerEndOfTurn) this._onEagerEndOfTurn();
  }

  _emitEndOfTurn(finalTranscript) {
    if (this._onEndOfTurn) this._onEndOfTurn(finalTranscript);
  }

  _emitTurnResumed() {
    if (this._onTurnResumed) this._onTurnResumed();
  }
}

module.exports = SpeechToTextProvider;
