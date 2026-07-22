/**
 * Bavio Dodo Billing Service
 * Handles all Dodo Payments API calls for subscriptions and one-time top-ups.
 * No postpaid overage. No $0.18/min billing.
 */

const axios = require('axios');
const { PLANS_CONFIG, getPlanProductId, productIdToPlan } = require('../config/plans');
const { TOPUPS_CONFIG, getTopupProductId, productIdToTopup } = require('../config/topups');

const DODO_API_KEY  = process.env.DODO_API_KEY;
const DODO_BASE_URL = 'https://api.dodopayments.com';

// ── Plan display names ─────────────────────────────────────────────────
const PLAN_DISPLAY_NAMES = { free: 'Free Trial' };
for (const [slug, plan] of Object.entries(PLANS_CONFIG)) {
    PLAN_DISPLAY_NAMES[slug] = plan.name;
}

// ── Plan limits (seconds and minutes) ─────────────────────────────────
const PLAN_LIMIT_SECONDS = { free: 0 };
const PLAN_MINUTES       = { free: 0 };
const BASE_COSTS_USD     = { free: 0 };

for (const [slug, plan] of Object.entries(PLANS_CONFIG)) {
    PLAN_LIMIT_SECONDS[slug] = plan.monthlyLimitSeconds || 0;
    PLAN_MINUTES[slug]       = plan.monthlyMinutes || 0;
    BASE_COSTS_USD[slug]     = plan.priceMonthly || 0;
}

// ── Legacy stubs (kept for backwards-compat, deprecated) ──────────────
/** @deprecated Use second-based tracking instead */
const OVERAGE_RATES = {};
const BASE_COSTS    = {};
const PLAN_LIMITS   = {};
for (const [slug] of Object.entries(PLANS_CONFIG)) {
    OVERAGE_RATES[slug] = 0;
    BASE_COSTS[slug]    = 0;
    PLAN_LIMITS[slug]   = PLAN_MINUTES[slug];
}

// ── Subscription: Create ───────────────────────────────────────────────
async function createSubscription(client_id, plan, email, billingCycle = 'monthly') {
    const productId = getPlanProductId(plan);
    if (!productId) {
        throw new Error(`Missing Dodo product ID for plan: ${plan}. Set the ${PLANS_CONFIG[plan?.toLowerCase()]?.dodoProductEnv} environment variable.`);
    }

    try {
        const response = await axios.post(
            `${DODO_BASE_URL}/v1/subscriptions`,
            {
                product_id: productId,
                customer: { email },
                metadata: {
                    client_id:     client_id.toString(),
                    business_id:   client_id.toString(),
                    plan,
                    billing_cycle: billingCycle,
                },
            },
            {
                headers: {
                    Authorization:  `Bearer ${DODO_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return {
            subscriptionId: response.data.subscription_id,
            customerId:     response.data.customer?.id,
            status:         response.data.status,
            checkoutUrl:    response.data.checkout_url,
            plan,
            billingCycle,
        };
    } catch (error) {
        console.error('Dodo createSubscription error:', error.response?.data || error.message);

        // Development mock fallback (network errors only)
        if (process.env.NODE_ENV !== 'production') {
            if (['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'].includes(error.code)) {
                console.warn('[Dodo] Offline — returning mock subscription for development.');
                return {
                    subscriptionId: 'sub_mock_' + Math.random().toString(36).substring(2, 15),
                    customerId:     'cust_mock_' + Math.random().toString(36).substring(2, 15),
                    status:         'pending',
                    checkoutUrl:    `https://checkout.dodopayments.com/buy/mock?client_id=${client_id}&plan=${plan}`,
                    plan,
                    billingCycle,
                };
            }
        }
        throw new Error(error.response?.data?.message || 'Failed to create subscription');
    }
}

// ── Top-Up: Create one-time checkout ─────────────────────────────────
async function createTopupCheckout(businessId, topupId, email) {
    const topupConfig = TOPUPS_CONFIG[topupId];
    if (!topupConfig) {
        throw new Error(`Invalid top-up ID: ${topupId}`);
    }

    const productId = getTopupProductId(topupId);
    if (!productId) {
        throw new Error(`Missing Dodo product ID for top-up: ${topupId}. Set the ${topupConfig.dodoProductEnv} environment variable.`);
    }

    try {
        const response = await axios.post(
            `${DODO_BASE_URL}/v1/payments`,
            {
                product_id: productId,
                customer:   { email },
                metadata: {
                    business_id: businessId.toString(),
                    topup_id:    topupId,
                    topup_type:  topupId,
                    minutes:     topupConfig.minutes.toString(),
                    seconds:     topupConfig.seconds.toString(),
                },
            },
            {
                headers: {
                    Authorization:  `Bearer ${DODO_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return {
            paymentId:   response.data.payment_id || response.data.id,
            checkoutUrl: response.data.checkout_url,
            topupId,
            minutes:     topupConfig.minutes,
            amount:      topupConfig.price,
            currency:    topupConfig.currency,
        };
    } catch (error) {
        console.error('Dodo createTopupCheckout error:', error.response?.data || error.message);

        // Development mock fallback
        if (process.env.NODE_ENV !== 'production') {
            if (['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'].includes(error.code)) {
                console.warn('[Dodo] Offline — returning mock top-up checkout for development.');
                return {
                    paymentId:   'pay_mock_' + Math.random().toString(36).substring(2, 15),
                    checkoutUrl: `https://checkout.dodopayments.com/buy/mock?topup=${topupId}&biz=${businessId}`,
                    topupId,
                    minutes:     topupConfig.minutes,
                    amount:      topupConfig.price,
                    currency:    topupConfig.currency,
                };
            }
        }
        throw new Error(error.response?.data?.message || 'Failed to create top-up checkout');
    }
}

// ── Subscription: Get ─────────────────────────────────────────────────
async function getSubscription(subscriptionId) {
    try {
        const response = await axios.get(
            `${DODO_BASE_URL}/v1/subscriptions/${subscriptionId}`,
            { headers: { Authorization: `Bearer ${DODO_API_KEY}` } }
        );
        return response.data;
    } catch (error) {
        console.error('Dodo getSubscription error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch subscription');
    }
}

// ── Subscription: Cancel ──────────────────────────────────────────────
async function cancelSubscription(subscriptionId) {
    try {
        const response = await axios.post(
            `${DODO_BASE_URL}/v1/subscriptions/${subscriptionId}/cancel`,
            {},
            {
                headers: {
                    Authorization:  `Bearer ${DODO_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Dodo cancelSubscription error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to cancel subscription');
    }
}

// ── Subscription: Update product (plan change) ────────────────────────
async function updateSubscription(subscriptionId, newProductId) {
    try {
        const response = await axios.patch(
            `${DODO_BASE_URL}/v1/subscriptions/${subscriptionId}`,
            { product_id: newProductId },
            {
                headers: {
                    Authorization:  `Bearer ${DODO_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error('Dodo updateSubscription error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to update subscription');
    }
}

// ── Payment lookups ───────────────────────────────────────────────────
async function getCustomerPayments(customerId) {
    try {
        const response = await axios.get(
            `${DODO_BASE_URL}/v1/customers/${customerId}/payments`,
            { headers: { Authorization: `Bearer ${DODO_API_KEY}` } }
        );
        return response.data;
    } catch (error) {
        console.error('Dodo getCustomerPayments error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch payments');
    }
}

async function getPayment(paymentId) {
    try {
        const response = await axios.get(
            `${DODO_BASE_URL}/v1/payments/${paymentId}`,
            { headers: { Authorization: `Bearer ${DODO_API_KEY}` } }
        );
        return response.data;
    } catch (error) {
        console.error('Dodo getPayment error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch payment');
    }
}

async function getCustomer(customerId) {
    try {
        const response = await axios.get(
            `${DODO_BASE_URL}/v1/customers/${customerId}`,
            { headers: { Authorization: `Bearer ${DODO_API_KEY}` } }
        );
        return response.data;
    } catch (error) {
        console.error('Dodo getCustomer error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch customer');
    }
}

// ── Helpers ───────────────────────────────────────────────────────────
function getPlanMinutes(planKey) {
    return PLAN_MINUTES[planKey?.toLowerCase()] || 0;
}

function getPlanLimitSeconds(planKey) {
    return PLAN_LIMIT_SECONDS[planKey?.toLowerCase()] || 0;
}

function getPlanCost(planKey) {
    const normalizedPlan = planKey?.toLowerCase();
    return { amount: BASE_COSTS_USD[normalizedPlan] || 0, currency: 'USD' };
}

function mapPlanToProductId(plan) {
    return getPlanProductId(plan);
}

module.exports = {
    // Subscription
    createSubscription,
    getSubscription,
    cancelSubscription,
    updateSubscription,
    // Top-up
    createTopupCheckout,
    // Payment lookups
    getCustomerPayments,
    getPayment,
    getCustomer,
    // Plan helpers
    mapPlanToProductId,
    productIdToPlan,
    getPlanMinutes,
    getPlanLimitSeconds,
    getPlanCost,
    // Top-up helpers
    productIdToTopup,
    getTopupProductId,
    // Legacy exports (deprecated, kept for backwards-compat)
    OVERAGE_RATES,
    BASE_COSTS,
    BASE_COSTS_USD,
    PLAN_LIMITS,
    PLAN_DISPLAY_NAMES,
};
