const callService = require('../services/callService');

async function getCalls(req, res) {
    try {
        const calls = await callService.getCallsForClient(req.params.client_id);
        res.status(200).json(calls);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getUsage(req, res) {
    try {
        const usage = await callService.getUsageForClient(req.params.client_id);
        res.status(200).json(usage);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getCalls, getUsage };
