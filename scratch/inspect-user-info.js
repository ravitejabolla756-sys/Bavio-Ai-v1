require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Checking businesses ===");
        const res = await pool.query(`
            SELECT id, name, email, phone, twilio_number, country_code, onboarding_status, onboarding_step
            FROM businesses
            WHERE email = 'ravitejabolla756@gmail.com'
        `);
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
