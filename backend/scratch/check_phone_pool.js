require('dotenv').config();
const db = require('../database/db');

async function run() {
    try {
        console.log('=== Pool Numbers in DB ===');
        const res = await db.query(
            `SELECT id, phone_number, type, status, pool_user_count, max_users, provider 
             FROM phone_numbers 
             WHERE type = 'pool' OR type = 'dedicated'
             ORDER BY type, pool_user_count`
        );
        console.table(res.rows);

        console.log('\n=== Pool Assignments ===');
        const assignments = await db.query(
            `SELECT pa.business_id, pa.forwarding_status, pn.phone_number, pa.user_original_number
             FROM pool_assignments pa
             JOIN phone_numbers pn ON pn.id = pa.pool_number_id
             LIMIT 10`
        );
        console.table(assignments.rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

run();
