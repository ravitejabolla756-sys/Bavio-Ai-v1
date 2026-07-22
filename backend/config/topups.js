/**
 * Bavio Canonical Top-Up Configuration
 * Single source of truth for prepaid minute top-ups.
 *
 * Top-ups are one-time purchases — not subscriptions.
 * Minutes are added only after verified Dodo webhook.
 * No minutes are granted from checkout redirects or browser payloads.
 */

const TOPUPS_CONFIG = {
  topup_100: {
    id: 'topup_100',
    name: '100-Minute Top-Up',
    price: 25,
    currency: 'USD',
    minutes: 100,
    seconds: 6000,                    // 100 min × 60
    paymentType: 'one_time',
    dodoProductEnv: 'DODO_TOPUP_100_PRODUCT_ID',
    publiclyAvailable: true,
    description: '100 prepaid connected call minutes',
    noAutoRenewal: true,
  },

  topup_250: {
    id: 'topup_250',
    name: '250-Minute Top-Up',
    price: 55,
    currency: 'USD',
    minutes: 250,
    seconds: 15000,                   // 250 min × 60
    paymentType: 'one_time',
    dodoProductEnv: 'DODO_TOPUP_250_PRODUCT_ID',
    publiclyAvailable: true,
    description: '250 prepaid connected call minutes',
    noAutoRenewal: true,
  },
};

/**
 * Resolves the Dodo product ID for a top-up from environment variables.
 * Returns null if the env var is not set yet.
 */
function getTopupProductId(topupKey) {
  const config = TOPUPS_CONFIG[topupKey];
  if (!config?.dodoProductEnv) return null;
  return process.env[config.dodoProductEnv] || null;
}

/**
 * Reverse-lookup: given a Dodo product ID, return the top-up key.
 * Returns null for unknown product IDs.
 */
function productIdToTopup(productId) {
  if (!productId) return null;
  for (const [key, config] of Object.entries(TOPUPS_CONFIG)) {
    if (config.dodoProductEnv) {
      const envId = process.env[config.dodoProductEnv];
      if (envId && envId === productId) return key;
    }
  }
  return null;
}

/**
 * Returns whether checkout is available for a top-up.
 * False when the Dodo product ID env var is not configured.
 */
function isTopupCheckoutAvailable(topupKey) {
  return !!getTopupProductId(topupKey);
}

module.exports = {
  TOPUPS_CONFIG,
  getTopupProductId,
  productIdToTopup,
  isTopupCheckoutAvailable,
};
