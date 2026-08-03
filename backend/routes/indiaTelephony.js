'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// Feature Flag Middleware: blocks access if INDIA_TELEPHONY_ENABLED is not explicitly true
function requireIndiaTelephonyEnabled(req, res, next) {
  if (process.env.INDIA_TELEPHONY_ENABLED === 'true') {
    return next();
  }
  return res.status(403).json({
    error: 'Feature Disabled',
    message: 'Indian telephony self-service provisioning is currently disabled. Please contact sales to request access.'
  });
}

// 1. Submit KYC documents
router.post('/kyc', requireAuth, requireIndiaTelephonyEnabled, async (req, res) => {
  try {
    const businessId = req.businessId || req.body.businessId;
    const { documentUrls } = req.body;

    if (!businessId) {
      return res.status(400).json({ error: 'Missing business identifier' });
    }
    if (!documentUrls || !Array.isArray(documentUrls) || documentUrls.length === 0) {
      return res.status(400).json({ error: 'At least one document URL is required for compliance verification' });
    }

    const result = await db.query(
      `INSERT INTO india_kyc_applications (business_id, kyc_status, document_urls, updated_at)
       VALUES ($1, 'UNDER_REVIEW', $2, NOW())
       ON CONFLICT (business_id) DO UPDATE 
       SET kyc_status = 'UNDER_REVIEW', document_urls = EXCLUDED.document_urls, updated_at = NOW()
       RETURNING *`,
      [businessId, documentUrls]
    );

    return res.status(200).json({
      message: 'KYC application submitted successfully and is currently under review.',
      application: result.rows[0]
    });

  } catch (err) {
    console.error('[IndiaTelephonyRoute] Submit KYC error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// 2. View KYC Status
router.get('/kyc', requireAuth, requireIndiaTelephonyEnabled, async (req, res) => {
  try {
    const businessId = req.businessId || req.query.businessId;
    if (!businessId) {
      return res.status(400).json({ error: 'Missing business identifier' });
    }

    const result = await db.query(
      'SELECT * FROM india_kyc_applications WHERE business_id = $1',
      [businessId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ kyc_status: 'NOT_STARTED', document_urls: [] });
    }

    return res.status(200).json(result.rows[0]);

  } catch (err) {
    console.error('[IndiaTelephonyRoute] Get KYC error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// 3. Admin review endpoint (only accessible with admin override)
router.post('/admin/kyc/:id/review', requireAuth, async (req, res) => {
  try {
    // Basic admin role check
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'developer');
    if (!isAdmin) {
      // For security, reject non-admins
      return res.status(403).json({ error: 'Unauthorized admin route' });
    }

    const { id } = req.params;
    const { kyc_status, admin_notes, rejection_reason } = req.body;

    const allowedStatuses = ['DOCUMENTS_REQUIRED', 'UNDER_REVIEW', 'APPROVED', 'PROVISIONING', 'ACTIVE', 'REJECTED'];
    if (!allowedStatuses.includes(kyc_status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    const result = await db.query(
      `UPDATE india_kyc_applications
       SET kyc_status = $1, admin_notes = $2, rejection_reason = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [kyc_status, admin_notes || null, rejection_reason || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'KYC application not found' });
    }

    return res.status(200).json({
      message: 'KYC application status updated successfully.',
      application: result.rows[0]
    });

  } catch (err) {
    console.error('[IndiaTelephonyRoute] Admin review error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

module.exports = router;
