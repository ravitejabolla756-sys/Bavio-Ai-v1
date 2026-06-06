const numberService = require('../services/numberService');
const { assignPhoneNumber } = require('../services/phone/numberProvisioningService');
const db = require('../database/db');

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
    try {
        const businessId = req.user.id;
        
        // Retrieve business original phone number from businesses table
        const bizRes = await db.query('SELECT phone, country FROM businesses WHERE id = $1', [businessId]);
        if (bizRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Business not found' });
        }
        const userOriginalNumber = bizRes.rows[0].phone;
        const country = bizRes.rows[0].country || 'IN';

        // Default setupType to forwarding for pooled virtual numbers
        const setupType = 'forwarding';

        const result = await assignPhoneNumber(businessId, setupType, userOriginalNumber);
        
        // Response format expected by frontend PhoneSetup.tsx:
        // { success: true, data: { phone_number: ... } }
        res.status(200).json({
            success: true,
            data: {
                phone_number: result.bavioPhonenumber,
                provider: 'exotel',
                country: country,
                assigned_at: new Date().toISOString()
            }
        });
    } catch (err) {
        console.error('[ASSIGN NUMBER] Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = { buyNumber, linkNumber, getNumbers, assignNumber };

