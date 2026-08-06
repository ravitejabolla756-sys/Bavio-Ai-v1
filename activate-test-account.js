const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query(
  "UPDATE businesses SET subscription_status='active', subscription_plan='starter', onboarding_step=6 WHERE email='bavio_test_1785952100513@testmail.com' RETURNING email, subscription_status, subscription_plan"
).then(r => {
  console.log('Updated:', JSON.stringify(r.rows));
  pool.end();
}).catch(e => {
  console.error(e.message);
  pool.end();
});
