const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../database/db');

router.get('/current-plan', requireAuth, async (req, res) => {
  try {
    const businessId = req.user.id;
    const result = await db.query(
      'SELECT plan_name, minutes_used, minutes_limit FROM businesses WHERE id = $1',
      [businessId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = result.rows[0];
    return res.status(200).json({
      plan: (row.plan_name || 'free').toLowerCase(),
      minutes_used: Number(row.minutes_used || 0),
      minutes_limit: Number(row.minutes_limit || 30)
    });
  } catch (err) {
    console.error('GET current-plan failed:', err.message);
    return res.status(500).json({ error: 'Failed to fetch current plan status' });
  }
});

module.exports = router;
