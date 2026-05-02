const assistantService = require('../services/assistantService');
const voiceOrchestrator = require('../services/voiceOrchestrator');

async function createAssistant(req, res) {
    try {
        const { client_id, name, system_prompt } = req.body;
        if (!client_id || !name) return res.status(400).json({ error: 'client_id and name are required' });
        
        const assistant = await assistantService.createAssistant({ 
            client_id, 
            name, 
            system_prompt: system_prompt || voiceOrchestrator.DEFAULT_SYSTEM_PROMPT 
        });
        res.status(201).json(assistant);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function updateAssistant(req, res) {
    try {
        const { id } = req.params;
        const { name, system_prompt } = req.body;
        
        const assistant = await assistantService.updateAssistant(id, { name, system_prompt });
        res.status(200).json(assistant);
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

async function getAssistantConfig(req, res) {
    try {
        const { client_id } = req.params;
        const config = await assistantService.getAssistantConfig(client_id);
        res.status(200).json(config);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { createAssistant, updateAssistant, getAssistants, getAssistantConfig };
