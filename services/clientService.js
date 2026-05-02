const db = require('../database/db');
const { randomUUID } = require('crypto');

async function createClient({ email, subscription_plan, country }) {
    const apiKey = randomUUID().replace(/-/g, '');
    const result = await db.query(
        `INSERT INTO clients (email, api_key, subscription_plan, country, status)
         VALUES ($1, $2, $3, $4, 'active') RETURNING *`,
        [email, apiKey, subscription_plan || 'free', country]
    );
    return result.rows[0];
}

async function getClientById(id) {
    const result = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (result.rows.length === 0) throw new Error(`Client ${id} not found`);
    return result.rows[0];
}

module.exports = { createClient, getClientById };
