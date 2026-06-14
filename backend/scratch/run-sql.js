require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const sqlPath = path.join(__dirname, '..', 'sql', 'sync_users_trigger.sql');
        console.log("Reading SQL from:", sqlPath);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Running SQL queries against database...");
        await pool.query(sql);
        console.log("✅ SQL executed successfully. Triggers created and existing rows synced!");

        // Verify users count
        const usersCount = await pool.query("SELECT COUNT(*) FROM users");
        console.log(`Verified: Users table now has ${usersCount.rows[0].count} users.`);

    } catch (err) {
        console.error("❌ SQL execution failed:", err.message);
    } finally {
        await pool.end();
    }
}

main();
