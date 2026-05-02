const db = require('../database/db');
const dodoService = require('../services/dodoBillingService');

async function subscribe(req, res) {
    try {
        const { plan, email } = req.body;
        const clientId = req.client.id;

        if (!plan || !email) {
            return res.status(400).json({ error: 'plan and email are required' });
        }

        const validPlans = ['starter', 'growth', 'scale'];
        if (!validPlans.includes(plan.toLowerCase())) {
            return res.status(400).json({ error: `Invalid plan. Valid plans: ${validPlans.join(', ')}` });
        }

        // Create subscription in Dodo
        const subscription = await dodoService.createSubscription(clientId, plan, email);

        // Update client record with subscription info
        const minutesLimit = dodoService.getPlanMinutes(plan);
        await db.query(
            `UPDATE clients 
             SET dodo_subscription_id = $1,
                 dodo_customer_id = $2,
                 plan = $3,
                 minutes_limit = $4
             WHERE id = $5`,
            [subscription.subscriptionId, subscription.customerId, plan, minutesLimit, clientId]
        );

        res.status(201).json({
            message: 'Subscription created successfully',
            subscriptionId: subscription.subscriptionId,
            checkoutUrl: subscription.checkoutUrl,
            status: subscription.status,
            plan: plan,
            minutesLimit: minutesLimit
        });
    } catch (err) {
        console.error('Subscribe error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function getStatus(req, res) {
    try {
        const { client_id } = req.params;
        const requestingClientId = req.client.id;

        // Security: only allow viewing own status unless admin
        if (parseInt(client_id) !== requestingClientId) {
            return res.status(403).json({ error: 'Can only view your own subscription status' });
        }

        const result = await db.query(
            `SELECT id, email, plan, plan_expires_at, minutes_limit, minutes_used, 
                    dodo_subscription_id, dodo_customer_id, subscription_plan, status
             FROM clients WHERE id = $1`,
            [client_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const client = result.rows[0];
        
        // If has Dodo subscription, fetch latest status from Dodo
        let dodoStatus = null;
        if (client.dodo_subscription_id) {
            try {
                dodoStatus = await dodoService.getSubscription(client.dodo_subscription_id);
            } catch (dodoErr) {
                console.error('Failed to fetch Dodo status:', dodoErr.message);
            }
        }

        res.status(200).json({
            client: {
                id: client.id,
                email: client.email,
                plan: client.plan,
                subscriptionPlan: client.subscription_plan,
                status: client.status,
                minutesLimit: client.minutes_limit,
                minutesUsed: client.minutes_used,
                minutesRemaining: Math.max(0, client.minutes_limit - client.minutes_used),
                planExpiresAt: client.plan_expires_at,
                dodoSubscriptionId: client.dodo_subscription_id,
                dodoCustomerId: client.dodo_customer_id
            },
            dodoSubscription: dodoStatus
        });
    } catch (err) {
        console.error('GetStatus error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function cancel(req, res) {
    try {
        const clientId = req.client.id;

        // Get client's subscription
        const result = await db.query(
            'SELECT dodo_subscription_id, plan FROM clients WHERE id = $1',
            [clientId]
        );

        if (result.rows.length === 0 || !result.rows[0].dodo_subscription_id) {
            return res.status(404).json({ error: 'No active subscription found' });
        }

        const { dodo_subscription_id, plan } = result.rows[0];

        // Cancel in Dodo
        await dodoService.cancelSubscription(dodo_subscription_id);

        // Update client record - downgrade to free
        await db.query(
            `UPDATE clients 
             SET plan = 'free',
                 minutes_limit = $1,
                 dodo_subscription_id = NULL
             WHERE id = $2`,
            [dodoService.getPlanMinutes('free'), clientId]
        );

        res.status(200).json({
            message: 'Subscription cancelled successfully',
            previousPlan: plan,
            currentPlan: 'free'
        });
    } catch (err) {
        console.error('Cancel subscription error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function handleWebhook(req, res) {
    try {
        const event = req.body;
        const eventType = event.event_type;
        const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

        // Verify webhook secret if configured
        const providedSecret = req.headers['x-webhook-secret'];
        if (webhookSecret && providedSecret !== webhookSecret) {
            console.error('Invalid webhook secret');
            return res.status(401).json({ error: 'Invalid webhook secret' });
        }

        console.log(`Received Dodo webhook: ${eventType}`, event);

        switch (eventType) {
            case 'subscription.active': {
                const subscription = event.data;
                const clientId = subscription.metadata?.client_id;
                
                if (clientId) {
                    // Determine plan from product ID
                    let plan = 'starter';
                    const productId = subscription.product_id;
                    if (productId === dodoService.PRODUCT_IDS.growth) plan = 'growth';
                    if (productId === dodoService.PRODUCT_IDS.scale) plan = 'scale';

                    const minutesLimit = dodoService.getPlanMinutes(plan);
                    
                    await db.query(
                        `UPDATE clients 
                         SET plan = $1,
                             plan_expires_at = $2,
                             minutes_limit = $3,
                             status = 'active'
                         WHERE id = $4`,
                        [plan, subscription.current_period_end, minutesLimit, clientId]
                    );
                    
                    console.log(`Activated subscription for client ${clientId}: ${plan}`);
                }
                break;
            }

            case 'subscription.cancelled':
            case 'subscription.deleted': {
                const subscription = event.data;
                const clientId = subscription.metadata?.client_id;
                
                if (clientId) {
                    const freeMinutes = dodoService.getPlanMinutes('free');
                    await db.query(
                        `UPDATE clients 
                         SET plan = 'free',
                             plan_expires_at = NULL,
                             minutes_limit = $1,
                             dodo_subscription_id = NULL
                         WHERE id = $2`,
                        [freeMinutes, clientId]
                    );
                    
                    console.log(`Downgraded client ${clientId} to free plan`);
                }
                break;
            }

            case 'payment.succeeded': {
                const payment = event.data;
                const customerId = payment.customer_id;
                
                // Log payment in database
                await db.query(
                    `INSERT INTO payment_logs (dodo_payment_id, dodo_customer_id, amount, currency, status, metadata)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        payment.id,
                        customerId,
                        payment.amount,
                        payment.currency || 'USD',
                        'succeeded',
                        JSON.stringify(payment)
                    ]
                );
                
                console.log(`Logged successful payment: ${payment.id}`);
                break;
            }

            case 'payment.failed': {
                const payment = event.data;
                console.error(`Payment failed: ${payment.id}`, payment.failure_reason);
                break;
            }

            default:
                console.log(`Unhandled webhook event: ${eventType}`);
        }

        res.status(200).json({ received: true });
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    subscribe,
    getStatus,
    cancel,
    handleWebhook
};
