/**
 * whatsappService.js
 * ─────────────────────────────────────────────────────────────────────
 * Service to send lead alerts via Twilio WhatsApp API.
 * Uses the Twilio WhatsApp sandbox for testing with personal numbers.
 */

const twilio = require('twilio');

// Initialize Twilio client using environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const sandboxNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

let client = null;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
} else {
    console.warn('[WA] Twilio credentials missing from env. WhatsApp alerts will be printed to console.');
}

/**
 * Sends a WhatsApp lead alert to the business owner's phone number
 * @param {string} toPhone - The recipient business phone number (e.g., +919876543210)
 * @param {object} leadData - The lead details captured from the call
 * @param {object} callDetails - Additional details like duration and caller number
 */
async function sendLeadAlert(toPhone, leadData, callDetails = {}) {
    try {
        if (!toPhone) {
            console.error('[WA] Recipient phone number is missing');
            return;
        }

        // Format numbers for WhatsApp
        // Twilio requires format "whatsapp:+[country_code][number]"
        let formattedTo = toPhone.trim();
        if (!formattedTo.startsWith('whatsapp:')) {
            if (!formattedTo.startsWith('+')) {
                formattedTo = '+' + formattedTo;
            }
            formattedTo = 'whatsapp:' + formattedTo;
        }

        const name = leadData.name || 'Not provided';
        const phone = leadData.phone || callDetails.caller_number || 'Not provided';
        const intent = leadData.intent || 'Not provided';
        const budget = leadData.budget || 'Not provided';
        const location = leadData.location || 'Not provided';
        const duration = callDetails.duration ? `${callDetails.duration}s` : 'Unknown';

        // Custom template-compatible message body
        const messageBody = `🎉 *New Lead Captured by Bavio AI!*
        
👤 *Name*: ${name}
📞 *Phone*: ${phone}
🎯 *Intent*: ${intent}
💰 *Budget*: ${budget}
📍 *Location*: ${location}
⏱ *Call Duration*: ${duration}

Check your dashboard at https://bavio.in/dashboard for details.`;

        console.log(`[WA] Preparing lead alert to ${formattedTo}...`);

        if (client) {
            const message = await client.messages.create({
                body: messageBody,
                from: sandboxNumber,
                to: formattedTo
            });
            console.log(`[WA] WhatsApp alert sent successfully! SID: ${message.sid}`);
            return message;
        } else {
            console.log(`[WA] MOCK ALERT (No Twilio config):\n${messageBody}`);
            return { mock: true, body: messageBody };
        }
    } catch (err) {
        console.error('[WA] Failed to send WhatsApp alert:', err.message);
        throw err;
    }
}

module.exports = {
    sendLeadAlert
};
