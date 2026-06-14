/*
TASK: Location-Based Dynamic Pricing

FILE: /app/pricing/PricingDisplay.js

REAL DATA (Research-Backed Pricing):

INDIA (INR):
├─ Starter: ₹1,999/month
├─ Growth: ₹3,999/month (MOST POPULAR)
└─ Scale: ₹7,999/month

USA/CANADA (USD):
├─ Starter: $39/month (NOT $29 - margin needs it)
├─ Growth: $79/month
└─ Scale: $149/month

UK (GBP):
├─ Starter: £29/month
├─ Growth: £59/month
└─ Scale: £99/month

AUSTRALIA (AUD):
├─ Starter: AUD 49/month
├─ Growth: AUD 99/month
└─ Scale: AUD 199/month

UAE (AED):
├─ Starter: AED 149/month
├─ Growth: AED 299/month
└─ Scale: AED 499/month

IMPLEMENTATION PROMPT:

"Build a dynamic pricing component for a multi-country SaaS platform.

Requirements:
1. Fetch user's country from global context
2. Display 3 pricing tiers with correct currency
3. Show monthly/yearly toggle (yearly = 20% discount)
4. Show country-specific badges (e.g., 'Most popular in India')
5. Each tier shows: price, features list, CTA button

Pricing data structure:
const PRICING_BY_COUNTRY = {
  IN: { currency: '₹', starter: 1999, growth: 3999, scale: 7999 },
  US: { currency: '$', starter: 39, growth: 79, scale: 149 },
  GB: { currency: '£', starter: 29, growth: 59, scale: 99 },
  AU: { currency: 'AUD', starter: 49, growth: 99, scale: 199 },
  AE: { currency: 'AED', starter: 149, growth: 299, scale: 499 },
  DEFAULT: { currency: '$', starter: 39, growth: 79, scale: 149 }
};

Create:
1. PricingCard component (single tier)
2. PricingGrid component (all tiers)
3. CurrencyConverter utility (for display only)
4. Annual billing toggle logic
5. Feature comparison table per country

Use React hooks, memoization for performance."

CODE LOCATION: /src/components/pricing/PricingDisplay.tsx
CONFIG FILE: /src/config/pricing.ts
TEST FILE: /src/components/pricing/__tests__/PricingDisplay.test.tsx
*/
require('dotenv').config();
const { Pool } = require('pg');

// Create pool with SSL enabled for Supabase
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const db = { query: (text, params) => pool.query(text, params) };

// Debug: Show if DATABASE_URL is set (masked)
const dbUrl = process.env.DATABASE_URL || '';
if (dbUrl) {
    const masked = dbUrl.replace(/:[^:@]+@/, ':****@');
    console.log('DATABASE_URL:', masked);
} else {
    console.log('DATABASE_URL: NOT SET');
}

console.log('\nEnvironment loaded. Checking if we can connect to database...\n');

// Try a simple test query
async function testDB() {
    try {
        const result = await db.query('SELECT NOW() as server_time');
        console.log('✅ Connected! Server time:', result.rows[0].server_time);
        
        // List all tables
        const tablesResult = await db.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        );
        console.log("\n📋 Tables in database:");
        tablesResult.rows.forEach(row => console.log("  -", row.table_name));
        
        // Check businesses table columns
        console.log("\n👥 Businesses table columns:");
        const columnsResult = await db.query(
            `SELECT column_name, data_type 
             FROM information_schema.columns 
             WHERE table_name = 'businesses' 
             ORDER BY ordinal_position`
        );
        columnsResult.rows.forEach(row => console.log("  -", row.column_name, "(" + row.data_type + ")"));

        // Check payment_logs table columns
        console.log("\n💳 Payment logs table columns:");
        const payColsResult = await db.query(
            `SELECT column_name, data_type 
             FROM information_schema.columns 
             WHERE table_name = 'payment_logs' 
             ORDER BY ordinal_position`
        );
        payColsResult.rows.forEach(row => console.log("  -", row.column_name, "(" + row.data_type + ")"));
        
        // Check if onboarding columns exist
        const onboardingCols = ['whatsapp_number', 'working_hours_from', 'twilio_number', 'onboarding_status'];
        const existingCols = columnsResult.rows.map(r => r.column_name);
        const missingCols = onboardingCols.filter(col => !existingCols.includes(col));
        
        if (missingCols.length > 0) {
            console.log("\n⚠️  Missing onboarding columns:", missingCols.join(', '));
            console.log("📌 Run the migration: database/migrations/001_add_onboarding_fields.sql");
        } else {
            console.log("\n✅ All onboarding columns already exist!");
        }
        
    } catch (error) {
        console.error("❌ Database query failed:");
        console.error(error.message);
    } finally {
        process.exit(0);
    }
}

testDB();
