require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Checking phone numbers for ravitejabolla756@gmail.com ===");
        const res = await pool.query(`
            SELECT *
            FROM phone_numbers
            WHERE business_id = 'c395088d-1334-400b-9f4f-69f87024a619' OR client_id = 'c395088d-1334-400b-9f4f-69f87024a619'
        `);
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
