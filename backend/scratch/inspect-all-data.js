require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Users ===");
        const users = await pool.query('SELECT id, email, country_code FROM users LIMIT 10');
        console.log(users.rows);

        console.log("=== Businesses ===");
        const businesses = await pool.query('SELECT id, name, email, country_code FROM businesses LIMIT 10');
        console.log(businesses.rows);

        console.log("=== Phone Numbers ===");
        const phoneNumbers = await pool.query('SELECT id, business_id, client_id, assistant_id, phone_number, number, country_code FROM phone_numbers LIMIT 10');
        console.log(phoneNumbers.rows);

        console.log("=== Assistants ===");
        const assistants = await pool.query('SELECT id, name, business_id FROM assistants LIMIT 10');
        console.log(assistants.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
