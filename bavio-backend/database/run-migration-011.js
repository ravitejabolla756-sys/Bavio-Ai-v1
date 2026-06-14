require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, '..', 'sql', '011_add_country_code.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running migration 011_add_country_code.sql...');
        await pool.query(sql);
        console.log('✅ Migration 011 completed successfully.');
    } catch (err) {
        console.error('❌ Error running migration 011:', err.message);
    } finally {
        await pool.end();
    }
}

runMigration();
