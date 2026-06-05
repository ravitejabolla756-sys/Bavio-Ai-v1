const clientService = require('../services/clientService');

async function createClient(req, res) {
    try {
        const { email, subscription_plan, country } = req.body;
        if (!email) return res.status(400).json({ error: 'email is required' });
        const client = await clientService.createClient({ email, subscription_plan, country });
        res.status(201).json(client);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'A client with that email already exists' });
        res.status(500).json({ error: err.message });
    }
}

async function getClient(req, res) {
    try {
        const client = await clientService.getClientById(req.params.id);
        res.status(200).json(client);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
}

module.exports = { createClient, getClient };
