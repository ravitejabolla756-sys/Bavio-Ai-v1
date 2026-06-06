const axios = require('axios');
const FormData = require('form-data');

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SARVAM_BASE_URL = 'https://api.sarvam.ai';

/**
 * Convert speech to text using Sarvam AI
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} languageCode - Language code (default: 'en-IN')
 * @returns {Promise<string>} - Transcript text
 */
async function speechToText(audioBuffer, languageCode = 'en-IN') {
    try {
        const formData = new FormData();
        formData.append('file', audioBuffer, { filename: 'audio.wav', contentType: 'audio/wav' });
        formData.append('model', 'saarika:v2.5');
        formData.append('language_code', languageCode);

        const response = await axios.post(
            `${SARVAM_BASE_URL}/speech-to-text`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'api-subscription-key': SARVAM_API_KEY
                },
                timeout: 30000
            }
        );

        return response.data?.transcript || '';
    } catch (error) {
        console.error('Sarvam STT error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Speech-to-text failed');
    }
}

/**
 * Convert text to speech using Sarvam AI
 * @param {string} text - Text to convert
 * @param {string} languageCode - Language code (default: 'hi-IN')
 * @returns {Promise<Buffer>} - Audio buffer (base64 decoded)
 */
async function textToSpeech(text, languageCode = 'hi-IN') {
    try {
        const response = await axios.post(
            `${SARVAM_BASE_URL}/text-to-speech`,
            {
                text,
                model: 'bulbul:v2',
                voice: 'anushka',
                target_language_code: languageCode
            },
            {
                headers: {
                    'api-subscription-key': SARVAM_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        // Decode base64 audio to buffer
        const audioBase64 = response.data?.audio_base64 || response.data?.audio;
        if (audioBase64) {
            return Buffer.from(audioBase64, 'base64');
        }
        
        throw new Error('No audio data in response');
    } catch (error) {
        console.error('Sarvam TTS error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Text-to-speech failed');
    }
}

/**
 * Chat with Sarvam AI LLM
 * @param {string} transcript - User input text
 * @param {string} systemPrompt - System prompt for AI
 * @param {Array} conversationHistory - Previous messages
 * @returns {Promise<string>} - AI response text
 */
async function chat(transcript, systemPrompt, conversationHistory = []) {
    try {
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.map(m => ({
                role: m.role,
                content: m.content?.trim() || '(silence)'
            })),
            { role: 'user', content: transcript?.trim() || '(silence)' }
        ];

        const response = await axios.post(
            `${SARVAM_BASE_URL}/v1/chat/completions`,
            {
                model: 'sarvam-m',
                reasoning_effort: null,
                messages: messages
            },
            {
                headers: {
                    'api-subscription-key': SARVAM_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        let aiResponse = response.data?.choices?.[0]?.message?.content || '';
        
        // Strip thinking tags if present
        aiResponse = aiResponse.replace(/<thinking>.*?<\/thinking>/gs, '');
        aiResponse = aiResponse.replace(/<think>.*?<\/think>/gs, '');
        aiResponse = aiResponse.trim();

        return aiResponse;
    } catch (error) {
        console.error('Sarvam Chat error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Chat completion failed');
    }
}

module.exports = {
    speechToText,
    textToSpeech,
    chat
};
