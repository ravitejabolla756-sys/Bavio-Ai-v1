const openAIService = require('./openAIService');
const db = require('../database/db');
const { incrementMinutesUsed } = require('../middleware/planEnforcement');
const { modelRouter } = require('./modelRouter');

const DEFAULT_SYSTEM_PROMPT = `You are a helpful, professional business assistant. 
You help customers with inquiries, booking appointments, and answering questions. 
Be concise, friendly, and professional. 
Reply in the same language the customer uses.`;

/**
 * Process a complete voice call through Bavio Model Router pipeline
 * @param {Buffer} audioBuffer - Incoming audio from caller
 * @param {string|number} clientId - Client/Business ID
 * @param {string} callId - Call identifier
 * @param {object} [options] - Optional runtime overrides
 * @returns {Promise<{audioBuffer: Buffer, transcript: string, aiResponse: string, duration: number, tier: string, model: string}>}
 */
async function processVoiceCall(audioBuffer, clientId, callId, options = {}) {
    const startTime = Date.now();
    let language = 'en-US';
    let voice = 'alloy';
    let tier = 'core';
    let resolvedStack = null;
    
    try {
        // Step 1: Get client's assistant config
        console.log(`[Call ${callId}] Step 1: Fetching assistant config for client ${clientId}...`);
        const assistantResult = await db.query(
            `SELECT a.*, c.system_prompt as business_system_prompt 
             FROM assistants a 
             JOIN businesses c ON (a.business_id = c.id OR a.client_id = c.id)
             WHERE c.id = $1 
             ORDER BY a.created_at DESC
             LIMIT 1`,
            [clientId]
        );

        const assistant = assistantResult.rows[0] || {};
        const systemPrompt = assistant.system_prompt || assistant.business_system_prompt || DEFAULT_SYSTEM_PROMPT;
        language = assistant.language || options.language || 'en-US';
        voice = assistant.voice_id || assistant.voice || 'alloy';
        tier = assistant.intelligence_tier || options.tier || 'core';

        // Resolve dynamic model stack
        resolvedStack = modelRouter.resolveModelStack({
            tier,
            language,
            complexity: options.complexity || 'normal',
            overrides: {
                intelligence_provider: assistant.intelligence_provider,
                intelligence_model: assistant.intelligence_model,
                stt_provider: assistant.stt_provider,
                stt_model: assistant.stt_model,
                tts_provider: assistant.tts_provider,
                tts_model: assistant.tts_model,
            },
        });

        console.log(`[Call ${callId}] Model Router resolved stack:`, {
            tier: resolvedStack.tier,
            effectiveTier: resolvedStack.effectiveTier,
            llm: `${resolvedStack.intelligence.provider}/${resolvedStack.intelligence.model}`,
            stt: `${resolvedStack.stt.provider}/${resolvedStack.stt.model}`,
            tts: `${resolvedStack.tts.provider}/${resolvedStack.tts.model}`,
        });

        // Step 2: Speech to Text
        const sttStartTime = Date.now();
        console.log(`[Call ${callId}] Step 2: Converting speech to text via ${resolvedStack.stt.displayName}...`);
        const sttResult = await openAIService.transcribeAudio(audioBuffer, language);
        const transcript = sttResult.text || '';
        const sttLatencyMs = Date.now() - sttStartTime;
        console.log(`[Call ${callId}] Transcript: "${transcript}" (STT latency: ${sttLatencyMs}ms)`);

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
                duration: Math.ceil((Date.now() - startTime) / 1000),
                tier: resolvedStack.effectiveTier,
                model: resolvedStack.intelligence.model,
            };
        }

        // Step 3: Fetch history and Chat with AI
        const llmStartTime = Date.now();
        console.log(`[Call ${callId}] Step 3: Getting AI response via ${resolvedStack.intelligence.displayName}...`);
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
        const aiResponse = chatResult.response_text || '';
        const llmFirstTokenMs = Date.now() - llmStartTime;
        console.log(`[Call ${callId}] AI Response: "${aiResponse}" (LLM latency: ${llmFirstTokenMs}ms)`);

        // Step 4: Text to Speech
        const ttsStartTime = Date.now();
        console.log(`[Call ${callId}] Step 4: Converting to speech via ${resolvedStack.tts.displayName}...`);
        const responseAudio = await openAIService.textToSpeech(aiResponse, voice, language, 'mp3');
        const ttsFirstAudioMs = Date.now() - ttsStartTime;
        const totalTtfbMs = Date.now() - startTime;

        // Step 5: Save to DB
        const duration = Math.ceil((Date.now() - startTime) / 1000);
        
        await db.query(
            `INSERT INTO call_conversations (call_id, client_id, transcript, ai_response, duration, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (call_id) DO UPDATE 
             SET transcript = EXCLUDED.transcript,
                 ai_response = EXCLUDED.ai_response,
                 duration = EXCLUDED.duration`,
            [callId, clientId, transcript, aiResponse, duration]
        ).catch(e => console.warn('[VoiceOrchestrator] Failed to save conversation history turn:', e.message));

        // Step 6: Track minutes usage
        const durationMinutes = Math.ceil(duration / 60);
        await incrementMinutesUsed(clientId, durationMinutes, callId).catch(e => console.warn('[VoiceOrchestrator] Minutes tracking warning:', e.message));

        // Step 7: Granular Cost & Telemetry Logging
        const estInputTokens = Math.ceil((systemPrompt.length + transcript.length) / 4);
        const estOutputTokens = Math.ceil(aiResponse.length / 4);
        const ttsChars = aiResponse.length;

        modelRouter.recordCallCostLog({
            workspaceId: assistant.business_id || clientId,
            businessId: assistant.business_id || clientId,
            aiEmployeeId: assistant.id || null,
            callId,
            tier: resolvedStack.effectiveTier,
            language,
            provider: resolvedStack.intelligence.provider,
            model: resolvedStack.intelligence.model,
            sttProvider: resolvedStack.stt.provider,
            sttModel: resolvedStack.stt.model,
            ttsProvider: resolvedStack.tts.provider,
            ttsModel: resolvedStack.tts.model,
            durationSeconds: duration,
            inputTokens: estInputTokens,
            outputTokens: estOutputTokens,
            ttsCharacters: ttsChars,
            sttLatencyMs,
            llmFirstTokenMs,
            ttsFirstAudioMs,
            totalTtfbMs,
        }).catch(e => console.warn('[VoiceOrchestrator] Cost log logging failed:', e.message));

        return {
            audioBuffer: responseAudio,
            transcript,
            aiResponse,
            duration,
            tier: resolvedStack.effectiveTier,
            model: resolvedStack.intelligence.model,
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
                duration: Math.ceil((Date.now() - startTime) / 1000),
                tier,
                model: 'fallback',
            };
        } catch (ttsError) {
            console.error(`[Call ${callId}] Fallback TTS failed:`, ttsError);
            throw error;
        }
    }
}

async function getConversationHistory(callId) {
    try {
        const result = await db.query(
            `SELECT transcript, ai_response 
             FROM call_conversations 
             WHERE call_id = $1 
             ORDER BY created_at ASC`,
            [callId]
        );
        return result.rows || [];
    } catch (error) {
        console.warn(`[Call ${callId}] Could not fetch conversation history:`, error.message);
        return [];
    }
}

module.exports = {
    processVoiceCall,
    getConversationHistory,
    DEFAULT_SYSTEM_PROMPT
};
