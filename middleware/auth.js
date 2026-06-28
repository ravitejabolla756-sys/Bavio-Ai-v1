const db = require('../database/db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || '7e0341f2ee874653ce795be1851359683e92e769db290b69965697ae80da0a5e5745972bd30e6b51088fbc878ea141f97acec678ca57855eb024064f44f4d220';

const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Please log in first' });
        }
        
        const token = authHeader.substring(7);
        
        // Try local system JWT verification first
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded && (decoded.id || decoded.sub)) {
                const userId = decoded.id || decoded.sub;
                const result = await db.query('SELECT * FROM businesses WHERE id = $1', [userId]);
                if (result.rows.length > 0) {
                    req.client = result.rows[0];
                    req.user = {
                        id: req.client.id,
                        email: req.client.email
                    };
                    req.tokenData = decoded;
                    return next();
                }
            }
        } catch (localJwtErr) {
            // Local JWT verification failed, proceed to Supabase authentication
        }
        
        const authClient = db.createAuthClient();
        const { data, error } = await authClient.auth.getUser(token);
        
        if (error || !data.user) {
            return res.status(401).json({ error: 'Please log in first' });
        }
        
        const supabaseUser = data.user;
        
        const result = await db.query('SELECT * FROM businesses WHERE id = $1', [supabaseUser.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Account error, contact support' });
        }
        
        req.client = result.rows[0];
        req.user = {
            id: req.client.id,
            email: req.client.email
        };
        req.tokenData = supabaseUser;
        next();
    } catch (error) {
        console.error('Supabase JWT Authentication Error:', error);
        res.status(500).json({ error: 'Internal Server Error during authentication' });
    }
};


const authenticateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({ error: 'Authentication failed: Missing x-api-key header' });
        }

        const result = await db.query('SELECT * FROM businesses WHERE api_key = $1 AND status = $2', [apiKey, 'active']);

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Authentication failed: Invalid or inactive API key' });
        }

        req.client = result.rows[0];
        req.user = {
            id: req.client.id,
            email: req.client.email
        };
        next();
    } catch (error) {
        console.error('Authentication Error:', error);
        res.status(500).json({ error: 'Internal Server Error during authentication' });
    }
};

module.exports = {
    requireAuth,
    authenticateApiKey,
    JWT_SECRET
};
