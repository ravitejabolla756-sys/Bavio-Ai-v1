require('dotenv').config({ path: 'c:/Startup/bavio-backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Finding call_id for bavio voice-test-call-12345 ===");
        const callRes = await pool.query("SELECT id FROM calls WHERE call_sid = 'bavio voice-test-call-12345'");
        if (callRes.rows.length > 0) {
            const callId = callRes.rows[0].id;
            console.log(`Found callId: ${callId}. Deleting usage_logs first...`);
            await pool.query("DELETE FROM usage_logs WHERE call_id = $1", [callId]);
            console.log("Deleting leads...");
            await pool.query("DELETE FROM leads WHERE call_id = $1", [callId]);
            console.log("Deleting transcripts...");
            await pool.query("DELETE FROM transcripts WHERE call_id = $1", [callId]);
            console.log("Deleting calls...");
            await pool.query("DELETE FROM calls WHERE id = $1", [callId]);
            console.log("Cleanup of bavio voice-test-call-12345 complete!");
        } else {
            console.log("No test calls found.");
        }
    } catch (err) {
        console.error("Cleanup error:", err);
    } finally {
        await pool.end();
    }
}

main();
