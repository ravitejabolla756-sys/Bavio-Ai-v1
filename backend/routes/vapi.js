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

  // ── Extract payload fields safely ────────────────────────────────────────
  const { message = {}, analysis = {}, customer = {}, call = {} } = req.body;

  const structured   = analysis?.structuredData || {};
  const callerNumber = customer?.number         || null;
  const vapiCallId   = call?.id                 || null;
  const duration     = call?.durationSeconds    || 0;
  const summary      = analysis?.summary        || null;

  const name     = structured?.name     || null;
  const budget   = structured?.budget   || null;
  const location = structured?.location || null;
  const intent   = structured?.intent   || null;

  // ── Temporary business_id for testing ───────────────────────────────────
  // TODO: replace with real lookup once assistant-to-business mapping is live
  const TEST_BUSINESS_ID = process.env.VAPI_TEST_BUSINESS_ID || null;

  // ── 1. Insert into calls ─────────────────────────────────────────────────
  let callRowId = null;
  try {
    const { data: callRow, error: callError } = await supabase
      .from('calls')
      .insert({
        business_id:      TEST_BUSINESS_ID,
        provider_call_id: vapiCallId,
        caller_number:    callerNumber,
        duration:         duration,
        duration_seconds: duration,
        status:           'completed',
        call_status:      'completed',
        provider:         'vapi',
        direction:        'inbound',
        transcript:       message?.transcript ? message.transcript : []
      })
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

  // ── 2. Insert into leads ─────────────────────────────────────────────────
  try {
    const { data: leadRow, error: leadError } = await supabase
      .from('leads')
      .insert({
        business_id: TEST_BUSINESS_ID,
        call_id:     callRowId,
        phone:       callerNumber,
        caller_number: callerNumber,
        name:        name,
        intent:      intent,
        budget:      budget,
        location:    location,
        summary:     summary,
        status:      'new'
      })
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
