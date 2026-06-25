const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { requireAuth } = require('../middleware/auth');
const db = require('../database/db');

router.get('/:client_id', requireAuth, analyticsController.getCalls);

// POST /calls/demo - save a completed demo call
router.post('/demo', requireAuth, async (req, res) => {
    try {
        const business_id = req.user.id;
        const { caller_number, duration, call_status, transcript } = req.body;
        
        const result = await db.query(
            `INSERT INTO calls (
                user_id, country_code, call_sid, provider, from_number, virtual_number, 
                started_at, ended_at, status, duration_seconds, cost_amount, cost_currency, transcript, created_at
             )
             VALUES ($1, 'IN', $2, 'twilio', $3, '+919988122334', NOW(), NOW(), $4, $5, 0, 'INR', $6, NOW()) RETURNING *`,
            [business_id, `demo_${Date.now()}`, caller_number, call_status || 'completed', duration || 150, transcript || '']
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('[CALLS ROUTE] Demo create error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

