/**
 * phoneSetupController.js
 * ─────────────────────────────────────────────────────────────────────
 * Handles phone number setup for Bavio AI businesses.
 *
 * Routes:
 *   POST /phone/setup                → setupPhoneNumber
 *   GET  /phone/info                 → getPhoneInfo
 *   POST /phone/confirm-forwarding   → confirmForwarding
 *   GET  /phone/test-instructions    → getTestInstructions
 */

const { supabase } = require('../database/db');
const {
  assignPhoneNumber,
  confirmForwardingActivated,
  getBusinessNumberInfo,
  normalizePhoneNumber
} = require('../services/phone/numberProvisioningService');

// ── POST /phone/setup ─────────────────────────────────────────────────
async function setupPhoneNumber(req, res) {
  try {
    const businessId = req.user.id;
    const { setupType, userOriginalNumber } = req.body;

    if (!setupType || !['forwarding', 'dedicated'].includes(setupType)) {
      return res.status(400).json({
        success: false,
        error: 'setupType must be forwarding or dedicated'
      });
    }

    if (setupType === 'forwarding') {
      if (!userOriginalNumber) {
        return res.status(400).json({
          success: false,
          error: 'userOriginalNumber is required for forwarding setup'
        });
      }
      const normalized = normalizePhoneNumber(userOriginalNumber);
      if (!normalized) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number. Use: 9876543210 or +91 9876543210'
        });
      }

      // Check if number taken by another business
      const { data: taken } = await supabase
        .from('businesses')
        .select('id')
        .eq('original_phone_number', normalized)
        .neq('id', businessId)
        .maybeSingle();

      if (taken) {
        return res.status(409).json({
          success: false,
          error: 'This number is already registered with another Bavio account'
        });
      }
    }

    // Check if already set up
    const existing = await getBusinessNumberInfo(businessId);
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Phone number already configured',
        data: existing
      });
    }

    const result = await assignPhoneNumber(
      businessId,
      setupType,
      userOriginalNumber || null
    );

    return res.status(201).json({
      success: true,
      message: setupType === 'forwarding'
        ? 'Forwarding number assigned. Activate call forwarding on your phone.'
        : 'Your Bavio number is ready.',
      data: result
    });
  } catch (err) {
    console.error('[PHONE SETUP] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── GET /phone/info ───────────────────────────────────────────────────
async function getPhoneInfo(req, res) {
  try {
    const info = await getBusinessNumberInfo(req.user.id);
    if (!info) {
      return res.status(404).json({
        success: false,
        error: 'No phone number configured yet'
      });
    }
    return res.status(200).json({ success: true, data: info });
  } catch (err) {
    console.error('[PHONE INFO] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── POST /phone/confirm-forwarding ────────────────────────────────────
async function confirmForwarding(req, res) {
  try {
    await confirmForwardingActivated(req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Forwarding confirmed. Your Bavio AI is ready!'
    });
  } catch (err) {
    console.error('[PHONE CONFIRM] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── GET /phone/test-instructions ──────────────────────────────────────
async function getTestInstructions(req, res) {
  try {
    const info = await getBusinessNumberInfo(req.user.id);
    if (!info) {
      return res.status(404).json({
        success: false,
        error: 'No phone setup found'
      });
    }

    let instructions;
    if (info.setupType === 'forwarding') {
      instructions = {
        step1: 'Open your phone dialer app.',
        step2: `Dial this code and press call: ${info.forwardingCodes?.conditional || info.forwardingCode}`,
        step3: 'You will hear "Call forwarding activated".',
        step4: `Call ${info.userOriginalNumber} from another phone.`,
        step5: 'Let it ring 20 seconds. Bavio AI answers in Hindi.',
        cancelCode: info.forwardingCodes?.cancel || '#67#',
        note: 'Works on Airtel, Jio, Vi, and BSNL.'
      };
    } else {
      instructions = {
        step1: `Your Bavio number: ${info.phoneNumber}`,
        step2: 'Call this number to test.',
        step3: 'Bavio AI answers immediately.',
        step4: 'Share this number with customers.'
      };
    }

    return res.status(200).json({
      success: true,
      data: { setupType: info.setupType, instructions }
    });
  } catch (err) {
    console.error('[PHONE TEST] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  setupPhoneNumber,
  getPhoneInfo,
  confirmForwarding,
  getTestInstructions
};
