const db = require('../database/db');

async function getCallsForClient(business_id) {
    const result = await db.query(
        `SELECT id, user_id, country_code, call_sid, provider, 
                from_number as caller_number, virtual_number, 
                duration_seconds as duration, started_at, ended_at, 
                status as call_status, cost_amount as cost, 
                cost_currency as currency, recording_url, transcript, created_at
         FROM calls
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [business_id]
    );
    return result.rows;
}

async function getUsageForClient(business_id) {
    const usageLogs = await db.query(
        `SELECT ul.*, c.from_number as caller_number, c.duration_seconds as duration, c.status
         FROM usage_logs ul
         JOIN calls c ON ul.call_id = c.id
         WHERE ul.user_id = $1
         ORDER BY ul.created_at DESC`,
        [business_id]
    );

    const summary = await db.query(
        `SELECT b.minutes_used, SUM(ul.cost_total) AS total_cost
         FROM businesses b
         LEFT JOIN usage_logs ul ON ul.user_id = b.id
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
