const db = require('../database/db');
const providerFactory = require('../providers/index');
const billingService = require('../services/billingService');

async function handleIncoming(req, res) {
    try {
        const body = req.body;

        // Detect the provider by looking at the body signature
        const isExotel = Boolean(body.CallSid && body.Status && body.From);
        const providerName = isExotel ? 'exotel' : 'twilio';
        const provider = providerFactory.getProvider(providerName);

        const callData = await provider.handleIncomingCall(req);
        const { providerCallId, callerNumber, calledNumber } = callData;

        // Look up the phone number record
        const numResult = await db.query(
            'SELECT * FROM phone_numbers WHERE phone_number = $1',
            [calledNumber]
        );

        if (numResult.rows.length === 0) {
            console.warn(`No phone_number record found for ${calledNumber}`);
        } else {
            const phoneNumberId = numResult.rows[0].id;
            // Insert initial call log (duration/cost will be updated by /status webhook)
            await db.query(
                `INSERT INTO calls (phone_number_id, provider_call_id, caller_number, call_status, duration, cost)
                 VALUES ($1, $2, $3, 'in-progress', 0, 0)
                 ON CONFLICT (provider_call_id) DO NOTHING`,
                [phoneNumberId, providerCallId, callerNumber]
            );
        }

        // Respond based on provider
        if (providerName === 'twilio') {
            res.set('Content-Type', 'text/xml');
            return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Welcome to Bavio AI. Connecting you to your assistant.</Say></Response>`);
        }
        res.status(200).send('OK');
    } catch (err) {
        console.error('Incoming call error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function handleStatus(req, res) {
    try {
        const body = req.body;
        const providerCallId = body.CallSid;
        const callStatus = body.CallStatus;
        const durationSeconds = parseInt(body.CallDuration || body.Duration || '0');

        if (!providerCallId) return res.status(400).json({ error: 'Missing CallSid' });

        // Find the call record
        const callResult = await db.query(
            'SELECT * FROM calls WHERE provider_call_id = $1', [providerCallId]
        );

        if (callResult.rows.length === 0) {
            return res.status(404).json({ error: 'Call not found' });
        }

        const call = callResult.rows[0];

        if (callStatus === 'completed' && durationSeconds > 0) {
            await billingService.processCallEnd({
                providerCallId,
                phoneNumberId: call.phone_number_id,
                callerNumber: call.caller_number,
                durationSeconds
            });
        } else {
            // Update the status only
            await db.query(
                `UPDATE calls SET call_status = $1, duration = $2 WHERE provider_call_id = $3`,
                [callStatus, durationSeconds, providerCallId]
            );
        }

        res.status(200).send('OK');
    } catch (err) {
        console.error('Call status error:', err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = { handleIncoming, handleStatus };
