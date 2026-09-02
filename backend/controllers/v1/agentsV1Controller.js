'use strict';

const db = require('../../database/db');
const { PROVIDER_REGISTRY } = require('../../services/modelRouter/providerRegistry');

function validateModelConfig(modelConfig) {
  if (!modelConfig) return true;

  const validSttProviders = ['sarvam', 'deepgram', 'openai', 'elevenlabs', 'automatic'];
  const validLlmProviders = ['openai', 'sarvam', 'anthropic', 'automatic'];
  const validTtsProviders = ['elevenlabs', 'sarvam', 'openai', 'automatic'];

  if (modelConfig.stt?.provider && !validSttProviders.includes(modelConfig.stt.provider)) {
    throw new Error(`Unsupported STT provider '${modelConfig.stt.provider}'. Supported: ${validSttProviders.join(', ')}`);
  }
  if (modelConfig.llm?.provider && !validLlmProviders.includes(modelConfig.llm.provider)) {
    throw new Error(`Unsupported LLM provider '${modelConfig.llm.provider}'. Supported: ${validLlmProviders.join(', ')}`);
  }
  if (modelConfig.tts?.provider && !validTtsProviders.includes(modelConfig.tts.provider)) {
    throw new Error(`Unsupported TTS provider '${modelConfig.tts.provider}'. Supported: ${validTtsProviders.join(', ')}`);
  }
  return true;
}

async function createAgent(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { name, instructions, language = 'hi-IN', first_message, voice_id, model_config, preset_name = 'bavio-indian' } = req.body;

  if (!name) {
    return res.status(400).json({
      error: { code: 'invalid_request', message: 'Agent name is required' },
      request_id: requestId,
    });
  }

  try {
    validateModelConfig(model_config);

    const sttProvider = model_config?.stt?.provider || 'sarvam';
    const sttModel = model_config?.stt?.model || 'saaras-v3';
    const llmProvider = model_config?.llm?.provider || 'openai';
    const llmModel = model_config?.llm?.model || 'gpt-5.4-mini';
    const ttsProvider = model_config?.tts?.provider || 'elevenlabs';
    const ttsModel = model_config?.tts?.model || 'flash-v2.5';

    const result = await db.query(
      `INSERT INTO assistants (
         business_id, client_id, name, system_prompt, language, first_message, voice_id,
         stt_provider, stt_model, intelligence_provider, intelligence_model,
         tts_provider, tts_model, model_routing_config, created_at, updated_at
       )
       VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [
        businessId,
        name,
        instructions || 'You are a professional AI customer service agent.',
        language,
        first_message || 'Namaste! Main Bavio AI se bol raha hoon.',
        voice_id || 'Sarah',
        sttProvider,
        sttModel,
        llmProvider,
        llmModel,
        ttsProvider,
        ttsModel,
        JSON.stringify({ preset: preset_name, ...(model_config || {}) }),
      ]
    );

    const agent = result.rows[0];
    res.status(201).json({
      data: {
        id: agent.id,
        name: agent.name,
        instructions: agent.system_prompt,
        language: agent.language,
        first_message: agent.first_message,
        voice_id: agent.voice_id,
        model_config: {
          stt: { provider: agent.stt_provider, model: agent.stt_model },
          llm: { provider: agent.intelligence_provider, model: agent.intelligence_model },
          tts: { provider: agent.tts_provider, model: agent.tts_model },
        },
        created_at: agent.created_at,
      },
      request_id: requestId,
    });
  } catch (err) {
    res.status(400).json({
      error: { code: 'invalid_request', message: err.message },
      request_id: requestId,
    });
  }
}

async function listAgents(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
  const cursor = req.query.cursor || null;

  try {
    let query = `SELECT * FROM assistants WHERE business_id = $1 OR client_id = $1`;
    const params = [businessId];

    if (cursor) {
      query += ` AND created_at < $2`;
      params.push(cursor);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit + 1);

    const result = await db.query(query, params);
    const hasMore = result.rows.length > limit;
    const rawData = hasMore ? result.rows.slice(0, limit) : result.rows;

    const data = rawData.map(a => ({
      id: a.id,
      name: a.name,
      instructions: a.system_prompt,
      language: a.language,
      first_message: a.first_message,
      voice_id: a.voice_id,
      model_config: {
        stt: { provider: a.stt_provider, model: a.stt_model },
        llm: { provider: a.intelligence_provider, model: a.intelligence_model },
        tts: { provider: a.tts_provider, model: a.tts_model },
      },
      created_at: a.created_at,
    }));

    res.status(200).json({
      data,
      pagination: {
        next_cursor: hasMore ? rawData[rawData.length - 1].created_at : null,
        has_more: hasMore,
      },
      request_id: requestId,
    });
  } catch (err) {
    res.status(500).json({
      error: { code: 'internal_error', message: err.message },
      request_id: requestId,
    });
  }
}

async function getAgentById(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT * FROM assistants WHERE id = $1 AND (business_id = $2 OR client_id = $2)`,
      [id, businessId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'not_found', message: 'Agent not found' },
        request_id: requestId,
      });
    }

    const a = result.rows[0];
    res.status(200).json({
      data: {
        id: a.id,
        name: a.name,
        instructions: a.system_prompt,
        language: a.language,
        first_message: a.first_message,
        voice_id: a.voice_id,
        model_config: {
          stt: { provider: a.stt_provider, model: a.stt_model },
          llm: { provider: a.intelligence_provider, model: a.intelligence_model },
          tts: { provider: a.tts_provider, model: a.tts_model },
        },
        created_at: a.created_at,
      },
      request_id: requestId,
    });
  } catch (err) {
    res.status(500).json({
      error: { code: 'internal_error', message: err.message },
      request_id: requestId,
    });
  }
}

async function updateAgent(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { id } = req.params;
  const { name, instructions, language, first_message, voice_id, model_config } = req.body;

  try {
    validateModelConfig(model_config);

    const result = await db.query(
      `UPDATE assistants
       SET name = COALESCE($1, name),
           system_prompt = COALESCE($2, system_prompt),
           language = COALESCE($3, language),
           first_message = COALESCE($4, first_message),
           voice_id = COALESCE($5, voice_id),
           stt_provider = COALESCE($6, stt_provider),
           stt_model = COALESCE($7, stt_model),
           intelligence_provider = COALESCE($8, intelligence_provider),
           intelligence_model = COALESCE($9, intelligence_model),
           tts_provider = COALESCE($10, tts_provider),
           tts_model = COALESCE($11, tts_model),
           updated_at = NOW()
       WHERE id = $12 AND (business_id = $13 OR client_id = $13)
       RETURNING *`,
      [
        name || null,
        instructions || null,
        language || null,
        first_message || null,
        voice_id || null,
        model_config?.stt?.provider || null,
        model_config?.stt?.model || null,
        model_config?.llm?.provider || null,
        model_config?.llm?.model || null,
        model_config?.tts?.provider || null,
        model_config?.tts?.model || null,
        id,
        businessId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'not_found', message: 'Agent not found' },
        request_id: requestId,
      });
    }

    const a = result.rows[0];
    res.status(200).json({
      data: {
        id: a.id,
        name: a.name,
        instructions: a.system_prompt,
        language: a.language,
        first_message: a.first_message,
        voice_id: a.voice_id,
        model_config: {
          stt: { provider: a.stt_provider, model: a.stt_model },
          llm: { provider: a.intelligence_provider, model: a.intelligence_model },
          tts: { provider: a.tts_provider, model: a.tts_model },
        },
        updated_at: a.updated_at,
      },
      request_id: requestId,
    });
  } catch (err) {
    res.status(400).json({
      error: { code: 'invalid_request', message: err.message },
      request_id: requestId,
    });
  }
}

async function deleteAgent(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { id } = req.params;

  try {
    const result = await db.query(
      `DELETE FROM assistants WHERE id = $1 AND (business_id = $2 OR client_id = $2) RETURNING id`,
      [id, businessId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'not_found', message: 'Agent not found' },
        request_id: requestId,
      });
    }

    res.status(200).json({
      data: { id, deleted: true },
      request_id: requestId,
    });
  } catch (err) {
    res.status(500).json({
      error: { code: 'internal_error', message: err.message },
      request_id: requestId,
    });
  }
}

module.exports = {
  createAgent,
  listAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
};
