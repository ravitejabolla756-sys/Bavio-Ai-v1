require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const result = await pool.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`
        );
        console.log("Database Tables:");
        result.rows.forEach(row => console.log(" -", row.table_name));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
