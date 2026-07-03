require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Columns of phone_numbers ===");
        const cols1 = await pool.query(
            `SELECT column_name, data_type 
             FROM information_schema.columns 
             WHERE table_name = 'phone_numbers' 
             ORDER BY ordinal_position`
        );
        cols1.rows.forEach(row => console.log("  -", row.column_name, "(" + row.data_type + ")"));

        console.log("\n=== Rows of phone_numbers ===");
        const rows1 = await pool.query(`SELECT * FROM phone_numbers`);
        console.log(rows1.rows);

        console.log("\n=== Columns of virtual_numbers ===");
        const cols2 = await pool.query(
            `SELECT column_name, data_type 
             FROM information_schema.columns 
             WHERE table_name = 'virtual_numbers' 
             ORDER BY ordinal_position`
        );
        cols2.rows.forEach(row => console.log("  -", row.column_name, "(" + row.data_type + ")"));

        console.log("\n=== Rows of virtual_numbers ===");
        const rows2 = await pool.query(`SELECT * FROM virtual_numbers`);
        console.log(rows2.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
