require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Phone Numbers matching +12526508586 or similar ===");
        const res = await pool.query("SELECT * FROM phone_numbers WHERE number LIKE '%12526508586%' OR phone_number LIKE '%12526508586%'");
        console.table(res.rows);

        console.log("\n=== All Phone Numbers ===");
        const all = await pool.query("SELECT id, business_id, client_id, phone_number, number, provider, type, country_code FROM phone_numbers");
        console.table(all.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
