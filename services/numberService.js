const db = require('../database/db');
const providerFactory = require('../providers/index');

async function buyAndSaveNumber({ business_id, country, assistant_id }) {
    const providerName = country.toUpperCase() === 'IN' ? 'exotel' : 'twilio';
    const provider = providerFactory.getProvider(providerName);

    const phoneNumber = await provider.buyNumber(country);

    const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/calls/twilio/incoming`;
    // Attach the webhook to the purchased number (Twilio only for now)
    if (providerName === 'twilio') {
        const numbers = await provider.client?.incomingPhoneNumbers?.list?.({ phoneNumber, limit: 1 });
        if (numbers && numbers.length > 0) {
            await provider.client.incomingPhoneNumbers(numbers[0].sid).update({
                voiceUrl: webhookUrl,
                voiceMethod: 'POST'
            });
        }
    }

    const result = await db.query(
        `INSERT INTO phone_numbers (business_id, assistant_id, number, provider, status)
         VALUES ($1, $2, $3, $4, 'active') RETURNING *`,
        [business_id, assistant_id || null, phoneNumber, providerName]
    );
    return result.rows[0];
}

async function linkNumberToAssistant({ phone_number_id, assistant_id, business_id }) {
    if (assistant_id) {
        const astResult = await db.query(
            'SELECT id FROM assistants WHERE id = $1 AND business_id = $2',
            [assistant_id, business_id]
        );
        if (astResult.rows.length === 0) {
            throw new Error('Assistant not found or unauthorized');
        }
    }
    const result = await db.query(
        `UPDATE phone_numbers SET assistant_id = $1 WHERE id = $2 AND business_id = $3 RETURNING *`,
        [assistant_id, phone_number_id, business_id]
    );
    if (result.rows.length === 0) throw new Error('Phone number not found or unauthorized');
    return result.rows[0];
}

async function getNumbersForClient(business_id) {
    const result = await db.query(
        `SELECT pn.*, a.name AS assistant_name
         FROM phone_numbers pn
         LEFT JOIN assistants a ON pn.assistant_id = a.id
         WHERE pn.business_id = $1
         ORDER BY pn.created_at DESC`,
         [business_id]
    );
    return result.rows;
}

module.exports = { buyAndSaveNumber, linkNumberToAssistant, getNumbersForClient };
