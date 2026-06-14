/**
 * numberProvisioningService.js
 * ─────────────────────────────────────────────────────────────────────
 * Assigns pooled Exotel numbers to businesses.
 * One pooled number serves up to 50 users (cost: ₹25/user/month).
 */

const { supabase } = require('../../database/db');

// ── normalizePhoneNumber ──────────────────────────────────────────────
// Input: US or international format
// Output: normalized phone number or null if invalid
function normalizePhoneNumber(phone) {
  if (!phone) return null;
  let cleaned = String(phone).replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+1') && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith('1') && cleaned.length === 11) return '+' + cleaned;
  if (cleaned.length === 10 && /^[2-9]\d{9}$/.test(cleaned)) {
    return '+1' + cleaned;
  }
  if (cleaned.startsWith('+')) return cleaned;
  return null;
}

// ── buildForwardingResult ─────────────────────────────────────────────
function buildForwardingResult(bavioNumber, originalNumber, assignmentId) {
  const numberClean = bavioNumber.replace('+', '');
  return {
    setupType: 'forwarding',
    assignmentId,
    bavioPhonenumber: bavioNumber,
    userOriginalNumber: originalNumber,
    forwardingCodes: {
      conditional: `*67*${numberClean}#`,
      unconditional: `*21*${numberClean}#`,
      cancel: '#67#'
    },
    recommendedCode: `*67*${numberClean}#`,
    carrierInstructions: {
      verizon: `Dial *71${numberClean} and press call`,
      att: `Dial **67*${numberClean}# and press call`,
      tmobile: `Dial **67*${numberClean}# and press call`
    },
    testInstructions:
      `Call ${originalNumber} from another phone. ` +
      `Let it ring 20 seconds. Bavio AI should answer in English.`,
    status: 'pending'
  };
}

// ── assignForwardingNumber ────────────────────────────────────────────
async function assignForwardingNumber(businessId, userOriginalNumber) {
  const normalizedNumber = normalizePhoneNumber(userOriginalNumber);
  if (!normalizedNumber) {
    throw new Error(
      'Invalid phone number. Use format: 5125550199 or +1 512 555 0199'
    );
  }

  // Check existing assignment
  const { data: existing } = await supabase
    .from('pool_assignments')
    .select(`*, phone_numbers!pool_number_id (phone_number)`)
    .eq('business_id', businessId)
    .maybeSingle();

  if (existing) {
    return buildForwardingResult(
      existing.phone_numbers.phone_number,
      normalizedNumber,
      existing.id
    );
  }

  // Find least-loaded pool number
  const { data: pools, error: poolError } = await supabase
    .from('phone_numbers')
    .select('id, phone_number, pool_user_count, max_users')
    .eq('type', 'pool')
    .eq('status', 'active')
    .order('pool_user_count', { ascending: true });

  if (poolError) throw new Error('Failed to fetch pool numbers: ' + poolError.message);

  const poolNumber = pools?.find(p => p.pool_user_count < p.max_users);
  if (!poolNumber) {
    throw new Error(
      'All pool numbers are at capacity. Contact support.'
    );
  }

  const forwardingCode = `*67*${poolNumber.phone_number.replace('+', '')}#`;

  // Create pool assignment
  const { data: assignment, error: assignError } = await supabase
    .from('pool_assignments')
    .insert({
      pool_number_id: poolNumber.id,
      business_id: businessId,
      user_original_number: normalizedNumber,
      forwarding_code: forwardingCode,
      forwarding_status: 'pending'
    })
    .select()
    .single();

  if (assignError) {
    throw new Error('Failed to create assignment: ' + assignError.message);
  }

  // Create call routing record
  await supabase.from('call_routing').insert({
    bavio_number: poolNumber.phone_number,
    business_id: businessId,
    routing_method: 'caller_id',
    user_original_number: normalizedNumber,
    is_active: true
  });

  // Increment pool user count
  await supabase.rpc('increment_pool_user_count', {
    pool_number_id: poolNumber.id
  });

  // Update businesses table
  await supabase
    .from('businesses')
    .update({
      number_setup_type: 'forwarding',
      original_phone_number: normalizedNumber
    })
    .eq('id', businessId);

  // Insert into phone_numbers for existing query compatibility
  const { error: upsertErr } = await supabase.from('phone_numbers').upsert({
    business_id: businessId,
    phone_number: poolNumber.phone_number,
    type: 'forwarding',
    user_original_number: normalizedNumber,
    call_routing_method: 'caller_id',
    forwarding_status: 'pending',
    status: 'active',
    provider: 'exotel'
  }, { onConflict: 'phone_number' });
  if (upsertErr) {
    console.error('[PROVISION] phone_numbers upsert error:', upsertErr.message);
  }

  console.log(
    `[PROVISION] Forwarding: ${normalizedNumber} → ${poolNumber.phone_number}`
  );

  return buildForwardingResult(
    poolNumber.phone_number,
    normalizedNumber,
    assignment.id
  );
}

// ── assignDedicatedNumber ─────────────────────────────────────────────
async function assignDedicatedNumber(businessId) {
  // Check existing
  const { data: existing } = await supabase
    .from('phone_numbers')
    .select('phone_number, type, status')
    .eq('business_id', businessId)
    .eq('type', 'dedicated')
    .maybeSingle();

  if (existing) {
    return {
      setupType: 'dedicated',
      phoneNumber: existing.phone_number,
      status: existing.status,
      message: 'You already have a dedicated number.'
    };
  }

  // Find unassigned pool number to use as dedicated
  const { data: unassigned } = await supabase
    .from('phone_numbers')
    .select('id, phone_number')
    .eq('type', 'pool')
    .eq('pool_user_count', 0)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!unassigned) {
    throw new Error(
      'No dedicated numbers available. Choose forwarding or contact support.'
    );
  }

  await supabase
    .from('phone_numbers')
    .update({
      type: 'dedicated',
      business_id: businessId,
      call_routing_method: 'direct',
      forwarding_status: 'active'
    })
    .eq('id', unassigned.id);

  await supabase
    .from('businesses')
    .update({ number_setup_type: 'dedicated' })
    .eq('id', businessId);

  console.log(`[PROVISION] Dedicated: ${unassigned.phone_number} → ${businessId}`);

  return {
    setupType: 'dedicated',
    phoneNumber: unassigned.phone_number,
    status: 'active',
    message: `Your Bavio number: ${unassigned.phone_number}. Share with customers.`
  };
}

// ── assignPhoneNumber ─────────────────────────────────────────────────
async function assignPhoneNumber(businessId, setupType, userOriginalNumber = null) {
  try {
    console.log(`[PROVISION] Business: ${businessId}, Type: ${setupType}`);
    if (setupType === 'forwarding') {
      return await assignForwardingNumber(businessId, userOriginalNumber);
    } else if (setupType === 'dedicated') {
      return await assignDedicatedNumber(businessId);
    } else {
      throw new Error(`Unknown setup type: ${setupType}`);
    }
  } catch (err) {
    console.error('[PROVISION] Error:', err.message);
    throw err;
  }
}

// ── confirmForwardingActivated ────────────────────────────────────────
async function confirmForwardingActivated(businessId) {
  await supabase
    .from('pool_assignments')
    .update({
      forwarding_status: 'active',
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('business_id', businessId);

  await supabase
    .from('businesses')
    .update({
      forwarding_activated_at: new Date().toISOString(),
      phone_number_verified: true
    })
    .eq('id', businessId);

  await supabase
    .from('phone_numbers')
    .update({ forwarding_status: 'active' })
    .eq('business_id', businessId);

  await supabase
    .from('call_routing')
    .update({ is_active: true })
    .eq('business_id', businessId);

  console.log(`[PROVISION] Forwarding confirmed active: ${businessId}`);
  return { success: true };
}

// ── getBusinessNumberInfo ─────────────────────────────────────────────
async function getBusinessNumberInfo(businessId) {
  // Check forwarding assignment first
  const { data: assignment } = await supabase
    .from('pool_assignments')
    .select(`*, phone_numbers!pool_number_id (phone_number)`)
    .eq('business_id', businessId)
    .maybeSingle();

  if (assignment) {
    const bavioNumber = assignment.phone_numbers.phone_number;
    const numberClean = bavioNumber.replace('+', '');
    return {
      setupType: 'forwarding',
      bavioPhonenumber: bavioNumber,
      userOriginalNumber: assignment.user_original_number,
      forwardingCode: assignment.forwarding_code,
      forwardingCodes: {
        conditional: `*67*${numberClean}#`,
        cancel: '#67#'
      },
      forwardingStatus: assignment.forwarding_status,
      activatedAt: assignment.activated_at
    };
  }

  // Check dedicated number
  const { data: dedicated } = await supabase
    .from('phone_numbers')
    .select('phone_number, type, status, forwarding_status')
    .eq('business_id', businessId)
    .eq('type', 'dedicated')
    .maybeSingle();

  if (dedicated) {
    return {
      setupType: 'dedicated',
      phoneNumber: dedicated.phone_number,
      status: dedicated.status,
      forwardingStatus: 'active'
    };
  }

  return null;
}

// ── releasePhoneNumber ────────────────────────────────────────────────
async function releasePhoneNumber(businessId) {
  try {
    const { data: assignment } = await supabase
      .from('pool_assignments')
      .select('pool_number_id')
      .eq('business_id', businessId)
      .maybeSingle();

    if (assignment) {
      await supabase.rpc('decrement_pool_user_count', {
        pool_number_id: assignment.pool_number_id
      });
      await supabase
        .from('pool_assignments')
        .update({ forwarding_status: 'disabled' })
        .eq('business_id', businessId);
    }

    await supabase
      .from('call_routing')
      .update({ is_active: false })
      .eq('business_id', businessId);

    await supabase
      .from('phone_numbers')
      .update({ status: 'released' })
      .eq('business_id', businessId)
      .eq('type', 'forwarding');

    console.log(`[PROVISION] Released: ${businessId}`);
  } catch (err) {
    console.error('[PROVISION] Release error:', err.message);
  }
}

module.exports = {
  assignPhoneNumber,
  confirmForwardingActivated,
  getBusinessNumberInfo,
  releasePhoneNumber,
  normalizePhoneNumber
};
