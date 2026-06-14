const axios = require('axios');

class ExotelProvider {
    constructor() {
        this.apiKey = process.env.EXOTEL_API_KEY;
        this.apiToken = process.env.EXOTEL_API_TOKEN;
        this.subdomain = process.env.EXOTEL_SUBDOMAIN || 'api.exotel.com';
        this.sid = process.env.EXOTEL_SID;

        if (this.apiKey && this.apiToken) {
            const auth = Buffer.from(`${this.apiKey}:${this.apiToken}`).toString('base64');
            this.client = axios.create({
                baseURL: `https://${this.subdomain}/v1/Accounts/${this.sid}`,
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
        }
    }

    async buyNumber(country) {
        // Exotel is primarily for India. Buying automated numbers requires KYC logic.
        // We simulate the purchase of an ExoPhone here.
        console.log(`Exotel simulated purchase in ${country}`);
        return `+9180${Math.floor(1000000 + Math.random() * 9000000)}`;
    }

    async handleIncomingCall(req) {
        // Parse the inbound webhook data from Exotel
        const body = req.body;
        return {
            providerCallId: body.CallSid,
            callerNumber: body.From,
            calledNumber: body.To,
            status: body.Status
        };
    }

    async createOutboundCall(data) {
        // Exotel outbound call simulation (or real API call if configured)
        return `exotel_mock_call_${Date.now()}`;
    }

    async getCallStatus(callId) {
        // Simulated status return for Exotel
        return {
            status: 'completed',
            duration: Math.floor(Math.random() * 300), // Random duration for demo
            cost: parseFloat((Math.random() * 0.5).toFixed(4))
        };
    }
}

module.exports = new ExotelProvider();
