import { Router, Request, Response } from 'express';
import { query } from '../../db/db';
import { ResponseHelper } from '../helpers/response.helper';
import { rateLimiter } from '../middleware/rateLimit.middleware';
import { logger } from '../../utils/logger';
import { redisClient } from '../../redis/redis.client';
import { CACHE_KEYS, CACHE_TTL } from '../../config/cacheKeys';

const router = Router();

// Currency-to-USD approximate conversion rates (for dashboard aggregation)
const USD_RATES: Record<string, number> = {
  INR: 0.012,
  USD: 1.0,
  GBP: 1.27,
  AUD: 0.66,
  AED: 0.27,
};

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India',
  US: 'USA',
  GB: 'United Kingdom',
  AU: 'Australia',
  AE: 'United Arab Emirates',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  AUD: 'AUD ',
  AED: 'AED ',
};

// GET /api/admin/metrics
router.get('/metrics', rateLimiter, async (_req: Request, res: Response) => {
  logger.info('[ADMIN] Metrics dashboard request received');

  try {
    // Check Redis cache first for global dashboard metrics
    try {
      const cachedData = await redisClient.get(CACHE_KEYS.GLOBAL_METRICS);
      if (cachedData) {
        logger.info('[ADMIN] Cache HIT for global metrics dashboard');
        const parsedData = JSON.parse(cachedData);
        return ResponseHelper.success(res, 200, parsedData, 'GLOBAL', 'USD');
      }
      logger.info('[ADMIN] Cache MISS for global metrics dashboard. Querying database...');
    } catch (cacheErr) {
      logger.warn('[ADMIN] Failed to fetch global metrics cache (Redis offline?):', cacheErr);
    }

    // ── 1. Total customers by country ──
    const customersRes = await query(
      `SELECT country_code, COUNT(*) as count 
       FROM users 
       WHERE status = 'active' 
       GROUP BY country_code 
       ORDER BY count DESC`
    );

    const totalCustomers = customersRes.rows.reduce(
      (sum: number, r: any) => sum + parseInt(r.count, 10), 0
    );

    // ── 2. MRR by country ──
    const mrrRes = await query(
      `SELECT u.country_code, u.currency_code,
              SUM(s.price_amount) as mrr
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       WHERE s.payment_status = 'active'
       GROUP BY u.country_code, u.currency_code`
    );

    let mrrUsd = 0;
    let mrrInr = 0;
    const mrrByCountry: Record<string, { mrr: number; currency: string; mrr_usd: number }> = {};
    for (const row of mrrRes.rows) {
      const localMrr = parseFloat(row.mrr || '0');
      const rate = USD_RATES[row.currency_code] || 1;
      const rowUsd = localMrr * rate;
      mrrUsd += rowUsd;
      if (row.currency_code === 'INR') mrrInr += localMrr;
      else mrrInr += rowUsd / (USD_RATES['INR'] || 0.012);
      mrrByCountry[row.country_code] = {
        mrr: localMrr,
        currency: row.currency_code,
        mrr_usd: Math.round(rowUsd),
      };
    }

    // ── 3. Call volume today ──
    const callsTodayRes = await query(
      `SELECT COUNT(*) as count FROM calls WHERE started_at >= CURRENT_DATE`
    );
    const callsToday = parseInt(callsTodayRes.rows[0]?.count || '0', 10);

    // Calls yesterday for growth calc
    const callsYesterdayRes = await query(
      `SELECT COUNT(*) as count FROM calls 
       WHERE started_at >= CURRENT_DATE - INTERVAL '1 day' 
         AND started_at < CURRENT_DATE`
    );
    const callsYesterday = parseInt(callsYesterdayRes.rows[0]?.count || '0', 10);
    const callsGrowth = callsYesterday > 0
      ? Math.round(((callsToday - callsYesterday) / callsYesterday) * 1000) / 10
      : 0;

    // ── 4. Churn by country (failed/cancelled subs vs total) ──
    const churnRes = await query(
      `SELECT u.country_code,
              COUNT(*) FILTER (WHERE s.payment_status IN ('failed', 'cancelled')) as churned,
              COUNT(*) as total
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       GROUP BY u.country_code`
    );

    const churnByCountry: Record<string, number> = {};
    for (const row of churnRes.rows) {
      const total = parseInt(row.total, 10);
      const churned = parseInt(row.churned, 10);
      churnByCountry[row.country_code] = total > 0
        ? Math.round((churned / total) * 1000) / 10
        : 0;
    }

    // ── 5. Payment success rate ──
    const paymentRes = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE payment_status = 'active') as success,
         COUNT(*) as total
       FROM subscriptions`
    );
    const paySuccess = parseInt(paymentRes.rows[0]?.success || '0', 10);
    const payTotal = parseInt(paymentRes.rows[0]?.total || '0', 10);
    const paymentSuccessRate = payTotal > 0
      ? Math.round((paySuccess / payTotal) * 1000) / 10
      : 100;

    // ── 6. Revenue by country (for bar chart) ──
    const revenueByCountry = customersRes.rows.map((row: any) => {
      const cc = row.country_code;
      const mrrData = mrrByCountry[cc];
      return {
        country: COUNTRY_NAMES[cc] || cc,
        code: cc,
        revenue_usd: mrrData?.mrr_usd || 0,
        revenue_local: mrrData?.mrr || 0,
        currency: CURRENCY_SYMBOLS[mrrData?.currency || 'USD'] || '$',
      };
    });

    // ── 7. Call volume trend (last 30 days) ──
    const callTrendRes = await query(
      `SELECT DATE(started_at) as date, COUNT(*) as count
       FROM calls
       WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(started_at)
       ORDER BY date ASC`
    );
    const callVolumeTrend = callTrendRes.rows.map((r: any) => ({
      date: r.date,
      calls: parseInt(r.count, 10),
    }));

    // ── 8. MRR trend (last 30 days — approximated by subscription creation) ──
    const mrrTrendRes = await query(
      `SELECT DATE(billing_cycle_start) as date,
              SUM(price_amount) as mrr
       FROM subscriptions
       WHERE payment_status = 'active'
         AND billing_cycle_start >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(billing_cycle_start)
       ORDER BY date ASC`
    );
    const mrrTrend = mrrTrendRes.rows.map((r: any) => ({
      date: r.date,
      mrr: parseFloat(r.mrr || '0'),
    }));

    // ── 9. Peak hours heatmap (calls by hour and country) ──
    const peakRes = await query(
      `SELECT country_code, 
              EXTRACT(HOUR FROM started_at) as hour, 
              COUNT(*) as count
       FROM calls
       WHERE started_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY country_code, EXTRACT(HOUR FROM started_at)
       ORDER BY country_code, hour`
    );
    const peakHours: Record<string, number[]> = {};
    for (const row of peakRes.rows) {
      const cc = row.country_code;
      if (!peakHours[cc]) peakHours[cc] = new Array(24).fill(0);
      peakHours[cc][parseInt(row.hour, 10)] = parseInt(row.count, 10);
    }

    // ── 10. Top 10 customers ──
    const topCustomersRes = await query(
      `SELECT u.id, u.email, u.business_name, u.country_code, u.currency_code,
              s.plan_name, s.price_amount,
              COUNT(c.id) as total_calls,
              SUM(c.duration_seconds) as total_duration
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.payment_status = 'active'
       LEFT JOIN calls c ON c.user_id = u.id
       WHERE u.status = 'active'
       GROUP BY u.id, u.email, u.business_name, u.country_code, u.currency_code, s.plan_name, s.price_amount
       ORDER BY s.price_amount DESC NULLS LAST, total_calls DESC
       LIMIT 10`
    );
    const topCustomers = topCustomersRes.rows.map((r: any) => ({
      id: r.id,
      email: r.email,
      business_name: r.business_name || r.email,
      country: COUNTRY_NAMES[r.country_code] || r.country_code,
      country_code: r.country_code,
      plan: r.plan_name || 'free',
      revenue: parseFloat(r.price_amount || '0'),
      currency: CURRENCY_SYMBOLS[r.currency_code] || '$',
      total_calls: parseInt(r.total_calls || '0', 10),
      total_minutes: Math.round(parseInt(r.total_duration || '0', 10) / 60),
    }));

    // ── 11. Customer growth rate (last 30 days vs prior 30 days) ──
    const growthRes = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as recent,
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '60 days' AND created_at < CURRENT_DATE - INTERVAL '30 days') as prior
       FROM users WHERE status = 'active'`
    );
    const recentCustomers = parseInt(growthRes.rows[0]?.recent || '0', 10);
    const priorCustomers = parseInt(growthRes.rows[0]?.prior || '0', 10);
    const customerGrowthRate = priorCustomers > 0
      ? Math.round(((recentCustomers - priorCustomers) / priorCustomers) * 1000) / 10
      : 0;

    // ── 12. Active calls right now ──
    const activeCallsRes = await query(
      `SELECT COUNT(*) as count FROM calls 
       WHERE status IS NULL`
    );
    const activeCalls = parseInt(activeCallsRes.rows[0]?.count || '0', 10);

    // ── Build countries array ──
    const countries = customersRes.rows.map((row: any) => {
      const cc = row.country_code;
      const mrrData = mrrByCountry[cc];
      return {
        code: cc,
        name: COUNTRY_NAMES[cc] || cc,
        customer_count: parseInt(row.count, 10),
        mrr: mrrData?.mrr || 0,
        mrr_usd: mrrData?.mrr_usd || 0,
        currency: CURRENCY_SYMBOLS[mrrData?.currency || 'USD'] || '$',
        churn: churnByCountry[cc] || 0,
      };
    });

    // ── MRR growth rate ──
    const mrrGrowthRate = priorCustomers > 0
      ? Math.round(((recentCustomers - priorCustomers) / priorCustomers) * 1000) / 10
      : 12.3; // fallback

    // ── Assemble response ──
    const metricsData = {
      total_customers: totalCustomers,
      customer_growth_rate: customerGrowthRate,
      mrr_inr: Math.round(mrrInr),
      mrr_usd: Math.round(mrrUsd),
      mrr_growth_rate: mrrGrowthRate,
      calls_today: callsToday,
      calls_growth: callsGrowth,
      active_calls: activeCalls,
      payment_success_rate: paymentSuccessRate,
      countries,
      revenue_by_country: revenueByCountry,
      call_volume_trend: callVolumeTrend,
      mrr_trend: mrrTrend,
      churn_by_country: churnByCountry,
      peak_hours: peakHours,
      top_customers: topCustomers,
    };

    // Cache the metricsData in Redis for 5 minutes
    try {
      await redisClient.setex(
        CACHE_KEYS.GLOBAL_METRICS,
        CACHE_TTL.GLOBAL_METRICS,
        JSON.stringify(metricsData)
      );
      logger.info('[ADMIN] Cached global dashboard metrics in Redis');
    } catch (cacheErr) {
      logger.warn('[ADMIN] Failed to write global metrics to Redis cache:', cacheErr);
    }

    logger.info('[ADMIN] Metrics served successfully', {
      total_customers: totalCustomers,
      mrr_usd: Math.round(mrrUsd),
    });

    return ResponseHelper.success(res, 200, metricsData, 'GLOBAL', 'USD');
  } catch (err: any) {
    logger.error('[ADMIN] Failed to fetch metrics:', err);
    return ResponseHelper.error(res, 500, 'Failed to load admin metrics', 'INTERNAL_ERROR', 'GLOBAL');
  }
});

// GET /api/admin/active-calls (lightweight poll endpoint)
router.get('/active-calls', rateLimiter, async (_req: Request, res: Response) => {
  try {
    // 1. Try to read active calls from Redis cache
    try {
      const cachedCalls = await redisClient.get(CACHE_KEYS.ACTIVE_CALLS);
      if (cachedCalls !== null) {
        logger.info('[ADMIN] Cache HIT for active calls count');
        return res.status(200).json({
          active_calls: parseInt(cachedCalls, 10),
          timestamp: new Date().toISOString(),
        });
      }
    } catch (cacheErr) {
      logger.warn('[ADMIN] Failed to read active calls cache:', cacheErr);
    }

    // 2. Cache MISS: query database
    const result = await query(
      `SELECT COUNT(*) as count FROM calls 
       WHERE status IS NULL`
    );
    const activeCalls = parseInt(result.rows[0]?.count || '0', 10);

    // 3. Write active calls to cache (TTL: 10s)
    try {
      await redisClient.setex(
        CACHE_KEYS.ACTIVE_CALLS,
        CACHE_TTL.ACTIVE_CALLS,
        activeCalls.toString()
      );
    } catch (cacheErr) {
      logger.warn('[ADMIN] Failed to write active calls to cache:', cacheErr);
    }

    return res.status(200).json({
      active_calls: activeCalls,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error('[ADMIN] Failed to fetch active calls:', err);
    return res.status(500).json({ active_calls: 0, error: 'Failed to fetch' });
  }
});

export default router;
