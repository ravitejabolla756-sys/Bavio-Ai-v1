const db = require('../database/db');
const { randomUUID } = require('crypto');

const DB_PLAN_MAP = {
    'free': 'free',
    'starter': 'starter',
    'growth': 'pro',
    'scale': 'enterprise'
};

async function createClient({ email, subscription_plan, country }) {
    const apiKey = randomUUID().replace(/-/g, '');
    const plan = subscription_plan || 'free';
    const dbPlan = DB_PLAN_MAP[plan.toLowerCase()] || 'free';
    
    const result = await db.query(
        `INSERT INTO businesses (email, api_key, plan, plan_name, country, status)
         VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
        [email, apiKey, dbPlan, plan, country]
    );
    return result.rows[0];
}

async function getClientById(id) {
    const result = await db.query('SELECT * FROM businesses WHERE id = $1', [id]);
    if (result.rows.length === 0) throw new Error(`Business ${id} not found`);
    return result.rows[0];
}

module.exports = { createClient, getClientById };

