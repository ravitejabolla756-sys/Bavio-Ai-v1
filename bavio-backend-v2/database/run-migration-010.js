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
        const sqlPath = path.join(__dirname, '..', 'sql', '010_bavio_telephony_multi_tenant.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Running migration 010_bavio_telephony_multi_tenant.sql...');
        await pool.query(sql);
        console.log('✅ Migration 010 completed successfully.');
    } catch (err) {
        console.error('❌ Error running migration 010:', err.message);
    } finally {
        await pool.end();
    }
}

runMigration();
