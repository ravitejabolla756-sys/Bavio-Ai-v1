const db = require('../database/db');
const dodoService = require('../services/dodoBillingService');
const onboardingController = require('./onboardingController');

// Map user-facing subscription plan name to the plan_type enum used in DB
const DB_PLAN_MAP = {
    'free': 'free',
    'starter': 'starter',
    'growth': 'pro',
    'scale': 'enterprise'
};

async function subscribe(req, res) {
    try {
        const { plan } = req.body;
        const clientId = req.client.id;
        // Auto-extract email from authenticated user — frontend no longer needs to send it
        const email = req.body.email || req.client.email;

        if (!plan) {
            return res.status(400).json({ error: 'plan is required' });
        }

        const validPlans = ['starter', 'growth', 'scale'];
        if (!validPlans.includes(plan.toLowerCase())) {
            return res.status(400).json({ error: `Invalid plan. Valid plans: ${validPlans.join(', ')}` });
        }

        if (!email) {
            return res.status(400).json({ error: 'Could not determine email. Please provide email in request body.' });
        }

        // Create subscription in Dodo
        const subscription = await dodoService.createSubscription(clientId, plan, email);

        // Update client record with subscription info
        const minutesLimit = dodoService.getPlanMinutes(plan);
        const dbPlan = DB_PLAN_MAP[plan.toLowerCase()] || 'free';
        await db.query(
            `UPDATE businesses 
             SET dodo_subscription_id = $1,
                 dodo_customer_id = $2,
                 plan = $3,
                 plan_name = $4,
                 minutes_limit = $5
             WHERE id = $6`,
            [subscription.subscriptionId, subscription.customerId, dbPlan, plan, minutesLimit, clientId]
        );

        // Return `url` so the frontend can redirect to Dodo checkout
        res.status(201).json({
            message: 'Subscription created successfully',
            subscriptionId: subscription.subscriptionId,
            url: subscription.checkoutUrl,
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
                
                // Trigger auto-provisioning if business_id is available
                if (businessId) {
                    console.log(`[AUTO-PROVISION] Starting for business ${businessId}`);
                    autoProvisionBusiness(businessId).catch(err => {
                        console.error('[AUTO-PROVISION] Failed:', err.message);
                    });
                }
                break;
            }

            case 'payment.failed': {
                const payment = event.data;
                const businessId = payment.metadata?.business_id || payment.metadata?.client_id;
                console.error(`Payment failed: ${payment.id}`, payment.failure_reason);
                
                // Log failed payment too
                try {
                    await db.query(
                        `INSERT INTO payment_logs 
                         (dodo_payment_id, dodo_customer_id, business_id, amount, currency, status, metadata)
                         VALUES ($1, $2, $3, $4, $5, $6, $7)
                         ON CONFLICT DO NOTHING`,
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
        console.log(`[AUTO-PROVISION] Step 1: Getting business data for client ${clientId}`);
        
        // Get business data
        const businessResult = await db.query(
            `SELECT 
                id, full_name, email, city, whatsapp_number, phone,
                industry, language, intents, working_hours_from, working_hours_to,
                business_description, country
            FROM businesses WHERE id = $1`,
            [clientId]
        );
        
        if (businessResult.rows.length === 0) {
            throw new Error(`Business ${clientId} not found`);
        }
        
        const business = businessResult.rows[0];
        
        // Get assistant config
        const assistantResult = await db.query(
            `SELECT * FROM assistants WHERE business_id = $1`,
            [clientId]
        );
        
        const assistant = assistantResult.rows[0];
        
        // Update onboarding status to processing
        await db.query(
            `UPDATE businesses SET onboarding_status = $1 WHERE id = $2`,
            ['processing', clientId]
        );
        
        let purchasedNumber = null;
        let purchasedSid = null;
        const isIndia = false; // Forced false for US localization

        if (isIndia) {
            console.log(`[AUTO-PROVISION] India bypass path. Bypassed.`);
            const numberProvisioningService = require('../services/phone/numberProvisioningService');
            const provisionResult = await numberProvisioningService.assignPhoneNumber(
                clientId, 
                'forwarding', 
                business.phone || business.whatsapp_number
            );
            purchasedNumber = provisionResult.bavioPhonenumber;
            purchasedSid = String(provisionResult.assignmentId || 'EXO_ASSIGN_' + Date.now());
            console.log(`[AUTO-PROVISION] Allocated Exotel pool number: ${purchasedNumber}`);
        } else {
            console.log(`[AUTO-PROVISION] International user detected. Purchasing Twilio number.`);
            
            // Step 2: Buy Twilio number
            const twilio = require('twilio');
            const twilioClient = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );
            
            try {
                // Search for available numbers
                const availableNumbers = await twilioClient
                    .availablePhoneNumbers('US')
                    .local
                    .list({ limit: 5 });
                
                if (availableNumbers.length === 0) {
                    throw new Error('No Twilio numbers available');
                }
                
                // Purchase the first available number
                const numberToBuy = availableNumbers[0].phoneNumber;
                const incomingNumber = await twilioClient
                    .incomingPhoneNumbers
                    .create({ phoneNumber: numberToBuy });
                
                purchasedNumber = incomingNumber.phoneNumber;
                purchasedSid = incomingNumber.sid;
                
                console.log(`[AUTO-PROVISION] Purchased Twilio number: ${purchasedNumber}`);
            } catch (twilioErr) {
                console.error('[AUTO-PROVISION] Twilio number purchase failed:', twilioErr.message);
                // Try US 201 area code fallback
                try {
                    const availableNumbers = await twilioClient
                        .availablePhoneNumbers('US')
                        .local
                        .list({ limit: 1, areaCode: '201' });
                    
                    if (availableNumbers.length > 0) {
                        const incomingNumber = await twilioClient
                            .incomingPhoneNumbers
                            .create({ phoneNumber: availableNumbers[0].phoneNumber });
                        
                        purchasedNumber = incomingNumber.phoneNumber;
                        purchasedSid = incomingNumber.sid;
                        console.log(`[AUTO-PROVISION] Purchased US fallback number: ${purchasedNumber}`);
                    }
                } catch (fallbackErr) {
                    console.error('[AUTO-PROVISION] Fallback also failed:', fallbackErr.message);
                }
            }
            
            if (!purchasedNumber) {
                throw new Error('Could not purchase any Twilio phone number');
            }
            
            // Step 3: Set Twilio webhook for the number
            console.log(`[AUTO-PROVISION] Step 3: Configuring webhook`);
            
            const webhookUrl = `${process.env.WEBHOOK_BASE_URL || 'https://api.bavio.in'}/calls/twilio/incoming`;
            
            await twilioClient
                .incomingPhoneNumbers(purchasedSid)
                .update({
                    voiceUrl: webhookUrl,
                    voiceMethod: 'POST',
                    statusCallback: `${process.env.WEBHOOK_BASE_URL || 'https://api.bavio.in'}/calls/twilio/status`,
                    statusCallbackMethod: 'POST'
                });
            
            console.log(`[AUTO-PROVISION] Webhook configured: ${webhookUrl}`);
        }
        
        // Step 4: Save number to database
        console.log(`[AUTO-PROVISION] Step 4: Saving to database`);
        
        await db.query(
            `UPDATE businesses SET
                twilio_number = $1,
                twilio_number_sid = $2,
                number_assigned_at = NOW(),
                onboarding_status = $3
            WHERE id = $4`,
            [purchasedNumber, purchasedSid, 'ready', clientId]
        );
        
        // Also save to phone_numbers table
        const providerName = isIndia ? 'exotel' : 'twilio';
        await db.query(
            `INSERT INTO phone_numbers (business_id, number, phone_number, provider, status, assistant_id)
             VALUES ($1, $2, $2, $3, 'active', $4)
             ON CONFLICT (phone_number) DO UPDATE SET
                business_id = EXCLUDED.business_id,
                assistant_id = EXCLUDED.assistant_id,
                status = EXCLUDED.status`,
            [clientId, purchasedNumber, providerName, assistant?.id || null]
        );
        
        // Step 5: Build and save system prompt
        console.log(`[AUTO-PROVISION] Step 5: Building system prompt`);
        
        if (assistant) {
            const faqs = assistant.faqs || [];
            const systemPrompt = onboardingController.buildSystemPrompt({
                agent_name: assistant.agent_name,
                greeting: assistant.greeting,
                industry: business.industry,
                language: business.language,
                faqs: faqs
            });
            
            await db.query(
                `UPDATE assistants SET
                    system_prompt = $1,
                    is_active = true,
                    industry = $2,
                    language = $3
                WHERE id = $4`,
                [systemPrompt, business.industry, business.language, assistant.id]
            );
            
            console.log(`[AUTO-PROVISION] Assistant activated with system prompt`);
        }
        
        // Step 6: Send WhatsApp notification
        console.log(`[AUTO-PROVISION] Step 6: Sending WhatsApp notification`);
        
        try {
            const whatsappMessage = `🎉 *Your Bavio AI is Live!*
 
Namaste ${business.full_name},
 
Your AI voice assistant is now ready to answer calls!
 
📞 *Your dedicated number:*\n${purchasedNumber}
 
Share this number with your customers and they can call anytime — your AI will answer 24/7!
 
🚀 *Test it now:* Call ${purchasedNumber} and have a conversation!
 
📝 *What's next:*
• Go to https://bavio.in/dashboard to view your leads
• Customize your AI responses
• View call analytics
 
Need help? Reply to this message or email us at support@bavio.in
 
_Bavio AI - Never Miss a Call!_`;
            
            // Use Twilio WhatsApp if configured, otherwise log for now
            if (process.env.TWILIO_WHATSAPP_NUMBER && business.whatsapp_number) {
                await twilioClient.messages.create({
                    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                    to: `whatsapp:${business.whatsapp_number}`,
                    body: whatsappMessage
                });
                console.log(`[AUTO-PROVISION] WhatsApp sent to ${business.whatsapp_number}`);
            } else {
                console.log(`[AUTO-PROVISION] WhatsApp would be sent to ${business.whatsapp_number}:`);
                console.log(whatsappMessage);
            }
        } catch (waErr) {
            console.error('[AUTO-PROVISION] WhatsApp failed:', waErr.message);
        }
        
        console.log(`[AUTO-PROVISION] ✅ Complete for client ${clientId}`);
        console.log(`[AUTO-PROVISION] Number: ${purchasedNumber}`);
        
    } catch (err) {
        console.error('[AUTO-PROVISION] ❌ Failed:', err.message);
        
        // Update status to failed
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
