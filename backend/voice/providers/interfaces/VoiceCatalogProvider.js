'use strict';

class VoiceCatalogProvider {
  constructor(providerName) {
    if (new.target === VoiceCatalogProvider) {
      throw new TypeError('VoiceCatalogProvider is abstract and cannot be instantiated directly.');
    }
    this.providerName = providerName;
  }

  async listVoices(opts = {}) {
    throw new Error(`${this.providerName}.listVoices() not implemented`);
  }

  async getVoice(voiceId) {
    throw new Error(`${this.providerName}.getVoice() not implemented`);
  }

  async getDefaultVoice(language) {
    throw new Error(`${this.providerName}.getDefaultVoice() not implemented`);
  }
}

module.exports = VoiceCatalogProvider;
