import request from 'supertest';
import { app } from '../../index';
import { query } from '../../db/db';
import { trackUserSignup, trackPaymentSuccess, trackCallCompleted, capturedEventsForTest } from '../analytics';
import { checkAlertsAndNotify, sentAlertsForTest } from '../alerts';
import { MetricsService } from '../metrics';

describe('Bavio Monitoring, Alerting & Analytics Integration Tests', () => {
  let createdAlertId = '';

  beforeAll(async () => {
    // Ensure daily_metrics and system_alerts are clean of test logs
    await query('DELETE FROM daily_metrics WHERE metric_date = CURRENT_DATE');
    await query("DELETE FROM system_alerts WHERE title LIKE 'TEST_%' OR title LIKE 'MRR Dropped%' OR title LIKE 'Payment Success%'");
  });

  afterAll(async () => {
    // Clean up test alerts
    await query("DELETE FROM system_alerts WHERE title LIKE 'TEST_%' OR title LIKE 'MRR Dropped%' OR title LIKE 'Payment Success%'");
    await query('DELETE FROM daily_metrics WHERE metric_date = CURRENT_DATE');
  });

  describe('1. PostHog Event Tracking', () => {
    it('should capture signup, payment, and call completed events', async () => {
      // Clear captured events
      capturedEventsForTest.length = 0;

      await trackUserSignup('user_123', 'IN', 'growth');
      await trackPaymentSuccess('user_123', 3999, 'INR');
      await trackCallCompleted('user_123', 120, 2.4);

      expect(capturedEventsForTest).toHaveLength(3);
      expect(capturedEventsForTest[0].event).toBe('user_signup');
      expect(capturedEventsForTest[0].properties.country).toBe('IN');
      
      expect(capturedEventsForTest[1].event).toBe('payment_success');
      expect(capturedEventsForTest[1].properties.amount).toBe(3999);

      expect(capturedEventsForTest[2].event).toBe('call_completed');
      expect(capturedEventsForTest[2].properties.duration).toBe(120);
    });
  });

  describe('2. Alerting Thresholds System', () => {
    it('should trigger alerts for breaches: MRR drop, low payment rate, and country churn', async () => {
      sentAlertsForTest.length = 0;

      // Trigger threshold evaluation
      const alerts = await checkAlertsAndNotify({
        totalMrr: 10000,
        previousMrr: 11000, // > 5% drop (9.09% drop)
        paymentSuccessRate: 92.5, // < 95% threshold
        avgApiLatencyMs: 80, // healthy
        errorRate: 0.1, // healthy
        churnByCountry: {
          US: 4.2, // > 3% churn threshold
          IN: 1.5, // healthy
        }
      });

      expect(alerts).toHaveLength(3);
      
      // Verify alerts have been written to the database
      const dbAlerts = await query(
        "SELECT id, severity, title, status FROM system_alerts WHERE status = 'active' ORDER BY triggered_at DESC"
      );
      expect(dbAlerts.rows.length).toBeGreaterThanOrEqual(3);
      
      const mrrAlert = dbAlerts.rows.find((r: any) => r.title.includes('MRR Dropped'));
      expect(mrrAlert).toBeDefined();
      expect(mrrAlert.severity).toBe('HIGH');
      
      const payAlert = dbAlerts.rows.find((r: any) => r.title.includes('Payment Success'));
      expect(payAlert).toBeDefined();
      expect(payAlert.severity).toBe('CRITICAL');

      createdAlertId = payAlert.id; // Save one to resolve later
    });
  });

  describe('3. Metrics Engine & Reports compilation', () => {
    it('should aggregate daily metrics and save them successfully', async () => {
      const summary = await MetricsService.calculateDailyMetrics();

      expect(summary.date).toBeDefined();
      expect(summary.total_customers).toBeGreaterThan(0);
      expect(summary.total_mrr_usd).toBeGreaterThan(0);
      expect(summary.payment_success_rate).toBeDefined();

      // Check record exists in database
      const dbMetrics = await query('SELECT * FROM daily_metrics WHERE metric_date = CURRENT_DATE');
      expect(dbMetrics.rows).toHaveLength(1);
      
      const row = dbMetrics.rows[0];
      const parsedCustomers = typeof row.customers_by_country === 'string' ? JSON.parse(row.customers_by_country) : row.customers_by_country;
      expect(parsedCustomers.IN).toBeGreaterThan(0);
    });

    it('should compile daily co-founder ASCII report with active alerts included', async () => {
      const reportText = await MetricsService.sendDailyCoFounderReport();

      expect(reportText).toContain('BAVIO AI - Daily Operations Report');
      expect(reportText).toContain('REVENUE:');
      expect(reportText).toContain('CUSTOMERS:');
      expect(reportText).toContain('ALERTS TRIGGERED:');
      expect(reportText).toContain('Payment Success Rate Low');
    });
  });

  describe('4. Analytics REST Endpoints (Express Router)', () => {
    it('should fetch analytics summary snapshots', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/summary');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].metric_date).toBeDefined();
    });

    it('should fetch active system alerts logs', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/alerts?status=active');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should allow manually triggering metrics aggregation', async () => {
      const res = await request(app)
        .post('/api/admin/analytics/trigger-daily-metrics');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.report_preview).toBeDefined();
    });

    it('should resolve an active system alert incident', async () => {
      const res = await request(app)
        .post(`/api/admin/analytics/resolve-alert/${createdAlertId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('resolved');
      expect(res.body.data.resolved_at).toBeDefined();

      // Check DB resolved
      const dbCheck = await query('SELECT status FROM system_alerts WHERE id = $1', [createdAlertId]);
      expect(dbCheck.rows[0].status).toBe('resolved');
    });
  });
});
