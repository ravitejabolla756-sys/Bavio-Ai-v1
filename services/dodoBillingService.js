const axios = require('axios');

const DODO_API_KEY = process.env.DODO_API_KEY;
const DODO_BASE_URL = 'https://api.dodopayments.com';

const PRODUCT_IDS = {
    starter: process.env.DODO_STARTER_PRODUCT_ID || 'pdt_0NdJCmLQ4vEu1ozciOnzC',
    growth: process.env.DODO_GROWTH_PRODUCT_ID || 'pdt_0NdJCtm1chlF5sdwOymeu',
    scale: process.env.DODO_SCALE_PRODUCT_ID || 'pdt_0NdJCytZyhPzdBuKpg4sz'
};

const PLAN_LIMITS = {
    free: 100,
    starter: 500,
    growth: 2000,
    scale: 10000
};

function mapPlanToProductId(plan) {
    const normalizedPlan = plan.toLowerCase();
    return PRODUCT_IDS[normalizedPlan] || null;
}

async function createSubscription(client_id, plan, email) {
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
                    client_id: client_id.toString()
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
            plan: plan
        };
    } catch (error) {
        console.error('Dodo createSubscription error:', error.response?.data || error.message);
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

function getPlanMinutes(plan) {
    return PLAN_LIMITS[plan.toLowerCase()] || PLAN_LIMITS.free;
}

module.exports = {
    createSubscription,
    getSubscription,
    cancelSubscription,
    getCustomerPayments,
    mapPlanToProductId,
    getPlanMinutes,
    PRODUCT_IDS
};
