import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebhookController } from './controllers/webhook.controller';
import onboardingRouter from './api/routes/onboarding';
import pricingRouter from './api/routes/pricing';
import numbersRouter from './api/routes/numbers';
import exotelWebhookRouter from './api/webhooks/exotel';
import twilioWebhookRouter from './api/webhooks/twilio';
import paymentsWebhookRouter from './api/webhooks/payments';
import adminRouter from './api/routes/admin';
import analyticsRouter from './api/routes/analytics';
import { initMonitoringJobs } from './monitoring/metrics';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Mount API routes
app.use('/api', onboardingRouter);
app.use('/api', pricingRouter);
app.use('/api', numbersRouter);

// Mount Webhooks routes
app.use('/api/webhooks', exotelWebhookRouter);
app.use('/api/webhooks', twilioWebhookRouter);
app.use('/api/webhooks', paymentsWebhookRouter);

// Mount Admin routes
app.use('/api/admin', adminRouter);
app.use('/api/admin', analyticsRouter);

app.post('/webhooks/exotel/incoming', WebhookController.handleIncomingCall);
app.post('/webhooks/exotel/transcript', WebhookController.handleTranscript);
app.post('/webhooks/exotel/end', WebhookController.handleCallEnd);

// Export app for testing (e.g. supertest)
export { app };

if (process.env.NODE_ENV !== 'test') {
  initMonitoringJobs();
  app.listen(port, () => {
    console.log(`Bavio Telephony Server is running on port ${port}`);
  });
}
