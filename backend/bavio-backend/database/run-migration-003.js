require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false } // SSL enabled for Supabase database host
});

async function runMigration() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migrations', '003_create_integrations.sql'), 'utf8');
        console.log('Running migration 003_create_integrations.sql...');
        await pool.query(sql);
        console.log('✅ Migration 003 completed successfully.');
    } catch (err) {
        console.error('❌ Error running migration 003:', err.message);
    } finally {
        await pool.end();
    }
}

runMigration();
