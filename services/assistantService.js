const db = require('../database/db');
const axios = require('axios');

async function createAssistant({ client_id, name }) {
    const vapiKey = process.env.VAPI_API_KEY;
    let vapiAssistantId = null;

    if (vapiKey) {
        const vapiRes = await axios.post(
            'https://api.vapi.ai/assistant',
            {
                name,
                voice: { provider: '11labs', voiceId: 'burt' },
                model: {
                    provider: 'openai',
                    model: 'gpt-4',
                    messages: [{ role: 'system', content: `You are a helpful AI Voice Assistant for a business.` }]
                }
            },
            { headers: { Authorization: `Bearer ${vapiKey}`, 'Content-Type': 'application/json' } }
        );
        vapiAssistantId = vapiRes.data.id;
    } else {
        vapiAssistantId = `mock_vapi_${Date.now()}`;
    }

    const result = await db.query(
        `INSERT INTO assistants (client_id, name, vapi_assistant_id) VALUES ($1, $2, $3) RETURNING *`,
        [client_id, name, vapiAssistantId]
    );
    return result.rows[0];
}

async function getAssistantsForClient(client_id) {
    const result = await db.query(
        'SELECT * FROM assistants WHERE client_id = $1 ORDER BY created_at DESC',
        [client_id]
    );
    return result.rows;
}

module.exports = { createAssistant, getAssistantsForClient };
