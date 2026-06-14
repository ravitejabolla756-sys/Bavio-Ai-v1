require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Checking phone numbers ===");
        const res = await pool.query(`
            SELECT id, business_id, client_id, assistant_id, phone_number, number, user_original_number, country_code, provider, type, status
            FROM phone_numbers
            WHERE phone_number = '+918080810001' OR number = '+918080810001'
        `);
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
