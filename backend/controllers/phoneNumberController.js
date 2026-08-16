const phoneNumberService = require('../services/twilioPhoneNumberService');

/**
 * 1. GET ALL SUPPORTED / ELIGIBLE COUNTRIES
 */
async function getCountries(req, res) {
  try {
    const countries = await phoneNumberService.getSupportedCountries();
    res.status(200).json({ success: true, countries });
  } catch (err) {
    console.error('[PHONE CONTROLLER] getCountries error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve country list' });
  }
}

/**
 * 2. GET AVAILABLE NUMBER TYPES FOR A COUNTRY
 */
async function getNumberTypes(req, res) {
  try {
    const { countryCode } = req.query;
    const types = await phoneNumberService.getNumberTypes(countryCode);
    res.status(200).json({ success: true, countryCode, types });
  } catch (err) {
    console.error('[PHONE CONTROLLER] getNumberTypes error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve number types' });
  }
}

/**
 * 3. GET REGULATORY REQUIREMENTS
 */
async function getRegulatoryRequirements(req, res) {
  try {
    const { countryCode, numberType } = req.query;
    if (!countryCode) {
      return res.status(400).json({ success: false, error: 'countryCode query parameter is required' });
    }
    const requirements = await phoneNumberService.getRegulatoryRequirements(countryCode, numberType);
    res.status(200).json({ success: true, ...requirements });
  } catch (err) {
    console.error('[PHONE CONTROLLER] getRegulatoryRequirements error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve regulatory requirements' });
  }
}

/**
 * 4. SEARCH AVAILABLE LIVE PHONE NUMBERS
 */
async function searchNumbers(req, res) {
  try {
    const {
      countryCode = 'US',
      type = 'local',
      voice = 'true',
      sms = 'false',
      mms = 'false',
      areaCode,
      contains,
      limit = '10',
    } = req.query;

    const result = await phoneNumberService.searchAvailableNumbers({
      countryCode,
      numberType: type,
      voice: voice === 'true' || voice === true,
      sms: sms === 'true' || sms === true,
      mms: mms === 'true' || mms === true,
      areaCode,
      contains,
      limit: parseInt(limit, 10) || 10,
    });

    res.status(200).json({
      success: true,
      countryCode: countryCode.toUpperCase(),
      numberType: type,
      numbers: result.numbers,
      notice: result.message,
    });
  } catch (err) {
    console.error('[PHONE CONTROLLER] searchNumbers error:', err.message);
    res.status(500).json({
      success: false,
      numbers: [],
      error: 'Unable to search carrier inventory. Please try again shortly.',
    });
  }
}

/**
 * 5. PROVISION / PURCHASE PHONE NUMBER
 */
async function provisionNumber(req, res) {
  try {
    const businessId = req.user.id;
    const {
      phoneNumber,
      countryCode = 'US',
      numberType = 'local',
      assistantId,
      regulatoryInfo,
    } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'phoneNumber is required for provisioning' });
    }

    const record = await phoneNumberService.provisionPhoneNumber({
      businessId,
      phoneNumber,
      countryCode,
      numberType,
      assistantId,
      regulatoryInfo,
    });

    res.status(201).json({
      success: true,
      message: `Successfully provisioned ${record.number}`,
      data: record,
    });
  } catch (err) {
    console.error('[PHONE CONTROLLER] provisionNumber error:', err.message);

    if (err.code === 'LIMIT_REACHED') {
      return res.status(403).json({
        success: false,
        error: 'limit_reached',
        message: err.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'provisioning_failed',
      message: err.message || 'Failed to provision phone number with carrier',
    });
  }
}

/**
 * 6. LIST PHONE NUMBERS FOR CLIENT / BUSINESS
 */
async function listNumbers(req, res) {
  try {
    const businessId = req.user?.id || req.params.client_id;
    if (!businessId) {
      return res.status(400).json({ success: false, error: 'Client identification required' });
    }
    const numbers = await phoneNumberService.listNumbers(businessId);
    res.status(200).json(numbers);
  } catch (err) {
    console.error('[PHONE CONTROLLER] listNumbers error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve phone numbers' });
  }
}

/**
 * 7. LINK ASSISTANT TO PHONE NUMBER
 */
async function linkNumber(req, res) {
  try {
    const businessId = req.user.id;
    const { phoneId, phone_number_id, assistantId, assistant_id } = req.body;
    const targetPhoneId = phoneId || phone_number_id;
    const targetAssistantId = assistantId || assistant_id;

    if (!targetPhoneId) {
      return res.status(400).json({ success: false, error: 'phoneId is required' });
    }

    const record = await phoneNumberService.linkAssistant(businessId, targetPhoneId, targetAssistantId);
    res.status(200).json({ success: true, data: record });
  } catch (err) {
    console.error('[PHONE CONTROLLER] linkNumber error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Failed to link phone number' });
  }
}

/**
 * 8. UNLINK ASSISTANT FROM PHONE NUMBER
 */
async function unlinkNumber(req, res) {
  try {
    const businessId = req.user.id;
    const { phoneId, phone_number_id } = req.body;
    const targetPhoneId = phoneId || phone_number_id || req.params.id;

    if (!targetPhoneId) {
      return res.status(400).json({ success: false, error: 'phoneId is required' });
    }

    const record = await phoneNumberService.linkAssistant(businessId, targetPhoneId, null);
    res.status(200).json({ success: true, data: record });
  } catch (err) {
    console.error('[PHONE CONTROLLER] unlinkNumber error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Failed to unlink phone number' });
  }
}

/**
 * 9. RELEASE PHONE NUMBER
 */
async function releaseNumber(req, res) {
  try {
    const businessId = req.user.id;
    const { phoneId, phone_number_id } = req.body;
    const targetPhoneId = phoneId || phone_number_id || req.params.id;

    if (!targetPhoneId) {
      return res.status(400).json({ success: false, error: 'phoneId is required' });
    }

    const result = await phoneNumberService.releasePhoneNumber(businessId, targetPhoneId);
    res.status(200).json(result);
  } catch (err) {
    console.error('[PHONE CONTROLLER] releaseNumber error:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Failed to release phone number' });
  }
}

module.exports = {
  getCountries,
  getNumberTypes,
  getRegulatoryRequirements,
  searchNumbers,
  provisionNumber,
  listNumbers,
  linkNumber,
  unlinkNumber,
  releaseNumber,
};
