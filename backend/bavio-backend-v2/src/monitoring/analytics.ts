import { PostHog } from 'posthog-node';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const POSTHOG_KEY = process.env.POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://app.posthog.com';

// Mock client/fallback tracking for tests or local dev when API keys are missing
class MockPostHog {
  capture(payload: any) {
    logger.info('[MONITORING] [MOCK POSTHOG] Capture event:', payload);
    capturedEventsForTest.push(payload);
  }
}

// In-memory array for test assertions
export const capturedEventsForTest: any[] = [];

// Initialize PostHog client
let client: any;
if (POSTHOG_KEY && process.env.NODE_ENV !== 'test') {
  client = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST });
} else {
  client = new MockPostHog();
}

/**
 * Event: User signed up
 */
export async function trackUserSignup(userId: string, country: string, plan: string): Promise<void> {
  client.capture({
    distinctId: userId,
    event: 'user_signup',
    properties: {
      country,
      plan,
      timestamp: new Date(),
      source: 'web'
    }
  });
}

/**
 * Event: Payment success
 */
export async function trackPaymentSuccess(userId: string, amount: number, currency: string): Promise<void> {
  client.capture({
    distinctId: userId,
    event: 'payment_success',
    properties: {
      amount,
      currency,
      timestamp: new Date()
    }
  });
}

/**
 * Event: Call completed
 */
export async function trackCallCompleted(userId: string, duration: number, cost: number): Promise<void> {
  client.capture({
    distinctId: userId,
    event: 'call_completed',
    properties: {
      duration,
      cost,
      timestamp: new Date()
    }
  });
}
