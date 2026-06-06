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
