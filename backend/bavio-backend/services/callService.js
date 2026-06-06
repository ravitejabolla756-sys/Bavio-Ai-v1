const db = require('../database/db');

async function getCallsForClient(business_id) {
    const result = await db.query(
        `SELECT c.*, pn.number, COALESCE(c.provider, pn.provider) as provider
         FROM calls c
         LEFT JOIN phone_numbers pn ON c.phone_number_id = pn.id
         WHERE c.business_id = $1
         ORDER BY c.created_at DESC`,
        [business_id]
    );
    return result.rows;
}

async function getUsageForClient(business_id) {
    const usageLogs = await db.query(
        `SELECT ul.*, c.caller_number, c.duration, c.status
         FROM usage_logs ul
         JOIN calls c ON ul.call_id = c.id
         WHERE ul.business_id = $1
         ORDER BY ul.created_at DESC`,
        [business_id]
    );

    const summary = await db.query(
        `SELECT b.minutes_used, SUM(ul.cost_total) AS total_cost
         FROM businesses b
         LEFT JOIN usage_logs ul ON ul.business_id = b.id
         WHERE b.id = $1
         GROUP BY b.minutes_used`,
        [business_id]
    );

    return {
        summary: summary.rows[0] || { minutes_used: 0, total_cost: 0 },
        logs: usageLogs.rows
    };
}

module.exports = { getCallsForClient, getUsageForClient };
