require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const tablesToDelete = [
    // Dependents first
    'transcripts',
    'call_sessions',
    'call_logs',
    'call_routing',
    'usage_logs',
    'daily_metrics',
    'calls_ae',
    'calls_au',
    'calls_default',
    'calls_gb',
    'calls_in',
    'calls_us',
    'calls',
    'leads',
    'pool_assignments',
    'subscription_intents',
    'subscriptions',
    'assistants',
    'business_phone_mapping',
    'business_integrations',
    'api_keys',
    'api_integrations',
    'system_alerts',
    'caller_whitelist',
    'businesses',
    'users'
];

async function main() {
    console.log("Starting database reset...");
    
    // Disable triggers if possible (run as separate query, might fail if not superuser, but worth a try)
    try {
        await pool.query("SET session_replication_role = 'replica'");
        console.log("  - Disables triggers temporarily (session_replication_role = replica)");
    } catch (e) {
        console.warn("  - Note: could not set session_replication_role to replica (expected for non-superuser):", e.message);
    }

    console.log("1. Deleting all user data from tables...");
    for (const table of tablesToDelete) {
        try {
            const res = await pool.query(`DELETE FROM "${table}"`);
            console.log(`  - Deleted from ${table}: ${res.rowCount} rows`);
        } catch (err) {
            console.warn(`  ⚠️ Could not delete from ${table}:`, err.message);
        }
    }

    // Re-enable triggers
    try {
        await pool.query("SET session_replication_role = 'origin'");
        console.log("  - Restored triggers (session_replication_role = origin)");
    } catch (e) {
        // Ignore
    }

    console.log("\n2. Cleaning and resetting phone_numbers table...");
    try {
        await pool.query('DELETE FROM phone_numbers');
        console.log("  - Cleared phone_numbers table");

        // Insert the 3 specified Twilio pool numbers
        const testNumbers = [
            '+18259573326',
            '+12526508586',
            '+15722360133'
        ];

        for (const num of testNumbers) {
            await pool.query(`
                INSERT INTO phone_numbers (
                    phone_number, 
                    number, 
                    provider, 
                    status, 
                    type, 
                    pool_user_count, 
                    max_users, 
                    country_code, 
                    is_active
                ) VALUES ($1, $1, 'twilio', 'active', 'pool', 0, 50, 'US', true)
            `, [num]);
            console.log(`  - Inserted pool number: ${num}`);
        }
    } catch (err) {
        console.error("  ❌ Failed to reset phone_numbers:", err.message);
    }

    console.log("\n✅ Database Reset script completed!");
    await pool.end();
}

main();
