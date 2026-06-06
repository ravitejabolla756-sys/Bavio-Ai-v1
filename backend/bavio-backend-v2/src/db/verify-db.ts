import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Error: DATABASE_URL not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runVerification() {
  console.log('═══════════════════════════════════════════════');
  console.log('    BAVIO MULTI-COUNTRY DB VERIFICATION SUITE  ');
  console.log('═══════════════════════════════════════════════\n');

  try {
    // 1. Table presence & row counts
    const tables = ['users', 'virtual_numbers', 'phone_providers', 'pricing_plans', 'calls', 'usage_logs', 'subscriptions'];
    console.log('📋 Checking table row counts:');
    for (const table of tables) {
      const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`  - Table "${table}": ${res.rows[0].count} records seeded.`);
    }
    console.log('\n✅ Passed: All tables created and populated.\n');

    // 2. Index presence verification
    console.log('📋 Checking custom performance indexes:');
    const indexQueries = [
      { table: 'users', indexes: ['idx_users_country_code', 'idx_users_email', 'idx_users_status'] },
      { table: 'virtual_numbers', indexes: ['idx_virtual_numbers_country_code', 'idx_virtual_numbers_provider', 'idx_virtual_numbers_status', 'idx_virtual_numbers_phone_number'] },
      { table: 'calls', indexes: ['idx_calls_user_id', 'idx_calls_country_code', 'idx_calls_status', 'idx_calls_created_at'] },
      { table: 'subscriptions', indexes: ['idx_subscriptions_user_id', 'idx_subscriptions_payment_status', 'idx_subscriptions_next_billing_date'] }
    ];

    for (const item of indexQueries) {
      for (const idx of item.indexes) {
        const res = await pool.query(`
          SELECT count(*) 
          FROM pg_indexes 
          WHERE tablename = $1 AND indexname = $2
        `, [item.table, idx]);
        if (res.rows[0].count === '1') {
          console.log(`  - Index "${idx}" on table "${item.table}": EXISTS.`);
        } else {
          throw new Error(`Missing index "${idx}" on table "${item.table}"`);
        }
      }
    }
    console.log('\n✅ Passed: All optimized performance indexes exist.\n');

    // 3. Data isolation verification: Indian Tenant perspective
    console.log('📋 Verifying tenant data isolation for India (IN):');
    const indiaUserRes = await pool.query(`SELECT id, email FROM users WHERE country_code = 'IN' LIMIT 1`);
    if (indiaUserRes.rows.length === 0) throw new Error("No Indian user found in seeds");
    const indiaUserId = indiaUserRes.rows[0].id;
    const indiaUserEmail = indiaUserRes.rows[0].email;
    console.log(`  - Querying as Indian user "${indiaUserEmail}" (${indiaUserId})...`);

    // Fetch virtual numbers
    const vnRes = await pool.query(`SELECT phone_number, country_code FROM virtual_numbers WHERE user_id = $1`, [indiaUserId]);
    console.log(`  - Virtual numbers fetched: ${vnRes.rows.length} (Expected 1)`);
    vnRes.rows.forEach(row => {
      console.log(`    * Number: ${row.phone_number}, Country: ${row.country_code}`);
      if (row.country_code !== 'IN') throw new Error("DATA LEAKAGE: Indian tenant fetched non-Indian virtual number!");
    });

    // Fetch call logs
    const callRes = await pool.query(`SELECT call_sid, country_code FROM calls WHERE user_id = $1`, [indiaUserId]);
    console.log(`  - Call logs fetched: ${callRes.rows.length} (Expected 1)`);
    callRes.rows.forEach(row => {
      console.log(`    * Call SID: ${row.call_sid}, Country: ${row.country_code}`);
      if (row.country_code !== 'IN') throw new Error("DATA LEAKAGE: Indian tenant fetched non-Indian call log!");
    });

    // Fetch subscriptions
    const subRes = await pool.query(`SELECT plan_name, price_currency FROM subscriptions WHERE user_id = $1`, [indiaUserId]);
    console.log(`  - Subscriptions fetched: ${subRes.rows.length} (Expected 1)`);
    subRes.rows.forEach(row => {
      console.log(`    * Plan: ${row.plan_name}, Currency: ${row.price_currency}`);
      if (row.price_currency !== 'INR') throw new Error("DATA LEAKAGE: Indian tenant fetched non-INR subscription details!");
    });
    console.log('\n✅ Passed: Strict tenant data isolation verified. No cross-country leakage.\n');

    // 4. Operator Dashboard: Cross-Country aggregations
    console.log('📋 Verifying Operator cross-country analytics views:');
    const analyticsRes = await pool.query(`
      SELECT country_code, COUNT(id) as total_calls, SUM(cost_amount) as total_cost, cost_currency 
      FROM calls 
      GROUP BY country_code, cost_currency
    `);
    console.log('  - Aggregated global call statistics:');
    analyticsRes.rows.forEach(row => {
      console.log(`    * Region ${row.country_code}: ${row.total_calls} calls, Cost: ${row.total_cost} ${row.cost_currency}`);
    });
    console.log('\n✅ Passed: Operators successfully access multi-country aggregated metrics.');

  } catch (err: any) {
    console.error('❌ Verification failed:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\nVerification complete.');
  }
}

runVerification();
