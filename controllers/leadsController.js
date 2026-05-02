const db = require('../database/db');

async function createLead(req, res) {
    try {
        const { client_id, caller_number, intent, budget, notes } = req.body;
        
        if (!client_id || !caller_number) {
            return res.status(400).json({ error: 'client_id and caller_number are required' });
        }

        const result = await db.query(
            `INSERT INTO leads (client_id, caller_number, intent, budget, status, notes)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [client_id, caller_number, intent || null, budget || null, 'new', notes || null]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getLeads(req, res) {
    try {
        const { client_id } = req.params;
        
        const result = await db.query(
            `SELECT * FROM leads WHERE client_id = $1 ORDER BY created_at DESC`,
            [client_id]
        );
        
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function updateLead(req, res) {
    try {
        const { id } = req.params;
        const { status, intent, budget, notes } = req.body;
        
        const result = await db.query(
            `UPDATE leads 
             SET status = COALESCE($1, status),
                 intent = COALESCE($2, intent),
                 budget = COALESCE($3, budget),
                 notes = COALESCE($4, notes)
             WHERE id = $5 RETURNING *`,
            [status, intent, budget, notes, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { createLead, getLeads, updateLead };
