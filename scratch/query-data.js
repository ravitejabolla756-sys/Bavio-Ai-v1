require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Phone Numbers Table Contents ===");
        const phones = await pool.query("SELECT id, business_id, client_id, phone_number, number, provider, type, country_code FROM phone_numbers LIMIT 20");
        console.table(phones.rows);

        console.log("\n=== Businesses Table Contents ===");
        const businesses = await pool.query("SELECT id, name, email, phone, twilio_number, country_code FROM businesses LIMIT 20");
        console.table(businesses.rows);

        console.log("\n=== Users Table Contents ===");
        const users = await pool.query("SELECT id, email, country_code, business_name FROM users LIMIT 20");
        console.table(users.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
