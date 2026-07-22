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
  .then(async res => {
    console.log('✅ Database connection test successful on import. Server time:', res.rows[0].now);
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS demo_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            demo_started_at TIMESTAMPTZ,
            demo_ended_at TIMESTAMPTZ,
            demo_duration_seconds INTEGER,
            demo_status VARCHAR(20) DEFAULT 'eligible',
            demo_used BOOLEAN DEFAULT false,
            termination_reason TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('✅ demo_sessions table initialized/verified.');
    } catch (tblErr) {
      console.error('❌ Failed to initialize demo_sessions table:', tblErr.message);
    }
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
