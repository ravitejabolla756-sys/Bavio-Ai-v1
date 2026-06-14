const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// 1. PostgreSQL pool setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

pool.on('connect', () => {
    console.log('Connected to Supabase PostgreSQL');
});

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
});

// 2. Supabase Client setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables! Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// 3. Connection test on import
pool.query('SELECT NOW()')
  .then(res => {
    console.log('✅ Database connection test successful on import. Server time:', res.rows[0].now);
  })
  .catch(err => {
    console.error('❌ Database connection test failed on import:', err.message);
  });

const createAuthClient = () => {
  return createClient(supabaseUrl || '', supabaseServiceKey || '', {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
    supabase,
    createAuthClient
};
