require('dotenv').config();
const callService = require('../services/callService');

async function main() {
    try {
        console.log("=== Testing getCallsForClient ===");
        const calls = await callService.getCallsForClient('c395088d-1334-400b-9f4f-69f87024a619');
        console.log("Success! Found rows:", calls.length);
    } catch (err) {
        console.error("Error running getCallsForClient:", err.message);
    }
}

main();
