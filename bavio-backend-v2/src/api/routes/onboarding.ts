import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { query } from '../../db/db';
import { ResponseHelper } from '../helpers/response.helper';
import { JWT_SECRET, requireUserAuth, AuthenticatedUser } from '../middleware/auth.middleware';
import { rateLimiter } from '../middleware/rateLimit.middleware';
import { DbOptimizationsService } from '../../db/optimizations/dbOptimizations';

const router = Router();

const COUNTRY_CONFIGS: Record<string, { currency: string; timezone: string; welcomeMsg: string }> = {
  IN: { currency: 'INR', timezone: 'Asia/Kolkata', welcomeMsg: "Welcome to Bavio! You're in India." },
  US: { currency: 'USD', timezone: 'America/New_York', welcomeMsg: "Welcome to Bavio! You're in United States." },
  GB: { currency: 'GBP', timezone: 'Europe/London', welcomeMsg: "Welcome to Bavio! You're in United Kingdom." },
  AU: { currency: 'AUD', timezone: 'Australia/Sydney', welcomeMsg: "Welcome to Bavio! You're in Australia." },
  AE: { currency: 'AED', timezone: 'Asia/Dubai', welcomeMsg: "Welcome to Bavio! You're in United Arab Emirates." }
};

// POST /api/auth/signup
router.post('/auth/signup', rateLimiter, async (req: Request, res: Response) => {
  const { email, password, business_name, business_phone, business_website, industry, country_code, name, phone } = req.body;

  const finalBusinessName = business_name || name;
  const finalBusinessPhone = business_phone || phone;
  const finalIndustry = industry || "other";

  // Validate inputs
  if (!email || !password || !finalBusinessName || !finalBusinessPhone) {
    return ResponseHelper.error(
      res,
      400,
      "Missing required fields: email, password, business_name/name, business_phone/phone are mandatory.",
      "VALIDATION_ERROR",
      country_code || 'US'
    );
  }

  // Check email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return ResponseHelper.error(
      res,
      400,
      "Invalid email address format.",
      "VALIDATION_ERROR",
      country_code || 'US'
    );
  }

  // Resolve country configuration
  const resolvedCountry = (country_code || 'US').toUpperCase().trim().substring(0, 2);
  const config = COUNTRY_CONFIGS[resolvedCountry];

  if (!config) {
    return ResponseHelper.error(
      res,
      400,
      `Unsupported country code: ${resolvedCountry}. Allowed codes are: IN, US, GB, AU, AE.`,
      "VALIDATION_ERROR",
      'US'
    );
  }

  try {
    // Check if user already exists
    const duplicateRes = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (duplicateRes.rows.length > 0) {
      return ResponseHelper.error(
        res,
        409,
        "A user with this email address already exists.",
        "DUPLICATE_ERROR",
        resolvedCountry
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const userInsertRes = await query(
      `INSERT INTO users (
        email, password_hash, country_code, timezone, currency_code, 
        business_name, business_phone, business_website, industry, 
        subscription_plan, subscription_started_at, subscription_ends_at, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, email, country_code, currency_code`,
      [
        email,
        hashedPassword,
        resolvedCountry,
        config.timezone,
        config.currency,
        finalBusinessName,
        finalBusinessPhone,
        business_website || null,
        finalIndustry,
        'starter',
        new Date(),
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        'active'
      ]
    );

    const newUser = userInsertRes.rows[0];

    // Generate JWT token
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    // Fetch default starter plan price for the country
    const planRes = await query(
      `SELECT monthly_price FROM pricing_plans WHERE country_code = $1 AND plan_name = 'starter'`,
      [resolvedCountry]
    );
    const monthlyPrice = planRes.rows.length > 0 ? parseFloat(planRes.rows[0].monthly_price) : 39.00;

    // Create default 'pending' subscription log
    await query(
      `INSERT INTO subscriptions (
        user_id, country_code, plan_name, price_amount, price_currency, 
        billing_cycle_start, billing_cycle_end, next_billing_date, 
        payment_method, payment_status, minutes_limit, minutes_used
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        newUser.id,
        resolvedCountry,
        'starter',
        monthlyPrice,
        config.currency,
        new Date(),
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        'dodo_payments',
        'pending',
        30, // 30 free minutes limit
        0
      ]
    );

    // Invalidate country and global caches and refresh materialized view in background
    DbOptimizationsService.invalidateCountryMetricsCache(newUser.country_code);
    DbOptimizationsService.invalidateGlobalMetricsCache();
    DbOptimizationsService.refreshMetricsView();

    // Formulate final success payload
    const responseData = {
      user_id: newUser.id,
      token: token,
      country_code: newUser.country_code,
      currency: newUser.currency_code,
      next_step: 'select_plan',
      message: config.welcomeMsg
    };

    return ResponseHelper.success(res, 201, responseData, newUser.country_code, newUser.currency_code);
  } catch (err: any) {
    console.error('Signup process failure:', err.message);
    return ResponseHelper.error(
      res,
      500,
      "An unexpected error occurred during signup configuration.",
      "INTERNAL_SERVER_ERROR",
      resolvedCountry
    );
  }
});

// POST /api/onboarding/complete-trial
router.post('/onboarding/complete-trial', rateLimiter, requireUserAuth, async (req: Request, res: Response) => {
  const authUser = (req as any).user as AuthenticatedUser;

  try {
    const plan = 'starter';
    // 1. Fetch starter plan pricing details
    const planDetailsRes = await query(
      `SELECT monthly_price, minutes_included, currency_code 
       FROM pricing_plans 
       WHERE country_code = $1 AND plan_name = 'starter'`,
      [authUser.country_code]
    );

    const price = planDetailsRes.rows.length > 0 ? parseFloat(planDetailsRes.rows[0].monthly_price) : 39.00;
    const currency = planDetailsRes.rows.length > 0 ? planDetailsRes.rows[0].currency_code : 'USD';
    const minutesLimit = 100; // 100 free minutes for Starter trial workspace!

    const periodStart = new Date();
    const periodEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days trial

    // 2. Update user profile to starter plan
    await query(
      `UPDATE users 
       SET subscription_plan = $1, subscription_started_at = $2, subscription_ends_at = $3, status = 'active'
       WHERE id = $4`,
      [plan, periodStart, periodEnd, authUser.id]
    );

    // 3. Update subscription status to active with 100 minutes
    const existingSub = await query(
      `SELECT id FROM subscriptions WHERE user_id = $1`,
      [authUser.id]
    );

    if (existingSub.rows.length > 0) {
      await query(
        `UPDATE subscriptions 
         SET plan_name = $1, price_amount = $2, price_currency = $3, 
             billing_cycle_start = $4, billing_cycle_end = $5, next_billing_date = $6, 
             payment_method = 'dodo_payments', payment_status = 'active', 
             minutes_limit = $7, minutes_used = 0,
             updated_at = NOW()
         WHERE user_id = $8`,
        [plan, price, currency, periodStart, periodEnd, periodEnd, minutesLimit, authUser.id]
      );
    } else {
      await query(
        `INSERT INTO subscriptions (
          user_id, country_code, plan_name, price_amount, price_currency, 
          billing_cycle_start, billing_cycle_end, next_billing_date, 
          payment_method, payment_status, minutes_limit, minutes_used
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'dodo_payments', 'active', $9, 0)`,
        [authUser.id, authUser.country_code, plan, price, currency, periodStart, periodEnd, periodEnd, minutesLimit]
      );
    }

    DbOptimizationsService.invalidateCountryMetricsCache(authUser.country_code);
    DbOptimizationsService.invalidateGlobalMetricsCache();
    DbOptimizationsService.refreshMetricsView();

    return ResponseHelper.success(res, 200, {
      message: "Trial workspace created successfully with 100 free minutes.",
      plan: plan,
      minutes_limit: minutesLimit,
      status: "active"
    }, authUser.country_code, currency);

  } catch (err: any) {
    console.error('Complete trial onboarding failure:', err.message);
    return ResponseHelper.error(
      res,
      500,
      "An unexpected error occurred while activating your trial workspace.",
      "INTERNAL_SERVER_ERROR",
      authUser.country_code
    );
  }
});

// POST /api/auth/login
router.post('/auth/login', rateLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return ResponseHelper.error(res, 400, "Email and password are required.", "VALIDATION_ERROR", 'US');
  }
  try {
    const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return ResponseHelper.error(res, 401, "Invalid credentials.", "UNAUTHORIZED", 'US');
    }
    const user = userRes.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return ResponseHelper.error(res, 401, "Invalid credentials.", "UNAUTHORIZED", user.country_code);
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Fetch subscription details if any
    const subRes = await query('SELECT minutes_limit, minutes_used FROM subscriptions WHERE user_id = $1', [user.id]);
    const minutesLimit = subRes.rows.length > 0 ? subRes.rows[0].minutes_limit : 100;
    const minutesUsed = subRes.rows.length > 0 ? subRes.rows[0].minutes_used : 0;

    return ResponseHelper.success(res, 200, {
      success: true,
      token,
      client_id: user.id,
      name: user.business_name || user.email,
      email: user.email,
      plan: user.subscription_plan || 'free',
      plan_name: user.subscription_plan === 'starter' ? 'Starter Plan' : (user.subscription_plan === 'growth' ? 'Growth Plan' : (user.subscription_plan === 'scale' ? 'Scale Plan' : 'Free Trial')),
      onboarding_status: user.subscription_plan ? 'ready' : 'pending',
      onboarding_step: user.subscription_plan ? 2 : 1,
      minutes_limit: minutesLimit,
      minutes_used: minutesUsed,
      country_code: user.country_code,
    }, user.country_code, user.currency_code);
  } catch (err: any) {
    console.error('Login error:', err.message);
    return ResponseHelper.error(res, 500, "An unexpected error occurred during login.", "INTERNAL_SERVER_ERROR", 'US');
  }
});

// GET /api/auth/profile
router.get('/auth/profile', rateLimiter, requireUserAuth, async (req: Request, res: Response) => {
  const authUser = (req as any).user as AuthenticatedUser;
  try {
    const userRes = await query('SELECT * FROM users WHERE id = $1', [authUser.id]);
    if (userRes.rows.length === 0) {
      return ResponseHelper.error(res, 404, "User not found.", "NOT_FOUND", authUser.country_code);
    }
    const user = userRes.rows[0];

    // Fetch subscription details
    const subRes = await query('SELECT minutes_limit, minutes_used, price_amount, dodo_subscription_id FROM subscriptions WHERE user_id = $1', [user.id]);
    const minutesLimit = subRes.rows.length > 0 ? subRes.rows[0].minutes_limit : 100;
    const minutesUsed = subRes.rows.length > 0 ? subRes.rows[0].minutes_used : 0;
    const dodoSubId = subRes.rows.length > 0 ? subRes.rows[0].dodo_subscription_id : null;

    return ResponseHelper.success(res, 200, {
      success: true,
      id: user.id,
      name: user.business_name || user.email,
      email: user.email,
      phone: user.business_phone || "",
      country: user.country_code,
      country_code: user.country_code,
      api_key: user.id,
      minutes_limit: minutesLimit,
      minutes_used: minutesUsed,
      plan: user.subscription_plan || 'free',
      plan_name: user.subscription_plan === 'starter' ? 'Starter Plan' : (user.subscription_plan === 'growth' ? 'Growth Plan' : (user.subscription_plan === 'scale' ? 'Scale Plan' : 'Free Trial')),
      current_period_end: user.subscription_ends_at || null,
      onboarding_status: user.subscription_plan ? 'ready' : 'pending',
      onboarding_step: user.subscription_plan ? 2 : 1,
      dodo_subscription_id: dodoSubId,
      industry: user.industry || null,
      language: user.language || 'hi-IN',
      business_description: user.business_description || null,
      city: user.city || null,
      created_at: user.created_at,
    }, user.country_code, user.currency_code);
  } catch (err: any) {
    console.error('Get profile error:', err.message);
    return ResponseHelper.error(res, 500, "Failed to load user profile.", "INTERNAL_SERVER_ERROR", authUser.country_code);
  }
});

// PATCH /api/auth/profile
router.patch('/auth/profile', rateLimiter, requireUserAuth, async (req: Request, res: Response) => {
  const authUser = (req as any).user as AuthenticatedUser;
  const { name, phone, country, country_code } = req.body;
  try {
    const targetCountry = country_code ? country_code.trim().toUpperCase().substring(0, 2) : (country ? country.trim().toUpperCase().substring(0, 2) : null);
    const result = await query(
      `UPDATE users 
       SET business_name = COALESCE($1, business_name),
           business_phone = COALESCE($2, business_phone),
           country_code = COALESCE($3, country_code),
           updated_at = NOW()
       WHERE id = $4 AND status = 'active'
       RETURNING *`,
      [
        name || null,
        phone || null,
        targetCountry,
        authUser.id
      ]
    );
    if (result.rows.length === 0) {
      return ResponseHelper.error(res, 404, "User not found.", "NOT_FOUND", authUser.country_code);
    }
    const user = result.rows[0];
    return ResponseHelper.success(res, 200, {
      success: true,
      id: user.id,
      name: user.business_name,
      email: user.email,
      phone: user.business_phone,
      country: user.country_code,
      country_code: user.country_code,
    }, user.country_code, user.currency_code);
  } catch (err: any) {
    console.error('Update profile error:', err.message);
    return ResponseHelper.error(res, 500, "Failed to update profile.", "INTERNAL_SERVER_ERROR", authUser.country_code);
  }
});

export default router;
