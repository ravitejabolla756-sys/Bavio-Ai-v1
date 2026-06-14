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

module.exports = { buyNumber, linkNumber, getNumbers };
