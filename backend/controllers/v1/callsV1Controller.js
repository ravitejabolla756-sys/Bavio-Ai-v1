'use strict';

const db = require('../../database/db');
const twilioProvider = require('../../providers/twilio');
const { normalizePhoneNumber } = require('../../services/campaignService');
const webhookService = require('../../services/webhookService');

async function createCall(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { agent_id, phone_number, from_number } = req.body;

  if (!phone_number) {
    return res.status(400).json({
      error: { code: 'invalid_request', message: 'phone_number is required' },
      request_id: requestId,
    });
  }

  const normalizedPhone = normalizePhoneNumber(phone_number);
  if (!normalizedPhone) {
    return res.status(400).json({
      error: { code: 'invalid_phone_number', message: 'Invalid phone number format' },
      request_id: requestId,
    });
  }

  try {
    const from = from_number || process.env.TWILIO_PHONE_NUMBER || '+15005550006';
    const tempCallSid = `api_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const result = await db.query(
      `INSERT INTO calls (
         user_id, business_id, assistant_id, call_sid, country_code, provider, from_number,
         virtual_number, caller_number, status, call_status, started_at, created_at
       )
       VALUES ($1, $1, $2, $3, 'IN', 'twilio', $4, $4, $5, 'queued', 'queued', NOW(), NOW())
       RETURNING *`,
      [businessId, agent_id || null, tempCallSid, from, normalizedPhone]
    );

    const callRecord = result.rows[0];

    // Trigger async outbound telephony call
    const webhookBaseUrl = process.env.PUBLIC_API_BASE_URL || process.env.WEBHOOK_BASE_URL || 'https://api.bavio.in';
    const webhookUrl = `${webhookBaseUrl}/api/calls/incoming?call_id=${callRecord.id}`;

    try {
      const callSid = await twilioProvider.createOutboundCall({
        to: normalizedPhone,
        from: from,
        webhookUrl: webhookUrl,
      });

      await db.query(
        `UPDATE calls SET provider_call_id = $1, call_sid = $1, status = 'in-progress' WHERE id = $2`,
        [callSid, callRecord.id]
      );
      callRecord.call_sid = callSid;
      callRecord.status = 'in-progress';
    } catch (telephonyErr) {
      console.warn(`[CALLS V1 API] Telephony dispatch fallback: ${telephonyErr.message}`);
    }

    webhookService.dispatchWebhook(businessId, 'call.created', {
      call_id: callRecord.id,
      phone_number: normalizedPhone,
      status: callRecord.status,
    }).catch(() => {});

    res.status(202).json({
      data: {
        id: callRecord.id,
        agent_id: callRecord.assistant_id,
        phone_number: normalizedPhone,
        status: callRecord.status,
        created_at: callRecord.created_at,
      },
      request_id: requestId,
    });
  } catch (err) {
    res.status(500).json({
      error: { code: 'internal_error', message: err.message },
      request_id: requestId,
    });
  }
}

const { listCalls, getCallById } = require('./conversationReads');

async function getCallTranscript(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT id, transcript, created_at FROM calls WHERE id = $1 AND (business_id = $2 OR user_id = $2)`,
      [id, businessId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'not_found', message: 'Call not found' },
        request_id: requestId,
      });
    }

    res.status(200).json({
      data: {
        call_id: id,
        transcript: result.rows[0].transcript || '',
      },
      request_id: requestId,
    });
  } catch (err) {
    res.status(500).json({
      error: { code: 'internal_error', message: err.message },
      request_id: requestId,
    });
  }
}

async function getCallOutcome(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT * FROM call_outcomes WHERE call_id = $1 AND business_id = $2`,
      [id, businessId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'not_found', message: 'Call outcome not found or processing incomplete' },
        request_id: requestId,
      });
    }

    const outcome = result.rows[0];
    res.status(200).json({
      data: {
        call_id: outcome.call_id,
        kind: 'conversation_insight',
        source: outcome.raw_outcome?.provenance?.source || 'unverified_legacy',
        executionEvidence: null,
        interested: outcome.interested,
        lead_score: outcome.lead_score,
        budget: outcome.budget,
        location: outcome.location,
        property_type: outcome.property_type,
        purchase_timeline: outcome.purchase_timeline,
        callback_required: outcome.callback_required,
        summary: outcome.summary,
        raw_outcome: outcome.raw_outcome,
        created_at: outcome.created_at,
      },
      request_id: requestId,
    });
  } catch (err) {
    res.status(500).json({
      error: { code: 'internal_error', message: err.message },
      request_id: requestId,
    });
  }
}

module.exports = {
  createCall,
  listCalls,
  getCallById,
  getCallTranscript,
  getCallOutcome,
};
