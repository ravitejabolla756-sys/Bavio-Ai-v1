const assistantService = require('../services/assistantService');

async function createAssistant(req, res) {
    try {
        const { client_id, name } = req.body;
        if (!client_id || !name) return res.status(400).json({ error: 'client_id and name are required' });
        const assistant = await assistantService.createAssistant({ client_id, name });
        res.status(201).json(assistant);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getAssistants(req, res) {
    try {
        const assistants = await assistantService.getAssistantsForClient(req.params.client_id);
        res.status(200).json(assistants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { createAssistant, getAssistants };
