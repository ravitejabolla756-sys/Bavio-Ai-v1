const db = require('../database/db');
console.log('db exports in authController on load:', Object.keys(db));
const { randomUUID } = require('crypto');

function inferCountry(phone, country) {
    if (country) return country.toUpperCase();
    if (!phone) return 'IN';
    const cleaned = String(phone).replace(/[\s\-\(\)\+]/g, '');
    if (cleaned.startsWith('91')) return 'IN';
    if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) return 'IN';
    return 'US';
}

function mapIndustryToSystemPromptKey(ind) {
    if (!ind) return 'other';
    const lower = ind.toLowerCase();
    if (lower.includes('real estate')) return 'real-estate';
    if (lower.includes('healthcare') || lower.includes('clinic')) return 'clinic';
    if (lower.includes('restaurant') || lower.includes('food')) return 'restaurant';
    return 'other';
}

async function checkEmail(req, res) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }
        
        const result = await db.query(
            `SELECT email FROM businesses WHERE email = $1`,
            [email.trim().toLowerCase()]
        );
        
        if (result.rows.length > 0) {
            return res.status(409).json({
                available: false,
                email: email,
                message: "Email already in use"
            });
        }
        
        return res.status(200).json({
            available: true,
            email: email
        });
    } catch (err) {
        console.error('[AUTH CONTROLLER] checkEmail error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
}

async function signup(req, res) {
    try {
        const { 
            name, email, phone, password, country, country_code,
            business_description, industry, language,
            agent_name, greeting, faqs,
            // New payload fields:
            businessName, countryCode, dialCode, phoneNumber,
            businessPhone, demoCompleted,
            plan, currency
        } = req.body;

        const finalEmail = email;
        const finalPassword = password;

        if (!finalEmail || !finalPassword) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const finalName = name || businessName || finalEmail.split('@')[0];
        const finalPhone = phone || businessPhone || (dialCode && phoneNumber ? (dialCode + phoneNumber) : null);
        
        let inferredCountryFromCurrency = null;
        if (currency === 'USD') inferredCountryFromCurrency = 'US';
        else if (currency === 'GBP') inferredCountryFromCurrency = 'GB';
        else if (currency === 'AUD') inferredCountryFromCurrency = 'AU';
        else if (currency === 'SGD') inferredCountryFromCurrency = 'SG';

        const finalCountryCode = (countryCode || country_code || inferredCountryFromCurrency || (finalPhone ? inferCountry(finalPhone, country) : 'US')).trim().toUpperCase().substring(0, 2);
        const finalCountry = country || finalCountryCode;
        
        // 1. Validation
        let finalNormalizedPhone = null;
        if (finalPhone) {
            const { validateAndNormalizePhone } = require('../utils/phoneValidation');
            const phoneValidationResult = validateAndNormalizePhone(finalPhone, finalCountryCode);
            
            if (!phoneValidationResult.valid) {
                return res.status(400).json({ success: false, error: phoneValidationResult.error });
            }
            finalNormalizedPhone = phoneValidationResult.normalized;
        }

        // 2. Create user in Supabase Auth via Admin client
        const createParams = {
            email: finalEmail,
            password: finalPassword,
            email_confirm: true,
            user_metadata: {
                full_name: finalName,
                country: finalCountry
            }
        };
        if (finalNormalizedPhone) {
            createParams.phone = finalNormalizedPhone;
            createParams.phone_confirm = true;
        }

        const { data: authData, error: authError } = await db.supabase.auth.admin.createUser(createParams);

        if (authError) {
            if (authError.message && (authError.message.includes('already registered') || authError.status === 422)) {
                const msg = authError.message.toLowerCase();
                if (msg.includes('phone')) {
                    return res.status(409).json({ success: false, error: 'A business with that phone number already exists' });
                }
                return res.status(409).json({ success: false, error: 'A business with that email already exists' });
            }
            console.error('Supabase Auth signup error:', authError);
            return res.status(400).json({ success: false, error: authError.message });
        }

        const supabaseUser = authData.user;
        
        // 3. Generate API Key (UUID formatted)
        const apiKey = randomUUID();

        const devEmails = ['ravitejabolla756@gmail.com', 'praneeth.dev111@gmail.com'];
        const isDeveloper = finalEmail && devEmails.includes(finalEmail.trim().toLowerCase());

        const finalMinutesLimit = isDeveloper ? 999999 : 0;
        const finalOnboardingStep = isDeveloper ? 6 : 0;
        const finalOnboardingStatus = isDeveloper ? 'ready' : 'pre_payment';
        const finalPlan = isDeveloper ? 'enterprise' : 'free';
        const finalPlanName = isDeveloper ? 'developer' : 'free_trial';
        const finalPeriodEnd = isDeveloper ? '2099-12-31 00:00:00+00' : null;
        const finalStatus = 'active'; 
        const finalSubStatus = isDeveloper ? 'active' : 'inactive';

        const validPlans = ['starter', 'growth', 'scale'];
        const planKeyMap = {
            'starter': 'starter',
            'growth': 'pro',
            'scale': 'enterprise'
        };
        const savedPlan = plan && validPlans.includes(plan.toLowerCase().trim()) 
            ? planKeyMap[plan.toLowerCase().trim()] 
            : 'free';

        // 4. Insert into businesses table
        const result = await db.query(
            `INSERT INTO businesses (
                id, name, email, phone, password_hash, api_key, 
                minutes_limit, minutes_used, status, country, country_code,
                full_name, business_description, industry, language,
                whatsapp_number, onboarding_step, onboarding_status,
                plan, plan_name, current_period_end, subscription_status,
                subscription_plan
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            RETURNING *`,
            [
                supabaseUser.id, finalName, finalEmail, finalNormalizedPhone, 'supabase_auth_placeholder', apiKey, 
                finalMinutesLimit, finalStatus, finalCountry, finalCountryCode, finalName, null, 
                null, 'en-US', finalNormalizedPhone, 
                finalOnboardingStep, finalOnboardingStatus,
                finalPlan, finalPlanName, finalPeriodEnd, finalSubStatus,
                savedPlan
            ]
        );
        
        const user = result.rows[0];

        // Trigger welcome email in the background
        const emailService = require('../services/emailService');
        emailService.sendMail(
            finalEmail,
            'Welcome to Bavio!',
            `Hi ${finalName},

Your Bavio account has been created. Try the 3-Minute Bavio Demo to get started.

Questions? Chat with us →

Bavio Team`
        ).catch(e => console.error('[EMAIL] Failed to send welcome email:', e.message));
        
        // 5. Generate token via Supabase Auth signin
        const authClient = db.createAuthClient();
        const { data: sessionData, error: sessionError } = await authClient.auth.signInWithPassword({
            email: finalEmail,
            password: finalPassword
        });

        if (sessionError) {
            console.error('Supabase Auth signin error after signup:', sessionError);
            return res.status(500).json({ success: false, error: 'Sign in failed after registration: ' + sessionError.message });
        }

        const token = sessionData.session.access_token;
        
        // 6. Return response
        res.status(201).json({
            success: true,
            token,
            jwt: token, 
            client_id: user.id,
            userId: user.id, 
            businessId: user.id, 
            name: user.name,
            email: user.email,
            plan: user.plan || 'free',
            plan_name: user.plan_name || 'Free Trial',
            onboarding_status: user.onboarding_status || 'pending',
            onboarding_step: user.onboarding_step || 0,
            minutes_limit: user.minutes_limit,
            minutes_used: user.minutes_used,
            country_code: user.country_code,
            redirectTo: '/demo'
        });
    } catch (err) {
        if (err.code === '23505') {
            const detail = String(err.detail || '').toLowerCase();
            if (detail.includes('email')) {
                return res.status(409).json({ success: false, error: 'A business with that email already exists' });
            }
            if (detail.includes('phone')) {
                return res.status(409).json({ success: false, error: 'A business with that phone number already exists' });
            }
        }
        console.error('signup error:', err);
        res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;
        
        // 1. Validation
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        // 2. Authenticate via Supabase Auth (using a fresh client to avoid mutating the shared client)
        const authClient = db.createAuthClient();
        const { data, error } = await authClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        
        const supabaseUser = data.user;
        const token = data.session.access_token;
        
        // 3. Find user
        const result = await db.query(
            'SELECT * FROM businesses WHERE id = $1 AND status = $2',
            [supabaseUser.id, 'active']
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        
        // 4. Return response (NO password_hash exposed)
        res.status(200).json({
            success: true,
            token,
            client_id: user.id,
            name: user.name,
            email: user.email,
            plan: user.plan || 'free',
            plan_name: user.plan_name || 'Free Trial',
            onboarding_status: user.onboarding_status || 'pending',
            onboarding_step: user.onboarding_step || 0,
            minutes_limit: user.minutes_limit,
            minutes_used: user.minutes_used,
            country_code: user.country_code,
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}async function getProfile(req, res) {
    try {
        let result = await db.query(
            'SELECT * FROM businesses WHERE id = $1',
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            console.log(`Auto-creating business profile for Google user: ${req.user.id} (${req.user.email})`);
            const apiKey = randomUUID();
            const emailPrefix = req.user.email ? req.user.email.split('@')[0] : 'User';
            
            const insertResult = await db.query(
                `INSERT INTO businesses (
                    id, name, email, phone, password_hash, api_key, 
                    minutes_limit, minutes_used, status, country, country_code,
                    full_name, onboarding_step, onboarding_status, subscription_status
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 'registered', 'US', 'US', $7, 0, 'pre_payment', 'inactive')
                 RETURNING *`,
                [
                    req.user.id,
                    emailPrefix,
                    req.user.email,
                    `google_oauth_fallback_${req.user.id}`,
                    'supabase_auth_placeholder',
                    apiKey,
                    emailPrefix
                ]
            );
            result = insertResult;
        }
        
        const user = result.rows[0];
        
        // Compute trial metadata
        const limit = user.minutes_limit || 0;
        const used = user.minutes_used || 0;
        const trialMinutesAvailable = Math.max(0, limit - used);
        const trialStatus = used >= limit ? 'EXPIRED' : 'ACTIVE';
        const trialEndsAt = new Date(new Date(user.created_at).getTime() + 14 * 24 * 3600 * 1000).toISOString();

        // 1. Compute demo_status
        let demoStatus = 'eligible';
        const demoRes = await db.query(
            "SELECT demo_status, demo_used FROM demo_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
            [user.id]
        );
        if (demoRes.rows.length > 0) {
            const lastDemo = demoRes.rows[0];
            if (lastDemo.demo_used) {
                demoStatus = 'completed';
            } else if (lastDemo.demo_status === 'active') {
                demoStatus = 'active';
            } else if (lastDemo.demo_status === 'failed') {
                demoStatus = 'failed';
            }
        }

        // 2. Compute assistant_status
        const astCount = await db.query("SELECT id FROM assistants WHERE business_id = $1 LIMIT 1", [user.id]);
        const assistantStatus = astCount.rows.length > 0 ? 'configured' : 'not_configured';

        // 3. Compute phone_number_status
        const phoneNumberStatus = user.twilio_number ? 'assigned' : 'not_assigned';

        // 4. Resolve nextRoute
        const subStatus = user.subscription_status || 'inactive';
        const onboardingStatus = user.onboarding_status || 'pre_payment';
        let nextRoute = '/demo';

        if (subStatus === 'cancelled' || subStatus === 'expired') {
            nextRoute = '/billing/reactivate';
        } else if (subStatus === 'inactive' || subStatus === 'trialing') {
            // Check if there is a pending subscription intent
            const intentCheck = await db.query(
                "SELECT id FROM subscription_intents WHERE business_id = $1 AND status = 'pending' LIMIT 1",
                [user.id]
            );
            if (intentCheck.rows.length > 0) {
                nextRoute = '/payment-processing';
            } else if (demoStatus === 'eligible' || demoStatus === 'active') {
                nextRoute = '/demo';
            } else {
                nextRoute = '/pricing';
            }
        } else if (subStatus === 'pending') {
            nextRoute = '/payment-processing';
        } else if (subStatus === 'active') {
            if (onboardingStatus === 'completed' || user.onboarding_step >= 6) {
                nextRoute = '/dashboard';
            } else {
                const step = user.onboarding_step || 0;
                if (step < 3) {
                    nextRoute = '/onboarding';
                } else if (step === 3) {
                    nextRoute = '/onboarding/ai-setup';
                } else if (step === 4) {
                    nextRoute = '/onboarding/phone';
                } else if (step === 5) {
                    nextRoute = '/onboarding/test-drive';
                } else {
                    nextRoute = '/dashboard';
                }
            }
        }

        // Return flat profile matching frontend BusinessProfile type
        res.status(200).json({
            success: true,
            id: user.id,
            userId: user.id,
            businessId: user.id,
            name: user.name,
            businessName: user.name,
            email: user.email,
            phone: user.phone,
            country: user.country,
            country_code: user.country_code,
            api_key: user.api_key,
            minutes_limit: user.minutes_limit,
            minutes_used: user.minutes_used,
            trialStatus,
            trialMinutesAvailable,
            trialEndsAt,
            status: subStatus === 'inactive' ? 'registered' : user.status,
            account_status: subStatus === 'inactive' ? 'registered' : user.status,
            subscription_status: subStatus,
            onboarding_status: onboardingStatus,
            onboarding_step: user.onboarding_step || 0,
            assistant_status: assistantStatus,
            phone_number_status: phoneNumberStatus,
            demo_status: demoStatus,
            nextRoute,
            dodo_subscription_id: user.dodo_subscription_id || null,
            industry: user.industry || null,
            language: user.language || null,
            business_description: user.business_description || null,
            city: user.city || null,
            twilio_number: user.twilio_number || null,
            created_at: user.created_at,
        });
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

async function updateProfile(req, res) {
    try {
        const { name, phone, whatsapp_number, country, country_code } = req.body;
        
        const result = await db.query(
            `UPDATE businesses 
             SET name = COALESCE($1, name),
                 phone = COALESCE($2, phone),
                 whatsapp_number = COALESCE($3, whatsapp_number),
                 country = COALESCE($4, country),
                 country_code = COALESCE($5, country_code),
                 updated_at = NOW()
             WHERE id = $6 AND status = 'active'
             RETURNING *`,
            [
                name || null, 
                phone || null, 
                whatsapp_number || null, 
                country || null, 
                country_code ? country_code.trim().toUpperCase().substring(0, 2) : null,
                req.user.id
            ]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        const user = result.rows[0];
        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                country: user.country,
                country_code: user.country_code,
                whatsapp_number: user.whatsapp_number,
                api_key: user.api_key,
                minutes_limit: user.minutes_limit,
                minutes_used: user.minutes_used
            }
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = {
    signup,
    login,
    getProfile,
    updateProfile,
    checkEmail
};
