'use strict';

const axios = require('axios');

const REGIONS = {
  US: { code: 'US', domain: 'voice-us.bavio.in', url: 'wss://voice-us.bavio.in', httpUrl: 'https://voice-us.bavio.in', fallbackOrder: ['EU', 'AU', 'IN'] },
  EU: { code: 'EU', domain: 'voice-eu.bavio.in', url: 'wss://voice-eu.bavio.in', httpUrl: 'https://voice-eu.bavio.in', fallbackOrder: ['US', 'AU', 'IN'] },
  AU: { code: 'AU', domain: 'voice-au.bavio.in', url: 'wss://voice-au.bavio.in', httpUrl: 'https://voice-au.bavio.in', fallbackOrder: ['US', 'EU', 'IN'] },
  IN: { code: 'IN', domain: 'voice-in.bavio.in', url: 'wss://voice-in.bavio.in', httpUrl: 'https://voice-in.bavio.in', fallbackOrder: ['US', 'EU', 'AU'] }
};

const healthCache = {
  US: { healthy: true, lastChecked: 0 },
  EU: { healthy: true, lastChecked: 0 },
  AU: { healthy: true, lastChecked: 0 },
  IN: { healthy: true, lastChecked: 0 }
};

const CACHE_TIMEOUT_MS = 60000; // 1 minute

async function updateRegionHealth(regionKey) {
  const reg = REGIONS[regionKey];
  
  // Use config override url if provided in env
  const envUrl = process.env[`VOICE_WORKER_HTTP_${regionKey}`];
  const targetUrl = envUrl || reg.httpUrl;
  
  try {
    const res = await axios.get(`${targetUrl}/health`, { timeout: 3000 });
    healthCache[regionKey].healthy = (res.status === 200 && res.data.status === 'healthy');
  } catch (err) {
    console.warn(`[RegionalRouter] Health check failed for ${regionKey}: ${err.message}`);
    healthCache[regionKey].healthy = false;
  }
  healthCache[regionKey].lastChecked = Date.now();
}

/**
 * Selects the optimal regional voice worker base WebSocket URL.
 * Implements regional failure routing using in-memory health checks.
 */
async function selectWorkerRegionUrl({ toNumber = '', toCountry = '', fromCountry = '' }) {
  // 1. Detect target region based on phone number prefix
  let primaryRegion = 'US';
  const cleanTo = toNumber.replace(/[^0-9+]/g, '');

  if (cleanTo.startsWith('+44')) {
    primaryRegion = 'EU';
  } else if (cleanTo.startsWith('+61')) {
    primaryRegion = 'AU';
  } else if (cleanTo.startsWith('+91')) {
    primaryRegion = 'IN';
  } else {
    // Fallback check on country code ISO strings
    const country = (toCountry || fromCountry || '').toUpperCase();
    if (['GB', 'DE', 'FR', 'IT', 'ES', 'NL'].includes(country)) {
      primaryRegion = 'EU';
    } else if (country === 'AU') {
      primaryRegion = 'AU';
    } else if (country === 'IN') {
      primaryRegion = 'IN';
    }
  }

  // 2. Refresh health check of the primary region if expired
  const now = Date.now();
  if (now - healthCache[primaryRegion].lastChecked > CACHE_TIMEOUT_MS) {
    await updateRegionHealth(primaryRegion).catch(() => {});
  }

  // 3. If primary region is healthy, route immediately
  if (healthCache[primaryRegion].healthy) {
    const envWsUrl = process.env[`VOICE_WORKER_WS_${primaryRegion}`];
    return envWsUrl || REGIONS[primaryRegion].url;
  }

  // 4. Failure Routing: try fallbacks sequentially
  console.warn(`[RegionalRouter] Primary region ${primaryRegion} is unhealthy. Attempting regional failure routing...`);
  const fallbacks = REGIONS[primaryRegion].fallbackOrder;
  
  for (const fallback of fallbacks) {
    if (now - healthCache[fallback].lastChecked > CACHE_TIMEOUT_MS) {
      await updateRegionHealth(fallback).catch(() => {});
    }
    if (healthCache[fallback].healthy) {
      console.log(`[RegionalRouter] Failover route triggered: routing call to ${fallback}`);
      const envWsUrl = process.env[`VOICE_WORKER_WS_${fallback}`];
      return envWsUrl || REGIONS[fallback].url;
    }
  }

  // 5. Total outage fallback: default to US domain or local configuration
  console.error('[RegionalRouter] All regional voice workers are unhealthy. Defaulting to US worker.');
  const defaultWs = process.env.VOICE_WORKER_WS_US || process.env.VOICE_WEBSOCKET_URL || 'ws://localhost:5002';
  return defaultWs;
}

module.exports = {
  selectWorkerRegionUrl,
  healthCache,
  REGIONS
};
