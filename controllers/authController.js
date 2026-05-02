const db = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

async function signup(req, res) {
    try {
        const { email, password, subscription_plan, country } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const apiKey = randomUUID().replace(/-/g, '');
        
        const result = await db.query(
            `INSERT INTO clients (email, password_hash, api_key, subscription_plan, country, status)
             VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
            [email, hashedPassword, apiKey, subscription_plan || 'free', country || 'US']
        );
        
        const client = result.rows[0];
        const token = jwt.sign(
            { clientId: client.id, email: client.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            message: 'Client created successfully',
            token,
            client: {
                id: client.id,
                email: client.email,
                api_key: client.api_key,
                subscription_plan: client.subscription_plan,
                country: client.country
            }
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'A client with that email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await db.query(
            'SELECT * FROM clients WHERE email = $1 AND status = $2',
            [email, 'active']
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const client = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, client.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { clientId: client.id, email: client.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(200).json({
            message: 'Login successful',
            token,
            client: {
                id: client.id,
                email: client.email,
                api_key: client.api_key,
                subscription_plan: client.subscription_plan,
                country: client.country
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { signup, login, JWT_SECRET };
