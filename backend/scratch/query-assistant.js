require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        console.log("=== Fetching Assistant 4ed00909-1c3b-415a-8c76-5521ccdecddf ===");
        const result = await pool.query('SELECT * FROM assistants WHERE id = $1', ['4ed00909-1c3b-415a-8c76-5521ccdecddf']);
        console.log("Assistant Row:", JSON.stringify(result.rows[0], null, 2));

        console.log("\n=== Fetching all assistants ===");
        const allAssistants = await pool.query('SELECT id, name, industry, language, system_prompt, first_message FROM assistants');
        console.log("All Assistants:", JSON.stringify(allAssistants.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
