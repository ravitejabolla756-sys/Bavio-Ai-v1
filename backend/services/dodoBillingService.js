const axios = require('axios');

const DODO_API_KEY = process.env.DODO_API_KEY;
const DODO_BASE_URL = 'https://api.dodopayments.com';

const PRODUCT_IDS = {
    starter: process.env.DODO_STARTER_PRODUCT_ID || 'pdt_0NiAzNw5qQiVppDBGCML5',
    growth: process.env.DODO_GROWTH_PRODUCT_ID || 'pdt_0NiB01ov80r9R8s3iOJws',
    scale: process.env.DODO_SCALE_PRODUCT_ID || 'pdt_0NiB0gM8IBNoLarMfZRz0',
    business: process.env.DODO_BUSINESS_PRODUCT_ID || 'pdt_0NiB1J7CBSXoZRsdlWgom'
};

const PLAN_LIMITS = {
    free: 30,
    starter: 200,
    growth: 500,
    scale: 1500,
    business: 3000
};

const OVERAGE_RATES = {
    free: 0,
    starter: 10.40,
    growth: 8.60,
    scale: 5.20,
    business: 4.00
};

// Base costs in USD (paisa-free, display values)
const BASE_COSTS = {
    free: 0,
    starter: 2599,
    growth: 5199,
    scale: 10399,
    business: 29900
};

// International pricing in USD
const BASE_COSTS_USD = {
    free: 0,
    starter: 19,
    growth: 39,
    scale: 79,
    business: 299
};

// Plan display names
const PLAN_DISPLAY_NAMES = {
    free: 'Free Trial',
    starter: 'Starter',
    growth: 'Growth',
    scale: 'Scale',
    business: 'Business'
};

function mapPlanToProductId(plan) {
    const normalizedPlan = plan.toLowerCase();
    return PRODUCT_IDS[normalizedPlan] || null;
}

function productIdToPlan(productId) {
    for (const [plan, pid] of Object.entries(PRODUCT_IDS)) {
        if (pid === productId) return plan;
    }
    return null;
}

async function createSubscription(client_id, plan, email, billingCycle = 'monthly') {
    try {
        const productId = mapPlanToProductId(plan);
        if (!productId) {
            throw new Error(`Invalid plan: ${plan}. Valid plans: starter, growth, scale`);
        }

        const response = await axios.post(
            `${DODO_BASE_URL}/v1/subscriptions`,
            {
                product_id: productId,
                customer: {
                    email: email
                },
                metadata: {
                    client_id: client_id.toString(),
                    business_id: client_id.toString(),
                    plan: plan,
                    billing_cycle: billingCycle
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${DODO_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            subscriptionId: response.data.subscription_id,
            customerId: response.data.customer?.id,
            status: response.data.status,
            checkoutUrl: response.data.checkout_url,
            plan: plan,
            billingCycle: billingCycle
        };
    } catch (error) {
        console.error('Dodo createSubscription error:', error.response?.data || error.message);
        if (process.env.NODE_ENV !== 'production') {
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                console.warn('[Dodo Billing Service] Offline/DNS error detected. Falling back to mock subscription for development.');
                return {
                    subscriptionId: 'sub_mock_' + Math.random().toString(36).substring(2, 15),
                    customerId: 'cust_mock_' + Math.random().toString(36).substring(2, 15),
                    status: 'pending',
                    checkoutUrl: `https://checkout.dodopayments.com/buy/mock?client_id=${client_id}&plan=${plan}&cycle=${billingCycle}`,
                    plan: plan,
                    billingCycle: billingCycle
                };
            }
        }
        throw new Error(error.response?.data?.message || 'Failed to create subscription');
    }
}

async function getSubscription(subscriptionId) {
    try {
        const response = await axios.get(
            `${DODO_BASE_URL}/v1/subscriptions/${subscriptionId}`,
            {
                headers: {
                    'Authorization': `Bearer ${DODO_API_KEY}`
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Dodo getSubscription error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch subscription');
    }
}

async function cancelSubscription(subscriptionId) {
    try {
        const response = await axios.post(
            `${DODO_BASE_URL}/v1/subscriptions/${subscriptionId}/cancel`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${DODO_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Dodo cancelSubscription error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to cancel subscription');
    }
}

/**
 * Update a subscription's product (plan change)
 * @param {string} subscriptionId - Existing Dodo subscription ID
 * @param {string} newProductId - New product ID to switch to
 */
async function updateSubscription(subscriptionId, newProductId) {
    try {
        const response = await axios.patch(
            `${DODO_BASE_URL}/v1/subscriptions/${subscriptionId}`,
            {
                product_id: newProductId
            },
            {
                headers: {
                    'Authorization': `Bearer ${DODO_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Dodo updateSubscription error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to update subscription');
    }
}

async function getCustomerPayments(customerId) {
    try {
        const response = await axios.get(
            `${DODO_BASE_URL}/v1/customers/${customerId}/payments`,
            {
                headers: {
                    'Authorization': `Bearer ${DODO_API_KEY}`
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Dodo getCustomerPayments error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch payments');
    }
}

/**
 * Get a specific payment by ID
 */
async function getPayment(paymentId) {
    try {
        const response = await axios.get(
            `${DODO_BASE_URL}/v1/payments/${paymentId}`,
            {
                headers: {
                    'Authorization': `Bearer ${DODO_API_KEY}`
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Dodo getPayment error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch payment');
    }
}

/**
 * Get customer details from Dodo
 */
async function getCustomer(customerId) {
    try {
        const response = await axios.get(
            `${DODO_BASE_URL}/v1/customers/${customerId}`,
            {
                headers: {
                    'Authorization': `Bearer ${DODO_API_KEY}`
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Dodo getCustomer error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch customer');
    }
}

function getPlanMinutes(plan) {
    return PLAN_LIMITS[plan.toLowerCase()] || PLAN_LIMITS.free;
}

function getPlanCost(plan, country) {
    const normalizedPlan = plan.toLowerCase();
    return { amount: BASE_COSTS_USD[normalizedPlan] || 0, currency: 'USD' };
}

module.exports = {
    createSubscription,
    getSubscription,
    cancelSubscription,
    updateSubscription,
    getCustomerPayments,
    getPayment,
    getCustomer,
    mapPlanToProductId,
    productIdToPlan,
    getPlanMinutes,
    getPlanCost,
    PRODUCT_IDS,
    OVERAGE_RATES,
    BASE_COSTS,
    BASE_COSTS_USD,
    PLAN_LIMITS,
    PLAN_DISPLAY_NAMES
};

