import { Request, Response } from 'express';
import { RoutingService } from '../services/routing.service';
import { SarvamService } from '../services/sarvam.service';
import { LeadService } from '../services/lead.service';
import { supabase } from '../database/supabase';
import { redisClient } from '../redis/redis.client';

export class WebhookController {
  static async handleIncomingCall(req: Request, res: Response) {
    const CallSid = req.body.CallSid || req.query.CallSid;
    const From = req.body.From || req.query.From;
    const To = req.body.To || req.query.To;

    if (!CallSid || !From || !To) {
      return res.status(400).json({ error: 'Missing required webhook parameters: CallSid, From, or To' });
    }

    try {
      const routingResult = await RoutingService.routeCall(
        String(CallSid),
        String(From),
        String(To)
      );

      if (!routingResult) {
        return res.status(404).json({ error: 'Business or active assistant not found' });
      }
      
      res.status(200).json({
        message: 'Call routed successfully',
        businessId: routingResult.businessId,
        assistantId: routingResult.assistantId,
        action: 'connect_to_sarvam_stream'
      });
      
    } catch (error) {
      console.error('Error in handleIncomingCall:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async handleTranscript(req: Request, res: Response) {
    const { CallSid, Transcript } = req.body;

    if (!CallSid || !Transcript) {
      return res.status(400).json({ error: 'Missing CallSid or Transcript' });
    }

    try {
      const audioResponseUrl = await SarvamService.processTurn(CallSid, Transcript);
      res.status(200).json({ playAudio: audioResponseUrl });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async handleCallEnd(req: Request, res: Response) {
    const { CallSid } = req.body;

    try {
      await supabase.from('call_sessions')
        .update({ session_status: 'completed', ended_at: new Date().toISOString() })
        .eq('call_sid', CallSid);

      await LeadService.extractLead(CallSid);

      const redisKey = `call:${CallSid}`;
      await redisClient.del(redisKey);

      res.status(200).json({ message: 'Call finalized successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
