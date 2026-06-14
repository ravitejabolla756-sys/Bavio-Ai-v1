import { Request } from 'express';

export interface PurchasedNumber {
  phoneNumber: string;
  providerSid: string;
  provider: 'exotel' | 'twilio';
}

export interface WebhookPayload {
  callSid: string;
  from: string;
  to: string;
  eventType: 'incoming' | 'ended' | 'recording' | 'other';
  recordingUrl?: string;
  duration?: number;
  cost?: number;
  status?: string;
}

export interface ITelephonyProvider {
  buyNumber(params: {
    businessId: string;
    countryCode: string;
    friendlyName: string;
    areaCode?: string;
  }): Promise<PurchasedNumber>;

  parseWebhook(req: Request): WebhookPayload;

  generateGreetingTwiML(greetingText: string): string;

  generateIVRBlockTwiML(): string;

  verifySignature(req: Request): boolean;
}
