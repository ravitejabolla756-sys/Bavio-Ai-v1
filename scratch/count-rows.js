require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const tablesResult = await pool.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        );
        console.log("=== Row Counts ===");
        for (const row of tablesResult.rows) {
            const tableName = row.table_name;
            const countRes = await pool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
            const count = countRes.rows[0].count;
            if (parseInt(count) > 0) {
                console.log(`- ${tableName}: ${count} rows`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
