const db = require('../database/db');
const providerFactory = require('../providers/index');

async function buyAndSaveNumber({ business_id, country, assistant_id }) {
    const providerName = country.toUpperCase() === 'IN' ? 'exotel' : 'twilio';
    
    // For testing/pre-launch: look for an unassigned number of the provider in the database
    const unassignedRes = await db.query(
        `SELECT * FROM phone_numbers 
         WHERE provider = $1 AND business_id IS NULL AND status = 'active'
         LIMIT 1`,
        [providerName]
    );

    if (unassignedRes.rows.length === 0) {
        throw new Error(`No available pre-configured test numbers for country/provider: ${providerName}. Contact support.`);
    }

    const dbNum = unassignedRes.rows[0];
    
    // Assign it to the business
    const result = await db.query(
        `UPDATE phone_numbers 
         SET business_id = $1, assistant_id = $2, type = 'dedicated'
         WHERE id = $3 RETURNING *`,
        [business_id, assistant_id || null, dbNum.id]
    );

    // Update the business table as well to associate this number
    if (providerName === 'twilio') {
        await db.query(
            `UPDATE businesses 
             SET twilio_number = $1, twilio_number_sid = $2 
             WHERE id = $3`,
            [dbNum.phone_number, dbNum.twilio_sid || 'PN_mock_sid', business_id]
        );
    } else {
        await db.query(
            `UPDATE businesses 
             SET original_phone_number = $1 
             WHERE id = $2`,
            [dbNum.phone_number, business_id]
        );
    }

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
