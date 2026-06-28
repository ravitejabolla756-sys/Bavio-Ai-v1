const express = require('express');
const router = express.Router();

// Comprehensive static mapping of country codes to name, flag emoji, and dial code
const countryMap = {
  US: { name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  CA: { name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  GB: { name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  IN: { name: 'India', flag: '🇮🇳', dialCode: '+91' },
  AU: { name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  NZ: { name: 'New Zealand', flag: '🇳🇿', dialCode: '+64' },
  SG: { name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  AE: { name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
  DE: { name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  FR: { name: 'France', flag: '🇫🇷', dialCode: '+33' },
  IE: { name: 'Ireland', flag: '🇮🇪', dialCode: '+353' },
  IT: { name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
  ES: { name: 'Spain', flag: '🇪🇸', dialCode: '+34' },
  NL: { name: 'Netherlands', flag: '🇳🇱', dialCode: '+31' },
  BE: { name: 'Belgium', flag: '🇧🇪', dialCode: '+32' },
  CH: { name: 'Switzerland', flag: '🇨🇭', dialCode: '+41' },
  AT: { name: 'Austria', flag: '🇦🇹', dialCode: '+43' },
  SE: { name: 'Sweden', flag: '🇸🇪', dialCode: '+46' },
  NO: { name: 'Norway', flag: '🇳🇴', dialCode: '+47' },
  DK: { name: 'Denmark', flag: '🇩🇰', dialCode: '+45' },
  FI: { name: 'Finland', flag: '🇫🇮', dialCode: '+358' },
  PL: { name: 'Poland', flag: '🇵🇱', dialCode: '+48' },
  PT: { name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
  GR: { name: 'Greece', flag: '🇬🇷', dialCode: '+30' },
  ZA: { name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
  MX: { name: 'Mexico', flag: '🇲🇽', dialCode: '+52' },
  BR: { name: 'Brazil', flag: '🇧🇷', dialCode: '+55' },
  AR: { name: 'Argentina', flag: '🇦🇷', dialCode: '+54' },
  CO: { name: 'Colombia', flag: '🇨🇴', dialCode: '+57' },
  CL: { name: 'Chile', flag: '🇨🇱', dialCode: '+56' },
  JP: { name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
  HK: { name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852' },
  ID: { name: 'Indonesia', flag: '🇮🇩', dialCode: '+62' },
  MY: { name: 'Malaysia', flag: '🇲🇾', dialCode: '+60' },
  TH: { name: 'Thailand', flag: '🇹🇭', dialCode: '+66' },
  PH: { name: 'Philippines', flag: '🇵🇭', dialCode: '+63' },
  KR: { name: 'South Korea', flag: '🇰🇷', dialCode: '+82' },
  IL: { name: 'Israel', flag: '🇮🇱', dialCode: '+972' },
  TR: { name: 'Turkey', flag: '🇹🇷', dialCode: '+90' },
  SA: { name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966' },
  QA: { name: 'Qatar', flag: '🇶🇦', dialCode: '+974' },
  KW: { name: 'Kuwait', flag: '🇰🇼', dialCode: '+965' },
  OM: { name: 'Oman', flag: '🇴🇲', dialCode: '+968' },
  BH: { name: 'Bahrain', flag: '🇧🇭', dialCode: '+973' },
  EG: { name: 'Egypt', flag: '🇪🇬', dialCode: '+20' },
  VN: { name: 'Vietnam', flag: '🇻🇳', dialCode: '+84' }
};

// Serve static country list — no Twilio API call (avoids network hang in dev)
router.get('/countries', (req, res) => {
  try {
    const result = Object.entries(countryMap)
      .map(([code, info]) => ({
        code,
        name: info.name,
        flag: info.flag,
        dialCode: info.dialCode
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json(result);
  } catch (err) {
    console.error('[PHONE] Failed to get countries:', err.message);
    res.status(500).json({ error: 'Failed to get countries: ' + err.message });
  }
});

module.exports = router;
