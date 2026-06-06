import { Router, Request, Response } from 'express';
import { query } from '../../db/db';
import { ResponseHelper } from '../helpers/response.helper';
import { requireUserAuth, AuthenticatedUser } from '../middleware/auth.middleware';
import { rateLimiter } from '../middleware/rateLimit.middleware';
import { PhoneAssignmentService } from '../../services/phoneProvider';

const router = Router();

// POST /api/numbers/assign
router.post('/numbers/assign', rateLimiter, requireUserAuth, async (req: Request, res: Response) => {
  const authUser = (req as any).user as AuthenticatedUser;
  
  // Accept user_id and country_code optional overrides if requested, but default to authenticated user
  const userId = req.body.user_id || authUser.id;
  const countryCode = (req.body.country_code || authUser.country_code).toUpperCase().trim().substring(0, 2);

  // Security: users can only assign numbers to themselves (data isolation)
  if (userId !== authUser.id) {
    return ResponseHelper.error(
      res,
      403,
      "Access forbidden: You cannot assign numbers for another user account.",
      "FORBIDDEN",
      authUser.country_code
    );
  }

  try {
    const friendlyName = `${authUser.email} Bavio Line`;
    
    // Provision virtual number using the orchestrator service
    const purchased = await PhoneAssignmentService.assignNumber({
      userId,
      countryCode,
      friendlyName
    });

    const responseData = {
      phone_number: purchased.phoneNumber,
      provider: purchased.provider,
      country: countryCode,
      assigned_at: new Date().toISOString(),
      next_step: 'enable_call_forward'
    };

    return ResponseHelper.success(res, 201, responseData, countryCode, authUser.currency_code);
  } catch (err: any) {
    console.error('Telephony assignment endpoint failure:', err.message);
    return ResponseHelper.error(
      res,
      500,
      `Telephony provider failed to buy number: ${err.message}`,
      "PROVIDER_ERROR",
      countryCode
    );
  }
});

// GET /api/calls
router.get('/calls', rateLimiter, requireUserAuth, async (req: Request, res: Response) => {
  const authUser = (req as any).user as AuthenticatedUser;
  
  // Pagination
  const limit = parseInt(req.query.limit as string || '50');
  const offset = parseInt(req.query.offset as string || '0');

  try {
    // 1. Fetch scoped call logs for user/country
    const callsRes = await query(
      `SELECT id as call_id, from_number as from, duration_seconds as duration, status, cost_amount as cost, cost_currency as currency, created_at 
       FROM calls 
       WHERE user_id = $1 AND country_code = $2
       ORDER BY created_at DESC 
       LIMIT $3 OFFSET $4`,
      [authUser.id, authUser.country_code, limit, offset]
    );

    // 2. Fetch aggregated metadata (total calls & cost)
    const statsRes = await query(
      `SELECT COUNT(id) as total_calls, COALESCE(SUM(cost_amount), 0.0000) as total_cost 
       FROM calls 
       WHERE user_id = $1 AND country_code = $2`,
      [authUser.id, authUser.country_code]
    );

    const stats = statsRes.rows[0];
    const totalCalls = parseInt(stats.total_calls);
    const totalCost = parseFloat(stats.total_cost);

    const responseData = {
      user_id: authUser.id,
      country: authUser.country_code,
      calls: callsRes.rows.map(row => ({
        call_id: row.call_id,
        from: row.from,
        duration: row.duration,
        status: row.status,
        cost: parseFloat(row.cost),
        currency: row.currency,
        created_at: new Date(row.created_at).toISOString()
      })),
      total_calls: totalCalls,
      total_cost: totalCost,
      total_cost_currency: authUser.currency_code
    };

    return ResponseHelper.success(res, 200, responseData, authUser.country_code, authUser.currency_code);
  } catch (err: any) {
    console.error('Fetch calls list failure:', err.message);
    return ResponseHelper.error(
      res,
      500,
      "An unexpected error occurred while retrieving call records.",
      "INTERNAL_SERVER_ERROR",
      authUser.country_code
    );
  }
});

export default router;
