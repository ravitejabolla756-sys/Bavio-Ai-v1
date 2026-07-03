require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const rows = await pool.query(`SELECT id, phone_number, number, provider, status, type, business_id, pool_user_count FROM phone_numbers`);
        console.log("=== All Phone Numbers ===");
        console.log(rows.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
