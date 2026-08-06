'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// Internal Admin/Developer check middleware
function requireAdminOrDeveloper(req, res, next) {
    const isAuthorized = req.user && (req.user.role === 'admin' || req.user.role === 'developer');
    if (!isAuthorized) {
        return res.status(403).json({ error: 'Unauthorized cost dashboard access.' });
    }
    next();
}

/**
 * GET /cogs/summary
 * Internal cost dashboard API reporting aggregated COGS costs and segmentations.
 */
router.get('/summary', requireAuth, requireAdminOrDeveloper, async (req, res) => {
    try {
        // 1. Fetch total summaries from usage_logs
        const totalsRes = await db.query(
            `SELECT
                COALESCE(SUM(seconds_used), 0) as total_seconds,
                COALESCE(SUM(cost_telephony), 0) as total_telephony_cost,
                COALESCE(SUM(cost_stt), 0) as total_stt_cost,
                COALESCE(SUM(cost_tts), 0) as total_tts_cost,
                COALESCE(SUM(cost_total), 0) as total_cost
             FROM usage_logs`
        );
        const totals = totalsRes.rows[0];

        // 2. Fetch segmentations from call_turn_metrics or usage_logs
        // Aggregate by Region
        const regionRes = await db.query(
            `SELECT 
                region, 
                COUNT(*) as turn_count,
                ROUND(AVG(end_to_end_first_audio_ms), 2) as avg_latency_ms
             FROM call_turn_metrics
             GROUP BY region`
        );

        // Aggregate by LLM Provider
        const llmRes = await db.query(
            `SELECT 
                llm_provider, 
                COUNT(*) as turn_count,
                ROUND(AVG(speech_end_to_llm_first_token_ms), 2) as avg_llm_start_ms
             FROM call_turn_metrics
             GROUP BY llm_provider`
        );

        // Aggregate by Telephony Provider
        const telRes = await db.query(
            `SELECT 
                telephony_provider, 
                COUNT(*) as turn_count,
                ROUND(AVG(speech_end_to_telephony_audio_ms), 2) as avg_tel_audio_ms
             FROM call_turn_metrics
             GROUP BY telephony_provider`
        );

        return res.status(200).json({
            totals: {
                total_minutes: Math.ceil(parseFloat(totals.total_seconds) / 60),
                total_seconds: parseInt(totals.total_seconds),
                total_telephony_cost: parseFloat(totals.total_telephony_cost),
                total_stt_cost: parseFloat(totals.total_stt_cost),
                total_tts_cost: parseFloat(totals.total_tts_cost),
                total_cost: parseFloat(totals.total_cost)
            },
            segments: {
                regions: regionRes.rows,
                llm_providers: llmRes.rows,
                telephony_providers: telRes.rows
            }
        });

    } catch (err) {
        console.error('[CogsDashboardRoute] Summary fetch error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});

module.exports = router;
