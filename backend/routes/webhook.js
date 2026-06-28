const express = require('express');
const router = express.Router();
const db = require('../database/db');

// POST /api/webhook/exotel-call
router.post('/exotel-call', async (req, res) => {
  try {
    const { event, callSid, from, to, duration, transcript, capturedLead } = req.body;
    console.log(`[WEBHOOK] Exotel call webhook: ${event} | ${callSid} | ${from} -> ${to}`);

    if (!to) {
      return res.status(400).json({ error: 'missing_destination', message: 'Destination phone number (to) is required' });
    }

    // 1. Lookup business by twilio_number
    const bizRes = await db.query(
      'SELECT id, minutes_used, minutes_limit FROM businesses WHERE twilio_number = $1 AND status = $2',
      [to, 'active']
    );

    if (bizRes.rows.length === 0) {
      console.warn(`[WEBHOOK] Business not found for Twilio/Exotel number: ${to}`);
      return res.status(404).json({ error: 'business_not_found', message: 'No business linked to this number' });
    }

    const business = bizRes.rows[0];
    const businessId = business.id;

    // 2. Broadcast event to WebSocket client if connected
    const wsClients = req.app.get('wsClients');
    const ws = wsClients?.get(businessId);
    if (ws && ws.readyState === 1) { // 1 = OPEN
      const wsEvent = event === 'ringing' ? 'call:ringing' : event === 'answered' ? 'call:in_progress' : 'call:ended';
      
      const payload = {
        event: wsEvent,
        callSid,
        from,
        to,
        duration: duration || 0,
        timestamp: new Date()
      };

      if (transcript) {
        payload.transcript = transcript;
      }
      if (capturedLead) {
        payload.capturedLead = capturedLead;
      }

      ws.send(JSON.stringify(payload));
      console.log(`[WEBHOOK] Broadcasted ${wsEvent} event to business ${businessId}`);
    } else {
      console.log(`[WEBHOOK] No active WebSocket connection for business ${businessId}`);
    }

    // 3. If call ended, save call log, lead info, and update minute usage
    if (event === 'ended') {
      const durSec = duration || 0;
      const durMin = Math.ceil(durSec / 60);

      // Insert Call Record
      const callInsertRes = await db.query(
        `INSERT INTO calls (
          business_id, caller_number, provider_call_id, call_status, status,
          provider, duration, duration_seconds, transcript, bavio_number, direction, ended_at
         )
         VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9, $10, NOW())
         RETURNING id`,
        [
          businessId,
          from,
          callSid,
          'completed',
          'exotel',
          durMin,
          durSec,
          JSON.stringify(transcript || []),
          to,
          'inbound'
        ]
      );
      const callId = callInsertRes.rows[0]?.id;

      // Insert Lead if captured
      if (capturedLead && (capturedLead.name || capturedLead.intent || capturedLead.budget)) {
        await db.query(
          `INSERT INTO leads (
            business_id, call_id, phone, caller_number, name, intent, budget, location, notes, status
           )
           VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9)`,
          [
            businessId,
            callId,
            from,
            capturedLead.name || 'Anonymous Caller',
            capturedLead.intent || 'General inquiry',
            capturedLead.budget || 'N/A',
            capturedLead.location || 'Unknown',
            `Captured during test call. Sentiment: ${capturedLead.sentiment || 'Neutral'}.`,
            'qualified'
          ]
        );
        console.log(`[WEBHOOK] Saved lead record for business ${businessId}`);
      }

      // Update business minute usage
      await db.query(
        'UPDATE businesses SET minutes_used = minutes_used + $1, updated_at = NOW() WHERE id = $2',
        [durMin, businessId]
      );
      console.log(`[WEBHOOK] Incremented minute usage by ${durMin} min for business ${businessId}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[WEBHOOK] Error processing Exotel call webhook:', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

module.exports = router;
