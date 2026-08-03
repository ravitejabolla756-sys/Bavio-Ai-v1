'use strict';

class TextToSpeechProvider {
  constructor(providerName) {
    if (new.target === TextToSpeechProvider) {
      throw new TypeError('TextToSpeechProvider is abstract and cannot be instantiated directly.');
    }
    this.providerName    = providerName;
    this._onAudioChunk   = null;
    this._onComplete     = null;
    this._onError        = null;
  }

  async connect(opts) {
    throw new Error(`${this.providerName}.connect() not implemented`);
  }

  streamText(textChunk) {
    throw new Error(`${this.providerName}.streamText() not implemented`);
  }

  async flush() {
    throw new Error(`${this.providerName}.flush() not implemented`);
  }

  cancel() {
    throw new Error(`${this.providerName}.cancel() not implemented`);
  }

  async close() {
    throw new Error(`${this.providerName}.close() not implemented`);
  }

  onAudioChunk(cb) {
    this._onAudioChunk = cb;
    return this;
  }

  onComplete(cb) {
    this._onComplete = cb;
    return this;
  }

  onError(cb) {
    this._onError = cb;
    return this;
  }

  _emitAudioChunk(chunk, responseId) { if (this._onAudioChunk) this._onAudioChunk(chunk, responseId); }
  _emitComplete()        { if (this._onComplete)   this._onComplete(); }
  _emitError(err)        { if (this._onError)      this._onError(err); }
}

module.exports = TextToSpeechProvider;
