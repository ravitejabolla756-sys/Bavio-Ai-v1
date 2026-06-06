import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { query } from '../../db/db';
import { ResponseHelper } from '../helpers/response.helper';

export const JWT_SECRET = process.env.JWT_SECRET || '7e0341f2ee874653ce795be1851359683e92e769db290b69965697ae80da0a5e5745972bd30e6b51088fbc878ea141f97acec678ca57855eb024064f44f4d220';

export interface AuthenticatedUser {
  id: string;
  email: string;
  country_code: string;
  currency_code: string;
  subscription_plan: string | null;
}

export const requireUserAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ResponseHelper.error(
      res,
      401,
      "Authentication failed: Missing or invalid Authorization header",
      "UNAUTHORIZED"
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    if (!decoded || !decoded.userId) {
      return ResponseHelper.error(
        res,
        401,
        "Authentication failed: Invalid token payload",
        "UNAUTHORIZED"
      );
    }

    const userRes = await query(
      `SELECT id, email, country_code, currency_code, subscription_plan, status FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (userRes.rows.length === 0) {
      return ResponseHelper.error(
        res,
        404,
        "Authentication failed: User not found",
        "NOT_FOUND"
      );
    }

    const dbUser = userRes.rows[0];

    if (dbUser.status !== 'active') {
      return ResponseHelper.error(
        res,
        403,
        "Authentication failed: User account is inactive or paused",
        "FORBIDDEN",
        dbUser.country_code
      );
    }

    (req as any).user = {
      id: dbUser.id,
      email: dbUser.email,
      country_code: dbUser.country_code,
      currency_code: dbUser.currency_code,
      subscription_plan: dbUser.subscription_plan
    };

    next();
  } catch (err: any) {
    console.error('JWT authentication error:', err.message);
    return ResponseHelper.error(
      res,
      401,
      "Authentication failed: Invalid or expired token",
      "UNAUTHORIZED"
    );
  }
};
