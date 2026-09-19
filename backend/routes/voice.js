const express = require('express');
const router = express.Router();
const openAIService = require('../services/openAIService');
const voiceOrchestrator = require('../services/voiceOrchestrator');
const { requireAuth } = require('../middleware/auth');
const { checkMinutesLimit } = require('../middleware/planEnforcement');
const multer = require('multer');
const db = require('../database/db');
const axios = require('axios');

// Configure multer for audio file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * POST /voice/process - Full STT → LLM → TTS pipeline
 * Accepts audio file, processes through complete pipeline, returns audio
 */
router.post('/process', requireAuth, checkMinutesLimit, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Audio file required' });
        }

        const clientId = req.client.id;
        const callId = req.body.call_id || `test_${Date.now()}`;
        
        console.log(`[Voice Process] Processing audio for client ${clientId}`);
        
        const result = await voiceOrchestrator.processVoiceCall(req.file.buffer, clientId, callId);
        
        // Return audio as binary response
        res.set('Content-Type', 'audio/wav');
        res.set('X-Transcript', encodeURIComponent(result.transcript));
        res.set('X-AI-Response', encodeURIComponent(result.aiResponse));
        res.set('X-Duration', result.duration.toString());
        res.send(result.audioBuffer);
        
    } catch (error) {
        console.error('Voice process error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /voice/stt - Test STT only
 */
router.post('/stt', requireAuth, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Audio file required' });
        }

        const languageCode = req.body.language_code || 'en-IN';
        const sttResult = await openAIService.transcribeAudio(req.file.buffer, languageCode);
        const transcript = sttResult.text;
        
        res.json({
            success: true,
            transcript,
            language_code: languageCode
        });
    } catch (error) {
        console.error('STT test error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /voice/tts - Test TTS only
 */
router.post('/tts', requireAuth, async (req, res) => {
    try {
        const { text, language_code } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text required' });
        }

        const languageCode = language_code || 'hi-IN';
        const audioBuffer = await openAIService.textToSpeech(text, 'alloy', languageCode, 'mp3');
        
        // Return audio as binary
        res.set('Content-Type', 'audio/mpeg');
        res.set('X-Text', encodeURIComponent(text));
        res.send(audioBuffer);
    } catch (error) {
        console.error('TTS test error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /voice/chat - Test LLM only
 */
router.post('/chat', requireAuth, async (req, res) => {
    try {
        const { transcript, system_prompt, conversation_history } = req.body;
        
        if (!transcript) {
            return res.status(400).json({ error: 'Transcript required' });
        }

        const systemPrompt = system_prompt || voiceOrchestrator.DEFAULT_SYSTEM_PROMPT;
        const formattedHistory = (conversation_history || []).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content || ''
        }));
        formattedHistory.push({ role: 'user', content: transcript });
        
        const chatResult = await openAIService.chat(systemPrompt, formattedHistory, null);
        const aiResponse = chatResult.response_text;
        
        res.json({
            success: true,
            transcript,
            ai_response: aiResponse,
            system_prompt: systemPrompt
        });
    } catch (error) {
        console.error('Chat test error:', error);
        res.status(500).json({ error: error.message });
    }
});

const voiceCatalogService = require('../services/voiceCatalogService');

/**
 * GET /voice/languages - Expose runtime supported languages
 */
router.get('/languages', async (req, res) => {
    try {
        const languages = voiceCatalogService.getSupportedLanguages();
        res.json({ success: true, languages });
    } catch (error) {
        console.error('Failed to retrieve supported languages:', error);
        res.status(503).json({ success: false, error: 'Language availability is temporarily unavailable.' });
    }
});

/**
 * GET /voice/catalog - Expose canonical Bavio voices catalog
 */
router.get('/catalog', async (req, res) => {
    try {
        const voices = voiceCatalogService.getVoiceCatalog();
        // Also map legacy format fields (voice_id, voice_display_name, etc.) for backward compatibility
        const catalog = voices.map(v => ({
            ...v,
            voice_id: v.id,
            voice_display_name: v.name,
            voice_gender: v.gender,
            voice_language: v.supportedLanguages[0] || 'en-US',
            preview_url: `/voice/preview/${v.id}`,
        }));
        return res.json({ success: true, voices: catalog, catalog });
    } catch (error) {
        console.error('Failed to retrieve voices catalog:', error);
        return res.status(503).json({ success: false, error: 'Voice service is temporarily unavailable.' });
    }
});

/**
 * GET /voice/preview/:voiceId - Proxied / synthesized real audio preview stream
 */
router.get('/preview/:voiceId', async (req, res) => {
    try {
        const { voiceId } = req.params;
        const { language = 'en-US' } = req.query;

        const audioBuffer = await voiceCatalogService.getVoicePreviewAudio(voiceId, language);
        
        res.set('Content-Type', 'audio/mpeg');
        res.set('Content-Length', audioBuffer.length);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(audioBuffer);
    } catch (error) {
        console.error('[VOICE PREVIEW ERROR] Failed to stream voice preview:', error.message);
        res.status(500).json({ error: 'Preview unavailable' });
    }
});

module.exports = router;
