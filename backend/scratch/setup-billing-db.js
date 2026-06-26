require('dotenv').config();
const db = require('../database/db');

async function main() {
  try {
    console.log('Running database setup for billing...');
    
    // Add billing_cycle column to businesses table if not exists
    await db.query(
      `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(50);`
    );
    console.log('✅ billing_cycle column verified/added to businesses table.');

    // Create subscription_intents table if not exists
    await db.query(
      `CREATE TABLE IF NOT EXISTS subscription_intents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
        plan VARCHAR(50) NOT NULL,
        billing_cycle VARCHAR(50) NOT NULL,
        dodo_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    );
    console.log('✅ subscription_intents table verified/created.');
    
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
  } finally {
    await db.pool.end();
  }
}

main();
