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
            businessPhone, demoCompleted
        } = req.body;

        const finalName = name || businessName;
        const finalEmail = email;
        const finalPassword = password;
        const finalPhone = phone || businessPhone || (dialCode && phoneNumber ? (dialCode + phoneNumber) : null);
        const finalCountryCode = (countryCode || country_code || inferCountry(finalPhone, country)).trim().toUpperCase().substring(0, 2);
        const finalCountry = country || finalCountryCode;
        
        // 1. Validation
        if (!finalName || !finalEmail || !finalPhone || !finalPassword) {
            return res.status(400).json({ success: false, error: 'Name/Business name, email, phone, and password are required' });
        }

        // 2. Create user in Supabase Auth via Admin client (auto-confirm email and phone)
        const { data: authData, error: authError } = await db.supabase.auth.admin.createUser({
            email: finalEmail,
            password: finalPassword,
            phone: finalPhone,
            email_confirm: true,
            phone_confirm: true,
            user_metadata: {
                full_name: finalName,
                country: finalCountry
            }
        });

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

        const isDemo = demoCompleted === true || String(demoCompleted) === 'true';
        const hasReceptionistData = agent_name && greeting;
        // If demoCompleted is true, they have a receptionist set up automatically, step 1 complete
        const onboardingStep = isDemo ? 1 : (hasReceptionistData ? 3 : 0);
        const onboardingStatus = isDemo ? 'pending' : (hasReceptionistData ? 'payment_pending' : 'pending');

        const devEmails = ['ravitejabolla756@gmail.com', 'praneeth.dev111@gmail.com'];
        const isDeveloper = finalEmail && devEmails.includes(finalEmail.trim().toLowerCase());

        const finalMinutesLimit = isDeveloper ? 999999 : 100;
        const finalOnboardingStep = isDeveloper ? 6 : onboardingStep;
        const finalOnboardingStatus = isDeveloper ? 'ready' : onboardingStatus;
        const finalPlan = isDeveloper ? 'enterprise' : 'free';
        const finalPlanName = isDeveloper ? 'developer' : 'free_trial';
        const finalPeriodEnd = isDeveloper ? '2099-12-31 00:00:00+00' : null;

        // 4. Insert into businesses table with active status
        const result = await db.query(
            `INSERT INTO businesses (
                id, name, email, phone, password_hash, api_key, 
                minutes_limit, minutes_used, status, country, country_code,
                full_name, business_description, industry, language,
                whatsapp_number, onboarding_step, onboarding_status,
                plan, plan_name, current_period_end, subscription_status
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'active', $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
             RETURNING *`,
            [
                supabaseUser.id, finalName, finalEmail, finalPhone, 'supabase_auth_placeholder', apiKey, 
                finalMinutesLimit, finalCountry, finalCountryCode, finalName, business_description || null, 
                industry || null, language || 'en-US', finalPhone, 
                finalOnboardingStep, finalOnboardingStatus,
                finalPlan, finalPlanName, finalPeriodEnd, isDeveloper ? 'active' : 'trialing'
            ]
        );
        
        const user = result.rows[0];

        // Trigger welcome email in the background
        const emailService = require('../services/emailService');
        emailService.sendMail(
            finalEmail,
            'Welcome to Bavio AI!',
            `Hi ${finalName},\n\nThank you for signing up with Bavio AI! Your account has been successfully created.\n\nGet started by setting up your dedicated receptionist virtual phone line to answer calls automatically 24/7.\n\nBest regards,\nThe Bavio Team`
        ).catch(e => console.error('[EMAIL] Failed to send welcome email:', e.message));
        
        // 4.5 Auto-create receptionist assistant if demoCompleted is true
        if (isDemo) {
            const onboardingController = require('./onboardingController');
            const defaultAgentName = 'Bavio Assistant';
            const defaultGreeting = `Hello! Welcome to ${finalName}. I'm your AI receptionist. How can I help you today?`;
            
            const promptKey = mapIndustryToSystemPromptKey(industry);
            const systemPrompt = onboardingController.buildSystemPrompt({
                agent_name: defaultAgentName,
                greeting: defaultGreeting,
                industry: promptKey,
                language: 'en-US'
            });

            const assistantResult = await db.query(
                `INSERT INTO assistants
                  (business_id, name, agent_name, greeting, first_message, voice, voice_id, faqs, industry, language, system_prompt, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, true)
                 RETURNING id`,
                [
                    supabaseUser.id,
                    defaultAgentName,
                    defaultAgentName,
                    defaultGreeting,
                    defaultGreeting,
                    'meera', // voice
                    'meera', // voice_id
                    JSON.stringify([]), // faqs
                    promptKey,
                    'en-US',
                    systemPrompt
                ]
            );

            if (assistantResult.rows.length > 0) {
                const assistantId = assistantResult.rows[0].id;
                await db.query(
                    'UPDATE businesses SET assistant_id = $1 WHERE id = $2',
                    [assistantId, supabaseUser.id]
                );
                console.log(`[AUTH SIGNUP] Linked default assistant ${assistantId} to business ${supabaseUser.id}`);
            }
        } else if (hasReceptionistData) {
            // Create receptionist assistant immediately if provided normally
            const onboardingController = require('./onboardingController');
            const systemPrompt = onboardingController.buildSystemPrompt({
                agent_name,
                greeting,
                industry: industry || 'general',
                language: language || 'hi-IN',
                faqs: faqs || []
            });

            await db.query(
                `INSERT INTO assistants
                  (business_id, name, agent_name, greeting, first_message, voice_id, faqs, industry, language, system_prompt, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, true)`,
                [
                    user.id,
                    agent_name,
                    agent_name,
                    greeting,
                    greeting,
                    'meera', // default voice_id
                    JSON.stringify(faqs || []),
                    industry || 'general',
                    language || 'hi-IN',
                    systemPrompt
                ]
            );
        }
        
        // 5. Generate token via Supabase Auth signin (using a fresh client to avoid mutating the shared client)
        const authClient = db.createAuthClient();
        const { data: sessionData, error: sessionError } = await authClient.auth.signInWithPassword({
            email,
            password
        });

        if (sessionError) {
            console.error('Supabase Auth signin error after signup:', sessionError);
            return res.status(500).json({ success: false, error: 'Sign in failed after registration: ' + sessionError.message });
        }

        const token = sessionData.session.access_token;
        
        // 6. Return response (NO password_hash exposed)
        res.status(201).json({
            success: true,
            token,
            jwt: token, // Alias for jwt
            client_id: user.id,
            userId: user.id, // Alias for userId
            businessId: user.id, // Alias for businessId
            name: user.name,
            email: user.email,
            plan: user.plan || 'free',
            plan_name: user.plan_name || 'Free Trial',
            onboarding_status: user.onboarding_status || 'pending',
            onboarding_step: user.onboarding_step || 0,
            minutes_limit: user.minutes_limit,
            minutes_used: user.minutes_used,
            country_code: user.country_code,
            redirectTo: '/onboarding'
        });
    } catch (err) {
        if (err.code === '23505') {
            const detail = String(err.detail || '').toLowerCase();
            if (detail.includes('phone') || detail.includes('mobile')) {
                return res.status(409).json({ success: false, error: 'A business with that phone number already exists' });
            }
            return res.status(409).json({ success: false, error: 'A business with that email already exists' });
        }
        console.error('signup error:', err);
        res.status(500).json({ success: false, error: err.message });
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
}

async function getProfile(req, res) {
    try {
        let result = await db.query(
            'SELECT * FROM businesses WHERE id = $1 AND status = $2',
            [req.user.id, 'active']
        );
        
        if (result.rows.length === 0) {
            console.log(`Auto-creating business profile for Google user: ${req.user.id} (${req.user.email})`);
            const apiKey = randomUUID();
            const emailPrefix = req.user.email ? req.user.email.split('@')[0] : 'User';
            
            const insertResult = await db.query(
                `INSERT INTO businesses (
                    id, name, email, phone, password_hash, api_key, 
                    minutes_limit, minutes_used, status, country,
                    full_name, onboarding_step, onboarding_status
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, 100, 0, 'active', $7, $8, 0, 'pending')
                 RETURNING *`,
                [
                    req.user.id,
                    emailPrefix,
                    req.user.email,
                    `google_oauth_fallback_${req.user.id}`,
                    'supabase_auth_placeholder',
                    apiKey,
                    'IN', // default country
                    emailPrefix
                ]
            );
            result = insertResult;
        }
        
        const user = result.rows[0];
        
        // Compute trial metadata
        const limit = user.minutes_limit || 30;
        const used = user.minutes_used || 0;
        const trialMinutesAvailable = Math.max(0, limit - used);
        const trialStatus = used >= limit ? 'EXPIRED' : 'ACTIVE';
        const trialEndsAt = new Date(new Date(user.created_at).getTime() + 14 * 24 * 3600 * 1000).toISOString();

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
            status: 'ACTIVE',
            plan: user.plan || 'free',
            plan_name: user.plan_name || 'Free Trial',
            current_period_end: user.current_period_end || null,
            onboarding_status: user.onboarding_status || 'pending',
            onboarding_step: user.onboarding_step || 0,
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
