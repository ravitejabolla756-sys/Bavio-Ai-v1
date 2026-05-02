const db = require('../database/db');
const { DEFAULT_SYSTEM_PROMPT } = require('./voiceOrchestrator');

async function createAssistant({ client_id, name, system_prompt }) {
    const sarvamKey = process.env.SARVAM_API_KEY;
    let sarvamConfig = null;

    // Sarvam doesn't require creating an assistant entity
    // We just store the configuration locally
    if (sarvamKey) {
        sarvamConfig = {
            model: 'sarvam-m',
            voice: 'meera',
            tts_model: 'bulbul:v2',
            stt_model: 'saarika:v2.5',
            language_code: 'hi-IN'
        };
    } else {
        sarvamConfig = { mock: true, created_at: new Date().toISOString() };
    }

    const result = await db.query(
        `INSERT INTO assistants (client_id, name, system_prompt, sarvam_config) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [client_id, name, system_prompt || DEFAULT_SYSTEM_PROMPT, JSON.stringify(sarvamConfig)]
    );
    return result.rows[0];
}

async function updateAssistant(id, { name, system_prompt }) {
    const result = await db.query(
        `UPDATE assistants 
         SET name = COALESCE($1, name),
             system_prompt = COALESCE($2, system_prompt)
         WHERE id = $3 RETURNING *`,
        [name, system_prompt, id]
    );
    
    if (result.rows.length === 0) {
        throw new Error('Assistant not found');
    }
    
    return result.rows[0];
}

async function getAssistantsForClient(client_id) {
    const result = await db.query(
        'SELECT * FROM assistants WHERE client_id = $1 ORDER BY created_at DESC',
        [client_id]
    );
    return result.rows;
}

async function getAssistantConfig(client_id) {
    const result = await db.query(
        `SELECT a.*, c.system_prompt as client_system_prompt, c.plan, c.minutes_limit, c.minutes_used
         FROM assistants a 
         JOIN clients c ON a.client_id = c.id 
         WHERE a.client_id = $1 
         LIMIT 1`,
        [client_id]
    );
    
    if (result.rows.length === 0) {
        // Return default config if no assistant exists
        return {
            system_prompt: DEFAULT_SYSTEM_PROMPT,
            sarvam_config: {
                model: 'sarvam-m',
                voice: 'meera',
                tts_model: 'bulbul:v2',
                stt_model: 'saarika:v2.5',
                language_code: 'hi-IN'
            },
            is_default: true
        };
    }
    
    return result.rows[0];
}

module.exports = { createAssistant, updateAssistant, getAssistantsForClient, getAssistantConfig };
