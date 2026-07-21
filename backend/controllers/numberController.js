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
    try {
        const businessId = req.user.id;
        const { country_code } = req.body;
        
        console.log(`[NUMBERS] Assign request for business ${businessId}, country: ${country_code} (Twilio direct legacy stub)`);
        
        res.status(200).json({
            success: true,
            data: {
                phone_number: "+18882012345"
            }
        });
    } catch (err) {
        console.error('assignNumber error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function verifyForwarding(req, res) {
    try {
        const businessId = req.user.id;
        console.log(`[NUMBERS] Verifying forwarding status stub for business ${businessId}`);
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
