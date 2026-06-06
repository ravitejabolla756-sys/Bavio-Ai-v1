/**
 * Cache Keys and TTL Configurations for Redis Caching.
 */
export const CACHE_KEYS = {
  // Key for country-specific metrics (TTL: 5m)
  METRICS_BY_COUNTRY: (countryCode: string) => `metrics:${countryCode.toUpperCase().trim()}`,
  
  // Key for global admin dashboard metrics (TTL: 5m)
  GLOBAL_METRICS: 'metrics:global',
  
  // Key for active calls count (TTL: 10s)
  ACTIVE_CALLS: 'calls:active:count',
};

export const CACHE_TTL = {
  METRICS_BY_COUNTRY: 300, // 5 minutes (in seconds)
  GLOBAL_METRICS: 300,      // 5 minutes (in seconds)
  ACTIVE_CALLS: 10,        // 10 seconds (in seconds)
};
