/**
 * callRoutingService.js
 * ─────────────────────────────────────────────────────────────────────
 * Resolves an incoming Exotel call to the correct business.
 * Called at the START of every incoming call webhook.
 *
 * Priority:
 *  1. call_routing table  — direct lookup (fastest, indexed)
 *  2. phone_numbers table — dedicated or single-forwarding row
 *  3. pool_assignments    — pool number shared by many users
 */

const { supabase } = require('../../database/db');

async function resolveBusinessFromCall(toNumber, fromNumber) {
  try {
    console.log(`[ROUTING] ${fromNumber} → ${toNumber}`);

    // Priority 1: Direct call_routing table (fastest)
    const { data: directRoute } = await supabase
      .from('call_routing')
      .select('business_id, routing_method, user_original_number')
      .eq('bavio_number', toNumber)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (directRoute) {
      console.log(`[ROUTING] Direct route → ${directRoute.business_id}`);
      return {
        business_id: directRoute.business_id,
        routing_method: directRoute.routing_method,
        user_original_number: directRoute.user_original_number
      };
    }

    // Priority 2: phone_numbers table for dedicated numbers
    const { data: phoneRecord } = await supabase
      .from('phone_numbers')
      .select('business_id, call_routing_method, user_original_number, type')
      .eq('phone_number', toNumber)
      .eq('status', 'active')
      .maybeSingle();

    if (phoneRecord && phoneRecord.type === 'dedicated') {
      console.log(`[ROUTING] Dedicated → ${phoneRecord.business_id}`);
      return {
        business_id: phoneRecord.business_id,
        routing_method: 'direct',
        user_original_number: null
      };
    }

    if (phoneRecord && phoneRecord.type === 'forwarding') {
      console.log(`[ROUTING] Forwarding → ${phoneRecord.business_id}`);
      return {
        business_id: phoneRecord.business_id,
        routing_method: 'caller_id',
        user_original_number: phoneRecord.user_original_number
      };
    }

    // Priority 3: Pool assignments scan
    const { data: poolAssignments } = await supabase
      .from('pool_assignments')
      .select(`
        business_id,
        user_original_number,
        forwarding_status,
        phone_numbers!pool_number_id (phone_number)
      `)
      .eq('forwarding_status', 'active');

    if (poolAssignments) {
      const match = poolAssignments.find(
        a => a.phone_numbers?.phone_number === toNumber
      );
      if (match) {
        console.log(`[ROUTING] Pool match → ${match.business_id}`);
        return {
          business_id: match.business_id,
          routing_method: 'caller_id',
          user_original_number: match.user_original_number
        };
      }
    }

    console.log(`[ROUTING] No route found for ${toNumber}`);
    return null;
  } catch (err) {
    console.error('[ROUTING] Error:', err.message);
    return null;
  }
}

module.exports = { resolveBusinessFromCall };
