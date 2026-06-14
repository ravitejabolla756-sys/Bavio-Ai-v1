import { supabase } from '../database/supabase';

const MAX_CUSTOMERS_PER_POOL = 1;

export class PoolService {
  static async assignToPool(businessId: number, originalNumber: string): Promise<number | null> {
    const { data: availablePools, error: poolError } = await supabase
      .from('exotel_pools')
      .select('id, active_customers, max_concurrent_calls')
      .eq('status', 'active')
      .lt('active_customers', MAX_CUSTOMERS_PER_POOL)
      .order('active_customers', { ascending: false })
      .limit(1);

    if (poolError || !availablePools || availablePools.length === 0) {
      return null;
    }

    const poolId = availablePools[0].id;

    const { data: phoneData, error: phoneInsertError } = await supabase
      .from('phone_numbers')
      .insert({
        business_id: businessId,
        original_number: originalNumber,
        forwarding_enabled: true,
        verification_status: 'verified',
        exotel_pool_id: poolId
      })
      .select('id')
      .single();

    if (phoneInsertError) return null;

    await supabase.rpc('increment_pool_customers', { pool_id_input: poolId });

    return poolId;
  }
}
