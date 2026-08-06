require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const colsResult = await pool.query(
            `SELECT column_name, is_nullable, column_default 
             FROM information_schema.columns 
             WHERE table_name = 'businesses' 
             ORDER BY ordinal_position`
        );
        console.log("=== businesses Table Schema ===");
        colsResult.rows.forEach(row => {
            console.log(`  - ${row.column_name}: Nullable=${row.is_nullable}, Default=${row.column_default}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
