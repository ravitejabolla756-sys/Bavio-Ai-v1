const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// All Vapi webhooks — NO JWT auth
// Vapi calls these directly

// POST /api/vapi/webhook
router.post('/webhook', async (req, res) => {
  console.log('========== VAPI EVENT ==========');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('================================');

  // Only process end-of-call reports; acknowledge everything else immediately
  const messageType = req.body?.message?.type;
  if (messageType !== 'end-of-call-report') {
    return res.status(200).json({ ignored: true });
  }

  // ── Extract payload fields from inside message ────────────────────────────
  // Vapi nests all end-of-call data inside req.body.message, not at root level
  const message    = req.body.message    || {};
  const analysis   = message.analysis   || {};
  const structured = analysis.structuredData || {};

  // call object — contains id, durationSeconds, customer
  const call = message.call || {};

  // customer.number — check message.customer first, then call.customer
  const customer     = message.customer || call.customer || {};
  const callerNumber = customer.number  || null;

  const vapiCallId = call.id                               || null;
  const duration   = call.durationSeconds                  || 0;
  const summary    = analysis.summary || message.summary   || null;

  const name     = structured.name     || null;
  const budget   = structured.budget   || null;
  const location = structured.location || null;
  const intent   = structured.intent   || null;

  console.log('[VAPI] Parsed → caller:', callerNumber, '| callId:', vapiCallId, '| duration:', duration);
  console.log('[VAPI] Lead data → name:', name, '| intent:', intent, '| budget:', budget, '| location:', location);

  // ── Dynamic business_id lookup from assistant ID ────────────────────────
  const vapiAssistantId = call.assistantId || message.assistantId || null;
  let businessId = null;

  if (vapiAssistantId) {
    try {
      const { data: assistantRecord, error: astError } = await supabase
        .from('assistants')
        .select('business_id')
        .eq('vapi_assistant_id', vapiAssistantId)
        .maybeSingle();

      if (astError) {
        console.error('[VAPI] Error looking up business by assistant ID:', astError.message);
      } else if (assistantRecord) {
        businessId = assistantRecord.business_id;
        console.log('[VAPI] Found business matching assistant ID:', businessId);
      }
    } catch (err) {
      console.error('[VAPI] Exception looking up assistant:', err.message);
    }
  }

  // Fallback to test business ID if lookup fails
  if (!businessId) {
    businessId = process.env.VAPI_TEST_BUSINESS_ID || null;
  }

  // ── Build calls insert — only include business_id when set ──────────────
  // Omitting it when null avoids Supabase schema cache errors on nullable FK columns
  const callPayload = {
    provider_call_id: vapiCallId,
    caller_number:    callerNumber || 'unknown',
    duration:         duration,
    duration_seconds: duration,
    status:           'completed',
    call_status:      'completed',
    provider:         'vapi',
    direction:        'inbound',
    transcript:       message.transcript ? [{ text: message.transcript }] : []
  };
  if (businessId) callPayload.business_id = businessId;

  // ── 1. Insert into calls ─────────────────────────────────────────────────
  let callRowId = null;
  try {
    const { data: callRow, error: callError } = await supabase
      .from('calls')
      .insert(callPayload)
      .select('id')
      .single();

    if (callError) {
      console.error('[VAPI] calls insert error:', callError.message);
    } else {
      callRowId = callRow?.id || null;
      console.log('[VAPI] Call saved → id:', callRowId);
    }
  } catch (err) {
    console.error('[VAPI] calls insert exception:', err.message);
  }

  // ── Build leads insert — phone is NOT NULL, use fallback ────────────────
  const leadPayload = {
    call_id:       callRowId,
    phone:         callerNumber || 'unknown',   // NOT NULL constraint
    caller_number: callerNumber || 'unknown',
    name:          name,
    intent:        intent,
    budget:        budget,
    location:      location,
    summary:       summary,
    status:        'new'
  };
  if (businessId) leadPayload.business_id = businessId;

  // ── 2. Insert into leads ─────────────────────────────────────────────────
  try {
    const { data: leadRow, error: leadError } = await supabase
      .from('leads')
      .insert(leadPayload)
      .select('id')
      .single();

    if (leadError) {
      console.error('[VAPI] leads insert error:', leadError.message);
    } else {
      console.log('[VAPI] Lead saved → id:', leadRow?.id);
    }
  } catch (err) {
    console.error('[VAPI] leads insert exception:', err.message);
  }

  return res.status(200).json({ success: true });
});

module.exports = router;
