const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');
const encryption = require('../utils/encryption');
const axios = require('axios');

// Helper to mask API keys
function maskKey(key) {
  if (!key) return '';
  if (key.length <= 8) return '••••';
  return '••••••••' + key.slice(-8);
}

// -- 1. GET /integrations/status ----------------------------------------------
router.get('/status', requireAuth, async (req, res) => {
  try {
    const businessId = req.user.id;

    // Fetch all connected integrations
    const result = await db.query(
      'SELECT service_name, api_key_encrypted, last_tested_at, test_status, usage_limit, usage_current, selected_model FROM api_integrations WHERE business_id = $1',
      [businessId]
    );

    // Initial state
    const response = {
      deepgram: { connected: false, keyMasked: '', lastTested: null, testStatus: 'pending', usageLimit: 0, usageCurrent: 45 },
      openai: { connected: false, keyMasked: '', lastTested: null, testStatus: 'pending', usageLimit: 0, usageCurrent: 2300, model: 'gpt-4o-mini' },
      elevenlabs: { connected: false, keyMasked: '', lastTested: null, testStatus: 'pending', usageLimit: 3000000, usageCurrent: 1200000, voice: 'Luna' }
    };

    result.rows.forEach(row => {
      const service = row.service_name;
      if (response[service]) {
        response[service].connected = true;
        const decrypted = encryption.decrypt(row.api_key_encrypted);
        response[service].keyMasked = maskKey(decrypted);
        response[service].lastTested = row.last_tested_at;
        response[service].testStatus = row.test_status || 'pending';
        response[service].usageLimit = Number(row.usage_limit || 0);
        response[service].usageCurrent = Number(row.usage_current || 0);
        
        if (service === 'openai') {
          response[service].model = row.selected_model || 'gpt-4o-mini';
        } else if (service === 'elevenlabs') {
          response[service].voice = row.selected_model || 'Luna';
        }
      }
    });

    return res.status(200).json(response);
  } catch (err) {
    console.error('[Integrations] GET status failed:', err.message);
    return res.status(500).json({ error: 'Failed to load integration statuses', details: err.message });
  }
});

// -- 2. POST /integrations/add ------------------------------------------------
router.post('/add', requireAuth, async (req, res) => {
  try {
    const businessId = req.user.id;
    const { service, api_key } = req.body;

    if (!service || !api_key || api_key.trim().length === 0) {
      return res.status(400).json({ error: 'Service name and API key are required' });
    }

    const serviceLower = service.toLowerCase().trim();
    if (!['deepgram', 'openai', 'elevenlabs'].includes(serviceLower)) {
      return res.status(400).json({ error: 'Invalid service. Must be deepgram, openai, or elevenlabs' });
    }

    const encrypted = encryption.encrypt(api_key.trim());

    // Upsert into DB
    await db.query(
      `INSERT INTO api_integrations (business_id, service_name, api_key_encrypted, test_status, updated_at)
       VALUES ($1, $2, $3, 'pending', NOW())
       ON CONFLICT (business_id, service_name) 
       DO UPDATE SET api_key_encrypted = EXCLUDED.api_key_encrypted, test_status = 'pending', updated_at = NOW()`,
      [businessId, serviceLower, encrypted]
    );

    // Live test connection
    let testSuccess = false;
    let latency = 0;
    try {
      const testResult = await performTest(serviceLower, api_key.trim());
      testSuccess = testResult.success;
      latency = testResult.latency;

      await db.query(
        'UPDATE api_integrations SET test_status = $1, last_tested_at = NOW(), updated_at = NOW() WHERE business_id = $2 AND service_name = $3',
        [testSuccess ? 'success' : 'failed', businessId, serviceLower]
      );
    } catch (testErr) {
      console.warn('[Integrations] Auto test failed after add:', testErr.message);
    }

    return res.status(200).json({
      status: 'connected',
      tested: true,
      success: testSuccess,
      latency_ms: latency
    });

  } catch (err) {
    console.error('[Integrations] Add key failed:', err.message);
    return res.status(500).json({ error: 'Failed to save API key', details: err.message });
  }
});

// -- 3. POST /integrations/test -----------------------------------------------
router.post('/test', requireAuth, async (req, res) => {
  try {
    const businessId = req.user.id;
    const { service } = req.body;

    if (!service) {
      return res.status(400).json({ error: 'Service parameter is required' });
    }

    const serviceLower = service.toLowerCase().trim();

    // Fetch key from DB
    const result = await db.query(
      'SELECT api_key_encrypted FROM api_integrations WHERE business_id = $1 AND service_name = $2',
      [businessId, serviceLower]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `No API key connected for ${serviceLower}` });
    }

    const key = encryption.decrypt(result.rows[0].api_key_encrypted);
    if (!key) {
      return res.status(500).json({ error: 'Failed to decrypt API key' });
    }

    // Perform live connection request
    const testResult = await performTest(serviceLower, key);

    // Save test status in DB
    await db.query(
      'UPDATE api_integrations SET test_status = $1, last_tested_at = NOW(), updated_at = NOW() WHERE business_id = $2 AND service_name = $3',
      [testResult.success ? 'success' : 'failed', businessId, serviceLower]
    );

    if (testResult.success) {
      return res.status(200).json({ status: 'success', latency_ms: testResult.latency });
    } else {
      return res.status(400).json({ status: 'failed', error: testResult.error || 'Connection failed' });
    }

  } catch (err) {
    console.error('[Integrations] Live test failed:', err.message);
    return res.status(500).json({ error: 'Internal test execution error', details: err.message });
  }
});

// -- 4. PUT /integrations/select-voice ----------------------------------------
router.put('/select-voice', requireAuth, async (req, res) => {
  try {
    const businessId = req.user.id;
    const { voice_id, voice_name } = req.body;

    if (!voice_id || !voice_name) {
      return res.status(400).json({ error: 'voice_id and voice_name are required' });
    }

    // 1. Update ElevenLabs voice setting in api_integrations
    await db.query(
      `INSERT INTO api_integrations (business_id, service_name, api_key_encrypted, selected_model, updated_at)
       VALUES ($1, 'elevenlabs', 'placeholder_until_added', $2, NOW())
       ON CONFLICT (business_id, service_name)
       DO UPDATE SET selected_model = EXCLUDED.selected_model, updated_at = NOW()`,
      [businessId, voice_name]
    );

    // 2. Also sync to assistant's voice configuration table
    await db.query(
      'UPDATE assistants SET voice = $1, updated_at = NOW() WHERE business_id = $2',
      [voice_id, businessId]
    );

    return res.status(200).json({ success: true, voice: voice_name });
  } catch (err) {
    console.error('[Integrations] Select voice failed:', err.message);
    return res.status(500).json({ error: 'Failed to save voice selection', details: err.message });
  }
});

// -- Connection Test Handlers --------------------------------------------------
async function performTest(service, key) {
  const start = Date.now();
  try {
    if (service === 'deepgram') {
      await axios.get('https://api.deepgram.com/v1/projects', {
        headers: { Authorization: `Token ${key}` },
        timeout: 8000
      });
    } else if (service === 'openai') {
      await axios.get('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
        timeout: 8000
      });
    } else if (service === 'elevenlabs') {
      await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': key },
        timeout: 8000
      });
    }
    return { success: true, latency: Date.now() - start };
  } catch (err) {
    console.warn(`[Integrations] Live test request to ${service} failed:`, err.message);
    const errorDetails = err.response?.data || err.message;
    return { success: false, latency: Date.now() - start, error: err.message, details: errorDetails };
  }
}

module.exports = router;

