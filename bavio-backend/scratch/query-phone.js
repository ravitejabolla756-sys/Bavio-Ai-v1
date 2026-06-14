require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Phone Numbers mapping ===");
        const phoneResult = await pool.query(
            'SELECT * FROM phone_numbers WHERE number = $1',
            ['+12526508586']
        );
        console.log("Twilio mapping:", JSON.stringify(phoneResult.rows, null, 2));

        const jioResult = await pool.query(
            'SELECT * FROM phone_numbers WHERE number = $1',
            ['+917013959033']
        );
        console.log("Jio mapping:", JSON.stringify(jioResult.rows, null, 2));

        if (phoneResult.rows.length > 0) {
            const assistantId = phoneResult.rows[0].assistant_id;
            console.log(`Assistant ID for Twilio: ${assistantId}`);
            const assistant = await pool.query(
                'SELECT * FROM assistants WHERE id = $1',
                [assistantId]
            );
            console.log("Assistant Details:", JSON.stringify(assistant.rows[0], null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
