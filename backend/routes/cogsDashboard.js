'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');
const { TIER_INFRA_TARGETS, CUSTOMER_TIER_PRICING, USD_TO_INR_RATE } = require('../services/modelRouter');

// Internal Admin/Developer check middleware
function requireAdminOrDeveloper(req, res, next) {
  const isAuthorized = req.user && (req.user.role === 'admin' || req.user.role === 'developer' || req.user.is_admin === true);
  if (!isAuthorized) {
    return res.status(403).json({ error: 'Unauthorized cost dashboard access.' });
  }
  next();
}

/**
 * GET /cogs/summary
 * Internal cost dashboard API reporting aggregated COGS costs, tier segmentations, and gross margins.
 */
router.get('/summary', requireAuth, requireAdminOrDeveloper, async (req, res) => {
  try {
    // 1. Fetch aggregated metrics from call_cost_logs
    const costLogsRes = await db.query(
      `SELECT
        COUNT(*) as total_calls,
        COALESCE(SUM(duration_seconds), 0) as total_duration_seconds,
        COALESCE(SUM(input_tokens), 0) as total_input_tokens,
        COALESCE(SUM(output_tokens), 0) as total_output_tokens,
        COALESCE(SUM(tts_characters), 0) as total_tts_chars,
        COALESCE(SUM(stt_cost_usd), 0) as total_stt_cost_usd,
        COALESCE(SUM(tts_cost_usd), 0) as total_tts_cost_usd,
        COALESCE(SUM(llm_cost_usd), 0) as total_llm_cost_usd,
        COALESCE(SUM(telephony_cost_usd), 0) as total_telephony_cost_usd,
        COALESCE(SUM(estimated_cost_usd), 0) as total_estimated_cost_usd,
        COALESCE(SUM(estimated_cost_inr), 0) as total_estimated_cost_inr,
        COALESCE(SUM(customer_price_inr), 0) as total_customer_revenue_inr
       FROM call_cost_logs`
    );
    const costMetrics = costLogsRes.rows[0];

    // 2. Fallback to usage_logs if call_cost_logs is new
    const usageLogsRes = await db.query(
      `SELECT
        COALESCE(SUM(seconds_used), 0) as total_seconds,
        COALESCE(SUM(cost_telephony), 0) as total_telephony_cost,
        COALESCE(SUM(cost_stt), 0) as total_stt_cost,
        COALESCE(SUM(cost_tts), 0) as total_tts_cost,
        COALESCE(SUM(cost_total), 0) as total_cost
       FROM usage_logs`
    );
    const usageMetrics = usageLogsRes.rows[0];

    const totalSeconds = Math.max(
      parseFloat(costMetrics.total_duration_seconds) || 0,
      parseFloat(usageMetrics.total_seconds) || 0
    );
    const totalMinutes = Math.ceil(totalSeconds / 60);

    const totalCostUsd = parseFloat(costMetrics.total_estimated_cost_usd) || parseFloat(usageMetrics.total_cost) || 0;
    const totalCostInr = parseFloat(costMetrics.total_estimated_cost_inr) || (totalCostUsd * USD_TO_INR_RATE);
    const customerRevenueInr = parseFloat(costMetrics.total_customer_revenue_inr) || (totalMinutes * 18.0);
    const grossMarginInr = customerRevenueInr - totalCostInr;
    const grossMarginPercent = customerRevenueInr > 0 ? ((grossMarginInr / customerRevenueInr) * 100) : 0;

    // 3. Aggregate by Intelligence Tier
    const tierRes = await db.query(
      `SELECT
        tier,
        COUNT(*) as call_count,
        COALESCE(SUM(duration_seconds), 0) as duration_seconds,
        COALESCE(SUM(estimated_cost_usd), 0) as cost_usd,
        COALESCE(SUM(estimated_cost_inr), 0) as cost_inr,
        COALESCE(SUM(customer_price_inr), 0) as revenue_inr,
        ROUND(AVG(total_ttfb_ms), 2) as avg_ttfb_ms
       FROM call_cost_logs
       GROUP BY tier
       ORDER BY call_count DESC`
    );

    // 4. Aggregate by LLM Provider & Model
    const llmRes = await db.query(
      `SELECT
        provider,
        model,
        COUNT(*) as call_count,
        COALESCE(SUM(input_tokens), 0) as input_tokens,
        COALESCE(SUM(output_tokens), 0) as output_tokens,
        COALESCE(SUM(llm_cost_usd), 0) as cost_usd
       FROM call_cost_logs
       GROUP BY provider, model
       ORDER BY call_count DESC`
    );

    // 5. Aggregate by Speech Engine (STT & TTS)
    const sttRes = await db.query(
      `SELECT
        stt_provider,
        stt_model,
        COUNT(*) as call_count,
        COALESCE(SUM(stt_cost_usd), 0) as cost_usd
       FROM call_cost_logs
       GROUP BY stt_provider, stt_model`
    );

    const ttsRes = await db.query(
      `SELECT
        tts_provider,
        tts_model,
        COUNT(*) as call_count,
        COALESCE(SUM(tts_characters), 0) as characters,
        COALESCE(SUM(tts_cost_usd), 0) as cost_usd
       FROM call_cost_logs
       GROUP BY tts_provider, tts_model`
    );

    // 6. Recent Detailed Cost Logs (Last 20 calls)
    const recentLogsRes = await db.query(
      `SELECT 
        id, call_id, tier, language, provider, model, stt_provider, tts_provider,
        duration_seconds, input_tokens, output_tokens, tts_characters,
        estimated_cost_usd, estimated_cost_inr, customer_price_inr, gross_margin_percent,
        total_ttfb_ms, created_at
       FROM call_cost_logs
       ORDER BY created_at DESC
       LIMIT 20`
    );

    return res.status(200).json({
      success: true,
      summary: {
        totalCalls: parseInt(costMetrics.total_calls) || 0,
        totalSeconds: Math.round(totalSeconds),
        totalMinutes,
        totalInputTokens: parseInt(costMetrics.total_input_tokens) || 0,
        totalOutputTokens: parseInt(costMetrics.total_output_tokens) || 0,
        totalTtsCharacters: parseInt(costMetrics.total_tts_chars) || 0,
        costs: {
          sttCostUsd: parseFloat(costMetrics.total_stt_cost_usd) || parseFloat(usageMetrics.total_stt_cost) || 0,
          ttsCostUsd: parseFloat(costMetrics.total_tts_cost_usd) || parseFloat(usageMetrics.total_tts_cost) || 0,
          llmCostUsd: parseFloat(costMetrics.total_llm_cost_usd) || 0,
          telephonyCostUsd: parseFloat(costMetrics.total_telephony_cost_usd) || parseFloat(usageMetrics.total_telephony_cost) || 0,
          totalCostUsd: parseFloat(totalCostUsd.toFixed(4)),
          totalCostInr: parseFloat(totalCostInr.toFixed(2)),
        },
        financials: {
          customerRevenueInr: parseFloat(customerRevenueInr.toFixed(2)),
          grossMarginInr: parseFloat(grossMarginInr.toFixed(2)),
          grossMarginPercent: parseFloat(grossMarginPercent.toFixed(2)),
        },
        targets: TIER_INFRA_TARGETS,
      },
      segments: {
        tiers: tierRes.rows,
        llm: llmRes.rows,
        stt: sttRes.rows,
        tts: ttsRes.rows,
      },
      recentLogs: recentLogsRes.rows,
    });
  } catch (err) {
    console.error('[CogsDashboardRoute] Error fetching summary:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
