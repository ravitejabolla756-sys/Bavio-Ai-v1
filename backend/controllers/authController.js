const db = require('../database/db');
const crypto = require('node:crypto');
const { randomUUID } = crypto;

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
            businessName, countryCode, dialCode, phoneNumber,
            businessPhone, demoCompleted,
            plan, currency
        } = req.body;

        const rawEmail = email;
        const finalPassword = password;

        if (!rawEmail || !finalPassword) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const normalizedEmail = String(rawEmail).trim().toLowerCase();
        const finalName = name || businessName || normalizedEmail.split('@')[0];
        const finalPhone = phone || businessPhone || (dialCode && phoneNumber ? (dialCode + phoneNumber) : null);

        let inferredCountryFromCurrency = null;
        if (currency === 'USD') inferredCountryFromCurrency = 'US';
        else if (currency === 'GBP') inferredCountryFromCurrency = 'GB';
        else if (currency === 'AUD') inferredCountryFromCurrency = 'AU';
        else if (currency === 'SGD') inferredCountryFromCurrency = 'SG';

        const finalCountryCode = (countryCode || country_code || inferredCountryFromCurrency || (finalPhone ? inferCountry(finalPhone, country) : 'US')).trim().toUpperCase().substring(0, 2);
        const finalCountry = country || finalCountryCode;

        let finalNormalizedPhone = null;
        if (finalPhone) {
            const { validateAndNormalizePhone } = require('../utils/phoneValidation');
            const phoneValidationResult = validateAndNormalizePhone(finalPhone, finalCountryCode);

            if (!phoneValidationResult.valid) {
                if (phoneValidationResult.error.includes('provisioning virtual numbers')) {
                    finalNormalizedPhone = finalPhone;
                } else {
                    return res.status(400).json({ success: false, error: phoneValidationResult.error });
                }
            } else {
                finalNormalizedPhone = phoneValidationResult.normalized;
            }
        }

        // ── 1. Check existing business state in PostgreSQL ───────────────────
        const existingBizRes = await db.query(
            'SELECT * FROM businesses WHERE email = $1',
            [normalizedEmail]
        );
        const existingBiz = existingBizRes.rows[0];

        // State C: Account already exists and is active / verified
        if (existingBiz && existingBiz.status === 'active') {
            return res.status(409).json({
                success: false,
                code: 'ACCOUNT_ALREADY_EXISTS',
                error: 'An account already exists for this email. Sign in instead.'
            });
        }

        const emailService = require('../services/emailService');

        // State B: Account exists and is pending verification
        if (existingBiz && existingBiz.status === 'pending_verification') {
            // Check if recent OTP was generated within cooldown (30s)
            const recentOtp = await db.query(
                `SELECT created_at FROM email_verifications
                 WHERE email = $1 AND created_at > NOW() - INTERVAL '30 seconds'
                 ORDER BY created_at DESC LIMIT 1`,
                [normalizedEmail]
            );

            if (recentOtp.rows.length === 0) {
                // Invalidate prior unconsumed OTPs
                await db.query(
                    'UPDATE email_verifications SET consumed = true WHERE email = $1 AND consumed = false',
                    [normalizedEmail]
                );

                const otpCode = crypto.randomInt(100000, 999999).toString();
                const otpHash = crypto.createHash('sha256').update(`${normalizedEmail}:${otpCode}`).digest('hex');

                await db.query(
                    `INSERT INTO email_verifications (email, otp_hash, otp_code, expires_at)
                     VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
                    [normalizedEmail, otpHash, otpCode]
                );

                emailService.sendOtpEmail(normalizedEmail, otpCode).catch(e =>
                    console.error('[EMAIL] Failed to send resumed OTP email:', e.message)
                );
            }

            return res.status(200).json({
                success: true,
                emailVerificationRequired: true,
                code: 'VERIFICATION_REQUIRED',
                resumed: true,
                client_id: existingBiz.id,
                userId: existingBiz.id,
                businessId: existingBiz.id,
                name: existingBiz.name,
                email: existingBiz.email,
                plan: existingBiz.plan || 'free',
                plan_name: existingBiz.plan_name || 'Free Trial',
                onboarding_status: existingBiz.onboarding_status || 'pre_payment',
                onboarding_step: existingBiz.onboarding_step || 0,
                minutes_limit: existingBiz.minutes_limit,
                minutes_used: existingBiz.minutes_used,
                country_code: existingBiz.country_code,
                redirectTo: '/verify-email'
            });
        }

        // Check if Auth user already exists in auth.users table
        const authUserCheck = await db.query(
            'SELECT id, email FROM auth.users WHERE email = $1',
            [normalizedEmail]
        );
        const existingAuthUser = authUserCheck.rows[0];

        let supabaseUser = null;
        if (existingAuthUser) {
            // State D: Auth user exists, business profile missing -> reuse existing auth identity
            supabaseUser = { id: existingAuthUser.id, email: normalizedEmail };
        } else {
            // ── 2. Authenticate / Create Supabase Auth User ───────────────────
            const authClient = db.createAuthClient();
            const signUpOptions = {
                email: normalizedEmail,
                password: finalPassword,
                options: {
                    data: {
                        full_name: finalName,
                        country: finalCountry
                    },
                    emailRedirectTo: `${req.headers.origin || 'https://www.bavio.in'}/auth/callback`
                }
            };

            const { data: authData, error: authError } = await authClient.auth.signUp(signUpOptions);

            if (authError) {
                const authMsg = (authError.message || '').toLowerCase();

                // Check if user was actually created despite error (e.g. rate limit on retry)
                const lateAuthCheck = await db.query('SELECT id, email FROM auth.users WHERE email = $1', [normalizedEmail]);
                if (lateAuthCheck.rows.length > 0) {
                    supabaseUser = { id: lateAuthCheck.rows[0].id, email: normalizedEmail };
                } else if (authError.status === 429 || authMsg.includes('security purposes') || authMsg.includes('rate limit') || authMsg.includes('seconds')) {
                    const match = authError.message.match(/(\d+)\s*seconds/i);
                    const retrySeconds = match ? parseInt(match[1], 10) : 50;
                    return res.status(429).json({
                        success: false,
                        code: 'VERIFICATION_COOLDOWN',
                        retry_after_seconds: retrySeconds,
                        error: `Please wait before requesting another verification code.`
                    });
                } else if (authMsg.includes('already registered') || authError.status === 422) {
                    return res.status(409).json({
                        success: false,
                        code: 'ACCOUNT_ALREADY_EXISTS',
                        error: 'An account already exists for this email. Sign in instead.'
                    });
                } else {
                    console.error('[AUTH CONTROLLER] Supabase Auth signup error:', authError);
                    return res.status(400).json({
                        success: false,
                        code: 'AUTH_ERROR',
                        error: authError.message || 'Unable to create account'
                    });
                }
            } else {
                supabaseUser = authData?.user;
            }
        }

        // Fallback check if user object was not resolved
        if (!supabaseUser || !supabaseUser.id) {
            return res.status(409).json({
                success: false,
                code: 'ACCOUNT_ALREADY_EXISTS',
                error: 'An account already exists for this email. Sign in instead.'
            });
        }

        // State E: Check for identity conflict between business row and auth user
        if (existingBiz && existingBiz.id !== supabaseUser.id) {
            console.error('[AUTH CONTROLLER] Inconsistent identity state detected:', {
                bizId: existingBiz.id,
                authUserId: supabaseUser.id,
                email: normalizedEmail
            });
            return res.status(409).json({
                success: false,
                code: 'IDENTITY_CONFLICT',
                error: 'An account already exists with conflicting credentials. Please contact support.'
            });
        }

        // ── 3. Check / Insert Business Record Idempotently ────────────────────
        // Check if a business already exists with this supabaseUser.id or email
        const userByIdCheck = await db.query(
            'SELECT * FROM businesses WHERE id = $1 OR email = $2',
            [supabaseUser.id, normalizedEmail]
        );

        let user;
        if (userByIdCheck.rows.length > 0) {
            // Already created in previous step or concurrent call
            user = userByIdCheck.rows[0];
            if (user.status === 'active') {
                return res.status(409).json({
                    success: false,
                    code: 'ACCOUNT_ALREADY_EXISTS',
                    error: 'An account already exists for this email. Sign in instead.'
                });
            }
        } else {
            // Fresh insert
            const isDev = process.env.NODE_ENV === 'development';
            const apiKey = randomUUID();
            const devEmails = ['ravitejabolla756@gmail.com', 'praneeth.dev111@gmail.com'];
            const isDeveloper = normalizedEmail && devEmails.includes(normalizedEmail);

            const finalMinutesLimit = isDeveloper ? 999999 : 0;
            const finalOnboardingStep = isDeveloper ? 6 : 0;
            const finalOnboardingStatus = isDeveloper ? 'ready' : 'pre_payment';
            const finalPlan = isDeveloper ? 'enterprise' : 'free';
            const finalPlanName = isDeveloper ? 'developer' : 'free_trial';
            const finalPeriodEnd = isDeveloper ? '2099-12-31 00:00:00+00' : null;
            const finalStatus = 'pending_verification';
            const finalSubStatus = isDeveloper ? 'active' : 'inactive';

            const validPlans = ['starter', 'growth', 'scale'];
            const planKeyMap = { 'starter': 'starter', 'growth': 'pro', 'scale': 'enterprise' };
            const savedPlan = plan && validPlans.includes(plan.toLowerCase().trim())
                ? planKeyMap[plan.toLowerCase().trim()]
                : 'free';

            const insertResult = await db.query(
                `INSERT INTO businesses (
                    id, name, email, phone, password_hash, api_key,
                    minutes_limit, minutes_used, status, country, country_code,
                    full_name, business_description, industry, language,
                    whatsapp_number, onboarding_step, onboarding_status,
                    plan, plan_name, current_period_end, subscription_status,
                    subscription_plan
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
                ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
                RETURNING *`,
                [
                    supabaseUser.id, finalName, normalizedEmail, finalNormalizedPhone, 'supabase_auth_placeholder', apiKey,
                    finalMinutesLimit, finalStatus, finalCountry, finalCountryCode, finalName, null,
                    null, 'en-US', finalNormalizedPhone,
                    finalOnboardingStep, finalOnboardingStatus,
                    finalPlan, finalPlanName, finalPeriodEnd, finalSubStatus,
                    savedPlan
                ]
            );
            user = insertResult.rows[0];
        }

        // ── 4. Generate and Dispatch Bavio 6-Digit OTP ─────────────────────────
        const otpCode = crypto.randomInt(100000, 999999).toString();
        const otpHash = crypto.createHash('sha256').update(`${normalizedEmail}:${otpCode}`).digest('hex');

        await db.query(
            'UPDATE email_verifications SET consumed = true WHERE email = $1 AND consumed = false',
            [normalizedEmail]
        );

        await db.query(
            `INSERT INTO email_verifications (email, otp_hash, otp_code, expires_at)
             VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
            [normalizedEmail, otpHash, otpCode]
        );

        emailService.sendOtpEmail(normalizedEmail, otpCode).catch(e =>
            console.error('[EMAIL] Failed to send OTP email:', e.message)
        );

        return res.status(201).json({
            success: true,
            emailVerificationRequired: true,
            code: 'VERIFICATION_REQUIRED',
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
            redirectTo: '/verify-email'
        });

    } catch (err) {
        console.error('[AUTH CONTROLLER] signup error:', err);

        // ── 5. Sanitize all Database Unique Violations ────────────────────────
        if (err.code === '23505') {
            const detail = String(err.detail || '').toLowerCase();
            const constraint = String(err.constraint || '').toLowerCase();

            if (detail.includes('email') || constraint.includes('email') || constraint.includes('pkey') || detail.includes('id')) {
                return res.status(409).json({
                    success: false,
                    code: 'ACCOUNT_ALREADY_EXISTS',
                    error: 'An account already exists for this email. Sign in instead.'
                });
            }
            if (detail.includes('phone') || constraint.includes('phone')) {
                return res.status(409).json({
                    success: false,
                    code: 'PHONE_ALREADY_EXISTS',
                    error: 'A business with that phone number already exists.'
                });
            }
            return res.status(409).json({
                success: false,
                code: 'ACCOUNT_ALREADY_EXISTS',
                error: 'An account already exists with these details. Sign in instead.'
            });
        }

        // Generic fail-safe response: NEVER expose SQL or internal errors
        return res.status(500).json({
            success: false,
            code: 'INTERNAL_ERROR',
            error: 'Unable to complete registration. Please try again or contact support.'
        });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

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

        const result = await db.query(
            'SELECT * FROM businesses WHERE id = $1 AND status = $2',
            [supabaseUser.id, 'active']
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid credentials or account pending verification' });
        }

        const user = result.rows[0];

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

        const limit = user.minutes_limit || 0;
        const used = user.minutes_used || 0;
        const trialMinutesAvailable = Math.max(0, limit - used);
        const trialStatus = used >= limit ? 'EXPIRED' : 'ACTIVE';
        const trialEndsAt = new Date(new Date(user.created_at).getTime() + 14 * 24 * 3600 * 1000).toISOString();

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

        const astCount = await db.query("SELECT id FROM assistants WHERE business_id = $1 LIMIT 1", [user.id]);
        const assistantStatus = astCount.rows.length > 0 ? 'configured' : 'not_configured';
        const phoneNumberStatus = user.twilio_number ? 'assigned' : 'not_assigned';

        const subStatus = user.subscription_status || 'inactive';
        const onboardingStatus = user.onboarding_status || 'pre_payment';
        let nextRoute = '/demo';

        if (subStatus === 'cancelled' || subStatus === 'expired') {
            nextRoute = '/billing/reactivate';
        } else if (subStatus === 'inactive' || subStatus === 'trialing') {
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

async function changeEmail(req, res) {
    try {
        const { userId, newEmail } = req.body;
        if (!userId || !newEmail) {
            return res.status(400).json({ success: false, error: 'User ID and new email are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            return res.status(400).json({ success: false, error: 'Invalid email address format' });
        }

        const userRes = await db.query(
            'SELECT email, onboarding_status FROM businesses WHERE id = $1',
            [userId]
        );
        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const duplicateRes = await db.query(
            'SELECT id FROM businesses WHERE email = $1 AND id != $2',
            [newEmail.trim().toLowerCase(), userId]
        );
        if (duplicateRes.rows.length > 0) {
            return res.status(409).json({ success: false, error: 'A business with that email already exists' });
        }

        const { data: authData, error: authError } = await db.supabase.auth.admin.updateUserById(
            userId,
            { email: newEmail.trim() }
        );

        if (authError) {
            console.error('Supabase Auth update email error:', authError);
            return res.status(400).json({ success: false, error: authError.message });
        }

        await db.query(
            'UPDATE businesses SET email = $1, updated_at = NOW() WHERE id = $2',
            [newEmail.trim().toLowerCase(), userId]
        );

        try {
            const authClient = db.createAuthClient();
            await authClient.auth.resend({
                type: 'signup',
                email: newEmail.trim(),
                options: {
                    emailRedirectTo: `${req.headers.origin || 'https://bavio.in'}/auth/callback`
                }
            });
        } catch (resendErr) {
            console.warn('[changeEmail] Failed to auto-resend verification link:', resendErr.message);
        }

        res.status(200).json({
            success: true,
            message: 'Email address updated successfully and verification link sent.'
        });
    } catch (err) {
        console.error('Change email error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

async function resendVerification(req, res) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const emailService = require('../services/emailService');

        const userCheck = await db.query(
            `SELECT id, name FROM businesses WHERE email = $1`,
            [trimmedEmail]
        );
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No account found with this email. Please sign up first.' });
        }

        const recentOtpCheck = await db.query(
            `SELECT created_at FROM email_verifications
             WHERE email = $1 AND created_at > NOW() - INTERVAL '30 seconds'
             ORDER BY created_at DESC LIMIT 1`,
            [trimmedEmail]
        );

        if (recentOtpCheck.rows.length > 0) {
            const elapsed = Math.floor((Date.now() - new Date(recentOtpCheck.rows[0].created_at).getTime()) / 1000);
            const remaining = Math.max(1, 30 - elapsed);
            return res.status(429).json({
                success: false,
                code: 'VERIFICATION_COOLDOWN',
                retry_after_seconds: remaining,
                error: `Please wait ${remaining} seconds before requesting another verification code.`
            });
        }

        await db.query(
            `UPDATE email_verifications SET consumed = true WHERE email = $1 AND consumed = false`,
            [trimmedEmail]
        );

        const otpCode = crypto.randomInt(100000, 999999).toString();
        const otpHash = crypto.createHash('sha256').update(`${trimmedEmail}:${otpCode}`).digest('hex');

        await db.query(
            `INSERT INTO email_verifications (email, otp_hash, otp_code, expires_at)
             VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
            [trimmedEmail, otpHash, otpCode]
        );

        const sendResult = await emailService.sendOtpEmail(trimmedEmail, otpCode);
        if (!sendResult.success) {
            console.error('[resendVerification] Email delivery failed:', sendResult.error);
            return res.status(500).json({
                success: false,
                error: sendResult.error || 'Unable to resend verification email. Please try again.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Verification code resent successfully.'
        });
    } catch (err) {
        console.error('resendVerification error:', err);
        res.status(500).json({ success: false, code: 'INTERNAL_ERROR', error: 'Unable to resend verification email. Please try again.' });
    }
}

async function verifyOtp(req, res) {
    try {
        const { email, token } = req.body;
        if (!email || !token) {
            return res.status(400).json({ success: false, error: 'Email and verification code are required' });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const enteredToken = String(token).trim();
        const enteredHash = crypto.createHash('sha256').update(`${trimmedEmail}:${enteredToken}`).digest('hex');

        const otpResult = await db.query(
            `SELECT * FROM email_verifications
             WHERE email = $1 AND consumed = false
             ORDER BY created_at DESC LIMIT 1`,
            [trimmedEmail]
        );

        if (otpResult.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid verification code or code expired.' });
        }

        const otpRecord = otpResult.rows[0];

        if (otpRecord.attempts >= 5) {
            await db.query(`UPDATE email_verifications SET consumed = true WHERE id = $1`, [otpRecord.id]);
            return res.status(400).json({
                success: false,
                error: 'Too many failed attempts. Please request a new verification code.'
            });
        }

        if (new Date(otpRecord.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                error: 'This verification code has expired. Request a new code.'
            });
        }

        const isMatch = otpRecord.otp_hash ? (otpRecord.otp_hash === enteredHash) : (otpRecord.otp_code === enteredToken);
        if (!isMatch) {
            const updatedAttempts = otpRecord.attempts + 1;
            await db.query(
                `UPDATE email_verifications SET attempts = attempts + 1${updatedAttempts >= 5 ? ', consumed = true' : ''} WHERE id = $1`,
                [otpRecord.id]
            );

            if (updatedAttempts >= 5) {
                return res.status(400).json({
                    success: false,
                    error: 'Too many failed attempts. Please request a new verification code.'
                });
            }

            return res.status(400).json({ success: false, error: 'Invalid verification code.' });
        }

        await db.query(
            `UPDATE email_verifications SET consumed = true, verified_at = NOW() WHERE id = $1`,
            [otpRecord.id]
        );

        const updateResult = await db.query(
            `UPDATE businesses
             SET status = 'active', updated_at = NOW()
             WHERE email = $1
             RETURNING *`,
            [trimmedEmail]
        );

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Business profile not found.' });
        }

        const user = updateResult.rows[0];

        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET || 'bavio_secret_key_default_jwt_fallback';
        const sessionToken = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            token: sessionToken,
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
            redirectTo: '/workspace'
        });
    } catch (err) {
        console.error('[AUTH CONTROLLER] verifyOtp exception:', err.message);
        res.status(500).json({ success: false, code: 'INTERNAL_ERROR', error: 'Unable to verify code. Please try again.' });
    }
}

async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email address is required' });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const emailService = require('../services/emailService');
        const genericSuccessMsg = "If an account exists with that email, a password reset link has been sent.";

        const userCheck = await db.query(
            `SELECT id FROM businesses WHERE email = $1`,
            [trimmedEmail]
        );

        if (userCheck.rows.length === 0) {
            console.log(`[forgotPassword] Request for unregistered email: ${trimmedEmail} (returning generic success)`);
            return res.status(200).json({ success: true, message: genericSuccessMsg });
        }

        await db.query(
            `UPDATE password_resets SET consumed = true WHERE email = $1 AND consumed = false`,
            [trimmedEmail]
        );

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        await db.query(
            `INSERT INTO password_resets (email, token_hash, expires_at)
             VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
            [trimmedEmail, tokenHash]
        );

        const baseUrl = (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://bavio.in').replace(/\/$/, '');
        const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

        const sendResult = await emailService.sendPasswordResetEmail(trimmedEmail, resetUrl);
        if (!sendResult.success) {
            console.error('[forgotPassword] Resend email delivery failed:', sendResult.error);
            return res.status(500).json({
                success: false,
                error: 'Unable to send password reset email. Please try again later.'
            });
        }

        return res.status(200).json({
            success: true,
            message: genericSuccessMsg
        });
    } catch (err) {
        console.error('[AUTH CONTROLLER] forgotPassword exception:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

async function verifyResetToken(req, res) {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, valid: false, error: 'Reset token is required' });
        }

        const tokenHash = crypto.createHash('sha256').update(String(token).trim()).digest('hex');

        const tokenResult = await db.query(
            `SELECT email, expires_at, consumed FROM password_resets
             WHERE token_hash = $1
             ORDER BY created_at DESC LIMIT 1`,
            [tokenHash]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({ success: false, valid: false, error: 'Invalid or expired password reset link.' });
        }

        const record = tokenResult.rows[0];
        if (record.consumed) {
            return res.status(400).json({ success: false, valid: false, error: 'This password reset link has already been used.' });
        }

        if (new Date(record.expires_at) <= new Date()) {
            return res.status(400).json({ success: false, valid: false, error: 'This password reset link has expired.' });
        }

        return res.status(200).json({ success: true, valid: true });
    } catch (err) {
        console.error('[AUTH CONTROLLER] verifyResetToken exception:', err);
        return res.status(500).json({ success: false, valid: false, error: 'Internal Server Error' });
    }
}

async function resetPassword(req, res) {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ success: false, error: 'Reset token and new password are required' });
        }

        const passStr = String(password);
        if (passStr.length < 8 || !/[A-Z]/.test(passStr) || !/[0-9]/.test(passStr) || !/[!@#$%^&*]/.test(passStr)) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters long and contain 1 uppercase letter, 1 number, and 1 special character.'
            });
        }

        const tokenHash = crypto.createHash('sha256').update(String(token).trim()).digest('hex');

        const tokenResult = await db.query(
            `SELECT id, email, expires_at, consumed FROM password_resets
             WHERE token_hash = $1
             ORDER BY created_at DESC LIMIT 1`,
            [tokenHash]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid or expired password reset link.' });
        }

        const record = tokenResult.rows[0];
        if (record.consumed) {
            return res.status(400).json({ success: false, error: 'This password reset link has already been used. Please request a new link.' });
        }

        if (new Date(record.expires_at) <= new Date()) {
            return res.status(400).json({ success: false, error: 'This password reset link has expired. Please request a new link.' });
        }

        const userResult = await db.query(
            `SELECT id, email FROM businesses WHERE email = $1`,
            [record.email]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No account found for this reset request.' });
        }

        const user = userResult.rows[0];

        if (db.supabase && db.supabase.auth && db.supabase.auth.admin) {
            const { error: authErr } = await db.supabase.auth.admin.updateUserById(user.id, {
                password: passStr
            });
            if (authErr) {
                console.warn('[resetPassword] Supabase Auth update warning:', authErr.message);
            }
        }

        await db.query(
            `UPDATE businesses SET updated_at = NOW() WHERE id = $1`,
            [user.id]
        );

        await db.query(
            `UPDATE password_resets SET consumed = true WHERE id = $1`,
            [record.id]
        );

        return res.status(200).json({
            success: true,
            message: 'Your password has been reset successfully. You can now sign in.'
        });
    } catch (err) {
        console.error('[AUTH CONTROLLER] resetPassword exception:', err);
        return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
}

module.exports = {
    signup,
    verifyOtp,
    login,
    getProfile,
    updateProfile,
    checkEmail,
    changeEmail,
    resendVerification,
    forgotPassword,
    verifyResetToken,
    resetPassword
};
