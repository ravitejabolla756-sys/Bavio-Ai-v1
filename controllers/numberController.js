const numberService = require('../services/numberService');

async function buyNumber(req, res) {
    try {
        const businessId = req.user.id;
        const { country, assistant_id } = req.body;
        if (!country) return res.status(400).json({ error: 'country is required' });
        const record = await numberService.buyAndSaveNumber({ business_id: businessId, country, assistant_id });
        res.status(201).json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function linkNumber(req, res) {
    try {
        const { phone_number_id, assistant_id } = req.body;
        const businessId = req.user.id;
        if (!phone_number_id || !assistant_id) return res.status(400).json({ error: 'phone_number_id and assistant_id are required' });
        const record = await numberService.linkNumberToAssistant({ phone_number_id, assistant_id, business_id: businessId });
        res.status(200).json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getNumbers(req, res) {
    try {
        const businessId = req.user.id;
        const numbers = await numberService.getNumbersForClient(businessId);
        res.status(200).json(numbers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function assignNumber(req, res) {
    const db = require('../database/db');
    const twilio = require('twilio');
    const fs = require('fs');
    const path = require('path');
    let purchasedPhoneNumber = null;
    let purchasedSid = null;
    let client = null;

    try {
        const businessId = req.user.id;
        const { country_code, assistant_id } = req.body;
        const country = (country_code || 'US').toUpperCase().trim();

        // Enforce included phone numbers limit
        const countRes = await db.query(
            "SELECT COUNT(*)::int as count FROM phone_numbers WHERE business_id = $1 AND status = 'active'",
            [businessId]
        );
        const activeCount = countRes.rows[0].count;

        const bizRes = await db.query(
            "SELECT included_phone_numbers FROM businesses WHERE id = $1",
            [businessId]
        );
        const includedLimit = bizRes.rows[0]?.included_phone_numbers || 1;

        if (activeCount >= includedLimit) {
            return res.status(403).json({
                error: 'limit_reached',
                message: `You have reached the maximum number of virtual phone numbers included in your plan (${includedLimit} number). Please contact support to request additional numbers at $10/month.`
            });
        }

        // 1. Validate country against supported countries list
        let countries = [];
        try {
            const countriesPath = path.join(__dirname, '..', 'config', 'supported-countries.json');
            countries = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));
        } catch (err) {
            console.error('[NUMBERS] Failed to load supported-countries config:', err.message);
            return res.status(500).json({ error: 'Failed to load country configuration' });
        }

        const countryConfig = countries.find(c => c.iso2 === country && c.enabled === true);
        if (!countryConfig) {
            return res.status(400).json({ 
                error: `Bavio does not support provisioning virtual numbers for country: ${country}` 
            });
        }

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        const isPlaceholder = !accountSid || !authToken || 
                              accountSid.includes('your_') || 
                              authToken.includes('your_');

        if (isPlaceholder || process.env.NODE_ENV !== 'production') {
            if (process.env.NODE_ENV === 'production') {
                return res.status(400).json({ error: 'Twilio credentials are not configured in production.' });
            }
            // In non-production, allow fallback mock number assignment
            console.log(`[TWILIO] Sandbox mock assignment for business ${businessId}`);
            const mockNum = '+1888' + Math.floor(1000000 + Math.random() * 9000000);
            
            // Uniqueness check for mock
            const checkRes = await db.query('SELECT id FROM phone_numbers WHERE number = $1 AND status = \'active\'', [mockNum]);
            if (checkRes.rows.length > 0) {
                return res.status(409).json({ error: 'Mock number already exists. Retry.' });
            }

            const record = await db.query(
                `INSERT INTO phone_numbers 
                 (business_id, client_id, assistant_id, number, phone_number, provider, status, country_code, twilio_sid, is_active, type)
                 VALUES ($1, $1, $2, $3, $3, 'twilio', 'active', $4, 'PN_mock_sid', true, 'dedicated')
                 RETURNING *`,
                [businessId, assistant_id || null, mockNum, country]
            );

            // Update business
            await db.query(
                'UPDATE businesses SET twilio_number = $1, twilio_number_sid = $2 WHERE id = $3',
                [mockNum, 'PN_mock_sid', businessId]
            );

            return res.status(200).json({
                success: true,
                data: {
                    phone_number: mockNum,
                    record: record.rows[0]
                }
            });
        }

        // Live Twilio purchase logic
        client = twilio(accountSid, authToken);

        // 1. Search available numbers
        const available = await client.availablePhoneNumbers(country).local.list({ limit: 1 });
        if (!available || available.length === 0) {
            return res.status(404).json({ 
                error: 'No Bavio phone numbers are currently available in this country. Please try again later or choose another supported country.' 
            });
        }

        purchasedPhoneNumber = available[0].phoneNumber;

        // 2. Buy/provision the phone number with webhook config
        const voiceUrl = process.env.PUBLIC_API_BASE_URL + '/calls/twilio';
        const statusCallbackUrl = process.env.PUBLIC_API_BASE_URL + '/calls/twilio/status';
        
        console.log(`[TWILIO] Purchasing number ${purchasedPhoneNumber} for business ${businessId}...`);
        
        const incoming = await client.incomingPhoneNumbers.create({
            phoneNumber: purchasedPhoneNumber,
            friendlyName: `Bavio AI - ${businessId.substring(0, 8)}`,
            voiceUrl: voiceUrl,
            voiceMethod: 'POST',
            statusCallback: statusCallbackUrl,
            statusCallbackMethod: 'POST'
        });

        purchasedSid = incoming.sid;

        // 3. Post-provisioning verification: Fetch and confirm settings match
        const fetchedNum = await client.incomingPhoneNumbers(purchasedSid).fetch();
        const matches = fetchedNum.phoneNumber === purchasedPhoneNumber &&
                        fetchedNum.voiceUrl === voiceUrl &&
                        fetchedNum.voiceMethod === 'POST' &&
                        fetchedNum.statusCallback === statusCallbackUrl &&
                        fetchedNum.statusCallbackMethod === 'POST';

        if (!matches) {
            console.error(`[TWILIO VERIFY] Provisioned settings mismatch for SID: ${purchasedSid}`);
            throw new Error('Twilio provisioning configuration verification failed');
        }

        // 4. Save to database
        const record = await db.query(
            `INSERT INTO phone_numbers 
             (business_id, client_id, assistant_id, number, phone_number, provider, status, country_code, twilio_sid, is_active, type, webhook_url)
             VALUES ($1, $1, $2, $3, $3, 'twilio', 'active', $4, $5, true, 'dedicated', $6)
             RETURNING *`,
            [businessId, assistant_id || null, purchasedPhoneNumber, country, purchasedSid, voiceUrl]
        );

        // 5. Update the business association
        await db.query(
            'UPDATE businesses SET twilio_number = $1, twilio_number_sid = $2 WHERE id = $3',
            [purchasedPhoneNumber, purchasedSid, businessId]
        );

        return res.status(200).json({
            success: true,
            data: {
                phone_number: purchasedPhoneNumber,
                record: record.rows[0]
            }
        });

    } catch (err) {
        console.error('assignNumber error:', err);

        // Fail-safe cleanup: release Twilio number if database assignment fails
        if (purchasedSid && client) {
            console.warn(`[TWILIO CLEANUP] Database insert failed after purchase. Releasing number SID: ${purchasedSid}`);
            try {
                await client.incomingPhoneNumbers(purchasedSid).remove();
                console.log(`[TWILIO CLEANUP] Successfully released number SID: ${purchasedSid}`);
            } catch (cleanErr) {
                console.error(`[TWILIO CLEANUP] Failed to release number SID: ${purchasedSid}:`, cleanErr.message);
            }
        }

        return res.status(500).json({
            error: 'provisioning_failed',
            message: err.message
        });
    }
}

async function verifyForwarding(req, res) {
    try {
        const businessId = req.user.id;
        console.log(`[NUMBERS] Verifying forwarding status for business ${businessId}`);
        
        // Find if they have an active number assigned
        const result = await db.query(
            'SELECT id, number FROM phone_numbers WHERE business_id = $1 AND status = \'active\' LIMIT 1',
            [businessId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                status: 'pending',
                message: 'No active phone number assigned to this business.'
            });
        }
        
        res.status(200).json({
            success: true,
            status: 'verified',
            message: 'Forwarding verified successfully.'
        });
    } catch (err) {
        console.error('verifyForwarding error:', err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = { buyNumber, linkNumber, getNumbers, assignNumber, verifyForwarding };
