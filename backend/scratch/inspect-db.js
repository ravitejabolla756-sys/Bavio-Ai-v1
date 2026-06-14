require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== LATEST CALLS ===");
        const calls = await pool.query(`SELECT id, virtual_number, from_number, status, created_at, provider FROM calls ORDER BY created_at DESC LIMIT 5`);
        console.table(calls.rows);

        console.log("\n=== LATEST LEADS ===");
        const leads = await pool.query(`SELECT id, phone, name, intent, status, created_at FROM leads ORDER BY created_at DESC LIMIT 5`);
        console.table(leads.rows);

        console.log("\n=== LATEST USAGE LOGS ===");
        const logs = await pool.query(`SELECT id, call_id, minutes_used, cost_total, created_at FROM usage_logs ORDER BY created_at DESC LIMIT 5`);
        console.table(logs.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
