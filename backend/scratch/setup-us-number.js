require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const usBusinessId = 'c395088d-1334-400b-9f4f-69f87024a619'; // ravitejabolla756@gmail.com
        const twilioNumber = '+12526508586';
        const vapiAssistantId = '3620fd61-1b85-41f8-a8ff-f6f2edd4e508';

        console.log("=== Setting up US Phone Number mapping ===");

        // 1. Upsert assistant record in database with the exact Vapi Assistant ID first!
        console.log("Upserting assistant record with Vapi Assistant ID:", vapiAssistantId);
        const assistantCheck = await pool.query('SELECT * FROM assistants WHERE id = $1 OR business_id = $2', [vapiAssistantId, usBusinessId]);
        if (assistantCheck.rows.length > 0) {
            await pool.query(
                `UPDATE assistants 
                 SET id = $1, name = 'Riley', agent_name = 'Riley', is_active = true, language = 'en-US'
                 WHERE id = $2 OR business_id = $3`,
                [vapiAssistantId, assistantCheck.rows[0].id, usBusinessId]
            );
        } else {
            await pool.query(
                `INSERT INTO assistants (id, business_id, client_id, name, agent_name, is_active, language)
                 VALUES ($1, $2, $2, 'Riley', 'Riley', true, 'en-US')`,
                [vapiAssistantId, usBusinessId]
            );
        }

        // 2. Check if the phone number exists in phone_numbers table and update/insert
        const phoneCheck = await pool.query('SELECT * FROM phone_numbers WHERE phone_number = $1', [twilioNumber]);
        if (phoneCheck.rows.length > 0) {
            console.log("Updating existing phone number mapping to business:", usBusinessId);
            await pool.query(
                `UPDATE phone_numbers 
                 SET business_id = $1, client_id = $1, assistant_id = $2, country_code = 'US', provider = 'twilio', type = 'forwarding', status = 'active'
                 WHERE phone_number = $3`,
                [usBusinessId, vapiAssistantId, twilioNumber]
            );
        } else {
            console.log("Inserting new phone number mapping for business:", usBusinessId);
            await pool.query(
                `INSERT INTO phone_numbers (business_id, client_id, assistant_id, phone_number, number, provider, status, type, country_code)
                 VALUES ($1, $1, $2, $3, $3, 'twilio', 'active', 'forwarding', 'US')`,
                [usBusinessId, vapiAssistantId, twilioNumber]
            );
        }

        // 3. Update the businesses table to set twilio_number
        console.log("Updating businesses table twilio_number for US user...");
        await pool.query(
            `UPDATE businesses 
             SET twilio_number = $1, onboarding_status = 'ready', onboarding_step = 4, country_code = 'US'
             WHERE id = $2`,
            [twilioNumber, usBusinessId]
        );

        console.log("=== Verification of current state ===");
        const verifyBiz = await pool.query('SELECT id, name, email, twilio_number, country_code FROM businesses WHERE id = $1', [usBusinessId]);
        console.log("Business:", verifyBiz.rows[0]);

        const verifyPhone = await pool.query('SELECT * FROM phone_numbers WHERE phone_number = $1', [twilioNumber]);
        console.log("Phone number mapping:", verifyPhone.rows[0]);

        const verifyAssistant = await pool.query('SELECT * FROM assistants WHERE id = $1', [vapiAssistantId]);
        console.log("Assistant record:", verifyAssistant.rows[0]);

        console.log("🎉 US Phone Setup complete and verified successfully!");
    } catch (err) {
        console.error("Setup failed:", err);
    } finally {
        await pool.end();
    }
}

main();
