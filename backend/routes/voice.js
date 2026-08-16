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

const CURATED_VOICES = [
  { voice_id: '21m00Tcm4TlvDq8ikWAM', voice_display_name: 'Rachel (Calm & Professional)', voice_gender: 'female', voice_accent: 'American', voice_language: 'English', voice_style: 'Professional', preview_url: '/voice/preview/21m00Tcm4TlvDq8ikWAM' },
  { voice_id: 'AZnzlk1XvdvUeBnXmlld', voice_display_name: 'Domi (Empathetic & Warm)', voice_gender: 'female', voice_accent: 'American', voice_language: 'English', voice_style: 'Warm', preview_url: '/voice/preview/AZnzlk1XvdvUeBnXmlld' },
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', voice_display_name: 'Bella (Articulate Support)', voice_gender: 'female', voice_accent: 'American', voice_language: 'English', voice_style: 'Support', preview_url: '/voice/preview/EXAVITQu4vr4xnSDxMaL' },
  { voice_id: 'ErXwobaYiN019PkySvjV', voice_display_name: 'Antoni (Executive & Confident)', voice_gender: 'male', voice_accent: 'American', voice_language: 'English', voice_style: 'Corporate', preview_url: '/voice/preview/ErXwobaYiN019PkySvjV' },
  { voice_id: 'sarvam_meera', voice_display_name: 'Meera (Indic Multilingual)', voice_gender: 'female', voice_accent: 'Indian', voice_language: 'Hindi', voice_style: 'Natural', preview_url: '/voice/preview/sarvam_meera' },
  { voice_id: 'sarvam_rohan', voice_display_name: 'Rohan (Indic Executive)', voice_gender: 'male', voice_accent: 'Indian', voice_language: 'Hindi', voice_style: 'Executive', preview_url: '/voice/preview/sarvam_rohan' },
];

/**
 * GET /voice/catalog - Expose curated voices catalog
 */
router.get('/catalog', requireAuth, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT voice_id, voice_display_name, voice_gender, voice_accent, voice_language, voice_style, preview_url
             FROM voices
             ORDER BY voice_language, voice_accent, voice_display_name`
        ).catch(() => ({ rows: [] }));
        
        if (result.rows && result.rows.length > 0) {
            const catalog = result.rows.map(v => ({
                voice_id: v.voice_id,
                voice_display_name: v.voice_display_name,
                voice_gender: v.voice_gender,
                voice_accent: v.voice_accent,
                voice_language: v.voice_language,
                voice_style: v.voice_style,
                preview_url: `/voice/preview/${v.voice_id}`
            }));
            return res.json(catalog);
        }

        return res.json(CURATED_VOICES);
    } catch (error) {
        console.error('Failed to retrieve voices catalog:', error);
        return res.json(CURATED_VOICES);
    }
});

/**
 * GET /voice/preview/:voiceId - Proxied preview stream to protect provider credentials
 */
router.get('/preview/:voiceId', async (req, res) => {
    try {
        const { voiceId } = req.params;
        
        const result = await db.query('SELECT * FROM voices WHERE voice_id = $1', [voiceId]);
        const voice = result.rows[0];
        if (!voice) {
            return res.status(404).json({ error: 'Voice not found' });
        }
        
        const previewUrl = `https://api.elevenlabs.io/v1/voices/${voiceId}/previews`;
        
        const response = await axios({
            method: 'get',
            url: previewUrl,
            responseType: 'stream',
            timeout: 5000
        });
        
        res.set('Content-Type', response.headers['content-type'] || 'audio/mpeg');
        response.data.pipe(res);
        
    } catch (error) {
        console.error('Failed to proxy voice preview:', error);
        res.status(500).json({ error: 'Failed to retrieve preview' });
    }
});

module.exports = router;
