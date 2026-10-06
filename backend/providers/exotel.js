'use strict';

const axios = require('axios');

/**
 * ExotelProvider — Exotel HTTP and webhook API handler
 */
class ExotelProvider {
  constructor() {
    this.apiKey = process.env.EXOTEL_API_KEY;
    this.apiToken = process.env.EXOTEL_API_TOKEN;
    this.accountSid = process.env.EXOTEL_ACCOUNT_SID;
    this.subdomain = process.env.EXOTEL_SUBDOMAIN || 'api.exotel.com';
    this.virtualNumber = process.env.EXOTEL_VIRTUAL_NUMBER;
  }

  async handleIncomingCall(req) {
    const body = req.body || req.query || {};
    return {
      providerCallId: body.CallSid || body.CallSid_exotel || `exotel_${Date.now()}`,
      callerNumber: body.From || body.CallFrom || body.Caller || '',
      calledNumber: body.To || body.CallTo || body.DialWhomNumber || this.virtualNumber || '',
      status: body.CallStatus || body.Status || 'ringing',
      direction: 'inbound',
      provider: 'exotel'
    };
  }

  async createOutboundCall(data) {
    if (!this.apiKey || !this.apiToken || !this.accountSid) {
      throw new Error('Exotel credentials not configured. Set EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_ACCOUNT_SID in .env');
    }

    const auth = Buffer.from(`${this.apiKey}:${this.apiToken}`).toString('base64');
    const params = new URLSearchParams();
    params.append('From', data.from || this.virtualNumber);
    params.append('To', data.to);
    params.append('CallerId', data.from || this.virtualNumber);
    params.append('Url', data.webhookUrl || process.env.EXOTEL_APPLET_URL);
    if (data.statusCallback) {
      params.append('StatusCallback', data.statusCallback);
    }

    const response = await axios.post(
      `https://${this.subdomain}/v1/Accounts/${this.accountSid}/Calls/connect.json`,
      params.toString(),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      }
    );

    return response.data?.Call?.Sid || `exotel_out_${Date.now()}`;
  }

  async getCallStatus(callId) {
    if (!this.apiKey || !this.apiToken || !this.accountSid) {
      return { status: 'completed', duration: 0, cost: 0 };
    }

    const auth = Buffer.from(`${this.apiKey}:${this.apiToken}`).toString('base64');
    const response = await axios.get(
      `https://${this.subdomain}/v1/Accounts/${this.accountSid}/Calls/${callId}.json`,
      {
        headers: {
          'Authorization': `Basic ${auth}`
        },
        timeout: 8000
      }
    );

    const call = response.data?.Call || {};
    return {
      status: call.Status,
      duration: parseInt(call.Duration || '0', 10),
      cost: parseFloat(call.Price || '0')
    };
  }
}

module.exports = new ExotelProvider();
