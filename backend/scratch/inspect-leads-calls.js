require('dotenv').config({ path: 'c:/Startup/bavio-backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const businessId = 'c395088d-1334-400b-9f4f-69f87024a619';
    try {
        console.log("=== Querying all calls for Medcare Hospitals (business_id) ===");
        const callsRes = await pool.query(
            "SELECT id, call_sid, provider, from_number, virtual_number, duration_seconds, status, created_at FROM calls WHERE user_id = $1 ORDER BY created_at DESC",
            [businessId]
        );
        console.log(`Found ${callsRes.rows.length} calls:`);
        console.log(JSON.stringify(callsRes.rows, null, 2));

        console.log("\n=== Querying all leads for Medcare Hospitals (business_id) ===");
        const leadsRes = await pool.query(
            "SELECT id, call_id, phone, name, intent, budget, location, status, created_at FROM leads WHERE business_id = $1 ORDER BY created_at DESC",
            [businessId]
        );
        console.log(`Found ${leadsRes.rows.length} leads:`);
        console.log(JSON.stringify(leadsRes.rows, null, 2));

        console.log("\n=== Querying all transcripts for Medcare Hospitals (business_id) ===");
        const transRes = await pool.query(
            "SELECT id, call_id, transcript, summary, created_at FROM transcripts WHERE business_id = $1 ORDER BY created_at DESC",
            [businessId]
        );
        console.log(`Found ${transRes.rows.length} transcripts:`);
        console.log(JSON.stringify(transRes.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
