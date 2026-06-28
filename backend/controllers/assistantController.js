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

async function getAssistantById(req, res) {
  try {
    const { id } = req.params;
    const businessId = req.user?.id || req.client?.id;

    const db = require('../database/db');
    const result = await db.query(
      'SELECT * FROM assistants WHERE id = $1 AND (business_id = $2 OR client_id = $2)',
      [id, businessId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'not_found', message: 'Assistant not found' });
    }

    const assistant = result.rows[0];

    // Safely parse followUpQuestions from sarvam_config or default
    let followUpQuestions = ['BUDGET', 'LOCATION', 'APPOINTMENT'];
    try {
      if (assistant.sarvam_config && typeof assistant.sarvam_config === 'object') {
        if (Array.isArray(assistant.sarvam_config.followUpQuestions)) {
          followUpQuestions = assistant.sarvam_config.followUpQuestions;
        }
      } else if (assistant.sarvam_config && typeof assistant.sarvam_config === 'string') {
        const parsed = JSON.parse(assistant.sarvam_config);
        if (parsed && Array.isArray(parsed.followUpQuestions)) {
          followUpQuestions = parsed.followUpQuestions;
        }
      }
    } catch (parseErr) {
      console.warn('Failed to parse followUpQuestions:', parseErr);
    }

    return res.status(200).json({
      id: assistant.id,
      businessId: assistant.business_id,
      name: assistant.name || 'Default Assistant',
      language: assistant.language === 'hi-IN' ? 'HINDI' : assistant.language === 'en-US' ? 'ENGLISH' : 'HINGLISH',
      firstMessage: assistant.first_message || assistant.greeting || '',
      systemPrompt: assistant.system_prompt || '',
      followUpQuestions,
      createdAt: assistant.created_at,
      updatedAt: assistant.updated_at
    });
  } catch (err) {
    console.error('getAssistantById error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

async function updateAssistantById(req, res) {
  try {
    const { id } = req.params;
    const businessId = req.user?.id || req.client?.id;
    const { systemPrompt, followUpQuestions } = req.body;

    if (systemPrompt && systemPrompt.length > 1000) {
      return res.status(400).json({ error: 'invalid_prompt', message: 'System prompt cannot exceed 1000 characters' });
    }

    const db = require('../database/db');
    
    // Find assistant
    const result = await db.query(
      'SELECT * FROM assistants WHERE id = $1 AND (business_id = $2 OR client_id = $2)',
      [id, businessId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'not_found', message: 'Assistant not found' });
    }

    const assistant = result.rows[0];

    // Prepare updated sarvam_config
    let sarvamConfig = assistant.sarvam_config || {};
    if (typeof sarvamConfig === 'string') {
      try {
        sarvamConfig = JSON.parse(sarvamConfig);
      } catch (e) {
        sarvamConfig = {};
      }
    }
    sarvamConfig.followUpQuestions = followUpQuestions || [];

    // Update DB
    const updateRes = await db.query(
      `UPDATE assistants 
       SET system_prompt = COALESCE($1, system_prompt),
           sarvam_config = $2,
           updated_at = NOW()
       WHERE id = $3 AND (business_id = $4 OR client_id = $4)
       RETURNING *`,
      [systemPrompt || null, JSON.stringify(sarvamConfig), id, businessId]
    );

    // Update onboarding step to 5 (after customize)
    await db.query(
      'UPDATE businesses SET onboarding_step = 5, updated_at = NOW() WHERE id = $1',
      [businessId]
    );

    return res.status(200).json({
      success: true,
      id: updateRes.rows[0].id,
      updatedAt: updateRes.rows[0].updated_at
    });

  } catch (err) {
    console.error('updateAssistantById error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

module.exports = { 
  createAssistant, 
  updateAssistant, 
  getAssistants, 
  getAssistantConfig,
  getAssistantById,
  updateAssistantById
};
