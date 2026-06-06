import { query } from '../db';
import { redisClient } from '../../redis/redis.client';
import { CACHE_KEYS, CACHE_TTL } from '../../config/cacheKeys';
import { logger } from '../../utils/logger';

export class DbOptimizationsService {
  /**
   * Refreshes the metrics materialized view concurrently.
   * Concurrent refreshes do not lock read queries on the view.
   */
  static async refreshMetricsView(): Promise<void> {
    try {
      logger.info('[DB OPTIMIZATION] Starting concurrent metrics view refresh...');
      await query('REFRESH MATERIALIZED VIEW CONCURRENTLY metrics_by_country');
      logger.info('[DB OPTIMIZATION] Concurrent metrics view refresh succeeded.');
    } catch (err: any) {
      logger.error('[DB OPTIMIZATION] Failed to refresh metrics view:', err);
      // Fallback to non-concurrent if unique index fails or under special lock scenarios
      if (err.code === '55006' || err.message?.includes('CONCURRENTLY')) {
        try {
          logger.warn('[DB OPTIMIZATION] Retrying view refresh in non-concurrent mode...');
          await query('REFRESH MATERIALIZED VIEW metrics_by_country');
          logger.info('[DB OPTIMIZATION] View refresh (non-concurrent) succeeded.');
        } catch (fallbackErr) {
          logger.error('[DB OPTIMIZATION] Fallback view refresh failed:', fallbackErr);
        }
      }
    }
  }

  /**
   * Fetches country metrics utilizing Redis caching with database fallback.
   */
  static async getCountryMetrics(countryCode: string): Promise<any> {
    const cacheKey = CACHE_KEYS.METRICS_BY_COUNTRY(countryCode);

    try {
      // 1. Try to fetch from Redis cache
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.info(`[DB OPTIMIZATION] Cache HIT for metrics:${countryCode}`);
        return JSON.parse(cached);
      }
    } catch (redisErr) {
      // Fail gracefully if Redis is offline
      logger.warn('[DB OPTIMIZATION] Redis read error (is Redis running?):', redisErr);
    }

    // 2. Database Fallback (Query from the Materialized View)
    logger.info(`[DB OPTIMIZATION] Cache MISS. Querying database metrics for: ${countryCode}`);
    const result = await query(
      `SELECT country_code, total_customers, total_calls, 
              monthly_revenue::float as monthly_revenue, 
              avg_arpu::float as avg_arpu, 
              last_calculated_at
       FROM metrics_by_country 
       WHERE country_code = $1`,
      [countryCode.toUpperCase().trim()]
    );

    const metrics = result.rows[0] || {
      country_code: countryCode,
      total_customers: 0,
      total_calls: 0,
      monthly_revenue: 0,
      avg_arpu: 0,
      last_calculated_at: new Date().toISOString()
    };

    try {
      // 3. Cache the resolved metrics in Redis
      await redisClient.setex(
        cacheKey,
        CACHE_TTL.METRICS_BY_COUNTRY,
        JSON.stringify(metrics)
      );
      logger.info(`[DB OPTIMIZATION] Cached metrics for country: ${countryCode}`);
    } catch (redisErr) {
      logger.warn('[DB OPTIMIZATION] Redis write error (is Redis running?):', redisErr);
    }

    return metrics;
  }

  /**
   * Invalidates cached metrics for a specific country.
   */
  static async invalidateCountryMetricsCache(countryCode: string): Promise<void> {
    const cacheKey = CACHE_KEYS.METRICS_BY_COUNTRY(countryCode);
    try {
      await redisClient.del(cacheKey);
      logger.info(`[DB OPTIMIZATION] Invalidated cache for key: ${cacheKey}`);
    } catch (redisErr) {
      logger.warn('[DB OPTIMIZATION] Redis delete error:', redisErr);
    }
  }

  /**
   * Invalidates global metrics cache.
   */
  static async invalidateGlobalMetricsCache(): Promise<void> {
    try {
      await redisClient.del(CACHE_KEYS.GLOBAL_METRICS);
      logger.info(`[DB OPTIMIZATION] Invalidated cache for key: ${CACHE_KEYS.GLOBAL_METRICS}`);
    } catch (redisErr) {
      logger.warn('[DB OPTIMIZATION] Redis delete error:', redisErr);
    }
  }
}
