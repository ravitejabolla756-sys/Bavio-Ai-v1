const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' }); // Load env variables from backend/.env

// Check environment configuration
const dbUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!dbUrl || !supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables! Ensure DATABASE_URL, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function clearDb() {
  console.log('🔄 Connecting to database and auth API...');
  
  try {
    // 1. Delete all users from Supabase Auth
    console.log('🔄 Fetching users from Supabase Auth...');
    const { data, error: fetchError } = await supabase.auth.admin.listUsers({
      perPage: 1000
    });
    
    if (fetchError) {
      throw new Error(`Failed to list users: ${fetchError.message}`);
    }

    const users = data?.users || [];
    console.log(`Found ${users.length} users in Supabase Auth.`);

    for (const user of users) {
      console.log(`🔄 Deleting user ${user.email} (${user.id})...`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`⚠️ Failed to delete ${user.email}:`, deleteError.message);
      } else {
        console.log(`✅ Deleted user ${user.email}`);
      }
    }

    // 2. Truncate PostgreSQL database tables in public schema
    console.log('🔄 Querying list of tables in PostgreSQL public schema...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    const tables = tablesResult.rows.map(r => r.table_name);
    console.log('Tables found:', tables);

    // List of tables we can safely truncate (filtering out migrations or internal tables)
    const tablesToClear = tables.filter(t => t !== 'schema_migrations' && t !== 'spatial_ref_sys');

    if (tablesToClear.length > 0) {
      console.log(`🔄 Truncating tables: ${tablesToClear.join(', ')}...`);
      // Build CASCADE truncate query
      const truncateQuery = `TRUNCATE TABLE ${tablesToClear.map(t => `"${t}"`).join(', ')} CASCADE;`;
      await pool.query(truncateQuery);
      console.log('✅ Successfully truncated all public tables.');
    } else {
      console.log('ℹ️ No public tables to truncate.');
    }

    console.log('\n✨ Database and Auth accounts reset successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await pool.end();
  }
}

clearDb();
