const db = require('../database/db');
const providerFactory = require('../providers/index');

const COST_PER_MINUTE = 0.05; // $0.05 per minute

async function processCallEnd({ providerCallId, phoneNumberId, callerNumber, durationSeconds, provider }) {
    const durationMinutes = Math.ceil(durationSeconds / 60);
    const cost = parseFloat((durationMinutes * COST_PER_MINUTE).toFixed(4));

    // Insert call record
    const callResult = await db.query(
        `INSERT INTO calls (phone_number_id, provider_call_id, caller_number, call_status, duration, cost)
         VALUES ($1, $2, $3, 'completed', $4, $5) RETURNING *`,
        [phoneNumberId, providerCallId, callerNumber, durationSeconds, cost]
    );
    const call = callResult.rows[0];

    // Get client_id from phone_numbers
    const numResult = await db.query(
        'SELECT client_id FROM phone_numbers WHERE id = $1', [phoneNumberId]
    );
    const clientId = numResult.rows[0]?.client_id;

    if (clientId) {
        // Insert usage log
        await db.query(
            `INSERT INTO usage_logs (client_id, call_id, minutes_used, cost) VALUES ($1, $2, $3, $4)`,
            [clientId, call.id, durationMinutes, cost]
        );

        // Update client usage_minutes
        await db.query(
            `UPDATE clients SET usage_minutes = usage_minutes + $1 WHERE id = $2`,
            [durationMinutes, clientId]
        );
    }

    return call;
}

module.exports = { processCallEnd, COST_PER_MINUTE };
