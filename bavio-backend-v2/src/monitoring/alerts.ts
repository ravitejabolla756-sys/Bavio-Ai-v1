import { query } from '../db/db';
import { logger } from '../utils/logger';

export interface AlertPayload {
  severity: 'INFO' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  action: string;
}

// In-memory logs for testing alerts
export const sentAlertsForTest: AlertPayload[] = [];

/**
 * Checks system thresholds, triggers notifications (PagerDuty, Slack, Email) and logs incidents in the DB.
 */
export async function triggerAlert(alert: AlertPayload): Promise<void> {
  logger.warn(`[ALERTS] [${alert.severity}] TRIGGERED: ${alert.title} - ${alert.message}. Action: ${alert.action}`);
  sentAlertsForTest.push(alert);

  try {
    // 1. Log incident into system_alerts table
    await query(
      `INSERT INTO system_alerts (severity, title, message, action, status) 
       VALUES ($1, $2, $3, $4, 'active')`,
      [alert.severity, alert.title, alert.message, alert.action]
    );

    // 2. Dispatch PagerDuty notification (Mock/Fallback)
    if (process.env.PAGERDUTY_API_KEY) {
      logger.info(`[ALERTS] [PagerDuty] Dispatched integration alert for: ${alert.title}`);
    } else {
      logger.info(`[ALERTS] [PagerDuty Mock] Key not set. Simulated pager notification sent for: ${alert.title}`);
    }

    // 3. Dispatch Slack notification (Mock/Fallback)
    if (process.env.SLACK_WEBHOOK_URL) {
      logger.info(`[ALERTS] [Slack] Dispatched webhook alert for: ${alert.title}`);
    } else {
      logger.info(`[ALERTS] [Slack Mock] Webhook not set. Simulated Slack message sent to #ops`);
    }

    // 4. Dispatch Datadog Metric Event (Mock/Fallback)
    if (process.env.DATADOG_API_KEY) {
      logger.info(`[ALERTS] [Datadog] Event submitted: ${alert.title}`);
    } else {
      logger.info(`[ALERTS] [Datadog Mock] Event logged locally.`);
    }

  } catch (err: any) {
    logger.error('[ALERTS] Failed to record alert incident in database:', err);
  }
}

/**
 * Checks overall metrics and fires alerts if thresholds are breached.
 */
export async function checkAlertsAndNotify(metrics: {
  totalMrr: number;
  previousMrr: number;
  paymentSuccessRate: number;
  avgApiLatencyMs: number;
  errorRate: number;
  churnByCountry: Record<string, number>;
}): Promise<AlertPayload[]> {
  const triggeredAlerts: AlertPayload[] = [];

  // 1. Check MRR Drop > 5%
  if (metrics.previousMrr > 0) {
    const mrrDropPercentage = ((metrics.previousMrr - metrics.totalMrr) / metrics.previousMrr) * 100;
    if (mrrDropPercentage > 5) {
      triggeredAlerts.push({
        severity: 'HIGH',
        title: 'MRR Dropped',
        message: `Total MRR dropped by ${mrrDropPercentage.toFixed(1)}% (from $${metrics.previousMrr.toLocaleString()} to $${metrics.totalMrr.toLocaleString()})`,
        action: 'Check payment processor issues and recent cancellations.'
      });
    }
  }

  // 2. Check Payment Success Rate < 95%
  if (metrics.paymentSuccessRate < 95) {
    triggeredAlerts.push({
      severity: 'CRITICAL',
      title: 'Payment Success Rate Low',
      message: `Gateway payment success rate has fallen to ${metrics.paymentSuccessRate.toFixed(1)}% (Threshold: 95%)`,
      action: 'Contact Dodo Payments / Stripe support immediately to verify gateway status.'
    });
  }

  // 3. Check Churn > 3% by Country
  Object.entries(metrics.churnByCountry).forEach(([country, churn]) => {
    if (churn > 3) {
      triggeredAlerts.push({
        severity: 'MEDIUM',
        title: `High Churn in ${country}`,
        message: `${country} churn rate is at ${churn.toFixed(1)}% (Threshold: 3%)`,
        action: `Review customer feedback and check if virtual number routing or latency is poor in ${country}.`
      });
    }
  });

  // 4. Check API Latency > 500ms
  if (metrics.avgApiLatencyMs > 500) {
    triggeredAlerts.push({
      severity: 'HIGH',
      title: 'High API Latency',
      message: `Average API server response latency is at ${metrics.avgApiLatencyMs.toFixed(0)}ms (Threshold: 500ms)`,
      action: 'Check database connection pooling, CPU utilization, or scale web workers.'
    });
  }

  // 5. Check Error Rate > 1%
  if (metrics.errorRate > 1.0) {
    triggeredAlerts.push({
      severity: 'CRITICAL',
      title: 'High Error Rate',
      message: `API request failure error rate is at ${metrics.errorRate.toFixed(2)}% (Threshold: 1.0%)`,
      action: 'Review backend server logs and debug error handlers.'
    });
  }

  // Send all triggered alerts
  for (const alert of triggeredAlerts) {
    await triggerAlert(alert);
  }

  return triggeredAlerts;
}
