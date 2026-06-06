import { supabase } from '../../database/supabase';
import { ExotelService } from './ExotelService';
import { TwilioService } from './TwilioService';

export interface PurchasedNumber {
  phoneNumber: string;
  providerSid: string;
  provider: 'exotel' | 'twilio';
}

export interface IPhoneProvider {
  buyNumber(params: {
    businessId: string;
    countryCode: string;
    friendlyName: string;
    areaCode?: string;
  }): Promise<PurchasedNumber>;
}

export class PhoneAssignmentService {
  private static exotelService = new ExotelService();
  private static twilioService = new TwilioService();

  private static getProvider(countryCode: string): IPhoneProvider {
    const code = countryCode.toUpperCase();
    if (code === 'IN') {
      return this.exotelService;
    }
    return this.twilioService;
  }

  /**
   * Auto-assign a virtual number based on user country, save it, and link it to business profile
   */
  public static async assignNumber(params: {
    businessId: string;
    countryCode: string;
    friendlyName: string;
    areaCode?: string;
  }): Promise<PurchasedNumber> {
    const { businessId, countryCode, friendlyName, areaCode } = params;
    const cleanCountry = countryCode.trim().toUpperCase().substring(0, 2);

    // 1. Prevent duplicate assignments: check if business already has an active virtual number
    const { data: existing, error: fetchErr } = await supabase
      .from('virtual_numbers')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .maybeSingle();

    if (fetchErr) {
      console.error('[PHONE ASSIGNMENT] Error checking existing assignments:', fetchErr);
    }

    if (existing) {
      console.log(`[PHONE ASSIGNMENT] Business ${businessId} already has active number: ${existing.phone_number}`);
      return {
        phoneNumber: existing.phone_number,
        providerSid: existing.provider_sid,
        provider: existing.provider as 'exotel' | 'twilio',
      };
    }

    // 2. Route to correct provider based on country
    const provider = this.getProvider(cleanCountry);

    // 3. Purchase number from provider API
    let purchased: PurchasedNumber;
    try {
      purchased = await provider.buyNumber({
        businessId,
        countryCode: cleanCountry,
        friendlyName,
        areaCode,
      });
    } catch (err: any) {
      console.error(`[PHONE ASSIGNMENT] Telephony provision error: ${err.message}`);
      throw new Error(`Telephony provider failed to buy number: ${err.message}`);
    }

    // 4. Save to virtual_numbers table
    const { error: insertErr } = await supabase
      .from('virtual_numbers')
      .insert({
        business_id: businessId,
        country_code: cleanCountry,
        provider: purchased.provider,
        phone_number: purchased.phoneNumber,
        provider_sid: purchased.providerSid,
        status: 'active',
      });

    if (insertErr) {
      console.error('[PHONE ASSIGNMENT] Error saving virtual number to database:', insertErr);
      throw new Error(`Failed to log assigned virtual number to database: ${insertErr.message}`);
    }

    // 5. Link to user account (update twilio_number column on businesses)
    const { error: updateErr } = await supabase
      .from('businesses')
      .update({
        twilio_number: purchased.phoneNumber,
        number_assigned_at: new Date().toISOString(),
      })
      .eq('id', businessId);

    if (updateErr) {
      console.warn(`[PHONE ASSIGNMENT] Warning: Failed to update default twilio_number on businesses: ${updateErr.message}`);
    }

    console.log(`[PHONE ASSIGNMENT] Successfully auto-assigned ${purchased.phoneNumber} (${purchased.provider}) to business ${businessId}`);
    return purchased;
  }
}
