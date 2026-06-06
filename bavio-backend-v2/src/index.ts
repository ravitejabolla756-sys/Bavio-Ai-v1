import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebhookController } from './controllers/webhook.controller';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.post('/webhooks/exotel/incoming', WebhookController.handleIncomingCall);
app.post('/webhooks/exotel/transcript', WebhookController.handleTranscript);
app.post('/webhooks/exotel/end', WebhookController.handleCallEnd);

app.listen(port, () => {
  console.log(`Bavio Telephony Server is running on port ${port}`);
});
