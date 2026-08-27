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

      await pool.query(`
        CREATE TABLE IF NOT EXISTS email_verifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) NOT NULL,
            otp_code VARCHAR(10) NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            attempts INTEGER DEFAULT 0,
            consumed BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
      `);
      console.log('✅ email_verifications table initialized/verified.');

      await pool.query(`
        CREATE TABLE IF NOT EXISTS password_resets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL,
            token_hash TEXT NOT NULL,
            consumed BOOLEAN DEFAULT FALSE,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
        CREATE INDEX IF NOT EXISTS idx_password_resets_token_hash ON password_resets(token_hash);
      `);
      console.log('✅ password_resets table initialized/verified.');

      // Run Migration 023: Developer Platform, Multi-Provider & Outbound Campaigns
      try {
        const fs = require('fs');
        const path = require('path');
        const migrationPath = path.join(__dirname, '../sql/023_developer_platform_and_campaigns.sql');
        if (fs.existsSync(migrationPath)) {
          const sql = fs.readFileSync(migrationPath, 'utf8');
          await pool.query(sql);
          console.log('✅ Migration 023 (Developer Platform & Campaigns) initialized/verified.');
        }
      } catch (migErr) {
        console.error('❌ Failed to run migration 023:', migErr.message);
      }

      // Run Migration 024: Secure Hashed Email Verification Schema
      try {
        const fs = require('fs');
        const path = require('path');
        const migration024Path = path.join(__dirname, '../sql/024_hash_email_verifications.sql');
        if (fs.existsSync(migration024Path)) {
          const sql = fs.readFileSync(migration024Path, 'utf8');
          await pool.query(sql);
          console.log('✅ Migration 024 (Hashed Email Verifications) initialized/verified.');
        }
      } catch (migErr) {
        console.error('❌ Failed to run migration 024:', migErr.message);
      }

      // Run Migration 025: Add pending_verification Enum Value to business_status
      try {
        const fs = require('fs');
        const path = require('path');
        const migration025Path = path.join(__dirname, '../sql/025_add_pending_verification_enum.sql');
        if (fs.existsSync(migration025Path)) {
          const sql = fs.readFileSync(migration025Path, 'utf8');
          await pool.query(sql);
          console.log('✅ Migration 025 (pending_verification Enum Value) initialized/verified.');
        }
      } catch (migErr) {
        console.error('❌ Failed to run migration 025:', migErr.message);
      }

      // Run Migration 026: Create password_resets Table for Secure Password Recovery
      try {
        const fs = require('fs');
        const path = require('path');
        const migration026Path = path.join(__dirname, '../sql/026_create_password_reset_tokens.sql');
        if (fs.existsSync(migration026Path)) {
          const sql = fs.readFileSync(migration026Path, 'utf8');
          await pool.query(sql);
          console.log('✅ Migration 026 (password_resets Table) initialized/verified.');
        }
      } catch (migErr) {
        console.error('❌ Failed to run migration 026:', migErr.message);
      }
    } catch (tblErr) {
      console.error('❌ Failed to initialize database tables:', tblErr.message);
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
