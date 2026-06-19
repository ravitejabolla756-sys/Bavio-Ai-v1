require('dotenv').config({ path: 'c:/Startup/bavio-backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Querying call_logs table ===");
        const res = await pool.query(
            "SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 10"
        );
        console.log(`Found ${res.rows.length} records:`);
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
