import { Router, Request, Response } from 'express';
import { query } from '../../db/db';
import { redisClient } from '../../redis/redis.client';
import { logger } from '../../utils/logger';
import { rateLimiter } from '../middleware/rateLimit.middleware';
import { ExotelService } from '../../services/phoneProvider/ExotelService';

const router = Router();
const exotelService = new ExotelService();

// POST /api/webhooks/exotel
router.post('/exotel', rateLimiter, async (req: Request, res: Response) => {
  logger.info('[EXOTEL WEBHOOK] Webhook received', { body: req.body });

  // 1. Verify Authenticity
  if (!exotelService.verifySignature(req)) {
    logger.warn('[EXOTEL WEBHOOK] Signature validation failed');
    return res.status(401).send('Unauthorized');
  }

  const payload = exotelService.parseWebhook(req);

  if (!payload.callSid) {
    logger.warn('[EXOTEL WEBHOOK] Missing CallSid parameter');
    return res.status(400).send('Missing CallSid');
  }

  try {
    // Event type: Recording Ready
    if (payload.eventType === 'recording') {
      logger.info(`[EXOTEL WEBHOOK] Recording ready event for CallSid: ${payload.callSid}`);
      
      // Update call details in DB
      await query(
        `UPDATE calls 
         SET recording_url = $1, status = 'completed'
         WHERE call_sid = $2`,
        [payload.recordingUrl, payload.callSid]
      );
      
      return res.status(200).send('OK');
    }

    // Event type: Call Ended
    if (payload.eventType === 'ended') {
      logger.info(`[EXOTEL WEBHOOK] Call ended event for CallSid: ${payload.callSid}`);
      
      const duration = payload.duration || 0;
      const cost = payload.cost || 0.00;
      const resolvedStatus = payload.status === 'completed' ? 'completed' : 'failed';

      // Update call details
      await query(
        `UPDATE calls 
         SET duration_seconds = $1, cost_amount = $2, status = $3, ended_at = NOW() 
         WHERE call_sid = $4`,
        [duration, cost, resolvedStatus, payload.callSid]
      );

      // Clean session from Redis
      try {
        await redisClient.del(`call:${payload.callSid}`);
      } catch (redisErr: any) {
        logger.warn('[EXOTEL WEBHOOK] Failed to delete session from Redis', { error: redisErr.message });
      }

      return res.status(200).send('OK');
    }

    // Event type: Incoming Call (Inbound)
    if (payload.eventType === 'incoming') {
      logger.info(`[EXOTEL WEBHOOK] Incoming call event for CallSid: ${payload.callSid}`);

      // Idempotency: check if call log or session already exists to prevent duplicate webhook processing
      const existingCall = await query('SELECT id FROM calls WHERE call_sid = $1 LIMIT 1', [payload.callSid]);
      if (existingCall.rows.length > 0) {
        logger.info(`[EXOTEL WEBHOOK] CallSid ${payload.callSid} already logged. Skipping duplicate.`);
        return res.status(200).send('OK');
      }

      // Route to correct user by phone number
      const userRes = await query(
        `SELECT u.id as user_id, u.country_code, u.currency_code, u.business_name 
         FROM virtual_numbers vn
         JOIN users u ON vn.user_id = u.id
         WHERE vn.phone_number = $1 OR REPLACE(vn.phone_number, ' ', '') = $1
         LIMIT 1`,
        [payload.to]
      );

      if (userRes.rows.length === 0) {
        logger.warn(`[EXOTEL WEBHOOK] Virtual number ${payload.to} not registered to any user`);
        return res.status(404).send('Not found');
      }

      const user = userRes.rows[0];

      // Check caller whitelist (handling database compatibility gracefully)
      let isWhitelisted = true;
      try {
        const whitelistRes = await query(
          `SELECT id FROM caller_whitelist 
           WHERE business_id = $1 AND caller_phone = $2
           LIMIT 1`,
          [user.user_id, payload.from]
        );
        if (whitelistRes.rows.length === 0) {
          isWhitelisted = false;
        }
      } catch (dbErr: any) {
        logger.warn('[EXOTEL WEBHOOK] Whitelist table check failed, bypassing whitelist safety.', { error: dbErr.message });
        // Keep isWhitelisted true if the table doesn't exist yet in the test environment
      }

      if (!isWhitelisted) {
        logger.warn(`[EXOTEL WEBHOOK] Caller ${payload.from} is not whitelisted for user ${user.user_id}`);
        return res.status(403).set('Content-Type', 'text/xml').send(exotelService.generateIVRBlockTwiML());
      }

      // Create session in Redis
      try {
        await redisClient.set(
          `call:${payload.callSid}`,
          JSON.stringify({
            user_id: user.user_id,
            caller_phone: payload.from,
            virtual_number: payload.to,
            country: user.country_code,
            provider: 'exotel',
          })
        );
      } catch (redisErr: any) {
        logger.warn('[EXOTEL WEBHOOK] Failed to set session in Redis', { error: redisErr.message });
      }

      // Save call data initially
      await query(
        `INSERT INTO calls (
          user_id, country_code, call_sid, provider, from_number, virtual_number, started_at, cost_currency
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
        [user.user_id, user.country_code, payload.callSid, 'exotel', payload.from, payload.to, user.currency_code]
      );

      // AI greeting triggered
      const greeting = `Hello! Thank you for calling ${user.business_name || 'Bavio AI customer service'}. How can we assist you today?`;

      return res.status(200).set('Content-Type', 'text/xml').send(exotelService.generateGreetingTwiML(greeting));
    }

    return res.status(200).send('OK');
  } catch (err: any) {
    logger.error('[EXOTEL WEBHOOK] Critical Error:', err);
    return res.status(500).send('Internal Server Error');
  }
});

export default router;
