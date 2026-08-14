const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const r = await pool.query('SELECT id, email FROM businesses WHERE email = $1', ['demo@bavio.ai']);
  console.log('Result:', r.rows);
  await pool.end();
}
run().catch(console.error);
