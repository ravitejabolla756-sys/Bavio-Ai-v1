const express = require('express');
const router = express.Router();

// ─── Centralized launch country list ──────────────────────────────────────────
// Single source of truth for Bavio's launch countries.
// Used by: signup, onboarding, phone-number search, Twilio provisioning, validation.
// India is NOT included. Do not add countries without Twilio number availability confirmed.
const SUPPORTED_LAUNCH_COUNTRIES = [
  {
    isoCode: 'US',
    name: 'United States',
    dialCode: '+1',
    twilioCountryCode: 'US',
    enabled: true
  },
  {
    isoCode: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    twilioCountryCode: 'GB',
    enabled: true
  },
  {
    isoCode: 'AU',
    name: 'Australia',
    dialCode: '+61',
    twilioCountryCode: 'AU',
    enabled: true
  }
];

module.exports.SUPPORTED_LAUNCH_COUNTRIES = SUPPORTED_LAUNCH_COUNTRIES;

// ─── GET /telephony/supported-countries ───────────────────────────────────────
// Public endpoint — no authentication required.
// Returns the canonical list of Bavio launch countries.
// Response: { countries: [{ isoCode, name, dialCode, enabled }] }
router.get('/supported-countries', (req, res) => {
  try {
    const enabledCountries = SUPPORTED_LAUNCH_COUNTRIES
      .filter(c => c.enabled === true)
      .map(({ isoCode, name, dialCode, enabled }) => ({ isoCode, name, dialCode, enabled }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({ countries: enabledCountries });
  } catch (err) {
    console.error('[TELEPHONY] Error loading supported countries:', err.message);
    res.status(500).json({ error: 'Failed to load supported countries' });
  }
});

module.exports = router;

