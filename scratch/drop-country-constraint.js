require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("Dropping check_country_code and check_currency_code constraints on users table...");
        
        await pool.query("ALTER TABLE users DROP CONSTRAINT IF EXISTS check_country_code;");
        console.log("✅ dropped check_country_code constraint (if existed).");
        
        await pool.query("ALTER TABLE users DROP CONSTRAINT IF EXISTS check_currency_code;");
        console.log("✅ dropped check_currency_code constraint (if existed).");
        
        // Let's verify constraints left on the users table
        const res = await pool.query(
            `SELECT conname 
             FROM pg_constraint 
             WHERE conrelid = 'users'::regclass`
        );
        console.log("\nConstraints left on users table:");
        res.rows.forEach(row => {
            console.log(`- ${row.conname}`);
        });

    } catch (err) {
        console.error("❌ Alter execution failed:", err.message);
    } finally {
        await pool.end();
    }
}

main();
