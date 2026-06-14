require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== PHONE NUMBERS ===");
        const phones = await pool.query(`SELECT id, business_id, phone_number, number, provider FROM phone_numbers LIMIT 10`);
        console.table(phones.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
