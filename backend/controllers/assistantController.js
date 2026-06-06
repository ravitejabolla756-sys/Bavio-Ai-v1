const assistantService = require('../services/assistantService');
const voiceOrchestrator = require('../services/voiceOrchestrator');

async function createAssistant(req, res) {
    try {
        const business_id = req.user.id;
        const { name, system_prompt } = req.body;
        if (!name) return res.status(400).json({ error: 'name is required' });
        
        const assistant = await assistantService.createAssistant({ 
            business_id, 
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
        const businessId = req.user.id;
        const assistant = await assistantService.updateAssistant(id, businessId, req.body);
        res.status(200).json(assistant);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getAssistants(req, res) {
    try {
        const businessId = req.user.id;
        const assistants = await assistantService.getAssistantsForClient(businessId);
        res.status(200).json(assistants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getAssistantConfig(req, res) {
    try {
        const businessId = req.user.id;
        const config = await assistantService.getAssistantConfig(businessId);
        res.status(200).json(config);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { createAssistant, updateAssistant, getAssistants, getAssistantConfig };
