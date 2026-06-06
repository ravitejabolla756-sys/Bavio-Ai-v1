import { query } from '../../db/db';
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
   * Auto-assign a virtual number based on user country, save it, and link it to user profile
   */
  public static async assignNumber(params: {
    userId?: string;
    businessId?: string;
    countryCode: string;
    friendlyName: string;
    areaCode?: string;
  }): Promise<PurchasedNumber> {
    const { userId, businessId, countryCode, friendlyName, areaCode } = params;
    const targetId = userId || businessId;
    if (!targetId) {
      throw new Error('Either userId or businessId must be provided');
    }
    const cleanCountry = countryCode.trim().toUpperCase().substring(0, 2);

    // 1. Prevent duplicate assignments: check if user already has an active virtual number for this country
    const existingRes = await query(
      `SELECT phone_number, provider_sid, provider 
       FROM virtual_numbers 
       WHERE user_id = $1 AND country_code = $2 AND status = 'active' 
       LIMIT 1`,
      [targetId, cleanCountry]
    );

    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      console.log(`[PHONE ASSIGNMENT] User ${targetId} already has active number for ${cleanCountry}: ${existing.phone_number}`);
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
        businessId: targetId,
        countryCode: cleanCountry,
        friendlyName,
        areaCode,
      });
    } catch (err: any) {
      console.error(`[PHONE ASSIGNMENT] Telephony provision error: ${err.message}`);
      throw new Error(`Telephony provider failed to buy number: ${err.message}`);
    }

    // 4. Save to virtual_numbers table
    try {
      await query(
        `INSERT INTO virtual_numbers (
          user_id, country_code, provider, phone_number, provider_sid, status
        ) VALUES ($1, $2, $3, $4, $5, 'active')`,
        [targetId, cleanCountry, purchased.provider, purchased.phoneNumber, purchased.providerSid]
      );
    } catch (insertErr: any) {
      console.error('[PHONE ASSIGNMENT] Error saving virtual number to database:', insertErr);
      throw new Error(`Failed to log assigned virtual number to database: ${insertErr.message}`);
    }

    // 5. Link to user account: Update business_phone as the virtual number on the user's profile
    try {
      await query(
        `UPDATE users 
         SET business_phone = $1 
         WHERE id = $2`,
        [purchased.phoneNumber, targetId]
      );
    } catch (updateErr: any) {
      console.warn(`[PHONE ASSIGNMENT] Warning: Failed to update business_phone on users: ${updateErr.message}`);
    }

    console.log(`[PHONE ASSIGNMENT] Successfully auto-assigned ${purchased.phoneNumber} (${purchased.provider}) to user ${targetId}`);
    return purchased;
  }
}
