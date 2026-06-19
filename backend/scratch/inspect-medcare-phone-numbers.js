require('dotenv').config({ path: 'c:/Startup/bavio-backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Querying phone numbers for Medcare Hospitals business ===");
        const res1 = await pool.query(
            "SELECT * FROM phone_numbers WHERE business_id = $1",
            ['c395088d-1334-400b-9f4f-69f87024a619']
        );
        console.log(JSON.stringify(res1.rows, null, 2));

        console.log("\n=== Querying phone numbers matching +12526508586 ===");
        const res2 = await pool.query(
            "SELECT * FROM phone_numbers WHERE phone_number = $1 OR number = $1 OR user_original_number = $1",
            ['+12526508586']
        );
        console.log(JSON.stringify(res2.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
