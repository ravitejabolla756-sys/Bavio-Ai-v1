require('dotenv').config({ path: 'c:/Startup/bavio-backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Querying ravitejabolla756@gmail.com from businesses ===");
        const bResult = await pool.query(
            "SELECT id, name, email, onboarding_step, onboarding_status, country_code, status FROM businesses WHERE email = $1",
            ["ravitejabolla756@gmail.com"]
        );
        console.log(JSON.stringify(bResult.rows, null, 2));

        if (bResult.rows.length > 0) {
            const bId = bResult.rows[0].id;
            console.log("\n=== Querying users table ===");
            const uResult = await pool.query("SELECT * FROM users WHERE id = $1", [bId]);
            console.log(JSON.stringify(uResult.rows, null, 2));

            console.log("\n=== Querying assistants table ===");
            const aResult = await pool.query("SELECT * FROM assistants WHERE business_id = $1", [bId]);
            console.log(JSON.stringify(aResult.rows, null, 2));

            console.log("\n=== Querying phone_numbers table ===");
            const pResult = await pool.query("SELECT * FROM phone_numbers WHERE business_id = $1", [bId]);
            console.log(JSON.stringify(pResult.rows, null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
