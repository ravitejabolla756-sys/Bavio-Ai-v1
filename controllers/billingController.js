const db = require('../database/db');
const dodoService = require('../services/dodoBillingService');
const onboardingController = require('./onboardingController');

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
                
                // Get client_id from metadata and trigger auto-provisioning
                const clientId = payment.metadata?.client_id;
                if (clientId) {
                    console.log(`[AUTO-PROVISION] Starting for client ${clientId}`);
                    // Run auto-provisioning asynchronously (don't block webhook response)
                    autoProvisionBusiness(clientId).catch(err => {
                        console.error('[AUTO-PROVISION] Failed:', err.message);
                    });
                }
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

// Auto-provision business after successful payment
async function autoProvisionBusiness(clientId) {
    try {
        console.log(`[AUTO-PROVISION] Step 1: Getting business data for client ${clientId}`);
        
        // Get business data
        const clientResult = await db.query(
            `SELECT 
                id, full_name, email, city, whatsapp_number,
                industry, language, intents, working_hours_from, working_hours_to,
                business_description
            FROM clients WHERE id = $1`,
            [clientId]
        );
        
        if (clientResult.rows.length === 0) {
            throw new Error(`Client ${clientId} not found`);
        }
        
        const business = clientResult.rows[0];
        
        // Get assistant config
        const assistantResult = await db.query(
            `SELECT * FROM assistants WHERE client_id = $1`,
            [clientId]
        );
        
        const assistant = assistantResult.rows[0];
        
        // Update onboarding status to processing
        await db.query(
            `UPDATE clients SET onboarding_status = $1 WHERE id = $2`,
            ['processing', clientId]
        );
        
        console.log(`[AUTO-PROVISION] Step 2: Purchasing Twilio number`);
        
        // Step 2: Buy Indian Twilio number
        const twilio = require('twilio');
        const twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
        
        let purchasedNumber = null;
        let purchasedSid = null;
        
        try {
            // Search for available Indian numbers
            const availableNumbers = await twilioClient
                .availablePhoneNumbers('IN')
                .local
                .list({ limit: 5 });
            
            if (availableNumbers.length === 0) {
                throw new Error('No Indian numbers available');
            }
            
            // Purchase the first available number
            const numberToBuy = availableNumbers[0].phoneNumber;
            const incomingNumber = await twilioClient
                .incomingPhoneNumbers
                .create({ phoneNumber: numberToBuy });
            
            purchasedNumber = incomingNumber.phoneNumber;
            purchasedSid = incomingNumber.sid;
            
            console.log(`[AUTO-PROVISION] Purchased number: ${purchasedNumber}`);
        } catch (twilioErr) {
            console.error('[AUTO-PROVISION] Twilio number purchase failed:', twilioErr.message);
            // If India not available, try US as fallback
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
            throw new Error('Could not purchase any phone number');
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
        
        // Step 4: Save number to database
        console.log(`[AUTO-PROVISION] Step 4: Saving to database`);
        
        await db.query(
            `UPDATE clients SET
                twilio_number = $1,
                twilio_number_sid = $2,
                number_assigned_at = NOW(),
                onboarding_status = $3
            WHERE id = $4`,
            [purchasedNumber, purchasedSid, 'ready', clientId]
        );
        
        // Also save to phone_numbers table
        await db.query(
            `INSERT INTO phone_numbers (client_id, phone_number, provider, status, assistant_id)
             VALUES ($1, $2, 'twilio', 'active', $3)
             ON CONFLICT (phone_number) DO UPDATE SET
                client_id = $1,
                assistant_id = $3,
                status = 'active'`,
            [clientId, purchasedNumber, assistant?.id || null]
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
                `UPDATE clients SET onboarding_status = $1 WHERE id = $2`,
                ['failed', clientId]
            );
        } catch (dbErr) {
            console.error('[AUTO-PROVISION] Could not update status:', dbErr.message);
        }
        
        throw err;
    }
}

module.exports = {
    subscribe,
    getStatus,
    cancel,
    handleWebhook
};
