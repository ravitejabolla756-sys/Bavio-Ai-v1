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
        const sqlPath = path.join(__dirname, '..', 'sql', '014_add_twilio_columns.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running migration 014_add_twilio_columns.sql...');
        await pool.query(sql);
        console.log('✅ Migration 014 completed successfully.');
    } catch (err) {
        console.error('❌ Error running migration 014:', err.message);
    } finally {
        await pool.end();
    }
}

runMigration();
