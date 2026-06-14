require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== CALLS TABLE SCHEMA ===");
        const schema = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'calls'
        `);
        console.table(schema.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
