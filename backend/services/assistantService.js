const db = require('../database/db');
const { DEFAULT_SYSTEM_PROMPT } = require('./voiceOrchestrator');

async function createAssistant({
    business_id,
    name,
    system_prompt,
    language = 'en-US',
    voice_id,
    intelligence_tier = 'core',
    intelligence_mode = 'automatic',
    intelligence_provider = 'automatic',
    intelligence_model = 'automatic',
    stt_provider = 'automatic',
    stt_model = 'automatic',
    tts_provider = 'automatic',
    tts_model = 'automatic',
    model_routing_config = {},
}) {
    const sarvamKey = process.env.SARVAM_API_KEY;
    let sarvamConfig = null;

    if (sarvamKey) {
        sarvamConfig = {
            model: 'sarvam-m',
            voice: 'meera',
            tts_model: 'bulbul:v2',
            stt_model: 'saarika:v2.5',
            language_code: language || 'hi-IN'
        };
    } else {
        sarvamConfig = { mock: true, created_at: new Date().toISOString() };
    }

    const result = await db.query(
        `INSERT INTO assistants (
            business_id, name, system_prompt, sarvam_config, language, voice_id,
            intelligence_tier, intelligence_mode, intelligence_provider, intelligence_model,
            stt_provider, stt_model, tts_provider, tts_model, model_routing_config
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
        RETURNING *`,
        [
            business_id,
            name,
            system_prompt || DEFAULT_SYSTEM_PROMPT,
            JSON.stringify(sarvamConfig),
            language,
            voice_id || null,
            intelligence_tier,
            intelligence_mode,
            intelligence_provider,
            intelligence_model,
            stt_provider,
            stt_model,
            tts_provider,
            tts_model,
            JSON.stringify(model_routing_config || {})
        ]
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
        voice,
        faqs, 
        industry, 
        language,
        is_active,
        intelligence_tier,
        intelligence_mode,
        intelligence_provider,
        intelligence_model,
        stt_provider,
        stt_model,
        tts_provider,
        tts_model,
        model_routing_config,
    } = fields;

    const result = await db.query(
        `UPDATE assistants 
         SET name = COALESCE($1, name),
             system_prompt = COALESCE($2, system_prompt),
             agent_name = COALESCE($3, agent_name),
             greeting = COALESCE($4, greeting),
             voice_id = COALESCE($5, voice_id),
             voice = COALESCE($6, voice),
             faqs = COALESCE($7, faqs),
             industry = COALESCE($8, industry),
             language = COALESCE($9, language),
             is_active = COALESCE($10, is_active),
             intelligence_tier = COALESCE($11, intelligence_tier),
             intelligence_mode = COALESCE($12, intelligence_mode),
             intelligence_provider = COALESCE($13, intelligence_provider),
             intelligence_model = COALESCE($14, intelligence_model),
             stt_provider = COALESCE($15, stt_provider),
             stt_model = COALESCE($16, stt_model),
             tts_provider = COALESCE($17, tts_provider),
             tts_model = COALESCE($18, tts_model),
             model_routing_config = COALESCE($19, model_routing_config),
             updated_at = NOW()
         WHERE id = $20 AND (business_id = $21 OR client_id = $21) RETURNING *`,
        [
            name || null, 
            system_prompt || null, 
            agent_name || null, 
            greeting || null, 
            voice_id || null, 
            voice || null,
            faqs ? JSON.stringify(faqs) : null, 
            industry || null, 
            language || null, 
            is_active !== undefined ? is_active : null,
            intelligence_tier || null,
            intelligence_mode || null,
            intelligence_provider || null,
            intelligence_model || null,
            stt_provider || null,
            stt_model || null,
            tts_provider || null,
            tts_model || null,
            model_routing_config ? JSON.stringify(model_routing_config) : null,
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
