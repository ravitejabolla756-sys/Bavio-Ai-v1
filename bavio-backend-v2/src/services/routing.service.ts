import { supabase } from '../database/supabase';
import { redisClient } from '../redis/redis.client';

export class RoutingService {
  static async routeCall(
    callSid: string,
    callerNumber: string,
    exotelNumber: string
  ): Promise<{ businessId: string; assistantId: string } | null> {
    // 1. Resolve exotel number to its pool record
    const { data: poolData, error: poolError } = await supabase
      .from('exotel_pools')
      .select('id')
      .eq('exotel_number', exotelNumber)
      .eq('status', 'active')
      .single();

    if (poolError || !poolData) {
      console.error(`Failed to resolve Exotel pool number ${exotelNumber}:`, poolError);
      return null;
    }

    // 2. Resolve pool record to the phone number / business assignment
    const { data: phoneData, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('business_id, original_number')
      .eq('exotel_pool_id', poolData.id)
      .single();

    if (phoneError || !phoneData) {
      console.error(`Failed to resolve business for Exotel pool ID ${poolData.id}:`, phoneError);
      return null;
    }

    const businessId = phoneData.business_id;
    const originalNumber = phoneData.original_number;

    const { data: assistantData, error: assistantError } = await supabase
      .from('assistants')
      .select('id')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .single();

    if (assistantError || !assistantData) return null;

    const assistantId = assistantData.id;

    await supabase.from('call_sessions').insert({
      business_id: businessId,
      call_sid: callSid,
      caller_number: callerNumber,
      original_number: originalNumber,
      session_status: 'in-progress'
    });

    const redisKey = `call:${callSid}`;
    await redisClient.hmset(redisKey, {
      business_id: String(businessId),
      assistant_id: String(assistantId),
      caller_number: callerNumber,
      original_number: originalNumber,
      conversation_history: JSON.stringify([]),
      lead_data: JSON.stringify({}),
    });

    await redisClient.expire(redisKey, 7200);

    return { businessId: String(businessId), assistantId: String(assistantId) };
  }
}
