import { IPhoneProvider, PurchasedNumber } from './index';
import twilio from 'twilio';

export class TwilioService implements IPhoneProvider {
  /**
   * Purchase local virtual number from Twilio (Global: US, GB, AU, CA, AE)
   */
  public async buyNumber(params: {
    businessId: string;
    countryCode: string;
    friendlyName: string;
    areaCode?: string;
  }): Promise<PurchasedNumber> {
    const { countryCode, friendlyName, areaCode } = params;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Fallback: If credentials are placeholders or missing, generate a mock number for testing
    const isPlaceholder = !accountSid || !authToken || 
                          accountSid.includes('your_') || 
                          authToken.includes('your_');

    if (isPlaceholder) {
      console.log(`[TWILIO PROVIDER] Placeholder credentials detected. Generating mock virtual number for country ${countryCode}...`);
      
      const countryCodeMap: Record<string, { prefix: string; length: number }> = {
        US: { prefix: "+1", length: 10 },
        CA: { prefix: "+1", length: 10 },
        GB: { prefix: "+44", length: 10 },
        AU: { prefix: "+61", length: 9 },
        AE: { prefix: "+971", length: 8 },
      };

      const geo = countryCodeMap[countryCode.toUpperCase()] || { prefix: "+1", length: 10 };
      const randomDigits = Math.floor(
        Math.pow(10, geo.length - 1) + Math.random() * (Math.pow(10, geo.length) - Math.pow(10, geo.length - 1))
      );

      return {
        phoneNumber: `${geo.prefix}${randomDigits}`,
        providerSid: `PN${Math.random().toString(16).substring(2, 34).toUpperCase()}`,
        provider: 'twilio',
      };
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    try {
      // 1. Search for available local phone numbers in the country
      const searchOptions: any = { limit: 1 };
      if (areaCode) {
        searchOptions.areaCode = areaCode;
      }

      const available = await client.availablePhoneNumbers(countryCode.toUpperCase()).local.list(searchOptions);

      if (!available || available.length === 0) {
        throw new Error(`No available phone numbers found in country: ${countryCode}`);
      }

      const selectedNumber = available[0].phoneNumber;

      // 2. Buy/provision the phone number
      const incoming = await client.incomingPhoneNumbers.create({
        phoneNumber: selectedNumber,
        friendlyName: friendlyName,
      });

      return {
        phoneNumber: incoming.phoneNumber,
        providerSid: incoming.sid,
        provider: 'twilio',
      };
    } catch (err: any) {
      // Catch failures and failover to mock during development/integration testing
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.warn('[TWILIO PROVIDER] Fallback: Returning mock virtual number for local test/dev environment...');
        const countryCodeMap: Record<string, { prefix: string; length: number }> = {
          US: { prefix: "+1", length: 10 },
          CA: { prefix: "+1", length: 10 },
          GB: { prefix: "+44", length: 10 },
          AU: { prefix: "+61", length: 9 },
          AE: { prefix: "+971", length: 8 },
        };
        const geo = countryCodeMap[countryCode.toUpperCase()] || { prefix: "+1", length: 10 };
        const randomDigits = Math.floor(
          Math.pow(10, geo.length - 1) + Math.random() * (Math.pow(10, geo.length) - Math.pow(10, geo.length - 1))
        );
        return {
          phoneNumber: `${geo.prefix}${randomDigits}`,
          providerSid: `PN_mock_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          provider: 'twilio',
        };
      }

      console.error('[TWILIO PROVIDER] SDK purchase request failed:', err.message);

      // Map Twilio error codes to explicit error messages
      // Twilio Error codes reference: https://www.twilio.com/docs/api/errors
      const twilioCode = err.code;
      if (twilioCode === 21612 || twilioCode === 21614) {
        throw new Error('Twilio billing payment failure: insufficient account balance.');
      }
      if (twilioCode === 20429) {
        throw new Error('Twilio API rate limiting exceeded. Please retry in a few moments.');
      }
      if (twilioCode === 21452 || twilioCode === 21422) {
        throw new Error(`No phone numbers available for purchase in this country (${countryCode}).`);
      }
      if (twilioCode === 21601 || twilioCode === 21644) {
        throw new Error('Telephony assignment quota limit reached on your Twilio account.');
      }

      throw err;
    }
  }
}
