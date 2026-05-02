const db = require('../database/db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../controllers/authController');

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

const authenticateJwt = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication failed: Missing or invalid Authorization header' });
        }
        
        const token = authHeader.substring(7);
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const result = await db.query('SELECT * FROM clients WHERE id = $1 AND status = $2', [decoded.clientId, 'active']);
        
        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Authentication failed: Client not found or inactive' });
        }
        
        req.client = result.rows[0];
        req.tokenData = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Authentication failed: Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Authentication failed: Token expired' });
        }
        console.error('JWT Authentication Error:', error);
        res.status(500).json({ error: 'Internal Server Error during authentication' });
    }
};

module.exports = {
    authenticateApiKey,
    authenticateJwt
};
