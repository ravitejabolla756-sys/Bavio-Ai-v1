import { Router, Request, Response } from 'express';
import { query } from '../../db/db';
import { ResponseHelper } from '../helpers/response.helper';
import { requireUserAuth, AuthenticatedUser } from '../middleware/auth.middleware';
import { rateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// GET /api/pricing
router.get('/pricing', rateLimiter, async (req: Request, res: Response) => {
  const countryQuery = (req.query.country as string || 'US').toUpperCase().trim().substring(0, 2);

  const supportedCountries = ['IN', 'US', 'GB', 'AU', 'AE'];
  if (!supportedCountries.includes(countryQuery)) {
    return ResponseHelper.error(
      res,
      400,
      `Unsupported country code: ${countryQuery}. Allowed codes are: IN, US, GB, AU, AE.`,
      "VALIDATION_ERROR",
      'US'
    );
  }

  try {
    const pricingRes = await query(
      `SELECT plan_name as name, monthly_price as price, currency_code as currency, minutes_included as minutes, features 
       FROM pricing_plans 
       WHERE country_code = $1 
       ORDER BY monthly_price ASC`,
      [countryQuery]
    );

    const currencyCode = pricingRes.rows.length > 0 ? pricingRes.rows[0].currency : 'USD';

    const responseData = {
      country: countryQuery,
      currency: currencyCode,
      plans: pricingRes.rows.map(row => ({
        name: row.name,
        price: parseFloat(row.price),
        currency: row.currency,
        minutes: row.minutes,
        features: Object.keys(row.features || {})
      }))
    };

    return ResponseHelper.success(res, 200, responseData, countryQuery, currencyCode);
  } catch (err: any) {
    console.error('Fetch pricing plans failure:', err.message);
    return ResponseHelper.error(
      res,
      500,
      "An unexpected error occurred while fetching regional pricing plans.",
      "INTERNAL_SERVER_ERROR",
      countryQuery
    );
  }
});

// POST /api/billing/charge
router.post('/billing/charge', rateLimiter, requireUserAuth, async (req: Request, res: Response) => {
  const authUser = (req as any).user as AuthenticatedUser;
  
  // Custom plan override from body, or default to growth
  const plan = req.body.plan || 'growth';

  if (!['starter', 'growth', 'scale'].includes(plan)) {
    return ResponseHelper.error(
      res,
      400,
      "Invalid subscription plan selection. Valid options are: starter, growth, scale.",
      "VALIDATION_ERROR",
      authUser.country_code
    );
  }

  try {
    // Fetch pricing details for the user's country and plan
    const planDetailsRes = await query(
      `SELECT monthly_price, minutes_included, currency_code 
       FROM pricing_plans 
       WHERE country_code = $1 AND plan_name = $2`,
      [authUser.country_code, plan]
    );

    if (planDetailsRes.rows.length === 0) {
      return ResponseHelper.error(
        res,
        404,
        "Pricing tier not configured for your country.",
        "NOT_FOUND",
        authUser.country_code
      );
    }

    const { monthly_price, minutes_included, currency_code } = planDetailsRes.rows[0];
    const amount = parseFloat(monthly_price);

    const chargeId = require('crypto').randomUUID();
    const periodStart = new Date();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days billing period

    // 1. Update user profile subscription plan
    await query(
      `UPDATE users 
       SET subscription_plan = $1, subscription_started_at = $2, subscription_ends_at = $3 
       WHERE id = $4`,
      [plan, periodStart, periodEnd, authUser.id]
    );

    // 2. Insert/Update active subscription status
    const existingSub = await query(
      `SELECT id FROM subscriptions WHERE user_id = $1 AND country_code = $2`,
      [authUser.id, authUser.country_code]
    );

    if (existingSub.rows.length > 0) {
      await query(
        `UPDATE subscriptions 
         SET plan_name = $1, price_amount = $2, price_currency = $3, 
             billing_cycle_start = $4, billing_cycle_end = $5, next_billing_date = $6, 
             payment_method = 'dodo_payments', payment_status = 'active', 
             minutes_limit = $7, minutes_used = 0 
         WHERE user_id = $8 AND country_code = $9`,
        [plan, amount, currency_code, periodStart, periodEnd, periodEnd, minutes_included, authUser.id, authUser.country_code]
      );
    } else {
      await query(
        `INSERT INTO subscriptions (
          user_id, country_code, plan_name, price_amount, price_currency, 
          billing_cycle_start, billing_cycle_end, next_billing_date, 
          payment_method, payment_status, minutes_limit, minutes_used
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'dodo_payments', 'active', $9, 0)`,
        [authUser.id, authUser.country_code, plan, amount, currency_code, periodStart, periodEnd, periodEnd, minutes_included]
      );
    }

    // 3. Log a record in usage_logs
    await query(
      `INSERT INTO usage_logs (
        user_id, country_code, minutes_used, cost_total, currency_code, billing_month, billing_year
      ) VALUES ($1, $2, 0, $3, $4, $5, $6)`,
      [
        authUser.id,
        authUser.country_code,
        amount,
        currency_code,
        periodStart.getMonth() + 1,
        periodStart.getFullYear()
      ]
    );

    // Format ISO Dates (YYYY-MM-DD)
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const responseData = {
      charge_id: chargeId,
      user_id: authUser.id,
      plan: plan,
      amount: amount,
      currency: currency_code,
      payment_method: 'dodo_payments',
      status: 'success',
      period_start: formatDate(periodStart),
      period_end: formatDate(periodEnd)
    };

    return ResponseHelper.success(res, 200, responseData, authUser.country_code, authUser.currency_code);
  } catch (err: any) {
    console.error('Process billing charge failure:', err.message);
    return ResponseHelper.error(
      res,
      500,
      "An unexpected error occurred during subscription billing configuration.",
      "INTERNAL_SERVER_ERROR",
      authUser.country_code
    );
  }
});

// GET /api/subscription
router.get('/subscription', rateLimiter, requireUserAuth, async (req: Request, res: Response) => {
  const authUser = (req as any).user as AuthenticatedUser;

  try {
    const subRes = await query(
      `SELECT plan_name, price_amount, price_currency, billing_cycle_start, billing_cycle_end, next_billing_date, payment_status, minutes_limit, minutes_used 
       FROM subscriptions 
       WHERE user_id = $1 AND country_code = $2`,
      [authUser.id, authUser.country_code]
    );

    if (subRes.rows.length === 0) {
      return ResponseHelper.error(
        res,
        404,
        "No active subscription configuration found for your account.",
        "NOT_FOUND",
        authUser.country_code
      );
    }

    const sub = subRes.rows[0];
    const minutesLimit = sub.minutes_limit || 0;
    const minutesUsed = sub.minutes_used || 0;
    const minutesRemaining = Math.max(0, minutesLimit - minutesUsed);

    const formatDate = (d: string | null) => d ? new Date(d).toISOString().split('T')[0] : null;

    const responseData = {
      user_id: authUser.id,
      country: authUser.country_code,
      current_plan: sub.plan_name,
      price: parseFloat(sub.price_amount),
      currency: sub.price_currency,
      billing_cycle_start: formatDate(sub.billing_cycle_start),
      billing_cycle_end: formatDate(sub.billing_cycle_end),
      next_billing_date: formatDate(sub.next_billing_date),
      minutes_limit: minutesLimit,
      minutes_used: minutesUsed,
      minutes_remaining: minutesRemaining,
      payment_status: sub.payment_status
    };

    return ResponseHelper.success(res, 200, responseData, authUser.country_code, authUser.currency_code);
  } catch (err: any) {
    console.error('Fetch user subscription status failure:', err.message);
    return ResponseHelper.error(
      res,
      500,
      "An unexpected error occurred while fetching your active subscription details.",
      "INTERNAL_SERVER_ERROR",
      authUser.country_code
    );
  }
});

export default router;
