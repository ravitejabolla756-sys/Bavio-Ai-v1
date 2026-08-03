'use strict';

class TelephonyProvider {
  constructor(providerName) {
    if (new.target === TelephonyProvider) {
      throw new TypeError('TelephonyProvider is abstract and cannot be instantiated directly.');
    }
    this.providerName  = providerName;
    this._onAudioChunk = null;
    this._onCallEnd    = null;
  }

  async startMediaSession(opts) {
    throw new Error(`${this.providerName}.startMediaSession() not implemented`);
  }

  sendAudio(audioBuffer) {
    throw new Error(`${this.providerName}.sendAudio() not implemented`);
  }

  clearAudio() {
    throw new Error(`${this.providerName}.clearAudio() not implemented`);
  }

  async terminateCall(reason) {
    throw new Error(`${this.providerName}.terminateCall() not implemented`);
  }

  async close() {
    throw new Error(`${this.providerName}.close() not implemented`);
  }

  onAudioChunk(cb) {
    this._onAudioChunk = cb;
    return this;
  }

  onCallEnd(cb) {
    this._onCallEnd = cb;
    return this;
  }

  _emitAudioChunk(chunk) { if (this._onAudioChunk) this._onAudioChunk(chunk); }
  _emitCallEnd()         { if (this._onCallEnd)    this._onCallEnd(); }
}

module.exports = TelephonyProvider;
