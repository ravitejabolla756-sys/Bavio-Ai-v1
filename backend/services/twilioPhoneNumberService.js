const db = require('../database/db');
const twilio = require('twilio');

// Global country reference mapping (dial codes, flags, names)
const WORLD_COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', dialCode: '+30' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', dialCode: '+972' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', dialCode: '+974' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', dialCode: '+965' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', dialCode: '+968' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', dialCode: '+973' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', dialCode: '+51' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', dialCode: '+40' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', dialCode: '+420' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', dialCode: '+36' },
];

let twilioClientInstance = null;
let countryCatalogCache = { data: null, timestamp: 0 };
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getTwilioClient() {
  if (twilioClientInstance) return twilioClientInstance;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (accountSid && authToken && !accountSid.includes('your_') && !authToken.includes('your_')) {
    twilioClientInstance = twilio(accountSid, authToken);
    return twilioClientInstance;
  }
  return null;
}

/**
 * 1. GET ALL BUSINESS & PHONE NUMBER COUNTRIES
 * Dynamically queries Twilio AvailablePhoneNumbers resource and enriches with global metadata.
 */
async function getSupportedCountries() {
  const now = Date.now();
  if (countryCatalogCache.data && now - countryCatalogCache.timestamp < CACHE_TTL_MS) {
    return countryCatalogCache.data;
  }

  const client = getTwilioClient();
  const twilioCountryMap = new Map();

  if (client) {
    try {
      const twilioCountries = await client.availablePhoneNumbers.list({ limit: 120 });
      for (const tc of twilioCountries) {
        const types = [];
        if (tc.subresourceUris) {
          if (tc.subresourceUris.local) types.push('local');
          if (tc.subresourceUris.toll_free) types.push('tollFree');
          if (tc.subresourceUris.mobile) types.push('mobile');
          if (tc.subresourceUris.national) types.push('national');
        }
        twilioCountryMap.set(tc.countryCode.toUpperCase(), {
          countryCode: tc.countryCode.toUpperCase(),
          country: tc.country,
          types: types.length > 0 ? types : ['local'],
        });
      }
    } catch (err) {
      console.warn('[PHONE SERVICE] Twilio country fetch failed, using built-in catalog:', err.message);
    }
  }

  // Combine world countries with Twilio availability
  const combined = WORLD_COUNTRIES.map((wc) => {
    const twilioInfo = twilioCountryMap.get(wc.code);
    const hasTwilioInventory = !!twilioInfo;
    const availableTypes = twilioInfo ? twilioInfo.types : (wc.code === 'US' || wc.code === 'CA' ? ['local', 'tollFree'] : ['local']);

    let notice = null;
    if (wc.code === 'IN') {
      notice = 'Indian phone-number availability depends on current regulatory and carrier requirements. You can use an eligible international Bavio number where available.';
    }

    return {
      code: wc.code,
      name: wc.name,
      flag: wc.flag,
      dialCode: wc.dialCode,
      hasDirectInventory: hasTwilioInventory,
      availableTypes,
      notice,
    };
  });

  // Ensure any other Twilio countries not in WORLD_COUNTRIES are also included
  for (const [code, info] of twilioCountryMap.entries()) {
    if (!combined.some((c) => c.code === code)) {
      combined.push({
        code: code,
        name: info.country || code,
        flag: '🌐',
        dialCode: '',
        hasDirectInventory: true,
        availableTypes: info.types,
        notice: null,
      });
    }
  }

  // Sort alphabetically
  combined.sort((a, b) => a.name.localeCompare(b.name));

  countryCatalogCache = { data: combined, timestamp: now };
  return combined;
}

/**
 * 2. GET AVAILABLE NUMBER TYPES FOR A COUNTRY
 */
async function getNumberTypes(countryCode) {
  const code = (countryCode || 'US').toUpperCase();
  const countries = await getSupportedCountries();
  const target = countries.find((c) => c.code === code);

  if (target && target.availableTypes && target.availableTypes.length > 0) {
    return target.availableTypes.map((t) => ({
      type: t,
      label: t === 'tollFree' ? 'Toll-Free' : t.charAt(0).toUpperCase() + t.slice(1),
      supported: true,
    }));
  }

  // Default fallback
  return [
    { type: 'local', label: 'Local', supported: true },
    { type: 'tollFree', label: 'Toll-Free', supported: code === 'US' || code === 'CA' },
  ];
}

/**
 * 3. GET REGULATORY REQUIREMENTS FOR COUNTRY & NUMBER TYPE
 */
async function getRegulatoryRequirements(countryCode, numberType = 'local') {
  const code = (countryCode || 'US').toUpperCase();
  const client = getTwilioClient();

  if (code === 'US' || code === 'CA') {
    return {
      required: false,
      friendlyName: `${code} Standard Provisioning`,
      requirements: [],
      message: 'No additional regulatory documents required for this number type.',
    };
  }

  if (code === 'IN') {
    return {
      required: true,
      friendlyName: 'India Regulatory Requirements',
      requirements: ['business_registration', 'local_address_proof', 'authorized_signatory'],
      message: 'Indian phone-number availability depends on current regulatory and carrier requirements. You can use an eligible international Bavio number where available.',
    };
  }

  if (client) {
    try {
      const normalizedType = numberType === 'tollFree' ? 'toll-free' : numberType.toLowerCase();
      const regulations = await client.numbers.v2.regulatoryCompliance.regulations.list({
        isoCountry: code,
        numberType: normalizedType,
        limit: 5,
      });

      if (regulations && regulations.length > 0) {
        const reg = regulations[0];
        const reqKeys = [];
        if (reg.requirements) {
          if (reg.requirements.end_user) reqKeys.push('end_user_info');
          if (reg.requirements.supporting_document) reqKeys.push('identity_document');
          if (reg.requirements.address) reqKeys.push('address_proof');
        }

        return {
          required: reqKeys.length > 0,
          friendlyName: reg.friendlyName || `${code} Compliance Regulation`,
          requirements: reqKeys,
          message: reqKeys.length > 0
            ? 'This number requires standard business compliance information before activation.'
            : 'Standard provisioning available.',
        };
      }
    } catch (err) {
      console.warn(`[REGULATORY CHECK] Twilio check failed for ${code}:`, err.message);
    }
  }

  return {
    required: false,
    friendlyName: `${code} Standard Provisioning`,
    requirements: [],
    message: 'Standard provisioning available.',
  };
}

/**
 * 4. SEARCH LIVE AVAILABLE PHONE NUMBERS FROM TWILIO
 */
async function searchAvailableNumbers({
  countryCode = 'US',
  numberType = 'local',
  voice = true,
  sms = false,
  mms = false,
  areaCode,
  contains,
  limit = 10,
}) {
  const code = countryCode.toUpperCase();
  const client = getTwilioClient();

  if (!client) {
    // Generate clean sandbox mock numbers for local development/testing without credentials
    console.log(`[PHONE SEARCH] Twilio client not initialized, returning sandbox numbers for ${code}`);
    return generateSandboxNumbers(code, numberType, limit);
  }

  try {
    const targetType = numberType === 'tollFree' ? 'tollFree' : numberType.toLowerCase();
    const countryHandler = client.availablePhoneNumbers(code);

    if (!countryHandler || !countryHandler[targetType]) {
      return {
        numbers: [],
        message: `Number type '${numberType}' is not currently available for ${code}. Please select another number type.`,
      };
    }

    const searchParams = { limit: Math.min(limit, 20) };
    if (voice) searchParams.voiceEnabled = true;
    if (sms) searchParams.smsEnabled = true;
    if (mms) searchParams.mmsEnabled = true;
    if (areaCode && targetType === 'local') searchParams.areaCode = areaCode;
    if (contains) searchParams.contains = contains;

    const available = await countryHandler[targetType].list(searchParams);

    if (!available || available.length === 0) {
      return {
        numbers: [],
        message: `No voice numbers are currently available in ${code} for this selection. Try another number type or country.`,
      };
    }

    const formatted = available.map((n) => ({
      phoneNumber: n.phoneNumber,
      friendlyName: n.friendlyName || n.phoneNumber,
      isoCountry: n.isoCountry || code,
      numberType: targetType,
      capabilities: {
        voice: n.capabilities ? !!n.capabilities.voice : true,
        sms: n.capabilities ? !!n.capabilities.SMS : false,
        mms: n.capabilities ? !!n.capabilities.MMS : false,
        inbound: true,
        outbound: true,
      },
      locality: n.locality || null,
      region: n.region || null,
      postalCode: n.postalCode || null,
      monthlyRate: '$2.00',
    }));

    return {
      numbers: formatted,
      message: null,
    };
  } catch (err) {
    console.error(`[PHONE SEARCH ERROR] Failed to query Twilio numbers for ${code}:`, err.message);

    if (err.status === 404 || err.message.includes('not found') || err.message.includes('not available')) {
      return {
        numbers: [],
        message: `No voice numbers are currently available for country code ${code}. Please select an eligible international Bavio number.`,
      };
    }

    // In non-production, return graceful sandbox numbers if Twilio API errors out
    if (process.env.NODE_ENV !== 'production') {
      return generateSandboxNumbers(code, numberType, limit);
    }

    return {
      numbers: [],
      message: 'Telephony inventory lookup temporarily unavailable. Please try again shortly.',
    };
  }
}

function generateSandboxNumbers(countryCode, numberType, limit = 5) {
  const prefix = countryCode === 'US' ? '+1888' : countryCode === 'GB' ? '+44800' : countryCode === 'CA' ? '+1800' : '+1888';
  const numbers = [];
  for (let i = 0; i < limit; i++) {
    const raw = prefix + Math.floor(1000000 + Math.random() * 9000000);
    numbers.push({
      phoneNumber: raw,
      friendlyName: raw,
      isoCountry: countryCode,
      numberType: numberType,
      capabilities: {
        voice: true,
        sms: true,
        mms: false,
        inbound: true,
        outbound: true,
      },
      locality: countryCode === 'US' ? 'Dallas' : 'London',
      region: countryCode === 'US' ? 'TX' : 'England',
      postalCode: '75001',
      monthlyRate: '$2.00',
    });
  }
  return { numbers, message: null };
}

/**
 * 5. PROVISION / PURCHASE PHONE NUMBER ON TWILIO AND SAVE TO DATABASE
 */
async function provisionPhoneNumber({
  businessId,
  phoneNumber,
  countryCode = 'US',
  numberType = 'local',
  assistantId = null,
  regulatoryInfo = null,
}) {
  if (!businessId) throw new Error('businessId is required for provisioning');
  if (!phoneNumber) throw new Error('phoneNumber is required for provisioning');

  const code = countryCode.toUpperCase();
  const client = getTwilioClient();

  // 1. Enforce plan virtual phone numbers limit
  const countRes = await db.query(
    "SELECT COUNT(*)::int as count FROM phone_numbers WHERE business_id = $1 AND status = 'active'",
    [businessId]
  );
  const activeCount = countRes.rows[0].count;

  const bizRes = await db.query(
    'SELECT included_phone_numbers, name FROM businesses WHERE id = $1',
    [businessId]
  );
  const includedLimit = bizRes.rows[0]?.included_phone_numbers || 1;

  if (activeCount >= includedLimit) {
    const error = new Error(`You have reached the maximum number of virtual phone numbers included in your plan (${includedLimit} number).`);
    error.code = 'LIMIT_REACHED';
    throw error;
  }

  // 2. Validate assistant if provided
  if (assistantId) {
    const astCheck = await db.query(
      'SELECT id, name FROM assistants WHERE id = $1 AND business_id = $2',
      [assistantId, businessId]
    );
    if (astCheck.rows.length === 0) {
      throw new Error('Selected AI Employee not found or unauthorized');
    }
  }

  let purchasedSid = null;
  let purchasedNumber = phoneNumber;
  const baseUrl = process.env.WEBHOOK_BASE_URL || 'https://api.bavio.in';
  const voiceUrl = `${baseUrl}/calls/twilio`;
  const statusCallbackUrl = `${baseUrl}/calls/twilio/status`;

  // 3. Purchase on Twilio if client is available
  if (client) {
    try {
      console.log(`[TWILIO PROVISION] Purchasing ${phoneNumber} for business ${businessId}...`);
      const incoming = await client.incomingPhoneNumbers.create({
        phoneNumber: phoneNumber,
        friendlyName: `Bavio AI - ${businessId.substring(0, 8)}`,
        voiceUrl: voiceUrl,
        voiceMethod: 'POST',
        statusCallback: statusCallbackUrl,
        statusCallbackMethod: 'POST',
      });

      purchasedSid = incoming.sid;
      purchasedNumber = incoming.phoneNumber || phoneNumber;
    } catch (twErr) {
      console.error('[TWILIO PROVISION ERROR]', twErr.message);

      // In non-production sandbox environment, fallback to simulated provisioning
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[SANDBOX FALLBACK] Simulating successful provisioning for ${phoneNumber}`);
        purchasedSid = 'PN_sandbox_' + Date.now();
      } else {
        throw new Error(`Carrier provisioning failed: ${twErr.message}`);
      }
    }
  } else {
    purchasedSid = 'PN_mock_' + Date.now();
  }

  try {
    // 4. Save to database
    const capabilities = { voice: true, sms: true, inbound: true, outbound: true };
    const insertRes = await db.query(
      `INSERT INTO phone_numbers 
       (business_id, client_id, assistant_id, number, phone_number, provider, status, country_code, phone_number_type, capabilities, regulatory_status, twilio_sid, is_active, type, webhook_url, price_monthly)
       VALUES ($1, $1, $2, $3, $3, 'twilio', 'active', $4, $5, $6, $7, $8, true, 'dedicated', $9, 2.00)
       RETURNING *`,
      [
        businessId,
        assistantId || null,
        purchasedNumber,
        code,
        numberType,
        JSON.stringify(capabilities),
        regulatoryInfo ? 'submitted' : 'none_required',
        purchasedSid,
        voiceUrl,
      ]
    );

    // 5. Update business primary twilio number
    await db.query(
      'UPDATE businesses SET twilio_number = $1, twilio_number_sid = $2 WHERE id = $3',
      [purchasedNumber, purchasedSid, businessId]
    );

    // 6. Fetch assistant name if linked
    let assistantName = null;
    if (assistantId) {
      const aRes = await db.query('SELECT name FROM assistants WHERE id = $1', [assistantId]);
      assistantName = aRes.rows[0]?.name || null;
    }

    return {
      ...insertRes.rows[0],
      assistant_name: assistantName,
    };
  } catch (dbErr) {
    console.error('[DATABASE PROVISION ERROR]', dbErr.message);

    // Fail-safe cleanup: release Twilio number if database insert failed
    if (purchasedSid && client && !purchasedSid.startsWith('PN_mock') && !purchasedSid.startsWith('PN_sandbox')) {
      try {
        await client.incomingPhoneNumbers(purchasedSid).remove();
        console.log(`[TWILIO CLEANUP] Successfully released number SID: ${purchasedSid}`);
      } catch (cleanErr) {
        console.error(`[TWILIO CLEANUP ERROR] Failed to release ${purchasedSid}:`, cleanErr.message);
      }
    }
    throw dbErr;
  }
}

/**
 * 6. LIST PHONE NUMBERS FOR BUSINESS
 */
async function listNumbers(businessId) {
  const result = await db.query(
    `SELECT pn.*, a.name AS assistant_name
     FROM phone_numbers pn
     LEFT JOIN assistants a ON pn.assistant_id = a.id
     WHERE pn.business_id = $1 AND pn.status != 'released'
     ORDER BY pn.created_at DESC`,
    [businessId]
  );
  return result.rows;
}

/**
 * 7. LINK / UNLINK ASSISTANT TO PHONE NUMBER
 */
async function linkAssistant(businessId, phoneId, assistantId) {
  if (assistantId) {
    const astResult = await db.query(
      'SELECT id, name FROM assistants WHERE id = $1 AND business_id = $2',
      [assistantId, businessId]
    );
    if (astResult.rows.length === 0) {
      throw new Error('Assistant not found or unauthorized');
    }
  }

  const result = await db.query(
    `UPDATE phone_numbers 
     SET assistant_id = $1 
     WHERE id = $2 AND business_id = $3 
     RETURNING *`,
    [assistantId || null, phoneId, businessId]
  );

  if (result.rows.length === 0) throw new Error('Phone number not found or unauthorized');

  let assistantName = null;
  if (assistantId) {
    const aRes = await db.query('SELECT name FROM assistants WHERE id = $1', [assistantId]);
    assistantName = aRes.rows[0]?.name || null;
  }

  return {
    ...result.rows[0],
    assistant_name: assistantName,
  };
}

/**
 * 8. RELEASE PHONE NUMBER
 */
async function releasePhoneNumber(businessId, phoneId) {
  const findRes = await db.query(
    'SELECT * FROM phone_numbers WHERE id = $1 AND business_id = $2',
    [phoneId, businessId]
  );

  if (findRes.rows.length === 0) {
    throw new Error('Phone number not found or unauthorized');
  }

  const num = findRes.rows[0];
  const client = getTwilioClient();

  if (client && num.twilio_sid && !num.twilio_sid.startsWith('PN_mock') && !num.twilio_sid.startsWith('PN_sandbox')) {
    try {
      await client.incomingPhoneNumbers(num.twilio_sid).remove();
      console.log(`[TWILIO RELEASE] Successfully released ${num.phone_number} (${num.twilio_sid})`);
    } catch (err) {
      console.warn(`[TWILIO RELEASE WARNING] Failed to release SID on Twilio:`, err.message);
    }
  }

  await db.query(
    "UPDATE phone_numbers SET status = 'released', is_active = false WHERE id = $1",
    [phoneId]
  );

  // If this was the primary twilio number on the business, clear it
  await db.query(
    'UPDATE businesses SET twilio_number = NULL, twilio_number_sid = NULL WHERE id = $1 AND twilio_number_sid = $2',
    [businessId, num.twilio_sid]
  );

  return { success: true, message: 'Phone number released successfully' };
}

module.exports = {
  getSupportedCountries,
  getNumberTypes,
  getRegulatoryRequirements,
  searchAvailableNumbers,
  provisionPhoneNumber,
  listNumbers,
  linkAssistant,
  releasePhoneNumber,
  WORLD_COUNTRIES,
};
