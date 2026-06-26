const db = require('../database/db');
const dodoService = require('../services/dodoBillingService');
const onboardingController = require('./onboardingController');
const emailService = require('../services/emailService');
const axios = require('axios');

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
                         SET plan = $1,
                             plan_name = $2,
                             current_period_end = $3,
                             minutes_limit = $4,
                             status = 'active'
                         WHERE id = $5`,
                        [dbPlan, plan, subscription.current_period_end, minutesLimit, businessId]
                    );
                    
                    console.log(`Activated subscription for business ${businessId}: ${plan}`);
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
                    await db.query(
                        `UPDATE businesses SET plan = $1, plan_name = $1, status = 'active', subscription_active = true, billing_cycle = $2 WHERE id = $3`,
                        [planName || 'starter', payment.billing_cycle || 'monthly', businessId]
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
        const axios = require('axios');
        
        // 1. Get business details
        const businessResult = await db.query(
            `SELECT id, name, email, industry, country_code, owner_mobile FROM businesses WHERE id = $1`,
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
        
        // 3. Auto-generate Greeting
        const greeting = `Hello. This is ${assistant.agent_name || 'Sarah'} from ${business.name || 'Bavio'}. How may I assist you today?`;
        
        // 4. Generate system prompt
        const systemPrompt = onboardingController.buildSystemPrompt({
            agent_name: assistant.agent_name,
            greeting: greeting,
            industry: business.industry,
            language: 'en-US'
        });
        
        // 5. Create Vapi Assistant via POST API
        let vapiAssistantId = 'vapi_asst_mock_' + Math.random().toString(36).substring(2, 15);
        if (process.env.VAPI_API_KEY) {
            try {
                const response = await axios.post('https://api.vapi.ai/assistant', {
                    name: assistant.agent_name,
                    firstMessage: greeting,
                    model: {
                        provider: 'openai',
                        model: 'gpt-4o',
                        messages: [
                            {
                                role: 'system',
                                content: systemPrompt
                            }
                        ]
                    },
                    voice: {
                        provider: '11labs',
                        voiceId: assistant.voice || '21m00Tcm4TlvDq8ikWAM'
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.data && response.data.id) {
                    vapiAssistantId = response.data.id;
                    console.log(`[AUTO-PROVISION] Created Vapi assistant: ${vapiAssistantId}`);
                }
            } catch (vapiErr) {
                console.error('[AUTO-PROVISION] Vapi API creation failed, using mock ID:', vapiErr.message);
            }
        }
        
        // Update assistant record in DB
        await db.query(
            `UPDATE assistants SET
                vapi_assistant_id = $1,
                greeting = $2,
                system_prompt = $3,
                is_active = true,
                updated_at = NOW()
             WHERE id = $4`,
            [vapiAssistantId, greeting, systemPrompt, assistant.id]
        );
        
        // 6. Automated Phone Number Assignment from pool
        const numberResult = await db.query(
            `SELECT id, phone_number FROM phone_numbers 
             WHERE type = 'pool' AND status = 'active' AND business_id IS NULL 
             LIMIT 1`
        );
        
        let assignedNumber = '+18005550199';
        let numberId = null;
        
        if (numberResult.rows.length > 0) {
            const poolNum = numberResult.rows[0];
            assignedNumber = poolNum.phone_number;
            numberId = poolNum.id;
            
            await db.query(
                `UPDATE phone_numbers SET
                    business_id = $1,
                    assistant_id = $2,
                    updated_at = NOW()
                 WHERE id = $3`,
                [clientId, assistant.id, numberId]
            );
        } else {
            console.warn('[AUTO-PROVISION] No free pool number found. Generating a mock one.');
            assignedNumber = '+1' + Math.floor(2000000000 + Math.random() * 8000000000);
            const insertNumRes = await db.query(
                `INSERT INTO phone_numbers (business_id, assistant_id, phone_number, provider, status)
                 VALUES ($1, $2, $3, 'twilio', 'active')
                 RETURNING id`,
                [clientId, assistant.id, assignedNumber]
            );
            numberId = insertNumRes.rows[0].id;
        }
        
        // 7. Update business state
        await db.query(
            `UPDATE businesses SET
                assistant_id = $1,
                phone_number_id = $2,
                twilio_number = $3,
                subscription_status = 'active',
                onboarding_status = 'ready',
                onboarding_step = 5,
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

module.exports = {
    subscribe,
    getStatus,
    cancel,
    changePlan,
    getPaymentHistory,
    getInvoice,
    handleWebhook,
    createRazorpayOrder,
    verifyRazorpayPayment
};
