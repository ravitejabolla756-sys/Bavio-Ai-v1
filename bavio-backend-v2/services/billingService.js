const db = require('../database/db');
const providerFactory = require('../providers/index');

const COST_PER_MINUTE = 0.05; // $0.05 per minute

async function processCallEnd({ providerCallId, phoneNumberId, callerNumber, durationSeconds, provider }) {
    const durationMinutes = Math.ceil(durationSeconds / 60);
    const cost = parseFloat((durationMinutes * COST_PER_MINUTE).toFixed(4));

    // Insert call record
    const callResult = await db.query(
        `INSERT INTO calls (phone_number_id, provider_call_id, caller_number, status, duration, cost)
         VALUES ($1, $2, $3, 'completed', $4, $5) RETURNING *`,
        [phoneNumberId, providerCallId, callerNumber, durationSeconds, cost]
    );
    const call = callResult.rows[0];

    // Get business_id from phone_numbers
    const numResult = await db.query(
        'SELECT business_id FROM phone_numbers WHERE id = $1', [phoneNumberId]
    );
    const businessId = numResult.rows[0]?.business_id;

    if (businessId) {
        // Insert usage log
        await db.query(
            `INSERT INTO usage_logs (business_id, call_id, minutes_used, cost_total) VALUES ($1, $2, $3, $4)`,
            [businessId, call.id, durationMinutes, cost]
        );

        // Update business minutes_used
        await db.query(
            `UPDATE businesses SET minutes_used = minutes_used + $1 WHERE id = $2`,
            [durationMinutes, businessId]
        );
    }

    return call;
}

module.exports = { processCallEnd, COST_PER_MINUTE };
