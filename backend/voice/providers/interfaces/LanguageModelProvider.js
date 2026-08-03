'use strict';

class LanguageModelProvider {
  constructor(providerName) {
    if (new.target === LanguageModelProvider) {
      throw new TypeError('LanguageModelProvider is abstract and cannot be instantiated directly.');
    }
    this.providerName = providerName;
  }

  async createSession(opts) {
    throw new Error(`${this.providerName}.createSession() not implemented`);
  }

  async streamResponse(opts) {
    throw new Error(`${this.providerName}.streamResponse() not implemented`);
  }

  async cancelResponse(sessionId) {
    throw new Error(`${this.providerName}.cancelResponse() not implemented`);
  }

  async callTool(opts) {
    throw new Error(`${this.providerName}.callTool() not implemented`);
  }

  async close(sessionId) {
    throw new Error(`${this.providerName}.close() not implemented`);
  }
}

module.exports = LanguageModelProvider;
