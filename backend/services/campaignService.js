'use strict';

const db = require('../database/db');
const { parse } = require('path');

function normalizePhoneNumber(phone) {
  if (!phone) return null;
  const cleaned = phone.toString().replace(/[^\d+]/g, '');
  if (cleaned.length < 8) return null;
  if (!cleaned.startsWith('+')) {
    // Default to +91 if 10 digits starting with 6-9
    if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      return `+91${cleaned}`;
    }
    return `+${cleaned}`;
  }
  return cleaned;
}

async function createCampaign(businessId, { agentId, name, objective, callingHours, maxAttempts = 3, retryDelayMinutes = 30, concurrency = 5, fromNumber }) {
  if (!name) throw new Error('Campaign name is required');

  const result = await db.query(
    `INSERT INTO campaigns (business_id, agent_id, name, objective, calling_hours, max_attempts, retry_delay_minutes, concurrency, from_number, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
     RETURNING *`,
    [
      businessId,
      agentId || null,
      name,
      objective || '',
      callingHours ? JSON.stringify(callingHours) : JSON.stringify({ start: '09:00', end: '20:00', timezone: 'Asia/Kolkata' }),
      maxAttempts,
      retryDelayMinutes,
      concurrency,
      fromNumber || null,
    ]
  );
  return result.rows[0];
}

async function parseAndImportContacts(campaignId, businessId, contactsArray) {
  if (!Array.isArray(contactsArray) || contactsArray.length === 0) {
    return { total: 0, imported: 0, duplicates: 0, invalid: 0 };
  }

  let imported = 0;
  let duplicates = 0;
  let invalid = 0;

  const existingPhoneNumbers = new Set();
  const existingRes = await db.query(
    `SELECT phone_number FROM campaign_contacts WHERE campaign_id = $1`,
    [campaignId]
  );
  for (const row of existingRes.rows) {
    existingPhoneNumbers.add(row.phone_number);
  }

  for (const row of contactsArray) {
    const rawName = row.name || row.Name || 'Contact';
    const rawPhone = row.phone || row.phone_number || row.Phone || row.PhoneNumber;
    const phone = normalizePhoneNumber(rawPhone);

    if (!phone) {
      invalid++;
      continue;
    }

    if (existingPhoneNumbers.has(phone)) {
      duplicates++;
      continue;
    }

    // Extract extra columns as JSONB metadata
    const metadata = {};
    for (const key of Object.keys(row)) {
      if (!['name', 'Name', 'phone', 'phone_number', 'Phone', 'PhoneNumber', 'external_id'].includes(key)) {
        metadata[key] = row[key];
      }
    }

    const externalId = row.external_id || row.id || null;

    try {
      await db.query(
        `INSERT INTO campaign_contacts (campaign_id, business_id, name, phone_number, external_id, metadata, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
        [campaignId, businessId, rawName, phone, externalId, JSON.stringify(metadata)]
      );
      existingPhoneNumbers.add(phone);
      imported++;
    } catch (err) {
      if (err.code === '23505') {
        duplicates++;
      } else {
        invalid++;
      }
    }
  }

  return {
    total: contactsArray.length,
    imported,
    duplicates,
    invalid,
  };
}

async function updateCampaignStatus(campaignId, businessId, targetStatus) {
  const allowedStatuses = ['running', 'paused', 'completed', 'cancelled'];
  if (!allowedStatuses.includes(targetStatus)) {
    throw new Error(`Invalid target status: ${targetStatus}`);
  }

  const extraFields = targetStatus === 'running' ? ', started_at = COALESCE(started_at, NOW())' :
                      targetStatus === 'completed' || targetStatus === 'cancelled' ? ', completed_at = NOW()' : '';

  const result = await db.query(
    `UPDATE campaigns
     SET status = $1, updated_at = NOW() ${extraFields}
     WHERE id = $2 AND business_id = $3
     RETURNING *`,
    [targetStatus, campaignId, businessId]
  );

  if (result.rows.length === 0) throw new Error('Campaign not found');
  return result.rows[0];
}

async function getCampaignDetails(campaignId, businessId) {
  const campaignRes = await db.query(
    `SELECT * FROM campaigns WHERE id = $1 AND business_id = $2`,
    [campaignId, businessId]
  );
  if (campaignRes.rows.length === 0) return null;

  const campaign = campaignRes.rows[0];

  const statsRes = await db.query(
    `SELECT status, COUNT(*) as count
     FROM campaign_contacts
     WHERE campaign_id = $1
     GROUP BY status`,
    [campaignId]
  );

  const contactStats = {
    pending: 0,
    calling: 0,
    answered: 0,
    no_answer: 0,
    busy: 0,
    failed: 0,
    completed: 0,
    do_not_call: 0,
    total: 0,
  };

  for (const row of statsRes.rows) {
    contactStats[row.status] = parseInt(row.count, 10);
    contactStats.total += parseInt(row.count, 10);
  }

  return {
    ...campaign,
    contact_stats: contactStats,
  };
}

async function listCampaigns(businessId, limit = 50, cursor = null) {
  let query = `SELECT * FROM campaigns WHERE business_id = $1`;
  const params = [businessId];

  if (cursor) {
    query += ` AND created_at < $2`;
    params.push(cursor);
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit + 1);

  const result = await db.query(query, params);
  const hasMore = result.rows.length > limit;
  const data = hasMore ? result.rows.slice(0, limit) : result.rows;
  const nextCursor = hasMore ? data[data.length - 1].created_at : null;

  return {
    data,
    pagination: {
      next_cursor: nextCursor,
      has_more: hasMore,
    },
  };
}

module.exports = {
  createCampaign,
  parseAndImportContacts,
  updateCampaignStatus,
  getCampaignDetails,
  listCampaigns,
  normalizePhoneNumber,
};
