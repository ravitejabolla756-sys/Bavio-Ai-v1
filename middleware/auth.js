const db = require('../database/db');

const authenticateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({ error: 'Authentication failed: Missing x-api-key header' });
        }

        const result = await db.query('SELECT * FROM clients WHERE api_key = $1 AND status = $2', [apiKey, 'active']);

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Authentication failed: Invalid or inactive API key' });
        }

        req.client = result.rows[0];
        next();
    } catch (error) {
        console.error('Authentication Error:', error);
        res.status(500).json({ error: 'Internal Server Error during authentication' });
    }
};

module.exports = {
    authenticateApiKey
};
