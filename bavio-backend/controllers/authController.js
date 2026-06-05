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

async function signup(req, res) {
    try {
        const { 
            name, email, phone, password, country,
            business_description, industry, language,
            agent_name, greeting, faqs
        } = req.body;
        
        // 1. Validation
        if (!name || !email || !phone || !password) {
            return res.status(400).json({ success: false, error: 'Name, email, phone, and password are required' });
        }

        // 2. Create user in Supabase Auth via Admin client (auto-confirm email and phone)
        const { data: authData, error: authError } = await db.supabase.auth.admin.createUser({
            email: email,
            password: password,
            phone: phone,
            email_confirm: true,
            phone_confirm: true,
            user_metadata: {
                full_name: name,
                country: country
            }
        });

        if (authError) {
            if (authError.message && (authError.message.includes('already registered') || authError.status === 422)) {
                return res.status(409).json({ success: false, error: 'A business with that email already exists' });
            }
            console.error('Supabase Auth signup error:', authError);
            return res.status(400).json({ success: false, error: authError.message });
        }

        const supabaseUser = authData.user;
        
        // 3. Generate API Key (UUID formatted)
        const apiKey = randomUUID();
        
        const inferredCountry = inferCountry(phone, country);

        const hasReceptionistData = agent_name && greeting;
        const onboardingStep = hasReceptionistData ? 3 : 0;
        const onboardingStatus = hasReceptionistData ? 'payment_pending' : 'pending';

        // 4. Insert into businesses table with active status
        const result = await db.query(
            `INSERT INTO businesses (
                id, name, email, phone, password_hash, api_key, 
                minutes_limit, minutes_used, status, country,
                full_name, business_description, industry, language,
                whatsapp_number, onboarding_step, onboarding_status
             )
             VALUES ($1, $2, $3, $4, $5, $6, 100, 0, 'active', $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING *`,
            [
                supabaseUser.id, name, email, phone, 'supabase_auth_placeholder', apiKey, 
                inferredCountry, name, business_description || null, 
                industry || null, language || 'hi-IN', phone, 
                onboardingStep, onboardingStatus
            ]
        );
        
        const user = result.rows[0];

        // Create receptionist assistant immediately if provided
        if (hasReceptionistData) {
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
            client_id: user.id,
            name: user.name,
            email: user.email,
            plan: user.plan || 'free',
            plan_name: user.plan_name || 'Free Trial',
            onboarding_status: user.onboarding_status || 'pending',
            onboarding_step: user.onboarding_step || 0,
            minutes_limit: user.minutes_limit,
            minutes_used: user.minutes_used,
        });
    } catch (err) {
        if (err.code === '23505') {
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
                    'google_oauth_fallback',
                    'supabase_auth_placeholder',
                    apiKey,
                    'IN', // default country
                    emailPrefix
                ]
            );
            result = insertResult;
        }
        
        const user = result.rows[0];
        
        // Return flat profile matching frontend BusinessProfile type
        res.status(200).json({
            success: true,
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            country: user.country,
            api_key: user.api_key,
            minutes_limit: user.minutes_limit,
            minutes_used: user.minutes_used,
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
            created_at: user.created_at,
        });
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

async function updateProfile(req, res) {
    try {
        const { name, phone, whatsapp_number, country } = req.body;
        
        const result = await db.query(
            `UPDATE businesses 
             SET name = COALESCE($1, name),
                 phone = COALESCE($2, phone),
                 whatsapp_number = COALESCE($3, whatsapp_number),
                 country = COALESCE($4, country),
                 updated_at = NOW()
             WHERE id = $5 AND status = 'active'
             RETURNING *`,
            [name || null, phone || null, whatsapp_number || null, country || null, req.user.id]
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
    updateProfile
};
