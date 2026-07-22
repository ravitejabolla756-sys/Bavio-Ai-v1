const twilio = require('twilio');

class TwilioProvider {
    constructor() {
        this._client = null;
    }

    get client() {
        if (!this._client) {
            const sid = process.env.TWILIO_ACCOUNT_SID;
            const token = process.env.TWILIO_AUTH_TOKEN;
            if (!sid || !token || sid.startsWith('your_')) {
                throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
            }
            this._client = twilio(sid, token);
        }
        return this._client;
    }

    async buyNumber(country) {
        try {
            const availableNumbers = await this.client.availablePhoneNumbers(country).local.list({ limit: 1 });
            if (availableNumbers.length > 0) {
                const phoneNumber = availableNumbers[0].phoneNumber;
                const purchasedNumber = await this.client.incomingPhoneNumbers.create({ phoneNumber });
                return purchasedNumber.phoneNumber;
            }
            throw new Error(`No available Twilio numbers for country: ${country}`);
        } catch (error) {
            console.error('Twilio buyNumber error:', error.message);
            throw error;
        }
    }

    async buyNumberWithDetails(country) {
        try {
            const availableNumbers = await this.client.availablePhoneNumbers(country).local.list({ limit: 1 });
            if (availableNumbers.length > 0) {
                const phoneNumber = availableNumbers[0].phoneNumber;
                const webhookBase = process.env.WEBHOOK_BASE_URL || 'https://api.bavio.in';
                const voiceUrl = `${webhookBase}/api/calls/incoming`;
                const statusCallback = `${webhookBase}/api/calls/status`;
                
                const purchasedNumber = await this.client.incomingPhoneNumbers.create({ 
                    phoneNumber,
                    voiceUrl,
                    voiceMethod: 'POST',
                    statusCallback,
                    statusCallbackMethod: 'POST'
                });
                
                return {
                    phoneNumber: purchasedNumber.phoneNumber,
                    sid: purchasedNumber.sid
                };
            }
            throw new Error(`No available Twilio numbers for country: ${country}`);
        } catch (error) {
            console.error('Twilio buyNumberWithDetails error:', error.message);
            throw error;
        }
    }

    async handleIncomingCall(req) {
        const body = req.body;
        return {
            providerCallId: body.CallSid,
            callerNumber: body.From,
            calledNumber: body.To,
            status: body.CallStatus
        };
    }

    async createOutboundCall(data) {
        try {
            const call = await this.client.calls.create({
                url: data.webhookUrl,
                to: data.to,
                from: data.from
            });
            return call.sid;
        } catch (error) {
            console.error('Twilio createOutboundCall error:', error.message);
            throw error;
        }
    }

    async getCallStatus(callId) {
        try {
            const call = await this.client.calls(callId).fetch();
            return {
                status: call.status,
                duration: call.duration ? parseInt(call.duration) : 0,
                cost: call.price ? Math.abs(parseFloat(call.price)) : 0
            };
        } catch (error) {
            console.error('Twilio getCallStatus error:', error.message);
            throw error;
        }
    }
}

module.exports = new TwilioProvider();
