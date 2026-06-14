require('dotenv').config({ path: 'c:/Startup/bavio-backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const email = "ravitejabolla756@gmail.com";
        const businessName = "Medcare Hospitals";

        console.log(`=== Updating businesses table for ${email} ===`);
        const bResult = await pool.query(
            "UPDATE businesses SET name = $1, full_name = $2 WHERE email = $3 RETURNING id",
            [businessName, businessName, email]
        );
        
        if (bResult.rows.length === 0) {
            console.error(`User with email ${email} not found!`);
            return;
        }
        
        const bId = bResult.rows[0].id;
        console.log(`Updated business ID: ${bId}`);

        console.log(`=== Updating users table for ID: ${bId} ===`);
        const uResult = await pool.query(
            "UPDATE users SET business_name = $1 WHERE id = $2 RETURNING id",
            [businessName, bId]
        );
        console.log(`Updated users row: ${uResult.rows.length} row(s)`);

        console.log(`=== Updating assistants table for business_id: ${bId} ===`);
        const currentAssistant = await pool.query("SELECT system_prompt FROM assistants WHERE business_id = $1", [bId]);
        
        let newPrompt = "You are Medcare Hospitals Agent, an AI voice assistant for Medcare Hospitals.";
        if (currentAssistant.rows.length > 0 && currentAssistant.rows[0].system_prompt) {
            newPrompt = currentAssistant.rows[0].system_prompt
                .replace(/Bavio Agent/g, "Medcare Hospitals Agent")
                .replace(/Riley/g, "Medcare Hospitals Agent");
        }

        const aResult = await pool.query(
            `UPDATE assistants 
             SET name = $1, 
                 agent_name = $2, 
                 system_prompt = $3,
                 first_message = 'Hello! Thank you for calling Medcare Hospitals. How can I help you today?'
             WHERE business_id = $4 RETURNING id`,
            [businessName, businessName, newPrompt, bId]
        );
        console.log(`Updated assistants row: ${aResult.rows.length} row(s)`);

        console.log("\n=== Verifying Updated Data ===");
        const verifyB = await pool.query("SELECT id, name, email FROM businesses WHERE email = $1", [email]);
        console.log("Businesses:", verifyB.rows);
        
        const verifyA = await pool.query("SELECT id, name, agent_name, first_message, system_prompt FROM assistants WHERE business_id = $1", [bId]);
        console.log("Assistants:", verifyA.rows);
        
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
