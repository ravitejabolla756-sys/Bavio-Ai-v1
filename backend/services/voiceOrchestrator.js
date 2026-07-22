const openAIService = require('./openAIService');
const db = require('../database/db');
const { incrementMinutesUsed } = require('../middleware/planEnforcement');

const DEFAULT_SYSTEM_PROMPT = `You are a helpful, professional business assistant. 
You help customers with inquiries, booking appointments, and answering questions. 
Be concise, friendly, and professional. 
Reply in the same language the customer uses.`;

/**
 * Process a complete voice call through OpenAI pipeline
 * @param {Buffer} audioBuffer - Incoming audio from caller
 * @param {number} clientId - Client ID
 * @param {string} callId - Call identifier
 * @returns {Promise<{audioBuffer: Buffer, transcript: string, aiResponse: string, duration: number}>}
 */
async function processVoiceCall(audioBuffer, clientId, callId) {
    const startTime = Date.now();
    let language = 'en-US';
    let voice = 'alloy';
    
    try {
        // Step 1: Get client's assistant config first
        console.log(`[Call ${callId}] Step 1: Fetching assistant config...`);
        const assistantResult = await db.query(
            `SELECT a.*, c.system_prompt 
             FROM assistants a 
             JOIN businesses c ON a.client_id = c.id 
             WHERE c.id = $1 
             LIMIT 1`,
            [clientId]
        );

        const assistant = assistantResult.rows[0] || {};
        const systemPrompt = assistant.system_prompt || DEFAULT_SYSTEM_PROMPT;
        language = assistant.language || 'en-US';
        voice = assistant.voice_id || 'alloy';

        // Step 2: Speech to Text using configured language
        console.log(`[Call ${callId}] Step 2: Converting speech to text for language ${language}...`);
        const sttResult = await openAIService.transcribeAudio(audioBuffer, language);
        const transcript = sttResult.text;
        console.log(`[Call ${callId}] Transcript: "${transcript}"`);

        if (!transcript || transcript.trim().length === 0) {
            const isHindi = language.startsWith('hi');
            const fallbackText = isHindi 
                ? "Namaste! Kripya dobara koshish karein." 
                : "Sorry, I didn't catch that. Could you please repeat it?";
            const fallbackAudio = await openAIService.textToSpeech(fallbackText, voice, language, 'mp3');
            return {
                audioBuffer: fallbackAudio,
                transcript: '',
                aiResponse: fallbackText,
                duration: Math.ceil((Date.now() - startTime) / 1000)
            };
        }

        // Step 3: Fetch history and Chat with AI
        console.log(`[Call ${callId}] Step 3: Getting AI response...`);
        const rawHistory = await getConversationHistory(callId);
        const history = [];
        for (const turn of rawHistory) {
            if (turn.transcript) {
                history.push({ role: 'user', content: turn.transcript });
            }
            if (turn.ai_response) {
                history.push({ role: 'assistant', content: turn.ai_response });
            }
        }
        history.push({ role: 'user', content: transcript });

        const chatResult = await openAIService.chat(systemPrompt, history, null);
        const aiResponse = chatResult.response_text;
        console.log(`[Call ${callId}] AI Response: "${aiResponse}"`);

        // Step 4: Text to Speech
        console.log(`[Call ${callId}] Step 4: Converting to speech using voice ${voice}...`);
        const responseAudio = await openAIService.textToSpeech(aiResponse, voice, language, 'mp3');

        // Step 5: Save to DB
        console.log(`[Call ${callId}] Step 5: Saving conversation...`);
        const duration = Math.ceil((Date.now() - startTime) / 1000);
        
        await db.query(
            `INSERT INTO call_conversations (call_id, client_id, transcript, ai_response, duration, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (call_id) DO UPDATE 
             SET transcript = EXCLUDED.transcript,
                 ai_response = EXCLUDED.ai_response,
                 duration = EXCLUDED.duration`,
            [callId, clientId, transcript, aiResponse, duration]
        );

        // Step 6: Track minutes usage
        const durationMinutes = Math.ceil(duration / 60);
        await incrementMinutesUsed(clientId, durationMinutes);

        return {
            audioBuffer: responseAudio,
            transcript,
            aiResponse,
            duration
        };

    } catch (error) {
        console.error(`[Call ${callId}] Voice orchestration error:`, error);
        
        // Return fallback audio on error
        try {
            const isHindi = language.startsWith('hi');
            const fallbackText = isHindi 
                ? "Maaf kijiye, koi technical problem ho gayi hai. Kripya baad mein koshish karein." 
                : "I apologize, but we are experiencing technical difficulties. Please try again later.";
            const fallbackAudio = await openAIService.textToSpeech(fallbackText, voice, language, 'mp3');
            return {
                audioBuffer: fallbackAudio,
                transcript: '',
                aiResponse: fallbackText,
                duration: Math.ceil((Date.now() - startTime) / 1000)
            };
        } catch (fallbackError) {
            console.error('Fallback audio generation failed:', fallbackError);
            throw error;
        }
    }
}

/**
 * Get conversation history for a call
 * @param {string} callId - Call identifier
 * @returns {Promise<Array>} - Conversation history
 */
async function getConversationHistory(callId) {
    try {
        const result = await db.query(
            `SELECT transcript, ai_response, duration, created_at 
             FROM call_conversations 
             WHERE call_id = $1 
             ORDER BY created_at ASC`,
            [callId]
        );
        return result.rows;
    } catch (error) {
        console.error('Get conversation history error:', error);
        return [];
    }
}

module.exports = {
    processVoiceCall,
    getConversationHistory,
    DEFAULT_SYSTEM_PROMPT
};
