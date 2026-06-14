require('dotenv').config();
const axios = require('axios');

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

async function testModel(modelName) {
    const start = Date.now();
    try {
        const response = await axios.post(
            'https://api.sarvam.ai/v1/chat/completions',
            {
                model: modelName,
                max_tokens: 100,
                temperature: 0.7,
                messages: [
                    { role: 'system', content: 'You are a friendly assistant. Keep it to 1 sentence.' },
                    { role: 'user', content: 'Namaste! Kaise ho?' }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${SARVAM_API_KEY}`,
                    'api-subscription-key': SARVAM_API_KEY, // try both headers just in case
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );
        const latency = Date.now() - start;
        console.log(`[${modelName}] SUCCESS in ${latency}ms`);
        console.log(`  Response: "${response.data?.choices?.[0]?.message?.content?.trim()}"`);
        return latency;
    } catch (err) {
        const latency = Date.now() - start;
        console.error(`[${modelName}] FAILED in ${latency}ms:`, err.response?.data || err.message);
        return null;
    }
}

async function main() {
    console.log("=== Testing Sarvam LLM Model Latencies ===");
    await testModel('sarvam-2b');
    await testModel('sarvam-m');
    await testModel('sarvam-30b');
}

main();
