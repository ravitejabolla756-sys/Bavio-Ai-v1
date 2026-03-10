const numberService = require('../services/numberService');

async function buyNumber(req, res) {
    try {
        const { client_id, country, assistant_id } = req.body;
        if (!client_id || !country) return res.status(400).json({ error: 'client_id and country are required' });
        const record = await numberService.buyAndSaveNumber({ client_id, country, assistant_id });
        res.status(201).json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function linkNumber(req, res) {
    try {
        const { phone_number_id, assistant_id } = req.body;
        if (!phone_number_id || !assistant_id) return res.status(400).json({ error: 'phone_number_id and assistant_id are required' });
        const record = await numberService.linkNumberToAssistant({ phone_number_id, assistant_id });
        res.status(200).json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getNumbers(req, res) {
    try {
        const numbers = await numberService.getNumbersForClient(req.params.client_id);
        res.status(200).json(numbers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { buyNumber, linkNumber, getNumbers };
