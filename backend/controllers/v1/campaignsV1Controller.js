'use strict';

const db = require('../../database/db');
const campaignService = require('../../services/campaignService');
const webhookService = require('../../services/webhookService');

async function createCampaign(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { name, agent_id, objective, calling_hours, max_attempts, retry_delay, concurrency, from_number } = req.body;

  try {
    const campaign = await campaignService.createCampaign(businessId, {
      agentId: agent_id,
      name,
      objective,
      callingHours: calling_hours,
      maxAttempts: max_attempts,
      retryDelayMinutes: retry_delay,
      concurrency,
      fromNumber: from_number,
    });

    res.status(201).json({
      data: campaign,
      request_id: requestId,
    });
  } catch (err) {
    res.status(400).json({
      error: { code: 'invalid_request', message: err.message },
      request_id: requestId,
    });
  }
}

async function listCampaigns(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
  const cursor = req.query.cursor || null;

  try {
    const result = await campaignService.listCampaigns(businessId, limit, cursor);
    res.status(200).json({
      ...result,
      request_id: requestId,
    });
  } catch (err) {
    res.status(500).json({
      error: { code: 'internal_error', message: err.message },
      request_id: requestId,
    });
  }
}

async function getCampaignById(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { id } = req.params;

  try {
    const campaign = await campaignService.getCampaignDetails(id, businessId);
    if (!campaign) {
      return res.status(404).json({
        error: { code: 'not_found', message: 'Campaign not found' },
        request_id: requestId,
      });
    }

    res.status(200).json({
      data: campaign,
      request_id: requestId,
    });
  } catch (err) {
    res.status(500).json({
      error: { code: 'internal_error', message: err.message },
      request_id: requestId,
    });
  }
}

async function updateCampaign(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { id } = req.params;
  const { name, objective, calling_hours, max_attempts, retry_delay, concurrency } = req.body;

  try {
    const result = await db.query(
      `UPDATE campaigns
       SET name = COALESCE($1, name),
           objective = COALESCE($2, objective),
           calling_hours = COALESCE($3, calling_hours),
           max_attempts = COALESCE($4, max_attempts),
           retry_delay_minutes = COALESCE($5, retry_delay_minutes),
           concurrency = COALESCE($6, concurrency),
           updated_at = NOW()
       WHERE id = $7 AND business_id = $8
       RETURNING *`,
      [
        name || null,
        objective || null,
        calling_hours ? JSON.stringify(calling_hours) : null,
        max_attempts || null,
        retry_delay || null,
        concurrency || null,
        id,
        businessId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'not_found', message: 'Campaign not found' },
        request_id: requestId,
      });
    }

    res.status(200).json({
      data: result.rows[0],
      request_id: requestId,
    });
  } catch (err) {
    res.status(400).json({
      error: { code: 'invalid_request', message: err.message },
      request_id: requestId,
    });
  }
}

async function startCampaign(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { id } = req.params;

  try {
    const campaign = await campaignService.updateCampaignStatus(id, businessId, 'running');
    webhookService.dispatchWebhook(businessId, 'campaign.started', { campaign_id: id }).catch(() => {});

    res.status(200).json({
      data: campaign,
      request_id: requestId,
    });
  } catch (err) {
    res.status(400).json({
      error: { code: 'invalid_request', message: err.message },
      request_id: requestId,
    });
  }
}

async function pauseCampaign(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { id } = req.params;

  try {
    const campaign = await campaignService.updateCampaignStatus(id, businessId, 'paused');
    webhookService.dispatchWebhook(businessId, 'campaign.paused', { campaign_id: id }).catch(() => {});

    res.status(200).json({
      data: campaign,
      request_id: requestId,
    });
  } catch (err) {
    res.status(400).json({
      error: { code: 'invalid_request', message: err.message },
      request_id: requestId,
    });
  }
}

async function resumeCampaign(req, res) {
  return startCampaign(req, res);
}

async function cancelCampaign(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { id } = req.params;

  try {
    const campaign = await campaignService.updateCampaignStatus(id, businessId, 'cancelled');
    res.status(200).json({
      data: campaign,
      request_id: requestId,
    });
  } catch (err) {
    res.status(400).json({
      error: { code: 'invalid_request', message: err.message },
      request_id: requestId,
    });
  }
}

async function addContacts(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { id } = req.params;
  const contactsPayload = Array.isArray(req.body) ? req.body : req.body.contacts;

  if (!Array.isArray(contactsPayload) || contactsPayload.length === 0) {
    return res.status(400).json({
      error: { code: 'invalid_request', message: 'Contacts array is required' },
      request_id: requestId,
    });
  }

  try {
    const stats = await campaignService.parseAndImportContacts(id, businessId, contactsPayload);
    res.status(200).json({
      data: stats,
      request_id: requestId,
    });
  } catch (err) {
    res.status(500).json({
      error: { code: 'internal_error', message: err.message },
      request_id: requestId,
    });
  }
}

async function listContacts(req, res) {
  const businessId = req.business_id || req.user.id;
  const requestId = req.requestId || `req_${Date.now()}`;
  const { id } = req.params;
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
  const cursor = req.query.cursor || null;

  try {
    let query = `SELECT * FROM campaign_contacts WHERE campaign_id = $1 AND business_id = $2`;
    const params = [id, businessId];

    if (cursor) {
      query += ` AND created_at < $3`;
      params.push(cursor);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit + 1);

    const result = await db.query(query, params);
    const hasMore = result.rows.length > limit;
    const data = hasMore ? result.rows.slice(0, limit) : result.rows;

    res.status(200).json({
      data,
      pagination: {
        next_cursor: hasMore ? data[data.length - 1].created_at : null,
        has_more: hasMore,
      },
      request_id: requestId,
    });
  } catch (err) {
    res.status(500).json({
      error: { code: 'internal_error', message: err.message },
      request_id: requestId,
    });
  }
}

module.exports = {
  createCampaign,
  listCampaigns,
  getCampaignById,
  updateCampaign,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  addContacts,
  listContacts,
};
