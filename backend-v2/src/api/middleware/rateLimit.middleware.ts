import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from '../helpers/response.helper';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitInfo>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 150; // max 150 requests per window

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();

  let info = rateLimitStore.get(ip);

  if (!info || now > info.resetTime) {
    info = {
      count: 0,
      resetTime: now + WINDOW_MS
    };
  }

  info.count++;
  rateLimitStore.set(ip, info);

  if (info.count > MAX_REQUESTS) {
    // Determine country code from query, body, header, or default
    const countryCode = (req.query.country as string) || (req.body.country_code as string) || 'US';
    return ResponseHelper.error(
      res,
      429,
      "Too many requests. Please try again later.",
      "TOO_MANY_REQUESTS",
      countryCode
    );
  }

  next();
};
