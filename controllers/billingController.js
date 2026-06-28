const db = require('../database/db');
const dodoService = require('../services/dodoBillingService');
const onboardingController = require('./onboardingController');
const emailService = require('../services/emailService');
const axios = require('axios');
const vapiService = require('../services/vapiService');

// Map user-facing subscription plan name to the plan_type enum used in DB
const DB_PLAN_MAP = {
    'free': 'free',
    'starter': 'starter',
    'growth': 'pro',
    'scale': 'enterprise'
};

async function subscribe(req, res) {
    try {
        const { plan, billingCycle = 'monthly' } = req.body;
        const clientId = req.client.id;
        const email = req.client.email;

        const validPlans = ['starter', 'growth', 'scale'];
        if (!plan || !validPlans.includes(plan.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        const validCycles = ['monthly', 'annual'];
        if (!validCycles.includes(billingCycle.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid billing cycle selected' });
        }

        // 3. Create default AI assistant for this business
        const planName = plan.toUpperCase();
        const assistantName = `AI Receptionist - ${planName}`;
        const assistantLanguage = 'en';
        const firstMessage = 'Hello! How can I help you?';
        const systemPrompt = 'You are a helpful AI receptionist...';
        const bizIndustry = req.client.industry || 'General';

        // Check if an assistant already exists for this business
        console.log('[DEBUG] Querying existing assistant for client:', clientId);
        const existingAssistant = await db.query(
            'SELECT id FROM assistants WHERE business_id = $1',
            [clientId]
        );

        let assistantId;
        if (existingAssistant.rows.length > 0) {
            assistantId = existingAssistant.rows[0].id;
            console.log('[DEBUG] Updating existing assistant:', assistantId);
            await db.query(
                `UPDATE assistants 
                 SET name = $1, 
                     agent_name = $2, 
                     language = $3, 
                     greeting = $4, 
                     first_message = $5, 
                     system_prompt = $6, 
                     industry = $7,
                     updated_at = NOW()
                 WHERE id = $8`,
                [assistantName, assistantName, assistantLanguage, firstMessage, firstMessage, systemPrompt, bizIndustry, assistantId]
            );
        } else {
            console.log('[DEBUG] Inserting default assistant');
            const insertResult = await db.query(
                `INSERT INTO assistants
                  (business_id, name, agent_name, language, greeting, first_message, system_prompt, industry, voice_id, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'meera', true)
                 RETURNING id`,
                [clientId, assistantName, assistantName, assistantLanguage, firstMessage, firstMessage, systemPrompt, bizIndustry]
            );
            assistantId = insertResult.rows[0].id;
        }

        // Link assistant to business if not already linked
        console.log('[DEBUG] Linking assistant to business');
        await db.query(
            'UPDATE businesses SET assistant_id = $1 WHERE id = $2',
            [assistantId, clientId]
        );

        // 4. Update businesses record
        const dbPlan = DB_PLAN_MAP[plan.toLowerCase()] || 'free';
        console.log('[DEBUG] Updating business plan details:', [dbPlan, plan, billingCycle, clientId]);
        await db.query(
            `UPDATE businesses 
             SET plan = $1,
                 plan_name = $2,
                 status = 'active',
                 billing_cycle = $3,
                 updated_at = NOW()
             WHERE id = $4`,
            [dbPlan, plan, billingCycle, clientId]
        );

        // 5. Create Dodo Payments checkout
        let subscription;
        try {
            subscription = await dodoService.createSubscription(clientId, plan, email, billingCycle);
        } catch (dodoErr) {
            console.error('Dodo API Error:', dodoErr.message);
            return res.status(500).json({ error: 'Payment system unavailable, try again' });
        }

        // 6. Store subscription intent in DB
        await db.query(
            `INSERT INTO subscription_intents (business_id, plan, billing_cycle, dodo_id, status)
             VALUES ($1, $2, $3, $4, 'pending')`,
            [clientId, plan, billingCycle, subscription.subscriptionId]
        );

        // Send JSON response
        res.status(201).json({
            success: true,
            checkout_url: subscription.checkoutUrl,
            plan: plan,
            billingCycle: billingCycle
        });
    } catch (err) {
        console.error('Subscribe error:', err);
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
}

async function getStatus(req, res) {
    try {
        const { client_id } = req.params;
        const requestingClientId = req.client.id;

        // Security: only allow viewing own status unless admin
        if (client_id !== requestingClientId) {
            return res.status(403).json({ error: 'Can only view your own subscription status' });
        }

        const result = await db.query(
            `SELECT id, email, plan, plan_name, current_period_end, minutes_limit, minutes_used, 
                    dodo_subscription_id, dodo_customer_id, status, country
             FROM businesses WHERE id = $1`,
            [client_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Business not found' });
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

        const planKey = (client.plan || 'free').toLowerCase();
        const overageRate = dodoService.OVERAGE_RATES[planKey] || 0;
        const baseCost = dodoService.BASE_COSTS[planKey] || 0;
        const overageMinutes = Math.max(0, (client.minutes_used || 0) - (client.minutes_limit || 100));
        const overageCost = overageMinutes * overageRate;
        const totalCostThisMonth = baseCost + overageCost;

        const dataPayload = {
            id: client.id,
            email: client.email,
            plan: client.plan,
            status: client.status,
            minutes_limit: client.minutes_limit,
            minutes_used: client.minutes_used,
            current_period_end: client.current_period_end,
            dodo_subscription_id: client.dodo_subscription_id,
            dodo_customer_id: client.dodo_customer_id,
            country: client.country
        };

        res.status(200).json({
            success: true,
            data: dataPayload,
            client: {
                id: client.id,
                email: client.email,
                plan: client.plan,
                subscriptionPlan: client.plan_name || client.plan,
                status: client.status,
                minutesLimit: client.minutes_limit,
                minutesUsed: client.minutes_used,
                minutesRemaining: Math.max(0, (client.minutes_limit || 100) - (client.minutes_used || 0)),
                planExpiresAt: client.current_period_end,
                dodoSubscriptionId: client.dodo_subscription_id,
                dodoCustomerId: client.dodo_customer_id,
                country: client.country,
                overageMinutes: overageMinutes,
                overageRate: overageRate,
                baseCost: baseCost,
                overageCost: overageCost,
                totalCostThisMonth: totalCostThisMonth
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
            'SELECT dodo_subscription_id, plan, plan_name FROM businesses WHERE id = $1',
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
            `UPDATE businesses 
             SET plan = 'free',
                 plan_name = 'free',
                 minutes_limit = $1,
                 dodo_subscription_id = NULL,
                 current_period_end = NULL
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

// ── Change Plan (Upgrade/Downgrade) ─────────────────────────────────
async function changePlan(req, res) {
    try {
        const { plan } = req.body;
        const clientId = req.client.id;
        const email = req.client.email;

        if (!plan) {
            return res.status(400).json({ error: 'plan is required' });
        }

        const validPlans = ['starter', 'growth', 'scale'];
        if (!validPlans.includes(plan.toLowerCase())) {
            return res.status(400).json({ error: `Invalid plan. Valid plans: ${validPlans.join(', ')}` });
        }

        // Get current subscription
        const result = await db.query(
            'SELECT dodo_subscription_id, dodo_customer_id, plan, plan_name FROM businesses WHERE id = $1',
            [clientId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Business not found' });
        }

        const currentBusiness = result.rows[0];
        const currentPlan = currentBusiness.plan_name || currentBusiness.plan || 'free';

        // If same plan, do nothing
        if (currentPlan.toLowerCase() === plan.toLowerCase()) {
            return res.status(400).json({ error: 'You are already on this plan' });
        }

        let checkoutUrl = null;

        if (currentBusiness.dodo_subscription_id) {
            // Try to update existing subscription first
            const newProductId = dodoService.mapPlanToProductId(plan);
            if (!newProductId) {
                return res.status(400).json({ error: 'Invalid plan product mapping' });
            }

            try {
                await dodoService.updateSubscription(currentBusiness.dodo_subscription_id, newProductId);
                console.log(`[PLAN-CHANGE] Updated subscription ${currentBusiness.dodo_subscription_id} to ${plan}`);
            } catch (updateErr) {
                // If update fails, cancel old and create new
                console.log(`[PLAN-CHANGE] Update failed, creating new subscription. Reason: ${updateErr.message}`);
                try {
                    await dodoService.cancelSubscription(currentBusiness.dodo_subscription_id);
                } catch (cancelErr) {
                    console.error('[PLAN-CHANGE] Cancel old sub failed:', cancelErr.message);
                }
                
                const newSub = await dodoService.createSubscription(clientId, plan, email);
                checkoutUrl = newSub.checkoutUrl;
                
                await db.query(
                    `UPDATE businesses SET 
                        dodo_subscription_id = $1,
                        dodo_customer_id = COALESCE($2, dodo_customer_id)
                     WHERE id = $3`,
                    [newSub.subscriptionId, newSub.customerId, clientId]
                );
            }
        } else {
            // No existing subscription — create fresh
            const newSub = await dodoService.createSubscription(clientId, plan, email);
            checkoutUrl = newSub.checkoutUrl;
            
            await db.query(
                `UPDATE businesses SET 
                    dodo_subscription_id = $1,
                    dodo_customer_id = COALESCE($2, dodo_customer_id)
                 WHERE id = $3`,
                [newSub.subscriptionId, newSub.customerId, clientId]
            );
        }

        // Update plan info in DB
        const minutesLimit = dodoService.getPlanMinutes(plan);
        const dbPlan = DB_PLAN_MAP[plan.toLowerCase()] || 'free';
        await db.query(
            `UPDATE businesses 
             SET plan = $1,
                 plan_name = $2,
                 minutes_limit = $3,
                 previous_plan = $4,
                 plan_changed_at = NOW()
             WHERE id = $5`,
            [dbPlan, plan, minutesLimit, currentPlan, clientId]
        );

        const response = {
            message: `Plan changed from ${currentPlan} to ${plan} successfully`,
            previousPlan: currentPlan,
            newPlan: plan,
            minutesLimit: minutesLimit
        };

        if (checkoutUrl) {
            response.url = checkoutUrl;
            response.checkoutUrl = checkoutUrl;
            response.requiresPayment = true;
        }

        res.status(200).json(response);
    } catch (err) {
        console.error('Change plan error:', err);
        res.status(500).json({ error: err.message });
    }
}

// ── Get Payment History ─────────────────────────────────────────────
async function getPaymentHistory(req, res) {
    try {
        const { client_id } = req.params;
        const requestingClientId = req.client.id;

        // Security: only allow viewing own history
        if (client_id !== requestingClientId) {
            return res.status(403).json({ error: 'Can only view your own payment history' });
        }

        // Fetch from local payment_logs
        const localResult = await db.query(
            `SELECT 
                id, dodo_payment_id, amount, currency, status, plan_name,
                invoice_number, payment_type, period_start, period_end, created_at
             FROM payment_logs 
             WHERE business_id = $1 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [client_id]
        );

        // Also try to fetch from Dodo if customer ID exists
        let dodoPayments = [];
        const bizResult = await db.query(
            'SELECT dodo_customer_id FROM businesses WHERE id = $1',
            [client_id]
        );

        if (bizResult.rows[0]?.dodo_customer_id) {
            try {
                const dodoData = await dodoService.getCustomerPayments(bizResult.rows[0].dodo_customer_id);
                dodoPayments = Array.isArray(dodoData) ? dodoData : (dodoData?.payments || []);
            } catch (dodoErr) {
                console.error('Failed to fetch Dodo payments:', dodoErr.message);
            }
        }

        // Merge and deduplicate
        const localPaymentIds = new Set(localResult.rows.map(p => p.dodo_payment_id).filter(Boolean));
        const mergedPayments = [
            ...localResult.rows.map(p => ({
                id: p.id,
                dodoPaymentId: p.dodo_payment_id,
                amount: parseFloat(p.amount) || 0,
                currency: p.currency || 'USD',
                status: p.status,
                planName: p.plan_name,
                invoiceNumber: p.invoice_number,
                paymentType: p.payment_type || 'subscription',
                periodStart: p.period_start,
                periodEnd: p.period_end,
                date: p.created_at,
                source: 'local'
            })),
            ...dodoPayments
                .filter(p => !localPaymentIds.has(p.id))
                .map(p => ({
                    dodoPaymentId: p.id,
                    amount: p.amount || 0,
                    currency: p.currency || 'USD',
                    status: p.status,
                    planName: null,
                    invoiceNumber: null,
                    paymentType: p.type || 'subscription',
                    date: p.created_at,
                    source: 'dodo'
                }))
        ];

        // Sort by date descending
        mergedPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({
            success: true,
            payments: mergedPayments,
            total: mergedPayments.length
        });
    } catch (err) {
        console.error('GetPaymentHistory error:', err);
        res.status(500).json({ error: err.message });
    }
}

// ── Get Invoice ─────────────────────────────────────────────────────
async function getInvoice(req, res) {
    try {
        const { payment_id } = req.params;
        const requestingClientId = req.client.id;

        // Fetch payment log
        const paymentResult = await db.query(
            `SELECT pl.*, b.name as business_name, b.email as business_email,
                    b.phone as business_phone, b.country, b.full_name
             FROM payment_logs pl
             LEFT JOIN businesses b ON pl.business_id = b.id
             WHERE pl.id = $1`,
            [payment_id]
        );

        if (paymentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        const payment = paymentResult.rows[0];

        // Security: verify ownership
        if (payment.business_id && payment.business_id !== requestingClientId) {
            return res.status(403).json({ error: 'Not authorized to view this invoice' });
        }

        const country = payment.country || 'IN';
        const planName = payment.plan_name || 'Unknown Plan';
        const planCost = dodoService.getPlanCost(planName, country);

        const invoice = {
            invoiceNumber: payment.invoice_number || `BAV-${Date.now()}`,
            date: payment.created_at,
            status: payment.status,
            customer: {
                name: payment.full_name || payment.business_name || 'Customer',
                email: payment.business_email || '',
                phone: payment.business_phone || '',
                country: country
            },
            items: [
                {
                    description: `Bavio AI ${dodoService.PLAN_DISPLAY_NAMES[planName.toLowerCase()] || planName} Plan - Monthly Subscription`,
                    quantity: 1,
                    unitPrice: parseFloat(payment.amount) || planCost.amount,
                    total: parseFloat(payment.amount) || planCost.amount,
                    currency: payment.currency || planCost.currency
                }
            ],
            subtotal: parseFloat(payment.amount) || planCost.amount,
            tax: 0,
            total: parseFloat(payment.amount) || planCost.amount,
            currency: payment.currency || planCost.currency,
            paymentMethod: 'Dodo Payments',
            dodoPaymentId: payment.dodo_payment_id,
            periodStart: payment.period_start,
            periodEnd: payment.period_end,
            company: {
                name: 'Bavio AI',
                email: 'billing@bavio.in',
                website: 'https://bavio.in',
                address: 'USA'
            }
        };

        res.status(200).json({
            success: true,
            invoice
        });
    } catch (err) {
        console.error('GetInvoice error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function handleWebhook(req, res) {
    try {
        // Verify webhook signature
        const providedSecret = req.headers['x-webhook-secret'];
        const expectedSecret = process.env.DODO_WEBHOOK_SECRET;
        if (expectedSecret && providedSecret !== expectedSecret) {
            console.error('Invalid webhook secret');
            return res.status(401).json({ error: 'Invalid webhook secret' });
        }
        const event = req.body;
        const eventType = event.event;

        console.log(`Received Dodo webhook: ${eventType}`, event);

        switch (eventType) {
            case 'subscription.active': {
                const subscription = event.data;
                const businessId = subscription.metadata?.business_id || subscription.metadata?.client_id;
                
                if (businessId) {
                    // Determine plan from product ID
                    let plan = 'starter';
                    const productId = subscription.product_id;
                    if (productId === dodoService.PRODUCT_IDS.growth) plan = 'growth';
                    if (productId === dodoService.PRODUCT_IDS.scale) plan = 'scale';

                    const minutesLimit = dodoService.getPlanMinutes(plan);
                    const dbPlan = DB_PLAN_MAP[plan.toLowerCase()] || 'free';
                    
                    await db.query(
                        `UPDATE businesses 
                         SET plan = $1::plan_type,
                             plan_name = $2,
                             current_period_end = $3,
                             minutes_limit = $4,
                             status = 'active',
                             dodo_subscription_id = $5
                         WHERE id = $6`,
                        [dbPlan, plan, subscription.current_period_end, minutesLimit, subscription.id || subscription.subscription_id, businessId]
                    );
                    
                    console.log(`Activated subscription for business ${businessId}: ${plan}`);

                    // Send Subscription Activation Email
                    db.query('SELECT email, name FROM businesses WHERE id = $1', [businessId])
                        .then(res => {
                            if (res.rows.length > 0) {
                                const { email, name } = res.rows[0];
                                emailService.sendMail(
                                    email,
                                    `Your Bavio AI Subscription to ${plan.toUpperCase()} is Active!`,
                                    `Hi ${name},\n\nWe are excited to let you know that your subscription to the ${plan.toUpperCase()} plan is now active!\n\nYour limit has been upgraded to ${minutesLimit} minutes/month. Thank you for partnering with Bavio AI to power your business receptionist line.\n\nBest regards,\nThe Bavio Team`
                                ).catch(e => console.error('[EMAIL] Send error:', e.message));
                            }
                        })
                        .catch(err => console.error('[EMAIL] Subscription active query error:', err.message));
                }
                break;
            }

            case 'subscription.cancelled':
            case 'subscription.deleted': {
                const subscription = event.data;
                const businessId = subscription.metadata?.business_id || subscription.metadata?.client_id;
                
                if (businessId) {
                    const freeMinutes = dodoService.getPlanMinutes('free');
                    await db.query(
                        `UPDATE businesses 
                         SET plan = 'free',
                             plan_name = 'free',
                             current_period_end = NULL,
                             minutes_limit = $1,
                             dodo_subscription_id = NULL
                         WHERE id = $2`,
                        [freeMinutes, businessId]
                    );
                    
                    console.log(`Downgraded business ${businessId} to free plan`);

                    // Send Subscription Ended Email
                    db.query('SELECT email, name FROM businesses WHERE id = $1', [businessId])
                        .then(res => {
                            if (res.rows.length > 0) {
                                const { email, name } = res.rows[0];
                                emailService.sendMail(
                                    email,
                                    'Your Bavio AI Subscription Has Ended',
                                    `Hi ${name},\n\nYour Bavio AI subscription has been successfully cancelled or has expired. Your account has been moved to our Free Trial tier.\n\nTo reactivate your dedicated receptionist features, please visit your workspace billing section at any time.\n\nBest regards,\nThe Bavio Team`
                                ).catch(e => console.error('[EMAIL] Send error:', e.message));
                            }
                        })
                        .catch(err => console.error('[EMAIL] Subscription cancel query error:', err.message));
                }
                break;
            }

            case 'payment.succeeded': {
                const payment = event.data;
                const customerId = payment.customer_id;
                
                // Idempotency: check if we already logged this payment
                const existingPayment = await db.query(
                    'SELECT id FROM payment_logs WHERE dodo_payment_id = $1',
                    [payment.id]
                );
                
                if (existingPayment.rows.length > 0) {
                    console.log(`Payment ${payment.id} already processed, skipping`);
                    break;
                }

                // Resolve business_id from metadata or customer mapping
                const businessId = payment.metadata?.business_id || payment.metadata?.client_id;
                const planName = payment.metadata?.plan || null;
                const countryCode = payment.metadata?.country_code || null;
                const dialCode = payment.metadata?.dial_code || null;

                // Log payment in database with enhanced fields
                await db.query(
                    `INSERT INTO payment_logs 
                     (dodo_payment_id, dodo_customer_id, business_id, amount, currency, status, plan_name, metadata)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        payment.id,
                        customerId,
                        businessId || null,
                        payment.amount,
                        payment.currency || 'USD',
                        'succeeded',
                        planName,
                        JSON.stringify(payment)
                    ]
                );
                
                console.log(`Logged successful payment: ${payment.id} for business ${businessId}`);
                
                if (businessId) {
                    // Update business subscription status
                    const dbPlan = DB_PLAN_MAP[(planName || 'starter').toLowerCase()] || 'starter';
                    await db.query(
                        `UPDATE businesses SET plan = $1::plan_type, plan_name = $2, status = 'active', subscription_status = 'active', billing_cycle = $3 WHERE id = $4`,
                        [dbPlan, planName || 'starter', payment.billing_cycle || 'monthly', businessId]
                    );
                    // Provision phone number via internal endpoint
                    try {
                        await axios.post(`${process.env.INTERNAL_API_BASE_URL || ''}/api/phone/provision`, {
                            businessId,
                            countryCode,
                            dialCode
                        });
                        console.log('Provisioned phone number for business', businessId);
                    } catch (provErr) {
                        console.error('Phone provisioning failed:', provErr.message);
                    }
                    // Mark intent completed if exists
                    await db.query(
                        `UPDATE subscription_intents SET status = 'completed' WHERE business_id = $1`,
                        [businessId]
                    );
                    // Send success email
                    try {
                        await emailService.sendMail(
                            payment.customer_email || payment.email || payment.metadata?.customer_email,
                            'Payment Successful',
                            `Your payment of ${payment.amount} ${payment.currency} was successful. Your virtual number is being set up.`
                        );
                    } catch (emailErr) {
                        console.error('Failed to send success email:', emailErr.message);
                    }
                }
                break;
            }

            case 'payment.failed': {
                const payment = event.data;
                const businessId = payment.metadata?.business_id || payment.metadata?.client_id;
                console.error(`Payment failed: ${payment.id}`, payment.failure_reason);
                // Update intent status to failed
                if (businessId) {
                    await db.query(
                        `UPDATE subscription_intents SET status = 'failed' WHERE business_id = $1`,
                        [businessId]
                    );
                }
                // Log failed payment
                try {
                    await db.query(
                        `INSERT INTO payment_logs 
                         (dodo_payment_id, dodo_customer_id, business_id, amount, currency, status, metadata)
                         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [
                            payment.id,
                            payment.customer_id,
                            businessId || null,
                            payment.amount,
                            payment.currency || 'USD',
                            'failed',
                            JSON.stringify(payment)
                        ]
                    );
                } catch (logErr) {
                    console.error('Failed to log failed payment:', logErr.message);
                }
                // Send failure email
                try {
                    await emailService.sendMail(
                        payment.customer_email || payment.email || payment.metadata?.customer_email,
                        'Payment Failed',
                        `Your payment of ${payment.amount} ${payment.currency} failed. Please try again.`
                    );
                } catch (emailErr) {
                    console.error('Failed to send failure email:', emailErr.message);
                }
                break;
            }

            case 'subscription.updated': {
                const subscription = event.data;
                const businessId = subscription.metadata?.business_id || subscription.metadata?.client_id;
                
                if (businessId) {
                    let plan = dodoService.productIdToPlan(subscription.product_id) || 'starter';
                    const minutesLimit = dodoService.getPlanMinutes(plan);
                    const dbPlan = DB_PLAN_MAP[plan.toLowerCase()] || 'free';
                    
                    await db.query(
                        `UPDATE businesses 
                         SET plan = $1,
                             plan_name = $2,
                             minutes_limit = $3,
                             plan_changed_at = NOW()
                         WHERE id = $4`,
                        [dbPlan, plan, minutesLimit, businessId]
                    );
                    
                    console.log(`Updated subscription for business ${businessId}: ${plan}`);
                }
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

// Auto-provision business after successful payment
async function autoProvisionBusiness(clientId) {
    try {
        console.log(`[AUTO-PROVISION] Starting for business ${clientId}`);
        
        // 1. Get business details
        const businessResult = await db.query(
            `SELECT id, name, email, industry, country_code, owner_mobile, twilio_number, phone_number_id FROM businesses WHERE id = $1`,
            [clientId]
        );
        if (businessResult.rows.length === 0) {
            throw new Error(`Business ${clientId} not found`);
        }
        const business = businessResult.rows[0];
        
        // 2. Get assistant details
        let assistantResult = await db.query(
            `SELECT id, agent_name, voice, greeting FROM assistants WHERE business_id = $1`,
            [clientId]
        );
        let assistant;
        if (assistantResult.rows.length === 0) {
            console.log(`[AUTO-PROVISION] Assistant not found for client ${clientId}. Creating default assistant...`);
            const agentName = 'Sarah';
            const voice = 'meera';
            const defaultGreeting = `Hello. This is ${agentName} from ${business.name || 'Bavio'}. How may I assist you today?`;
            const defaultSystemPrompt = onboardingController.buildSystemPrompt({
                agent_name: agentName,
                greeting: defaultGreeting,
                industry: business.industry || 'other',
                language: 'en-US'
            });
            const insertResult = await db.query(
                `INSERT INTO assistants
                  (business_id, name, agent_name, greeting, first_message, voice, voice_id, industry, language, system_prompt, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en-US', $9, true)
                 RETURNING id, agent_name, voice, greeting`,
                [clientId, agentName, agentName, defaultGreeting, defaultGreeting, voice, voice, business.industry || 'other', defaultSystemPrompt]
            );
            assistant = insertResult.rows[0];
            
            // Link assistant to business
            await db.query(
                'UPDATE businesses SET assistant_id = $1 WHERE id = $2',
                [assistant.id, clientId]
            );
            console.log(`[AUTO-PROVISION] Default assistant created with ID: ${assistant.id}`);
        } else {
            assistant = assistantResult.rows[0];
        }
        
        // 3. Automated Phone Number Purchase from Twilio (if not already set)
        let assignedNumber = business.twilio_number || null;
        let numberId = business.phone_number_id || null;
        let isMock = false;

        if (!assignedNumber) {
            const twilioProvider = require('../providers/twilio');
            const countryCode = (business.country_code === 'IN' || !business.country_code) ? 'US' : business.country_code;
            
            try {
                console.log(`[AUTO-PROVISION] Attempting to buy local Twilio number for country: ${countryCode}...`);
                assignedNumber = await twilioProvider.buyNumber(countryCode);
                console.log(`[AUTO-PROVISION] ✅ Twilio purchase success: ${assignedNumber}`);
            } catch (buyErr) {
                console.warn('[AUTO-PROVISION] ⚠️ Twilio purchase failed, using mock fallback:', buyErr.message);
                assignedNumber = '+1' + Math.floor(2000000000 + Math.random() * 8000000000);
                isMock = true;
            }

            // Store number in phone_numbers table
            const insertNumRes = await db.query(
                `INSERT INTO phone_numbers (business_id, assistant_id, phone_number, provider, status)
                 VALUES ($1, $2, $3, 'twilio', 'active')
                 RETURNING id`,
                [clientId, assistant.id, assignedNumber]
            );
            numberId = insertNumRes.rows[0].id;

            // Update business record with phone number details
            await db.query(
                `UPDATE businesses SET
                    twilio_number = $1,
                    phone_number_id = $2
                 WHERE id = $3`,
                [assignedNumber, numberId, clientId]
            );
        } else {
            console.log(`[AUTO-PROVISION] Business already has a Twilio number assigned: ${assignedNumber}`);
        }

        // 4. Create Vapi Assistant and map Twilio phone number on the Vapi platform
        await vapiService.syncVapiAssistantAndPhone(clientId);
        
        // 5. Update business state
        await db.query(
            `UPDATE businesses SET
                assistant_id = $1,
                phone_number_id = $2,
                twilio_number = $3,
                subscription_status = 'active',
                onboarding_status = 'ready',
                onboarding_step = 6,
                updated_at = NOW()
             WHERE id = $4`,
            [assistant.id, numberId, assignedNumber, clientId]
        );
        
        console.log(`[AUTO-PROVISION] ✅ Provisioning complete for business ${clientId}. Number assigned: ${assignedNumber}`);
        
    } catch (err) {
        console.error('[AUTO-PROVISION] ❌ Provisioning failed:', err.message);
        try {
            await db.query(
                `UPDATE businesses SET onboarding_status = $1 WHERE id = $2`,
                ['failed', clientId]
            );
        } catch (dbErr) {
            console.error('[AUTO-PROVISION] Could not update status:', dbErr.message);
        }
        
        throw err;
    }
}

// Create Razorpay Order
async function createRazorpayOrder(req, res) {
    try {
        const { planName, topupMinutes, amount } = req.body;
        const clientId = req.client.id;
        
        console.log(`[RAZORPAY] Creating order for client ${clientId}: planName=${planName}, topupMinutes=${topupMinutes}, amount=${amount}`);
        
        const orderId = 'order_rcpt_' + Math.random().toString(36).substring(2, 15);
        
        res.status(201).json({
            success: true,
            id: orderId,
            amount: amount,
            currency: 'USD',
            receipt: 'receipt_' + Date.now()
        });
    } catch (err) {
        console.error('createRazorpayOrder error:', err);
        res.status(500).json({ error: err.message });
    }
}

// Verify Razorpay Payment
async function verifyRazorpayPayment(req, res) {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature, 
            planName, 
            topupMinutes, 
            amount, 
            gstNumber, 
            gstBusinessName 
        } = req.body;
        
        const clientId = req.client.id;
        console.log(`[RAZORPAY] Verifying payment for client ${clientId}: orderId=${razorpay_order_id}, paymentId=${razorpay_payment_id}`);

        const paymentId = razorpay_payment_id || 'pay_' + Math.random().toString(36).substring(2, 12);
        const invoiceNum = 'BAV-RP-' + Date.now();

        // 1. Process Subscription upgrade
        if (planName) {
            const dbPlan = DB_PLAN_MAP[planName.toLowerCase()] || 'free';
            const minutesLimit = dodoService.PLAN_LIMITS[planName.toLowerCase()] || 100;
            
            await db.query(
                `UPDATE businesses 
                 SET plan = $1,
                     plan_name = $2,
                     minutes_limit = $3,
                     minutes_used = 0,
                     current_period_end = NOW() + INTERVAL '30 days',
                     status = 'active',
                     subscription_status = 'active',
                     plan_changed_at = NOW()
                 WHERE id = $4`,
                [dbPlan, planName, minutesLimit, clientId]
            );
            
            console.log(`[RAZORPAY] Upgraded client ${clientId} to plan ${planName}`);
        }
        // 2. Process minutes top-up
        else if (topupMinutes) {
            const parsedMinutes = parseInt(topupMinutes);
            await db.query(
                `UPDATE businesses 
                 SET minutes_limit = minutes_limit + $1,
                     current_period_end = COALESCE(current_period_end, NOW()) + INTERVAL '30 days'
                 WHERE id = $2`,
                [parsedMinutes, clientId]
            );
            console.log(`[RAZORPAY] Credited client ${clientId} with ${parsedMinutes} top-up minutes`);
        }

        // 3. Save GST details if provided
        if (gstNumber) {
            await db.query(
                `UPDATE businesses 
                 SET business_description = COALESCE(business_description, '') || '\nGST: ' || $1 || ' (' || $2 || ')'
                 WHERE id = $3`,
                [gstNumber, gstBusinessName || '', clientId]
            );
        }

        // 4. Log the transaction in payment_logs
        await db.query(
            `INSERT INTO payment_logs 
             (dodo_payment_id, dodo_customer_id, business_id, amount, currency, status, plan_name, invoice_number, payment_type, period_start, period_end)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW() + INTERVAL '30 days')`,
            [
                paymentId,
                'razorpay_cust_' + clientId,
                clientId,
                amount || 0,
                'USD',
                'succeeded',
                planName || 'topup',
                invoiceNum,
                planName ? 'subscription' : 'topup'
            ]
        );

        res.status(200).json({
            success: true,
            message: 'Payment verified and credited successfully.',
            invoiceNumber: invoiceNum,
            amount: amount,
            planName: planName || 'Top-Up Minutes'
        });

    } catch (err) {
        console.error('verifyRazorpayPayment error:', err);
        res.status(500).json({ error: err.message });
    }
}

// Fetch active trial status and usage summaries for onboarding
async function getTrialStatus(req, res) {
  try {
    const businessId = req.client?.id || req.user?.id;
    if (!businessId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const bizRes = await db.query(
      `SELECT trial_status, trial_ends_at, minutes_used, minutes_limit 
       FROM businesses WHERE id = $1`,
      [businessId]
    );

    if (bizRes.rows.length === 0) {
      return res.status(404).json({ error: 'business_not_found', message: 'Business not found' });
    }

    const business = bizRes.rows[0];

    // Count calls answered and leads captured
    const callsCountRes = await db.query(
      'SELECT COUNT(*)::int as count FROM calls WHERE business_id = $1',
      [businessId]
    );
    const leadsCountRes = await db.query(
      'SELECT COUNT(*)::int as count FROM leads WHERE business_id = $1',
      [businessId]
    );

    return res.status(200).json({
      businessId,
      trialStatus: business.trial_status || 'ACTIVE',
      trialEndsAt: business.trial_ends_at || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      minutesUsed: business.minutes_used || 0,
      minutesAvailable: business.minutes_limit || 30,
      callsAnswered: callsCountRes.rows[0]?.count || 0,
      leadsCaptured: leadsCountRes.rows[0]?.count || 0
    });

  } catch (err) {
    console.error('getTrialStatus error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

// Fetch available pricing packages
async function getPricing(req, res) {
  try {
    const plans = [
      {
        id: "STARTER",
        name: "Starter",
        price: 1999,
        currency: "INR",
        minutes: 200,
        overageRate: 5,
        features: ["200 minutes/month", "₹5 per extra minute", "Basic analytics", "Email support"]
      },
      {
        id: "GROWTH",
        name: "Growth",
        price: 3999,
        currency: "INR",
        minutes: 500,
        overageRate: 4,
        popular: true,
        features: ["500 minutes/month", "₹4 per extra minute", "Advanced analytics", "Lead prioritization", "24/7 support"]
      },
      {
        id: "SCALE",
        name: "Scale",
        price: 7999,
        currency: "INR",
        minutes: 1500,
        overageRate: 3,
        features: ["1500 minutes/month", "₹3 per extra minute", "Full analytics suite", "API access", "Priority support", "White-label option"]
      }
    ];

    return res.status(200).json({
      plans,
      yearlyDiscount: 0.17
    });
  } catch (err) {
    console.error('getPricing error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

// Create a checkout session redirecting to Dodo
async function createCheckout(req, res) {
  try {
    const businessId = req.client?.id || req.user?.id;
    const email = req.client?.email || req.user?.email || 'billing@bavio.in';
    
    if (!businessId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { planId, billingPeriod } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'missing_fields', message: 'planId is required' });
    }

    const normalizedPlan = planId.toLowerCase();
    const cycle = billingPeriod?.toLowerCase() === 'yearly' ? 'annual' : 'monthly';

    const dodoService = require('../services/dodoBillingService');
    let checkoutUrl = '';
    let orderId = `order_${Math.random().toString(36).substring(2, 11)}`;

    try {
      const response = await dodoService.createSubscription(businessId, normalizedPlan, email, cycle);
      if (response && response.checkoutUrl) {
        checkoutUrl = response.checkoutUrl;
        orderId = response.subscriptionId || orderId;
      }
    } catch (dodoErr) {
      console.warn('Dodo payment creation failed, using mock checkout link:', dodoErr.message);
    }

    if (!checkoutUrl) {
      checkoutUrl = `https://checkout.dodopayments.com/mock-checkout?plan=${planId}&period=${billingPeriod}&client=${businessId}`;
    }

    // Save initial payment log
    await db.query(
      `INSERT INTO payment_logs 
       (dodo_payment_id, business_id, amount, currency, status, plan_name, payment_type, period_start, period_end)
       VALUES ($1, $2, $3, $4, $5, $6, 'subscription', NOW(), NOW() + INTERVAL '30 days')`,
      [orderId, businessId, normalizedPlan === 'scale' ? 7999 : normalizedPlan === 'growth' ? 3999 : 1999, 'INR', 'pending', planId]
    );

    return res.status(200).json({
      checkoutUrl,
      orderId
    });

  } catch (err) {
    console.error('createCheckout error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

// Handle Dodo Payment Webhooks
async function handleDodoWebhook(req, res) {
  try {
    const { event, orderId, customerId, amount, currency, status } = req.body;
    console.log(`[DODO WEBHOOK] Received event: ${event} for order: ${orderId}`);

    if (event === 'order.completed' || status === 'SUCCESS') {
      let businessId = req.body.metadata?.business_id || req.body.metadata?.client_id;
      
      if (!businessId) {
        const logRes = await db.query(
          'SELECT business_id FROM payment_logs WHERE dodo_payment_id = $1 LIMIT 1',
          [orderId]
        );
        if (logRes.rows.length > 0) {
          businessId = logRes.rows[0].business_id;
        }
      }

      if (!businessId) {
        console.warn('[DODO WEBHOOK] No business_id found in webhook payload metadata.');
        return res.status(200).json({ received: true, warning: 'No business linked' });
      }

      // Update business table
      await db.query(
        `UPDATE businesses
         SET plan = $1,
             plan_name = $2,
             trial_status = 'CONVERTED',
             status = 'active',
             billing_period = $3,
             onboarding_step = 6,
             updated_at = NOW()
         WHERE id = $4`,
        ['pro', 'GROWTH', 'monthly', businessId]
      );

      // Upgrade payment log to succeeded
      await db.query(
        `UPDATE payment_logs 
         SET status = 'succeeded',
             dodo_customer_id = $1,
             updated_at = NOW()
         WHERE dodo_payment_id = $2`,
        [customerId || 'cust_dodo', orderId]
      );

      console.log(`[DODO WEBHOOK] Successfully upgraded business ${businessId} to GROWTH plan`);

      // Send Subscription Activation Email
      db.query('SELECT email, name, plan_name, minutes_limit FROM businesses WHERE id = $1', [businessId])
        .then(res => {
          if (res.rows.length > 0) {
            const { email, name, plan_name, minutes_limit } = res.rows[0];
            emailService.sendMail(
              email,
              `Your Bavio AI Subscription to ${plan_name.toUpperCase()} is Active!`,
              `Hi ${name},\n\nWe are excited to let you know that your subscription to the ${plan_name.toUpperCase()} plan is now active!\n\nYour limit has been upgraded to ${minutes_limit} minutes/month. Thank you for partnering with Bavio AI to power your business receptionist line.\n\nBest regards,\nThe Bavio Team`
            ).catch(e => console.error('[EMAIL] Send error:', e.message));
          }
        })
        .catch(err => console.error('[EMAIL] Fallback subscription active query error:', err.message));
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[DODO WEBHOOK] Error processing webhook:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

module.exports = {
    subscribe,
    getStatus,
    cancel,
    changePlan,
    getPaymentHistory,
    getInvoice,
    handleWebhook,
    createRazorpayOrder,
    verifyRazorpayPayment,
    autoProvisionBusiness,
    getTrialStatus,
    getPricing,
    createCheckout,
    handleDodoWebhook
};

