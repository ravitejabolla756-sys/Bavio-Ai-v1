require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const sqlPath = path.join(__dirname, '../sql/013_simplify_tables.sql');
    console.log('Reading migration file from:', sqlPath);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running migration on database...');
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();
