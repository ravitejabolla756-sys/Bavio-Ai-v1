const callService = require('../services/callService');

async function getCalls(req, res) {
    try {
        const businessId = req.user.id;
        const calls = await callService.getCallsForClient(businessId);
        res.status(200).json(calls);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getUsage(req, res) {
    try {
        const businessId = req.user.id;
        const usage = await callService.getUsageForClient(businessId);
        res.status(200).json(usage);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getCalls, getUsage };
