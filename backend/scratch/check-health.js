const https = require('https');

https.get('https://api.bavio.in/health', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log("Response:", res.statusCode, data);
    });
}).on('error', (err) => {
    console.error("Error:", err.message);
});
