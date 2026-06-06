import { Router, Request, Response } from 'express';
import { query } from '../../db/db';
import { ResponseHelper } from '../helpers/response.helper';
import { rateLimiter } from '../middleware/rateLimit.middleware';
import { logger } from '../../utils/logger';
import { MetricsService } from '../../monitoring/metrics';

const router = Router();

// GET /api/admin/analytics/summary
router.get('/analytics/summary', rateLimiter, async (_req: Request, res: Response) => {
  logger.info('[ADMIN] Fetching analytics history summary...');
  
  try {
    // Retrieve past 30 days of metrics
    const result = await query(
      `SELECT * FROM daily_metrics 
       ORDER BY metric_date DESC 
       LIMIT 30`
    );

    return ResponseHelper.success(res, 200, result.rows, 'GLOBAL', 'USD');
  } catch (err: any) {
    logger.error('[ADMIN] Failed to load analytics summary:', err);
    return ResponseHelper.error(res, 500, 'Failed to load analytics summaries', 'INTERNAL_ERROR', 'GLOBAL');
  }
});

// GET /api/admin/analytics/alerts
router.get('/analytics/alerts', rateLimiter, async (req: Request, res: Response) => {
  const status = req.query.status as string || 'active';
  logger.info(`[ADMIN] Fetching system alerts logs (status: ${status})...`);

  try {
    const result = await query(
      `SELECT * FROM system_alerts 
       WHERE status = $1 
       ORDER BY triggered_at DESC`,
      [status]
    );

    return ResponseHelper.success(res, 200, result.rows, 'GLOBAL', 'USD');
  } catch (err: any) {
    logger.error('[ADMIN] Failed to query system alerts:', err);
    return ResponseHelper.error(res, 500, 'Failed to fetch system alerts logs', 'INTERNAL_ERROR', 'GLOBAL');
  }
});

// POST /api/admin/analytics/trigger-daily-metrics
router.post('/analytics/trigger-daily-metrics', rateLimiter, async (_req: Request, res: Response) => {
  logger.info('[ADMIN] Manual override: Triggering daily metrics calculation...');

  try {
    const summary = await MetricsService.calculateDailyMetrics();
    const reportText = await MetricsService.sendDailyCoFounderReport();

    return ResponseHelper.success(
      res,
      200,
      { summary, report_preview: reportText },
      'GLOBAL',
      'USD'
    );
  } catch (err: any) {
    logger.error('[ADMIN] Manual metrics calculation failed:', err);
    return ResponseHelper.error(res, 500, 'Failed to compute daily metrics manually', 'INTERNAL_ERROR', 'GLOBAL');
  }
});

// POST /api/admin/analytics/resolve-alert/:id
router.post('/analytics/resolve-alert/:id', rateLimiter, async (req: Request, res: Response) => {
  const alertId = req.params.id;
  logger.info(`[ADMIN] Resolving system alert incident: ${alertId}`);

  try {
    const result = await query(
      `UPDATE system_alerts 
       SET status = 'resolved', resolved_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [alertId]
    );

    if (result.rows.length === 0) {
      return ResponseHelper.error(res, 404, 'Alert incident not found', 'NOT_FOUND', 'GLOBAL');
    }

    return ResponseHelper.success(res, 200, result.rows[0], 'GLOBAL', 'USD');
  } catch (err: any) {
    logger.error('[ADMIN] Failed to resolve alert:', err);
    return ResponseHelper.error(res, 500, 'Failed to resolve alert incident record', 'INTERNAL_ERROR', 'GLOBAL');
  }
});

export default router;
