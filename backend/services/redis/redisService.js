/**
 * redisService.js
 * ─────────────────────────────────────────────────────────────────────
 * Smart Redis wrapper for Bavio AI call sessions.
 *
 * • No REDIS_URL in .env  → uses in-memory Map (zero dependencies)
 * • REDIS_URL in .env      → connects to real Redis via ioredis
 */

const inMemoryStore = new Map();

let redisClient = null;
let usingRealRedis = false;

// ── Try to connect to real Redis if REDIS_URL exists ─────────────────
async function initRedis() {
  if (!process.env.REDIS_URL) {
    console.log('[REDIS] No REDIS_URL found — using in-memory fallback');
    return;
  }
  try {
    const { default: Redis } = await import('ioredis');
    redisClient = new Redis(process.env.REDIS_URL);
    redisClient.on('connect', () => {
      usingRealRedis = true;
      console.log('[REDIS] Connected to real Redis');
    });
    redisClient.on('error', (err) => {
      console.error('[REDIS] Error:', err.message);
      console.log('[REDIS] Falling back to in-memory store');
      usingRealRedis = false;
      redisClient = null;
    });
  } catch (err) {
    console.log('[REDIS] ioredis not available — using in-memory fallback');
  }
}

// ── setSession ────────────────────────────────────────────────────────
// Store call session data
async function setSession(key, value, ttlSeconds = 3600) {
  const serialized = JSON.stringify(value);
  if (usingRealRedis && redisClient) {
    await redisClient.setex(key, ttlSeconds, serialized);
  } else {
    inMemoryStore.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }
}

// ── getSession ────────────────────────────────────────────────────────
// Retrieve call session data
async function getSession(key) {
  if (usingRealRedis && redisClient) {
    const val = await redisClient.get(key);
    return val ? JSON.parse(val) : null;
  }
  const item = inMemoryStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    inMemoryStore.delete(key);
    return null;
  }
  return JSON.parse(item.value);
}

// ── updateSession ─────────────────────────────────────────────────────
// Update specific fields in existing session
async function updateSession(key, updates) {
  const existing = await getSession(key);
  if (!existing) return null;
  const merged = { ...existing, ...updates };
  await setSession(key, merged);
  return merged;
}

// ── deleteSession ─────────────────────────────────────────────────────
// Delete session when call ends
async function deleteSession(key) {
  if (usingRealRedis && redisClient) {
    await redisClient.del(key);
  } else {
    inMemoryStore.delete(key);
  }
}

// ── sessionExists ─────────────────────────────────────────────────────
// Check if session exists
async function sessionExists(key) {
  if (usingRealRedis && redisClient) {
    return (await redisClient.exists(key)) === 1;
  }
  const item = inMemoryStore.get(key);
  if (!item) return false;
  if (Date.now() > item.expiresAt) {
    inMemoryStore.delete(key);
    return false;
  }
  return true;
}

// Initialize on module load
initRedis();

module.exports = {
  setSession,
  getSession,
  updateSession,
  deleteSession,
  sessionExists
};
