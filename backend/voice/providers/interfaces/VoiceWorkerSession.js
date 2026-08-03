'use strict';

class VoiceWorkerSession {
  constructor(providerName) {
    if (new.target === VoiceWorkerSession) {
      throw new TypeError('VoiceWorkerSession is abstract and cannot be instantiated directly.');
    }
    this.providerName = providerName;
  }

  async start(opts) {
    throw new Error(`${this.providerName}.start() not implemented`);
  }

  handleAudio(audioChunk) {
    throw new Error(`${this.providerName}.handleAudio() not implemented`);
  }

  async end() {
    throw new Error(`${this.providerName}.end() not implemented`);
  }

  getState() {
    throw new Error(`${this.providerName}.getState() not implemented`);
  }
}

module.exports = VoiceWorkerSession;
