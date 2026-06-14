/**
 * callRoutingService.js
 * ─────────────────────────────────────────────────────────────────────
 * Resolves an incoming Exotel call to the correct business.
 * Called at the START of every incoming call webhook.
 *
 * Strategies:
 *  1. Provider-Specific Call Forwarding Metadata (e.g. SIP Diversion header)
 *  2. Caller Whitelist Lookup (queries caller_whitelist to match caller number)
 *  3. Default Fallback (checks business_phone_mapping for active Exotel number)
 *  4. Legacy Fallback (queries phone_numbers table)
 */

const { supabase } = require('../../database/db');

async function resolveBusinessFromCall(toNumber, fromNumber, req = null) {
  try {
    console.log(`[ROUTING] Incoming call: ${fromNumber} → ${toNumber}`);

    // Normalize Exotel number formats (handle leading 0, raw 10 digits, +91, etc.)
    let formattedNumbers = [toNumber];
    const cleanDigits = toNumber.replace(/\D/g, '');
    if (cleanDigits.length >= 10) {
      const tenDigits = cleanDigits.slice(-10);
      formattedNumbers.push('+91' + tenDigits);
      formattedNumbers.push(tenDigits);
      formattedNumbers.push('0' + tenDigits);
    }
    formattedNumbers = [...new Set(formattedNumbers)];

    // Strategy 1: Provider-Specific Call Forwarding Metadata
    let providerOriginalNumber = null;
    if (req) {
      providerOriginalNumber = 
        req.body?.ForwardedFrom || 
        req.query?.ForwardedFrom || 
        req.body?.OriginalCalledNumber || 
        req.query?.OriginalCalledNumber || 
        req.headers?.['diversion'] || 
        req.headers?.['x-diversion'];
    }

    if (providerOriginalNumber) {
      console.log(`[ROUTING] Provider-specific routing metadata found: ${providerOriginalNumber}`);
      const { data: mapping } = await supabase
        .from('business_phone_mapping')
        .select('business_id, business_number')
        .in('exotel_number', formattedNumbers)
        .eq('business_number', providerOriginalNumber)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (mapping) {
        console.log(`[ROUTING] Resolved via provider metadata to business ID: ${mapping.business_id}`);
        return {
          business_id: mapping.business_id,
          business_number: mapping.business_number,
          routing_method: 'provider_metadata'
        };
      }
    }

    // Strategy 2: Caller Whitelist Lookup (Diagram Method A)
    console.log(`[ROUTING] Performing Caller Whitelist Lookup for ${fromNumber} on Exotel numbers: ${formattedNumbers.join(', ')}`);
    const { data: whitelistMatch } = await supabase
      .from('caller_whitelist')
      .select('business_id')
      .eq('caller_phone', fromNumber)
      .limit(1)
      .maybeSingle();

    if (whitelistMatch) {
      // Check if this business is mapped to this Exotel number
      const { data: mapping } = await supabase
        .from('business_phone_mapping')
        .select('business_id, business_number')
        .eq('business_id', whitelistMatch.business_id)
        .in('exotel_number', formattedNumbers)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (mapping) {
        console.log(`[ROUTING] Resolved via Caller Whitelist to business ID: ${mapping.business_id}`);
        return {
          business_id: mapping.business_id,
          business_number: mapping.business_number,
          routing_method: 'caller_whitelist'
        };
      }
    }

    // Strategy 3: Default Fallback Mapped Tenant
    console.log(`[ROUTING] Whitelist/metadata resolution failed. Checking default fallback mapping for Exotel numbers: ${formattedNumbers.join(', ')}`);
    const { data: defaultMapping } = await supabase
      .from('business_phone_mapping')
      .select('business_id, business_number')
      .in('exotel_number', formattedNumbers)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (defaultMapping) {
      console.log(`[ROUTING] Resolved via Default Fallback to business ID: ${defaultMapping.business_id}`);
      return {
        business_id: defaultMapping.business_id,
        business_number: defaultMapping.business_number,
        routing_method: 'default_fallback'
      };
    }

    // Strategy 4: Fallback to old phone_numbers table (for backward compatibility)
    console.log(`[ROUTING] No business_phone_mapping found. Scanning legacy tables...`);
    const { data: phoneRecord } = await supabase
      .from('phone_numbers')
      .select('business_id, call_routing_method, user_original_number, type')
      .in('phone_number', formattedNumbers)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (phoneRecord) {
      console.log(`[ROUTING] Resolved via legacy phone_record to business ID: ${phoneRecord.business_id}`);
      return {
        business_id: phoneRecord.business_id,
        business_number: phoneRecord.user_original_number || toNumber,
        routing_method: phoneRecord.call_routing_method || 'legacy'
      };
    }

    console.log(`[ROUTING] No route found for Exotel numbers: ${formattedNumbers.join(', ')}, Caller: ${fromNumber}`);
    return null;
  } catch (err) {
    console.error('[ROUTING] Error:', err.message);
    return null;
  }
}

module.exports = { resolveBusinessFromCall };
