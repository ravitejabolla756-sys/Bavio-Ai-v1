/**
 * Bavio Canonical Plan Configuration
 * Single source of truth for subscription plans.
 * No postpaid overage. No $0.18/min billing.
 * Minutes tracked internally as seconds.
 */

const PLANS_CONFIG = {
  starter: {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 39,
    currency: 'USD',
    monthlyMinutes: 200,
    monthlyLimitSeconds: 12000,       // 200 min × 60
    includedPhoneNumbers: 1,
    dodoProductEnv: 'DODO_STARTER_PRODUCT_ID',
    publiclyAvailable: true,
    contactSales: false,
    checkoutAvailable: true,          // resolved dynamically at runtime
    // Legacy aliases kept for backwards compatibility — do NOT use in new code
    includedMinutes: 200,
    includedNumbers: 1,
  },

  growth: {
    id: 'growth',
    name: 'Growth',
    priceMonthly: 99,
    currency: 'USD',
    monthlyMinutes: 500,
    monthlyLimitSeconds: 30000,       // 500 min × 60
    includedPhoneNumbers: 1,
    dodoProductEnv: 'DODO_GROWTH_PRODUCT_ID',
    publiclyAvailable: true,
    contactSales: false,
    checkoutAvailable: true,
    // Legacy
    includedMinutes: 500,
    includedNumbers: 1,
  },

  scale: {
    id: 'scale',
    name: 'Scale',
    priceMonthly: 249,
    currency: 'USD',
    monthlyMinutes: 1500,
    monthlyLimitSeconds: 90000,       // 1500 min × 60
    includedPhoneNumbers: 1,
    dodoProductEnv: 'DODO_SCALE_PRODUCT_ID',
    publiclyAvailable: true,
    contactSales: false,
    checkoutAvailable: true,
    // Legacy
    includedMinutes: 1500,
    includedNumbers: 1,
  },

  business: {
    id: 'business',
    name: 'Business',
    priceMonthly: null,
    currency: 'USD',
    monthlyMinutes: null,
    monthlyLimitSeconds: null,
    includedPhoneNumbers: null,
    dodoProductEnv: null,
    publiclyAvailable: true,
    contactSales: true,
    checkoutAvailable: false,
    // Legacy
    includedMinutes: null,
    includedNumbers: null,
  },
};

/**
 * Returns the monthly limit in seconds for a given plan key.
 * Defaults to 0 for unknown or free plans.
 */
function getPlanLimitSeconds(planKey) {
  const config = PLANS_CONFIG[planKey?.toLowerCase()];
  return config?.monthlyLimitSeconds || 0;
}

/**
 * Returns the monthly limit in minutes for a given plan key.
 */
function getPlanMinutes(planKey) {
  const config = PLANS_CONFIG[planKey?.toLowerCase()];
  return config?.monthlyMinutes || 0;
}

/**
 * Resolves the Dodo product ID for a plan from environment variables.
 * Returns null if not configured.
 */
function getPlanProductId(planKey) {
  const config = PLANS_CONFIG[planKey?.toLowerCase()];
  if (!config?.dodoProductEnv) return null;
  return process.env[config.dodoProductEnv] || null;
}

/**
 * Reverse-lookup: given a Dodo product ID, return the plan key.
 * Returns null for unknown product IDs.
 */
function productIdToPlan(productId) {
  if (!productId) return null;
  for (const [key, config] of Object.entries(PLANS_CONFIG)) {
    if (config.dodoProductEnv) {
      const envId = process.env[config.dodoProductEnv];
      if (envId && envId === productId) return key;
    }
  }
  return null;
}

module.exports = {
  PLANS_CONFIG,
  getPlanLimitSeconds,
  getPlanMinutes,
  getPlanProductId,
  productIdToPlan,
};
