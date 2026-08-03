'use strict';

/**
 * Interface contract for compliant provider-agnostic Indian Telephony integration.
 */
class IndiaTelephonyProvider {
  constructor(name = 'IndiaTelephonyProvider') {
    this.name = name;
  }

  validateConfiguration() {
    throw new Error('validateConfiguration() not implemented');
  }

  async provisionNumber(businessId, documentUrls) {
    throw new Error('provisionNumber() not implemented');
  }

  async releaseNumber(numberId) {
    throw new Error('releaseNumber() not implemented');
  }

  async configureInboundRoute(numberId, webhookUrl) {
    throw new Error('configureInboundRoute() not implemented');
  }

  validateInboundCall(req) {
    throw new Error('validateInboundCall() not implemented');
  }

  async startMediaSession(options) {
    throw new Error('startMediaSession() not implemented');
  }

  sendAudio(chunk) {
    throw new Error('sendAudio() not implemented');
  }

  clearAudio() {
    throw new Error('clearAudio() not implemented');
  }

  async endCall(callSid) {
    throw new Error('endCall() not implemented');
  }

  async getCallStatus(callSid) {
    throw new Error('getCallStatus() not implemented');
  }

  async getUsage(callSid) {
    throw new Error('getUsage() not implemented');
  }

  async getRecording(callSid) {
    throw new Error('getRecording() not implemented');
  }
}

module.exports = IndiaTelephonyProvider;
