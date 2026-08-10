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

      await pool.query(`
        CREATE TABLE IF NOT EXISTS public_demo_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            payment_id VARCHAR(100) UNIQUE,
            product_id VARCHAR(100),
            industry VARCHAR(50),
            language VARCHAR(50),
            twilio_number VARCHAR(30),
            agent_profile VARCHAR(50),
            status VARCHAR(30) DEFAULT 'pending_payment',
            started_at TIMESTAMPTZ,
            expires_at TIMESTAMPTZ,
            duration_limit INTEGER DEFAULT 180,
            call_sid VARCHAR(100),
            phone_number VARCHAR(30),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            user_id UUID
        );
      `);
      console.log('✅ public_demo_sessions table initialized/verified.');

      // Drop country and currency check constraints from the users table to support all countries worldwide
      try {
        await pool.query(`
          ALTER TABLE users DROP CONSTRAINT IF EXISTS check_country_code;
          ALTER TABLE users DROP CONSTRAINT IF EXISTS check_currency_code;
        `);
        console.log('✅ Global country/currency constraints verified/dropped.');
      } catch (constErr) {
        console.warn('⚠️ Non-critical: Failed to drop users country constraints:', constErr.message);
      }
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
