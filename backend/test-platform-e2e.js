'use strict';

require('dotenv').config();
const db = require('./database/db');
const apiKeyService = require('./services/apiKeyService');
const webhookService = require('./services/webhookService');
const campaignService = require('./services/campaignService');
const outcomeExtractionService = require('./services/outcomeExtractionService');

async function runE2ETests() {
  console.log('\n======================================================');
  console.log('Bavio Developer Platform & Voice Engine E2E Test Suite');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  try {
    const fs = require('fs');
    const path = require('path');
    const migrationSql = fs.readFileSync(path.join(__dirname, 'sql/023_developer_platform_and_campaigns.sql'), 'utf8');
    await db.query(migrationSql);

    const phoneA = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
    const phoneB = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;

    // Setup test business
    const bizRes = await db.query(
      `INSERT INTO businesses (name, email, phone, password_hash, status)
       VALUES ('E2E Test Corp', 'e2e_${Date.now()}@bavio.test', $1, 'dummy_hash', 'active')
       RETURNING id, name, email`,
      [phoneA]
    );
    const bizA = bizRes.rows[0];
    assert(bizA && bizA.id, `Created Test Business A (${bizA.id})`);

    const bizResB = await db.query(
      `INSERT INTO businesses (name, email, phone, password_hash, status)
       VALUES ('Isolation Corp B', 'e2e_b_${Date.now()}@bavio.test', $1, 'dummy_hash', 'active')
       RETURNING id, name, email`,
      [phoneB]
    );
    const bizB = bizResB.rows[0];
    assert(bizB && bizB.id, `Created Test Business B (${bizB.id})`);

    // 1. API Key System
    console.log('\n--- 1. API Key Authentication ---');
    const newKey = await apiKeyService.createApiKey({
      businessId: bizA.id,
      name: 'Production Key A',
      environment: 'live',
    });
    assert(newKey.secret && newKey.secret.startsWith('bavio_live_'), 'Generated secret key starting with bavio_live_');
    assert(newKey.key_prefix === newKey.secret.slice(0, 16), 'Stored matching key prefix');

    const verified = await apiKeyService.verifyApiKey(newKey.secret);
    assert(verified && verified.businessId === bizA.id, 'Verified active API key and mapped to Business A');

    const invalidVerified = await apiKeyService.verifyApiKey('bavio_live_invalid_secret_key');
    assert(invalidVerified === null, 'Rejected invalid secret key');

    await apiKeyService.revokeApiKey(newKey.id, bizA.id);
    const revokedVerified = await apiKeyService.verifyApiKey(newKey.secret);
    assert(revokedVerified === null, 'Rejected revoked secret key');

    // 2. Webhooks & HMAC Signatures
    console.log('\n--- 2. Webhooks & HMAC Signature Security ---');
    const webhook = await webhookService.registerWebhook(bizA.id, 'https://example.com/webhook/test', ['call.completed']);
    assert(webhook && webhook.signing_secret.startsWith('whsec_'), 'Registered webhook with signing secret');

    const payloadStr = JSON.stringify({ event: 'test' });
    const sig = webhookService.computeSignature(payloadStr, webhook.signing_secret, 1700000000);
    assert(sig && sig.length === 64, 'Computed 64-char HMAC-SHA256 signature');

    assert(webhookService.isUrlSafe('https://api.external.com/webhooks') === true, 'Allowed external HTTPS webhook URL');
    assert(webhookService.isUrlSafe('http://localhost:3000/webhook') === false, 'Blocked localhost SSRF webhook URL');

    // 3. Campaign & CSV Contact System
    console.log('\n--- 3. Campaigns & CSV Contact Imports ---');
    const campaign = await campaignService.createCampaign(bizA.id, {
      name: 'Q3 Buyer Qualification',
      objective: 'Qualify 3BHK buyer budget',
      concurrency: 5,
    });
    assert(campaign && campaign.status === 'draft', 'Created campaign in draft status');

    const importRes = await campaignService.parseAndImportContacts(campaign.id, bizA.id, [
      { name: 'Rahul Sharma', phone: '+919876543210', budget: '80 Lakhs', city: 'Hyderabad' },
      { name: 'Priya Patel', phone: '+919812345678', budget: '60 Lakhs', city: 'Bangalore' },
      { name: 'Duplicate Rahul', phone: '+919876543210', budget: '80 Lakhs' }, // Duplicate
      { name: 'Invalid Phone', phone: '123' }, // Invalid
    ]);

    assert(importRes.imported === 2, `Imported 2 valid contacts (got ${importRes.imported})`);
    assert(importRes.duplicates === 1, `Identified 1 duplicate contact (got ${importRes.duplicates})`);
    assert(importRes.invalid === 1, `Identified 1 invalid row (got ${importRes.invalid})`);

    const updatedCamp = await campaignService.updateCampaignStatus(campaign.id, bizA.id, 'running');
    assert(updatedCamp.status === 'running', 'Started campaign lifecycle (status = running)');

    // 4. Structured Call Outcome Extraction
    console.log('\n--- 4. Call Outcome Extraction Engine ---');
    const dummyCall = await db.query(
      `INSERT INTO calls (user_id, business_id, call_sid, country_code, provider, from_number, virtual_number, caller_number, status, transcript, created_at)
       VALUES ($1, $1, $2, 'IN', 'twilio', '+15005550006', '+15005550006', '+919876543210', 'completed', 'Caller: Namaste! Main 3BHK apartment dekh raha hoon Hyderabad Kondapur mein. Mera budget 80 Lakhs hai.', NOW())
       RETURNING id`,
      [bizA.id, `call_e2e_${Date.now()}`]
    );

    const callId = dummyCall.rows[0].id;
    const outcome = await outcomeExtractionService.extractCallOutcome(
      callId,
      bizA.id,
      'Caller: Namaste! Main 3BHK apartment dekh raha hoon Hyderabad Kondapur mein. Mera budget 80 Lakhs hai.',
      '+919876543210'
    );

    assert(outcome && outcome.call_id === callId, 'Extracted call outcome successfully');
    assert(outcome.interested === true || outcome.lead_score >= 50, 'Computed lead score & interest');

    // 5. Multi-Tenant Data Isolation Checks
    console.log('\n--- 5. Strict Multi-Tenant Isolation ---');
    const bizACampaigns = await campaignService.listCampaigns(bizA.id);
    const bizBCampaigns = await campaignService.listCampaigns(bizB.id);

    assert(bizACampaigns.data.length === 1, 'Business A retrieved only Business A campaigns (1)');
    assert(bizBCampaigns.data.length === 0, 'Business B cannot view Business A campaigns (0)');

  } catch (err) {
    console.error('CRITICAL TEST ERROR:', err);
  } finally {
    console.log('\n======================================================');
    console.log(`E2E Test Suite Results: ${passed}/${total} assertions passed`);
    console.log('======================================================\n');
    process.exit(passed === total ? 0 : 1);
  }
}

runE2ETests();
