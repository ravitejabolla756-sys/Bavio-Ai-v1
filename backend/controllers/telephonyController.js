const db = require('../database/db');
const providerFactory = require('../providers/index');
const billingService = require('../services/billingService');
const { incrementMinutesUsed } = require('../middleware/planEnforcement');
const voiceOrchestrator = require('../services/voiceOrchestrator');

async function handleIncoming(req, res) {
    try {
        const body = req.body;
        const providerName = 'twilio';
        const provider = providerFactory.getProvider(providerName);

        const callData = await provider.handleIncomingCall(req);
        const { providerCallId, callerNumber, calledNumber } = callData;

        // Look up the phone number record
        const numResult = await db.query(
            'SELECT * FROM phone_numbers WHERE phone_number = $1',
            [calledNumber]
        );

        let phoneNumberId = null;
        if (numResult.rows.length === 0) {
            console.warn(`No phone_number record found for ${calledNumber}`);
        } else {
            phoneNumberId = numResult.rows[0].id;
            // Insert initial call log
            await db.query(
                `INSERT INTO calls (phone_number_id, provider_call_id, caller_number, call_status, duration, cost)
                 VALUES ($1, $2, $3, 'in-progress', 0, 0)
                 ON CONFLICT (provider_call_id) DO NOTHING`,
                [phoneNumberId, providerCallId, callerNumber]
            );
        }

        // Check if audio data is present in request (for voice processing)
        if (body.RecordingUrl || body.MediaUrl0 || req.body.audio_base64) {
            try {
                // Get audio buffer from request
                let audioBuffer;
                if (req.body.audio_base64) {
                    audioBuffer = Buffer.from(req.body.audio_base64, 'base64');
                } else if (body.RecordingUrl) {
                    const axios = require('axios');
                    const audioResponse = await axios.get(body.RecordingUrl, { responseType: 'arraybuffer' });
                    audioBuffer = Buffer.from(audioResponse.data);
                } else {
                    // For testing/demo: return welcome message
                    const welcomeText = "Namaste! Main Bavio AI hoon. Aapki kya madad kar sakta hoon?";
                    const welcomeAudio = await voiceOrchestrator.DEFAULT_SYSTEM_PROMPT ? 
                        await require('../services/openAIService').textToSpeech(welcomeText, 'alloy', 'hi-IN', 'mp3') : null;
                }

                if (audioBuffer && phoneNumberId) {
                    const numData = numResult.rows[0];
                    const clientId = numData.client_id;
                    
                    // Process through OpenAI pipeline
                    const result = await voiceOrchestrator.processVoiceCall(
                        audioBuffer, 
                        clientId, 
                        providerCallId
                    );

                    // For Twilio: return audio URL or play directly
                    res.set('Content-Type', 'text/xml');
                    const audioBase64 = result.audioBuffer.toString('base64');
                    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Play>${audioBase64}</Play></Response>`);
                }
            } catch (voiceError) {
                console.error('Voice processing error:', voiceError);
            }
        }

        // Default welcome response (if no audio or error)
        res.set('Content-Type', 'text/xml');
        return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Namaste! Bavio AI mein aapka swagat hai. Kripya apna sawal poochiye.</Say></Response>`);
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

            // Track minutes usage for client billing
            const phoneResult = await db.query(
                'SELECT client_id FROM phone_numbers WHERE id = $1',
                [call.phone_number_id]
            );
            if (phoneResult.rows.length > 0) {
                const clientId = phoneResult.rows[0].client_id;
                await incrementMinutesUsed(clientId, Math.ceil(durationSeconds / 60));
            }
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
