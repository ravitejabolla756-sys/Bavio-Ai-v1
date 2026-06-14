import { query } from '../../db/db';
import { ExotelService } from './ExotelService';
import { TwilioService } from './TwilioService';
import { ITelephonyProvider, PurchasedNumber } from './ITelephonyProvider';

export { PurchasedNumber };

export class PhoneAssignmentService {
  private static exotelService = new ExotelService();
  private static twilioService = new TwilioService();

  /**
   * Get active telephony provider based on ACTIVE_TELEPHONY_PROVIDER environment variable
   */
  public static getActiveProvider(countryCode?: string): ITelephonyProvider {
    const activeProvider = (process.env.ACTIVE_TELEPHONY_PROVIDER || 'twilio').toLowerCase().trim();
    if (activeProvider === 'exotel') {
      if (countryCode && countryCode.toUpperCase() === 'IN') {
        return this.exotelService;
      }
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

    // 2. Decide provider based on country and ACTIVE_TELEPHONY_PROVIDER setting
    const activeProvider = this.getActiveProvider(cleanCountry);
    let purchased: PurchasedNumber;

    if (activeProvider === this.exotelService) {
      try {
        console.log(`[PHONE ASSIGNMENT] Attempting to purchase Indian number via Exotel...`);
        purchased = await this.exotelService.buyNumber({
          businessId: targetId,
          countryCode: cleanCountry,
          friendlyName,
          areaCode,
        });
      } catch (exotelErr: any) {
        console.warn(`[PHONE ASSIGNMENT] Exotel purchase failed: ${exotelErr.message}. Falling back to Twilio for Indian number...`);
        try {
          purchased = await this.twilioService.buyNumber({
            businessId: targetId,
            countryCode: cleanCountry,
            friendlyName,
            areaCode,
          });
        } catch (twilioErr: any) {
          console.error(`[PHONE ASSIGNMENT] Fallback Twilio purchase also failed: ${twilioErr.message}`);
          throw new Error(
            `Both Exotel and fallback Twilio failed to buy Indian number. ` +
            `Exotel error: ${exotelErr.message}. Twilio error: ${twilioErr.message}`
          );
        }
      }
    } else {
      // Non-India countries or Twilio override goes straight to Twilio
      try {
        console.log(`[PHONE ASSIGNMENT] Attempting to purchase number via Twilio for country ${cleanCountry}...`);
        purchased = await this.twilioService.buyNumber({
          businessId: targetId,
          countryCode: cleanCountry,
          friendlyName,
          areaCode,
        });
      } catch (twilioErr: any) {
        console.error(`[PHONE ASSIGNMENT] Twilio purchase failed: ${twilioErr.message}`);
        throw new Error(`Telephony provider failed to buy number: ${twilioErr.message}`);
      }
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
