const db = require('../database/db');
const dodoService = require('../services/dodoBillingService');
const onboardingController = require('./onboardingController');
const emailService = require('../services/emailService');
const axios = require('axios');

// plan_type enum: free | starter | pro | enterprise
const DB_PLAN_MAP = {
    'free':     'free',
    'starter':  'starter',
    'growth':   'pro',
    'scale':    'enterprise',
    'business': 'enterprise',
};

const { PLANS_CONFIG, getPlanLimitSeconds } = require('../config/plans');
const { TOPUPS_CONFIG, getTopupProductId, productIdToTopup, isTopupCheckoutAvailable } = require('../config/topups');
const { applyTopupSeconds, resetMonthlySeconds } = require('../middleware/planEnforcement');

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

        // Second-based balance (new model)
        const monthlyLimitSec  = client.monthly_limit_seconds  || (client.minutes_limit  || 0) * 60;
        const monthlyUsedSec   = client.monthly_usage_seconds  || (client.minutes_used   || 0) * 60;
        const topupBalanceSec  = client.topup_balance_seconds  || 0;
        const monthlyRemSec    = Math.max(0, monthlyLimitSec - monthlyUsedSec);
        const totalAvailableSec = monthlyRemSec + topupBalanceSec;

        res.status(200).json({
            success: true,
            data: {
                id:                   client.id,
                email:                client.email,
                plan:                 client.plan,
                status:               client.status,
                minutes_limit:        Math.ceil(monthlyLimitSec / 60),
                minutes_used:         Math.ceil(monthlyUsedSec  / 60),
                current_period_end:   client.current_period_end,
                dodo_subscription_id: client.dodo_subscription_id,
                dodo_customer_id:     client.dodo_customer_id,
                country:              client.country,
                // Second-based fields
                monthly_limit_seconds:  monthlyLimitSec,
                monthly_usage_seconds:  monthlyUsedSec,
                topup_balance_seconds:  topupBalanceSec,
                total_available_seconds: totalAvailableSec,
            },
            client: {
                id:                   client.id,
                email:                client.email,
                plan:                 client.plan,
                subscriptionPlan:     client.plan_name || client.plan,
                subscriptionStatus:   client.subscription_status || client.status,
                status:               client.status,
                // Minute-based (for display)
                monthlyMinutesLimit:     Math.ceil(monthlyLimitSec / 60),
                monthlyMinutesUsed:      Math.ceil(monthlyUsedSec  / 60),
                monthlyMinutesRemaining: Math.ceil(monthlyRemSec   / 60),
                topupMinutesRemaining:   Math.ceil(topupBalanceSec / 60),
                totalMinutesAvailable:   Math.ceil(totalAvailableSec / 60),
                usagePercent:            monthlyLimitSec > 0 ? Math.min(100, Math.round((monthlyUsedSec / monthlyLimitSec) * 100)) : 0,
                // Second-based (for enforcement)
                monthlyLimitSeconds:     monthlyLimitSec,
                monthlyUsedSeconds:      monthlyUsedSec,
                monthlyRemainingSeconds: monthlyRemSec,
                topupBalanceSeconds:     topupBalanceSec,
                totalAvailableSeconds:   totalAvailableSec,
                // Meta
                planExpiresAt:        client.current_period_end,
                billingPeriodStart:   client.billing_period_start,
                billingPeriodEnd:     client.billing_period_end,
                dodoSubscriptionId:   client.dodo_subscription_id,
                dodoCustomerId:       client.dodo_customer_id,
                country:              client.country,
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
    const crypto = require('crypto');
    const webhookId = req.headers['webhook-id'] || req.headers['svix-id'];
    const signatureHeader = req.headers['webhook-signature'] || req.headers['svix-signature'];
    const timestamp = req.headers['webhook-timestamp'] || req.headers['svix-timestamp'];

    if (!webhookId || !signatureHeader || !timestamp) {
        console.error('[PAYMENT WEBHOOK] Missing standard webhook headers');
        return res.status(400).json({ error: 'Missing standard webhook headers' });
    }

    // Validate timestamp drift (replay prevention - 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const eventTime = parseInt(timestamp, 10);
    if (isNaN(eventTime) || Math.abs(now - eventTime) > 300) {
        console.error(`[PAYMENT WEBHOOK] Webhook timestamp drift too large: ${timestamp}`);
        return res.status(400).json({ error: 'Webhook timestamp outside accepted replay window' });
    }

    // Extract raw payload (handles Express raw buffer or fallback strings/objects)
    const rawBody = req.body instanceof Buffer 
        ? req.body.toString('utf8') 
        : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

    const secret = process.env.DODO_WEBHOOK_SECRET || '';
    let cleanSecret = secret;
    if (cleanSecret.startsWith('whsec_')) {
        cleanSecret = cleanSecret.substring(6);
    }

    let verified = false;
    try {
        const secretBuffer = Buffer.from(cleanSecret, 'base64');
        const toSign = `${webhookId}.${timestamp}.${rawBody}`;
        const signatures = signatureHeader.split(' ');
        
        for (const sig of signatures) {
            const parts = sig.split(',');
            if (parts.length === 2 && parts[0] === 'v1') {
                const expectedHash = parts[1];
                const hmac = crypto.createHmac('sha256', secretBuffer);
                hmac.update(toSign);
                const computedHash = hmac.digest('base64');
                
                if (crypto.timingSafeEqual(Buffer.from(expectedHash, 'utf8'), Buffer.from(computedHash, 'utf8'))) {
                    verified = true;
                    break;
                }
            }
        }
    } catch (e) {
        console.error('[PAYMENT WEBHOOK] Signature decryption error:', e.message);
    }

    if (!verified) {
        console.error('[PAYMENT WEBHOOK] Standard signature validation failed');
        return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Parse verified payload
    let event;
    try {
        event = JSON.parse(rawBody);
    } catch (e) {
        console.error('[PAYMENT WEBHOOK] Failed to parse payload JSON:', e.message);
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    const eventType = event.event;
    const eventId = webhookId;

    console.log(`Received Dodo webhook event: ${eventType} (ID: ${eventId})`);

    try {
        // Idempotency: verify webhook state in webhook_events
        const existingEvent = await db.query(
            "SELECT * FROM webhook_events WHERE provider = 'dodo' AND webhook_id = $1 LIMIT 1",
            [eventId]
        );

        if (existingEvent.rows.length > 0) {
            const record = existingEvent.rows[0];
            if (record.processing_status === 'completed') {
                console.log(`[DODO WEBHOOK] Webhook ${eventId} already processed successfully. Acknowledging.`);
                return res.status(200).json({ success: true, message: 'Event already processed' });
            }
            if (record.processing_status === 'processing') {
                console.log(`[DODO WEBHOOK] Webhook ${eventId} is currently processing.`);
                return res.status(409).json({ error: 'Conflict: Webhook is processing' });
            }
            // If failed, permit retry
            await db.query(
                "UPDATE webhook_events SET processing_status = 'processing', received_at = NOW(), error_message = NULL WHERE id = $1",
                [record.id]
            );
        } else {
            const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');
            await db.query(
                `INSERT INTO webhook_events (provider, webhook_id, event_type, payload_hash, processing_status, received_at)
                 VALUES ('dodo', $1, $2, $3, 'processing', NOW())`,
                [eventId, eventType, payloadHash]
            );
        }

        switch (eventType) {
            case 'subscription.active': {
                const subscription = event.data;
                const businessId = subscription.metadata?.business_id || subscription.metadata?.client_id;
                
                if (businessId) {
                    // Out-of-order event protection
                    const bizRes = await db.query('SELECT plan, plan_changed_at FROM businesses WHERE id = $1', [businessId]);
                    if (bizRes.rows.length > 0) {
                        const current = bizRes.rows[0];
                        const eventTimestamp = new Date(eventTime * 1000);
                        if (current.plan_changed_at && eventTimestamp < new Date(current.plan_changed_at)) {
                            console.warn(`[DODO WEBHOOK] Skipping out-of-order event ${eventId} (event time ${eventTimestamp} is older than last change ${current.plan_changed_at}).`);
                            await db.query(
                                "UPDATE webhook_events SET processing_status = 'completed', processed_at = NOW() WHERE provider = 'dodo' AND webhook_id = $1",
                                [eventId]
                            );
                            return res.status(200).json({ success: true, message: 'Skipped: Out-of-order event' });
                        }
                    }

                    const productId = subscription.product_id;
                    const plan = dodoService.productIdToPlan(productId);
                    if (!plan) {
                        console.error(`[DODO WEBHOOK] Unknown product ID: ${productId}. Cannot activate subscription.`);
                        throw new Error(`Unknown product ID: ${productId}`);
                    }

                    const planConfig = PLANS_CONFIG[plan.toLowerCase()];
                    const dbPlan = DB_PLAN_MAP[plan.toLowerCase()] || 'free';
                    const minutesLimit = planConfig.includedMinutes || 120;
                    const overageRate = planConfig.overagePerMinute || 0.18;
                    const includedNumbers = planConfig.includedNumbers || 1;

                    const periodStart = subscription.current_period_start ? new Date(subscription.current_period_start) : new Date();
                    const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : new Date();

                    await db.query(
                        `UPDATE businesses 
                         SET plan = $1::plan_type,
                             plan_name = $2,
                             subscription_status = 'active',
                             status = 'active',
                             dodo_product_id = $3,
                             dodo_subscription_id = $4,
                             dodo_customer_id = $5,
                             billing_period_start = $6,
                             billing_period_end = $7,
                             current_period_end = $7,
                             minutes_limit = $8,
                             minutes_used = 0,
                             overage_rate = $9,
                             included_phone_numbers = $10,
                             billing_cycle = 'monthly',
                             updated_at = NOW()
                         WHERE id = $11`,
                        [
                            dbPlan,
                            plan,
                            productId,
                            subscription.id || subscription.subscription_id,
                            subscription.customer?.id || subscription.customer_id,
                            periodStart,
                            periodEnd,
                            minutesLimit,
                            overageRate,
                            includedNumbers,
                            businessId
                        ]
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

                // ── Check if this is a top-up payment ────────────────────
                const topupType = payment.metadata?.topup_type || payment.metadata?.topup_id;
                const topupConfig = topupType ? require('../config/topups').TOPUPS_CONFIG[topupType] : null;

                if (topupConfig) {
                    // ── TOP-UP PAYMENT ────────────────────────────────────
                    const topupBusinessId = payment.metadata?.business_id || payment.metadata?.client_id;
                    if (!topupBusinessId) {
                        console.warn('[DODO WEBHOOK] Top-up payment missing business_id in metadata.');
                        break;
                    }

                    console.log(`[DODO WEBHOOK] Processing top-up ${topupType} for business ${topupBusinessId}`);

                    // Idempotency: check payment_logs
                    const existingTopup = await db.query(
                        'SELECT id FROM payment_logs WHERE dodo_payment_id = $1', [payment.id]
                    );
                    if (existingTopup.rows.length === 0) {
                        await db.query(
                            `INSERT INTO payment_logs
                             (dodo_payment_id, dodo_customer_id, business_id, amount, currency, status, plan_name, payment_type, metadata)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, 'topup', $8)`,
                            [payment.id, customerId, topupBusinessId, payment.amount, payment.currency || 'USD', 'succeeded', topupType,
                             JSON.stringify(payment)]
                        );
                    }

                    // Apply seconds atomically
                    await applyTopupSeconds(
                        topupBusinessId,
                        topupType,
                        topupConfig.seconds,
                        payment.id,
                        eventId,
                        { amount: payment.amount, currency: payment.currency || 'USD', dodoProductId: payment.product_id }
                    );
                    console.log(`[DODO WEBHOOK] Top-up applied: +${topupConfig.seconds}s for ${topupBusinessId}`);

                } else {
                    // ── SUBSCRIPTION PAYMENT ──────────────────────────────
                    const existingPayment = await db.query(
                        'SELECT id FROM payment_logs WHERE dodo_payment_id = $1', [payment.id]
                    );
                    if (existingPayment.rows.length > 0) {
                        console.log(`Payment ${payment.id} already processed, skipping`);
                        break;
                    }

                    const businessId = payment.metadata?.business_id || payment.metadata?.client_id;
                    const planName   = payment.metadata?.plan || null;

                    await db.query(
                        `INSERT INTO payment_logs
                         (dodo_payment_id, dodo_customer_id, business_id, amount, currency, status, plan_name, metadata)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [payment.id, customerId, businessId || null, payment.amount, payment.currency || 'USD',
                         'succeeded', planName, JSON.stringify(Object.assign({}, payment, { event_id: eventId }))]
                    );

                    console.log(`Logged successful subscription payment: ${payment.id} for business ${businessId}`);

                    if (businessId) {
                        const resolvedPlan  = (planName || 'starter').toLowerCase();
                        const planConfig    = PLANS_CONFIG[resolvedPlan] || PLANS_CONFIG.starter;
                        const dbPlan        = DB_PLAN_MAP[resolvedPlan] || 'starter';
                        const limitSeconds  = planConfig.monthlyLimitSeconds || planConfig.includedMinutes * 60 || 12000;
                        const limitMinutes  = planConfig.monthlyMinutes     || planConfig.includedMinutes || 200;
                        const inclNumbers   = planConfig.includedPhoneNumbers || planConfig.includedNumbers || 1;

                        await db.query(
                            `UPDATE businesses SET
                                plan = $1::plan_type,
                                plan_name = $2,
                                status = 'active',
                                subscription_status = 'active',
                                onboarding_status = 'pending',
                                onboarding_step = 0,
                                minutes_limit = $3,
                                monthly_limit_seconds = $4,
                                monthly_usage_seconds = 0,
                                billing_cycle = $5,
                                dodo_customer_id = $6,
                                included_phone_numbers = $7,
                                updated_at = NOW()
                             WHERE id = $8`,
                            [dbPlan, planConfig.id, limitMinutes, limitSeconds,
                             payment.billing_cycle || 'monthly', customerId || 'cust_dodo', inclNumbers, businessId]
                        );

                        await db.query(
                            `UPDATE subscription_intents SET status = 'completed' WHERE business_id = $1`,
                            [businessId]
                        );

                        try {
                            await emailService.sendMail(
                                payment.customer_email || payment.email || payment.metadata?.customer_email,
                                'Payment Successful — Welcome to Bavio',
                                `Your payment of $${payment.amount} ${payment.currency} was successful. Your AI receptionist is being set up.`
                            );
                        } catch (emailErr) {
                            console.error('Failed to send success email:', emailErr.message);
                        }
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
                    const plan = dodoService.productIdToPlan(subscription.product_id);
                    if (!plan) {
                        console.error(`[DODO WEBHOOK] Unknown product ID in subscription.updated: ${subscription.product_id}.`);
                        throw new Error(`Unknown product ID: ${subscription.product_id}`);
                    }

                    const planConfig      = PLANS_CONFIG[plan.toLowerCase()];
                    const dbPlan          = DB_PLAN_MAP[plan.toLowerCase()] || 'free';
                    const limitMinutes    = planConfig.monthlyMinutes || planConfig.includedMinutes || 200;
                    const limitSeconds    = planConfig.monthlyLimitSeconds || limitMinutes * 60;
                    const includedNumbers = planConfig.includedPhoneNumbers || planConfig.includedNumbers || 1;

                    await db.query(
                        `UPDATE businesses
                         SET plan = $1::plan_type,
                             plan_name = $2,
                             minutes_limit = $3,
                             monthly_limit_seconds = $4,
                             included_phone_numbers = $5,
                             plan_changed_at = NOW(),
                             updated_at = NOW()
                         WHERE id = $6`,
                        [dbPlan, plan, limitMinutes, limitSeconds, includedNumbers, businessId]
                    );

                    console.log(`Updated subscription for business ${businessId}: ${plan}`);
                }
                break;
            }

            case 'subscription.renewed': {
                // Monthly renewal: reset monthly seconds, preserve top-up balance
                const subscription = event.data;
                const businessId   = subscription.metadata?.business_id || subscription.metadata?.client_id;

                if (businessId) {
                    const plan = dodoService.productIdToPlan(subscription.product_id);
                    if (!plan) {
                        console.warn(`[DODO WEBHOOK] Unknown product ID in subscription.renewed: ${subscription.product_id}. Skipping reset.`);
                        break;
                    }

                    const planConfig   = PLANS_CONFIG[plan.toLowerCase()];
                    const limitSeconds = planConfig.monthlyLimitSeconds || (planConfig.monthlyMinutes || 200) * 60;

                    const periodEnd = subscription.current_period_end
                        ? new Date(subscription.current_period_end)
                        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                    // Reset monthly usage — idempotent via eventId
                    await resetMonthlySeconds(businessId, limitSeconds, eventId);

                    // Update billing period
                    await db.query(
                        `UPDATE businesses
                         SET billing_period_end = $1,
                             current_period_end = $1,
                             subscription_status = 'active',
                             updated_at = NOW()
                         WHERE id = $2`,
                        [periodEnd, businessId]
                    );

                    console.log(`[DODO WEBHOOK] Monthly renewal processed for ${businessId}: ${limitSeconds}s reset.`);

                    // Renewal email
                    db.query('SELECT email, name FROM businesses WHERE id = $1', [businessId])
                        .then(r => {
                            if (r.rows.length > 0) {
                                const { email, name } = r.rows[0];
                                const mins = Math.ceil(limitSeconds / 60);
                                emailService.sendMail(
                                    email,
                                    'Your Bavio Monthly Minutes Have Renewed',
                                    `Hi ${name},\n\nYour monthly plan has renewed and your ${mins} call minutes have been reset.\n\nYour prepaid top-up minutes (if any) carry over to the new period.\n\nBest regards,\nThe Bavio Team`
                                ).catch(e => console.error('[EMAIL] Renewal email failed:', e.message));
                            }
                        })
                        .catch(err => console.error('[EMAIL] Renewal query error:', err.message));
                }
                break;
            }

            default:
                console.log(`[DODO WEBHOOK] Unhandled event type: ${eventType}`);
                break;
        }

        // Mark event as completed in webhook_events
        await db.query(
            "UPDATE webhook_events SET processing_status = 'completed', processed_at = NOW() WHERE provider = 'dodo' AND webhook_id = $1",
            [eventId]
        );

        res.status(200).json({ success: true, received: true });
    } catch (err) {
        console.error('[DODO WEBHOOK] Webhook error:', err);

        // Mark event as failed in webhook_events
        try {
            await db.query(
                "UPDATE webhook_events SET processing_status = 'failed', error_message = $1, processed_at = NOW() WHERE provider = 'dodo' AND webhook_id = $2",
                [err.message, webhookId]
            );
        } catch (dbErr) {
            console.error('[DODO WEBHOOK] Failed to update fail state in DB:', dbErr.message);
        }

        res.status(500).json({ error: 'internal_error', message: err.message });
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

// Create Razorpay Order - Retired in Production (Phase 1 Hardening)
async function createRazorpayOrder(req, res) {
    console.warn(`[RETIRED] Attempted to call retired Razorpay create order endpoint for client ${req.client.id}`);
    return res.status(410).json({
        error: "Gone",
        message: "Razorpay integrations are no longer supported. Please subscribe via Dodo Payments."
    });
}

// Verify Razorpay Payment - Retired in Production (Phase 1 Hardening)
async function verifyRazorpayPayment(req, res) {
    console.warn(`[RETIRED] Attempted to call retired Razorpay verify endpoint for client ${req.client.id}`);
    return res.status(410).json({
        error: "Gone",
        message: "Razorpay integrations are no longer supported. Please subscribe via Dodo Payments."
    });
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

// Fetch available pricing packages and top-ups
async function getPricing(req, res) {
  try {
    const sanitizedPlans = Object.values(PLANS_CONFIG).map(plan => {
      if (plan.id === 'business') {
        return { id: plan.id, name: plan.name, contactSales: true, checkoutAvailable: false };
      }
      const productEnvVal = plan.dodoProductEnv ? process.env[plan.dodoProductEnv] : null;
      return {
        id:                   plan.id,
        name:                 plan.name,
        priceMonthly:         plan.priceMonthly,
        currency:             plan.currency,
        monthlyMinutes:       plan.monthlyMinutes,
        monthlyLimitSeconds:  plan.monthlyLimitSeconds,
        includedPhoneNumbers: plan.includedPhoneNumbers,
        // No overagePerMinute — prepaid model
        checkoutAvailable:    !!(productEnvVal && productEnvVal.trim())
      };
    });

    // Top-ups — visibility available always, checkout depends on env var
    const sanitizedTopups = Object.values(TOPUPS_CONFIG).map(t => ({
      id:                 t.id,
      name:               t.name,
      price:              t.price,
      currency:           t.currency,
      minutes:            t.minutes,
      seconds:            t.seconds,
      description:        t.description,
      noAutoRenewal:      t.noAutoRenewal,
      checkoutAvailable:  isTopupCheckoutAvailable(t.id),
    }));

    return res.status(200).json({ plans: sanitizedPlans, topups: sanitizedTopups });
  } catch (err) {
    console.error('getPricing error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

// Create a top-up one-time checkout
async function createTopupCheckout(req, res) {
  try {
    const businessId = req.client?.id || req.user?.id;
    const email      = req.client?.email || req.user?.email || 'billing@bavio.in';

    if (!businessId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { topupId } = req.body;
    if (!topupId) {
      return res.status(400).json({ error: 'missing_fields', message: 'topupId is required' });
    }

    const topupConfig = TOPUPS_CONFIG[topupId];
    if (!topupConfig) {
      return res.status(400).json({ error: 'invalid_topup', message: `Top-up ID ${topupId} is not valid.` });
    }

    // Require active subscription
    const bizRes = await db.query(
      'SELECT subscription_status, billing_period_end FROM businesses WHERE id = $1',
      [businessId]
    );
    if (bizRes.rows.length === 0) {
      return res.status(404).json({ error: 'business_not_found' });
    }
    const biz = bizRes.rows[0];
    const isActive = biz.subscription_status === 'active' && (!biz.billing_period_end || new Date(biz.billing_period_end) >= new Date());
    if (!isActive) {
      return res.status(403).json({
        error: 'subscription_required',
        message: 'An active Bavio subscription is required to purchase top-up minutes.'
      });
    }

    // Check product ID configured
    const productId = getTopupProductId(topupId);
    if (!productId) {
      console.error(`[BILLING] Missing ${topupConfig.dodoProductEnv} environment variable`);
      return res.status(503).json({
        error:   'service_unavailable',
        message: 'This top-up is being prepared for launch. Please try again shortly.'
      });
    }

    // Create Dodo one-time checkout
    let checkout;
    try {
      checkout = await dodoService.createTopupCheckout(businessId, topupId, email);
    } catch (dodoErr) {
      console.error('[BILLING] Top-up checkout creation failed:', dodoErr.message);
      return res.status(503).json({
        error:   'service_unavailable',
        message: 'Payment system temporarily unavailable. Please try again.'
      });
    }

    return res.status(200).json({
      checkoutUrl: checkout.checkoutUrl,
      topupId,
      minutes:  topupConfig.minutes,
      amount:   topupConfig.price,
      currency: topupConfig.currency,
    });

  } catch (err) {
    console.error('createTopupCheckout error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

// Get top-up transaction history for the authenticated business
async function getTopupTransactions(req, res) {
  try {
    const businessId = req.client?.id || req.user?.id;
    if (!businessId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await db.query(
      `SELECT id, topup_type, minutes_added, seconds_added, amount, currency,
              payment_status, created_at, applied_at
       FROM topup_transactions
       WHERE business_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [businessId]
    );

    return res.status(200).json({ transactions: result.rows });
  } catch (err) {
    console.error('getTopupTransactions error:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
}

// Get current second-based balance for the authenticated business
async function getBalance(req, res) {
  try {
    const businessId = req.client?.id || req.user?.id;
    if (!businessId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await db.query(
      `SELECT monthly_limit_seconds, monthly_usage_seconds, topup_balance_seconds,
              minutes_limit, minutes_used, subscription_status, billing_period_end, plan, plan_name
       FROM businesses WHERE id = $1`,
      [businessId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'business_not_found' });
    }

    const b = result.rows[0];
    const limitSec  = b.monthly_limit_seconds  || (b.minutes_limit || 0) * 60;
    const usedSec   = b.monthly_usage_seconds  || (b.minutes_used  || 0) * 60;
    const topupSec  = b.topup_balance_seconds  || 0;
    const remSec    = Math.max(0, limitSec - usedSec);
    const totalSec  = remSec + topupSec;

    return res.status(200).json({
      plan:                    b.plan_name || b.plan,
      subscriptionStatus:      b.subscription_status,
      billingPeriodEnd:        b.billing_period_end,
      monthlyLimitMinutes:     Math.ceil(limitSec / 60),
      monthlyUsedMinutes:      Math.ceil(usedSec  / 60),
      monthlyRemainingMinutes: Math.ceil(remSec   / 60),
      topupRemainingMinutes:   Math.ceil(topupSec / 60),
      totalAvailableMinutes:   Math.ceil(totalSec / 60),
      usagePercent:            limitSec > 0 ? Math.min(100, Math.round((usedSec / limitSec) * 100)) : 0,
      // Raw seconds for enforcement
      monthlyLimitSeconds:     limitSec,
      monthlyUsedSeconds:      usedSec,
      monthlyRemainingSeconds: remSec,
      topupBalanceSeconds:     topupSec,
      totalAvailableSeconds:   totalSec,
    });
  } catch (err) {
    console.error('getBalance error:', err);
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

    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'missing_fields', message: 'planId is required' });
    }

    const normalizedPlan = planId.toLowerCase();

    const planConfig = PLANS_CONFIG[normalizedPlan];
    if (!planConfig) {
      return res.status(400).json({ error: 'invalid_plan', message: `Plan ${planId} is invalid.` });
    }

    if (planConfig.id === 'business') {
      return res.status(400).json({ error: 'checkout_unavailable', message: 'Please contact sales to activate the Business plan.' });
    }

    // Verify Dodo Product ID is present in environment
    const productId = process.env[planConfig.dodoProductEnv];
    if (!productId || !productId.trim()) {
      console.error(`[BILLING] Missing environment variable: ${planConfig.dodoProductEnv}`);
      return res.status(503).json({
        error: 'service_unavailable',
        message: 'This plan is being prepared for launch. Please try again shortly.'
      });
    }

    const price = planConfig.priceMonthly;

    const dodoService = require('../services/dodoBillingService');
    let checkoutUrl = '';
    let orderId = `order_${Math.random().toString(36).substring(2, 11)}`;

    try {
      const response = await dodoService.createSubscription(businessId, normalizedPlan, email, 'monthly');
      if (response && response.checkoutUrl) {
        checkoutUrl = response.checkoutUrl;
        orderId = response.subscriptionId || orderId;
      }
    } catch (dodoErr) {
      console.warn('Dodo payment creation failed, using mock checkout link:', dodoErr.message);
    }

    if (!checkoutUrl) {
      // Return 503 since Dodo creation failed or checkouts are disabled
      return res.status(503).json({
        error: 'service_unavailable',
        message: 'This plan is being prepared for launch. Please try again shortly.'
      });
    }

    // Save initial payment log (using USD currency and price)
    await db.query(
      `INSERT INTO payment_logs 
       (dodo_payment_id, business_id, amount, currency, status, plan_name, payment_type, period_start, period_end)
       VALUES ($1, $2, $3, $4, $5, $6, 'subscription', NOW(), NOW() + INTERVAL '30 days')`,
      [orderId, businessId, price, 'USD', 'pending', planId]
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

      let planName = req.body.metadata?.plan || req.body.metadata?.plan_name;
      if (!planName) {
        const logRes = await db.query(
          'SELECT plan_name FROM payment_logs WHERE dodo_payment_id = $1 LIMIT 1',
          [orderId]
        );
        if (logRes.rows.length > 0) {
          planName = logRes.rows[0].plan_name;
        }
      }

      const billingPeriod = req.body.metadata?.billing_period || req.body.metadata?.billing_cycle || 'monthly';
      const resolvedPlan = planName || 'growth';
      const dbPlan = DB_PLAN_MAP[resolvedPlan.toLowerCase()] || 'starter';
      const minutesLimit = resolvedPlan.toLowerCase() === 'scale' ? 1500 : resolvedPlan.toLowerCase() === 'growth' ? 500 : 200;

      // Update business table
      await db.query(
        `UPDATE businesses
         SET plan = $1::plan_type,
             plan_name = $2,
             status = 'active',
             subscription_status = 'active',
             onboarding_status = 'pending',
             onboarding_step = 0,
             minutes_limit = $3,
             billing_cycle = $4,
             updated_at = NOW()
         WHERE id = $5`,
        [dbPlan, resolvedPlan, minutesLimit, billingPeriod, businessId]
      );

      // Upgrade payment log to succeeded
      await db.query(
        `UPDATE payment_logs 
         SET status = 'succeeded',
             dodo_customer_id = $1
         WHERE dodo_payment_id = $2`,
        [customerId || 'cust_dodo', orderId]
      );

      console.log(`[DODO WEBHOOK] Successfully upgraded business ${businessId} to ${resolvedPlan} plan`);

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
    handleDodoWebhook,
    // New top-up endpoints
    createTopupCheckout,
    getTopupTransactions,
    getBalance,
};

