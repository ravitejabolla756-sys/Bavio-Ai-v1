'use strict';

const IndiaTelephonyProvider = require('../interfaces/IndiaTelephonyProvider');

class MockIndiaTelephony extends IndiaTelephonyProvider {
  constructor() {
    super('MockIndiaTelephony');
    this.isActive = false;
    this.configurations = {};
  }

  validateConfiguration() {
    // Requires a mock license key or secret for sandbox testing
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    throw new Error('[MockIndiaTelephony] Invalid production configuration');
  }

  async provisionNumber(businessId, documentUrls) {
    if (!documentUrls || documentUrls.length === 0) {
      throw new Error('[MockIndiaTelephony] Documents required for KYC compliance');
    }
    
    // Simulate initial compliance review entry (KYC state: UNDER_REVIEW)
    return {
      kycStatus: 'UNDER_REVIEW',
      applicationId: `kyc_${businessId}_${Date.now()}`,
      notes: 'Mock KYC documents submitted for verification.'
    };
  }

  async releaseNumber(numberId) {
    return { status: 'released', numberId };
  }

  async configureInboundRoute(numberId, webhookUrl) {
    return { success: true, webhookUrl };
  }

  validateInboundCall(req) {
    // Validate request signatures or SIP headers for sandbox security
    const authHeader = req.headers && req.headers['authorization'];
    return !!authHeader;
  }

  async startMediaSession(options) {
    this.isActive = true;
    return { sessionId: 'mock_in_media_123', status: 'connected' };
  }

  sendAudio(chunk) {
    if (!this.isActive) {
      throw new Error('[MockIndiaTelephony] Session not started');
    }
    // Simulate streaming to a local WebSocket / mock SIP stack
    return true;
  }

  clearAudio() {
    return true;
  }

  async endCall(callSid) {
    this.isActive = false;
    return { success: true, callSid };
  }

  async getCallStatus(callSid) {
    return { status: 'completed', callSid };
  }

  async getUsage(callSid) {
    return { durationSeconds: 60, cost: 0.15, currency: 'INR' };
  }

  async getRecording(callSid) {
    return { recordingUrl: 'https://mock-india-telephony.in/recordings/123.mp3' };
  }
}

module.exports = MockIndiaTelephony;
