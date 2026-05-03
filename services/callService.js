const db = require('../database/db');

async function getCallsForClient(client_id) {
    const result = await db.query(
        `SELECT c.*, pn.phone_number, pn.provider
         FROM calls c
         JOIN phone_numbers pn ON c.phone_number_id = pn.id
         WHERE pn.client_id = $1
         ORDER BY c.created_at DESC`,
        [client_id]
    );
    return result.rows;
}

async function getUsageForClient(client_id) {
    const usageLogs = await db.query(
        `SELECT ul.*, c.caller_number, c.duration, c.call_status
         FROM usage_logs ul
         JOIN calls c ON ul.call_id = c.id
         WHERE ul.client_id = $1
         ORDER BY ul.created_at DESC`,
        [client_id]
    );

    const summary = await db.query(
        `SELECT usage_minutes, SUM(ul.cost) AS total_cost
         FROM businesses b
         LEFT JOIN usage_logs ul ON ul.client_id = b.id
         WHERE b.id = $1
         GROUP BY b.usage_minutes`,
        [client_id]
    );

    return {
        summary: summary.rows[0] || { usage_minutes: 0, total_cost: 0 },
        logs: usageLogs.rows
    };
}

module.exports = { getCallsForClient, getUsageForClient };
