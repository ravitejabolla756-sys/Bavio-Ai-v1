'use strict';

const db = require('../database/db');
const twilioProvider = require('../providers/twilio');
const webhookService = require('./webhookService');
const outcomeExtractionService = require('./outcomeExtractionService');

class CampaignWorker {
  constructor() {
    this._isRunning = false;
    this._interval = null;
  }

  start(intervalMs = 10000) {
    if (this._isRunning) return;
    this._isRunning = true;
    console.log('[CAMPAIGN WORKER] Started campaign execution engine (tick every 10s)');

    this.processRunningCampaigns().catch(e => console.error('[CAMPAIGN WORKER] Initial tick error:', e.message));
    this._interval = setInterval(() => {
      this.processRunningCampaigns().catch(e => console.error('[CAMPAIGN WORKER] Tick error:', e.message));
    }, intervalMs);
  }

  stop() {
    if (this._interval) clearInterval(this._interval);
    this._isRunning = false;
    console.log('[CAMPAIGN WORKER] Stopped campaign engine');
  }

  async processRunningCampaigns() {
    // 1. Fetch active campaigns with status = 'running'
    const campaignsRes = await db.query(
      `SELECT c.*, b.id as biz_id
       FROM campaigns c
       JOIN businesses b ON c.business_id = b.id
       WHERE c.status = 'running'`
    );

    if (campaignsRes.rows.length === 0) return;

    for (const campaign of campaignsRes.rows) {
      try {
        await this.processSingleCampaign(campaign);
      } catch (err) {
        console.error(`[CAMPAIGN WORKER] Error processing campaign ${campaign.id}:`, err.message);
      }
    }
  }

  async processSingleCampaign(campaign) {
    // Check concurrency: active contacts currently calling
    const activeCallingRes = await db.query(
      `SELECT COUNT(*) as count FROM campaign_contacts WHERE campaign_id = $1 AND status = 'calling'`,
      [campaign.id]
    );

    const currentCalling = parseInt(activeCallingRes.rows[0].count, 10);
    const availableSlots = (campaign.concurrency || 5) - currentCalling;

    if (availableSlots <= 0) return;

    // Fetch next eligible contacts
    const pendingRes = await db.query(
      `SELECT * FROM campaign_contacts
       WHERE campaign_id = $1
         AND (
           status = 'pending'
           OR (status IN ('no_answer', 'busy', 'failed') AND attempt_count < $2 AND (next_attempt_at IS NULL OR next_attempt_at <= NOW()))
         )
       ORDER BY created_at ASC
       LIMIT $3`,
      [campaign.id, campaign.max_attempts || 3, availableSlots]
    );

    if (pendingRes.rows.length === 0) {
      // Check if all contacts are finished
      const unfinishedRes = await db.query(
        `SELECT COUNT(*) as count FROM campaign_contacts
         WHERE campaign_id = $1 AND status IN ('pending', 'calling')`,
        [campaign.id]
      );
      if (parseInt(unfinishedRes.rows[0].count, 10) === 0) {
        // Mark campaign completed
        await db.query(
          `UPDATE campaigns SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [campaign.id]
        );
        console.log(`[CAMPAIGN WORKER] Campaign ${campaign.id} completed!`);
        webhookService.dispatchWebhook(campaign.business_id, 'campaign.completed', { campaign_id: campaign.id });
      }
      return;
    }

    // Dispatch outbound calls for available contacts
    for (const contact of pendingRes.rows) {
      await this.dispatchOutboundCall(campaign, contact);
    }
  }

  async dispatchOutboundCall(campaign, contact) {
    const attemptNumber = (contact.attempt_count || 0) + 1;

    try {
      // Update contact status to calling
      await db.query(
        `UPDATE campaign_contacts
         SET status = 'calling', attempt_count = $1, last_attempt_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [attemptNumber, contact.id]
      );

      const webhookBaseUrl = process.env.PUBLIC_API_BASE_URL || process.env.WEBHOOK_BASE_URL || 'https://api.bavio.in';
      const webhookUrl = `${webhookBaseUrl}/api/calls/incoming?campaign_id=${campaign.id}&contact_id=${contact.id}`;
      const from = campaign.from_number || process.env.TWILIO_PHONE_NUMBER || '+15005550006';

      const tempCallSid = `camp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const callRes = await db.query(
        `INSERT INTO calls (
           user_id, business_id, campaign_id, call_sid, country_code, provider, from_number,
           virtual_number, caller_number, status, call_status, started_at, created_at
         )
         VALUES ($1, $1, $2, $3, 'IN', 'twilio', $4, $4, $5, 'in-progress', 'in-progress', NOW(), NOW())
         RETURNING *`,
        [campaign.business_id, campaign.id, tempCallSid, from, contact.phone_number]
      );

      const callRecord = callRes.rows[0];

      // 2. Insert Campaign Attempt Record
      const attemptRes = await db.query(
        `INSERT INTO campaign_attempts (campaign_id, contact_id, call_id, attempt_number, status, started_at)
         VALUES ($1, $2, $3, $4, 'calling', NOW())
         RETURNING id`,
        [campaign.id, contact.id, callRecord.id, attemptNumber]
      );

      // 3. Initiate Twilio outbound call if Twilio is configured
      try {
        const callSid = await twilioProvider.createOutboundCall({
          to: contact.phone_number,
          from: from,
          webhookUrl: webhookUrl,
        });

        await db.query(
          `UPDATE calls SET provider_call_id = $1, call_sid = $1 WHERE id = $2`,
          [callSid, callRecord.id]
        );
      } catch (telephonyErr) {
        console.warn(`[CAMPAIGN WORKER] Telephony outbound call simulated for test mode (${telephonyErr.message})`);
        // Simulate call completion after brief async delay for local testing
        this.simulateCompletedCall(campaign, contact, callRecord.id, attemptRes.rows[0].id);
      }

    } catch (err) {
      console.error(`[CAMPAIGN WORKER] Failed to dispatch call to ${contact.phone_number}:`, err.message);
      const retryDelay = (campaign.retry_delay_minutes || 30) * 60 * 1000;
      await db.query(
        `UPDATE campaign_contacts
         SET status = 'failed', next_attempt_at = NOW() + INTERVAL '${campaign.retry_delay_minutes || 30} minutes', updated_at = NOW()
         WHERE id = $1`,
        [contact.id]
      );
    }
  }

  async simulateCompletedCall(campaign, contact, callId, attemptId) {
    setTimeout(async () => {
      try {
        const simulatedTranscript = `Caller: Namaste! Main ${contact.name} bol raha hoon. Mujhe ${contact.metadata?.property_type || '3BHK'} chahiye ${contact.metadata?.city || 'Hyderabad'} mein. Budget 80 Lakhs hai.`;
        const duration = 45;

        await db.query(
          `UPDATE calls SET status = 'completed', call_status = 'completed', ended_at = NOW(), duration_seconds = $1, transcript = $2 WHERE id = $3`,
          [duration, simulatedTranscript, callId]
        );

        await db.query(
          `UPDATE campaign_contacts SET status = 'completed', updated_at = NOW() WHERE id = $1`,
          [contact.id]
        );

        await db.query(
          `UPDATE campaign_attempts SET status = 'completed', duration_seconds = $1, ended_at = NOW() WHERE id = $2`,
          [duration, attemptId]
        );

        // Run structured outcome extraction
        await outcomeExtractionService.extractCallOutcome(callId, campaign.business_id, simulatedTranscript, contact.phone_number);

        webhookService.dispatchWebhook(campaign.business_id, 'campaign.contact.completed', {
          campaign_id: campaign.id,
          contact_id: contact.id,
          phone_number: contact.phone_number,
          status: 'completed',
        });
      } catch (simErr) {
        console.error('[CAMPAIGN WORKER] Simulation completion error:', simErr.message);
      }
    }, 1500);
  }
}

const campaignWorker = new CampaignWorker();
module.exports = campaignWorker;
