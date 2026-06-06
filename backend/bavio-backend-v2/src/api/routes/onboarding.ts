import { Router, Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { query } from '../../db/db';
import { ResponseHelper } from '../helpers/response.helper';
import { JWT_SECRET } from '../middleware/auth.middleware';
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
  const { email, password, business_name, business_phone, business_website, industry, country_code } = req.body;

  // Validate inputs
  if (!email || !password || !business_name || !business_phone || !industry) {
    return ResponseHelper.error(
      res,
      400,
      "Missing required fields: email, password, business_name, business_phone, industry are mandatory.",
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
        business_name,
        business_phone,
        business_website || null,
        industry,
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

export default router;
