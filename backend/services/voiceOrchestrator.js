const sarvamService = require('./sarvamService');
const db = require('../database/db');
const { incrementMinutesUsed } = require('../middleware/planEnforcement');

const DEFAULT_SYSTEM_PROMPT = `You are a helpful Indian business assistant. 
You help customers with inquiries, booking appointments, and answering questions. 
Be concise, friendly, and professional. 
Reply in the same language the customer uses.`;

/**
 * Process a complete voice call through Sarvam AI pipeline
 * @param {Buffer} audioBuffer - Incoming audio from caller
 * @param {number} clientId - Client ID
 * @param {string} callId - Call identifier
 * @returns {Promise<{audioBuffer: Buffer, transcript: string, aiResponse: string, duration: number}>}
 */
async function processVoiceCall(audioBuffer, clientId, callId) {
    const startTime = Date.now();
    
    try {
        // Step 1: Speech to Text
        console.log(`[Call ${callId}] Step 1: Converting speech to text...`);
        const transcript = await sarvamService.speechToText(audioBuffer, 'hi-IN');
        console.log(`[Call ${callId}] Transcript: "${transcript}"`);

        if (!transcript || transcript.trim().length === 0) {
            const fallbackText = "Namaste! Main Bavio AI hoon. Kripya dobara koshish karein.";
            const fallbackAudio = await sarvamService.textToSpeech(fallbackText, 'hi-IN');
            return {
                audioBuffer: fallbackAudio,
                transcript: '',
                aiResponse: fallbackText,
                duration: Math.ceil((Date.now() - startTime) / 1000)
            };
        }

        // Step 2: Get client's assistant config
        console.log(`[Call ${callId}] Step 2: Fetching assistant config...`);
        const assistantResult = await db.query(
            `SELECT a.*, c.system_prompt 
             FROM assistants a 
             JOIN businesses c ON a.client_id = c.id 
             WHERE c.id = $1 
             LIMIT 1`,
            [clientId]
        );

        const systemPrompt = assistantResult.rows[0]?.system_prompt || DEFAULT_SYSTEM_PROMPT;

        // Step 3: Chat with AI
        console.log(`[Call ${callId}] Step 3: Getting AI response...`);
        const aiResponse = await sarvamService.chat(transcript, systemPrompt, []);
        console.log(`[Call ${callId}] AI Response: "${aiResponse}"`);

        // Step 4: Text to Speech
        console.log(`[Call ${callId}] Step 4: Converting to speech...`);
        const responseAudio = await sarvamService.textToSpeech(aiResponse, 'hi-IN');

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
            const fallbackText = "Maaf kijiye, koi technical problem ho gayi hai. Kripya baad mein koshish karein.";
            const fallbackAudio = await sarvamService.textToSpeech(fallbackText, 'hi-IN');
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
