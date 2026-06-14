require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Checking users & businesses match ===");
        const res = await pool.query(`
            SELECT u.id as user_id, u.email as user_email, b.id as business_id, b.email as business_email, b.name as business_name
            FROM users u
            LEFT JOIN businesses b ON u.id = b.id OR u.email = b.email
            WHERE u.email IN ('ravitejabolla76@gmail.com', 'ravitejabolla756@gmail.com')
        `);
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
