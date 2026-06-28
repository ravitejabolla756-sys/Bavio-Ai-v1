require('dotenv').config({ path: 'c:/Startup/bavio-backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Querying all leads in public.leads ===");
        const leadsRes = await pool.query(
            "SELECT id, business_id, call_id, phone, name, intent, budget, location, notes, status, created_at FROM leads ORDER BY created_at DESC"
        );
        console.log(`Total Leads: ${leadsRes.rows.length}`);
        console.log(JSON.stringify(leadsRes.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
