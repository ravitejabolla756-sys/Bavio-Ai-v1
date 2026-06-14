require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Existing Tables ===");
        const tablesResult = await pool.query(
            `SELECT table_name 
             FROM information_schema.tables 
             WHERE table_schema = 'public' 
             ORDER BY table_name`
        );
        tablesResult.rows.forEach(row => console.log("Table:", row.table_name));

        for (const tableName of ['calls', 'businesses', 'users', 'leads', 'phone_numbers']) {
            console.log(`\n=== Columns for ${tableName} ===`);
            try {
                const colsResult = await pool.query(
                    `SELECT column_name, data_type 
                     FROM information_schema.columns 
                     WHERE table_name = $1 
                     ORDER BY ordinal_position`,
                    [tableName]
                );
                colsResult.rows.forEach(row => console.log(`  - ${row.column_name} (${row.data_type})`));
            } catch (tableErr) {
                console.log(`Failed to inspect table ${tableName}: ${tableErr.message}`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
