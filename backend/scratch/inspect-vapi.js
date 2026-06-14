require('dotenv').config();
const https = require('https');

function getVapi(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.vapi.ai',
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.VAPI_API_KEY}`
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', (err) => { reject(err); });
        req.end();
    });
}

async function main() {
    try {
        console.log("=== Fetching Vapi Phone Numbers ===");
        const numbers = await getVapi('/phone-number');
        console.log(numbers);

        console.log("\n=== Fetching Vapi Assistants ===");
        const assistants = await getVapi('/assistant');
        console.log(assistants);
    } catch (err) {
        console.error("Vapi error:", err.message);
    }
}

main();
