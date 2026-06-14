require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Businesses without corresponding User ===");
        const res = await pool.query(`
            SELECT b.id, b.name, b.email 
            FROM businesses b
            LEFT JOIN users u ON b.id = u.id
            WHERE u.id IS NULL
        `);
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
