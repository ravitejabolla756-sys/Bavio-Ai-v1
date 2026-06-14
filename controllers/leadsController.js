const db = require('../database/db');

async function createLead(req, res) {
    try {
        const business_id = req.user.id;
        const phone = req.body.phone || req.body.caller_number;
        const { intent, budget, notes, name, location, call_id } = req.body;
        
        if (!phone) {
            return res.status(400).json({ error: 'phone is required' });
        }

        const result = await db.query(
            `INSERT INTO leads (business_id, call_id, phone, name, intent, budget, location, status, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'new', $8) RETURNING *`,
            [business_id, call_id || null, phone, name || null, intent || null, budget || null, location || null, notes || null]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('[LEADS CONTROLLER] Create error explicitly:', err.message);
        res.status(500).json({ error: err.message });
    }
}

async function getLeads(req, res) {
    try {
        const business_id = req.user.id;
        
        const result = await db.query(
            `SELECT * FROM leads WHERE business_id = $1 ORDER BY created_at DESC`,
            [business_id]
        );
        
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('[LEADS CONTROLLER] Get error explicitly:', err.message);
        res.status(500).json({ error: err.message });
    }
}

async function updateLead(req, res) {
    try {
        const { id } = req.params;
        const business_id = req.user.id;
        const { status, intent, budget, notes, name, location } = req.body;
        
        const result = await db.query(
            `UPDATE leads 
             SET status = COALESCE($1, status),
                 intent = COALESCE($2, intent),
                 budget = COALESCE($3, budget),
                 notes = COALESCE($4, notes),
                 name = COALESCE($5, name),
                 location = COALESCE($6, location)
             WHERE id = $7 AND business_id = $8 RETURNING *`,
            [
                status !== undefined ? status : null,
                intent !== undefined ? intent : null,
                budget !== undefined ? budget : null,
                notes !== undefined ? notes : null,
                name !== undefined ? name : null,
                location !== undefined ? location : null,
                id,
                business_id
            ]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead not found or unauthorized' });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('[LEADS CONTROLLER] Update error explicitly:', err.message);
        res.status(500).json({ error: err.message });
    }
}

module.exports = { createLead, getLeads, updateLead };
