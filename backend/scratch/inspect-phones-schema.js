require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== PHONE NUMBERS TABLE SCHEMA ===");
        const schema = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'phone_numbers'
        `);
        console.table(schema.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
