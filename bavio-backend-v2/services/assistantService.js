const db = require('../database/db');
const { DEFAULT_SYSTEM_PROMPT } = require('./voiceOrchestrator');

async function createAssistant({ business_id, name, system_prompt }) {
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
        `INSERT INTO assistants (business_id, name, system_prompt, sarvam_config) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [business_id, name, system_prompt || DEFAULT_SYSTEM_PROMPT, JSON.stringify(sarvamConfig)]
    );
    return result.rows[0];
}

async function updateAssistant(id, business_id, fields) {
    const { 
        name, 
        system_prompt, 
        agent_name, 
        greeting, 
        voice_id, 
        faqs, 
        industry, 
        language,
        is_active
    } = fields;

    const result = await db.query(
        `UPDATE assistants 
         SET name = COALESCE($1, name),
             system_prompt = COALESCE($2, system_prompt),
             agent_name = COALESCE($3, agent_name),
             greeting = COALESCE($4, greeting),
             voice_id = COALESCE($5, voice_id),
             faqs = COALESCE($6, faqs),
             industry = COALESCE($7, industry),
             language = COALESCE($8, language),
             is_active = COALESCE($9, is_active),
             updated_at = NOW()
         WHERE id = $10 AND business_id = $11 RETURNING *`,
        [
            name || null, 
            system_prompt || null, 
            agent_name || null, 
            greeting || null, 
            voice_id || null, 
            faqs ? JSON.stringify(faqs) : null, 
            industry || null, 
            language || null, 
            is_active !== undefined ? is_active : null,
            id,
            business_id
        ]
    );
    
    if (result.rows.length === 0) {
        throw new Error('Assistant not found or unauthorized');
    }
    
    return result.rows[0];
}

async function getAssistantsForClient(business_id) {
    const result = await db.query(
        'SELECT * FROM assistants WHERE business_id = $1 ORDER BY created_at DESC',
        [business_id]
    );
    return result.rows;
}

async function getAssistantConfig(business_id) {
    const result = await db.query(
        `SELECT a.*, c.system_prompt as client_system_prompt, c.plan, c.minutes_limit, c.minutes_used
         FROM assistants a 
         JOIN businesses c ON a.business_id = c.id 
         WHERE a.business_id = $1 
         LIMIT 1`,
        [business_id]
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
