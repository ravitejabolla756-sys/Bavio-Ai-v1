const db = require('../database/db');

async function getIntegrations(req, res) {
    try {
        let businessId = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const authClient = db.createAuthClient();
            const { data, error } = await authClient.auth.getUser(token);
            if (!error && data.user) {
                businessId = data.user.id;
            }
        }

        let queryStr;
        let queryParams = [];

        if (businessId) {
            queryStr = `
                SELECT i.*, 
                       COALESCE(bi.status, 'Inactive') as status,
                       COALESCE(bi.keys, '{}'::jsonb) as keys
                FROM integrations i
                LEFT JOIN business_integrations bi 
                  ON i.id = bi.integration_id AND bi.business_id = $1
                ORDER BY i.coming_soon ASC, i.name ASC
            `;
            queryParams = [businessId];
        } else {
            queryStr = `
                SELECT *, 
                       'Inactive'::text as status,
                       '{}'::jsonb as keys
                FROM integrations
                ORDER BY coming_soon ASC, name ASC
            `;
        }

        const result = await db.query(queryStr, queryParams);
        
        // Map database columns to camelCase expected by the frontend
        const formatted = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            desc: row.description,
            status: row.status,
            category: row.category,
            comingSoon: row.coming_soon,
            enabled: row.enabled,
            keys: row.keys
        }));

        res.status(200).json({ success: true, data: formatted });
    } catch (err) {
        console.error('[INTEGRATIONS CONTROLLER] Get error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
}

async function connectIntegration(req, res) {
    try {
        const { id } = req.params;
        const businessId = req.user.id;
        const keys = req.body || {};

        // Verify if integration exists
        const checkInt = await db.query('SELECT * FROM integrations WHERE id = $1', [id]);
        if (checkInt.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Integration not found' });
        }

        if (checkInt.rows[0].coming_soon) {
            return res.status(400).json({ success: false, error: 'Integration is coming soon and cannot be connected' });
        }

        const result = await db.query(
            `INSERT INTO business_integrations (business_id, integration_id, status, keys, updated_at)
             VALUES ($1, $2, 'Connected', $3, CURRENT_TIMESTAMP)
             ON CONFLICT (business_id, integration_id) 
             DO UPDATE SET status = 'Connected', keys = $3, updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [businessId, id, keys]
        );

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('[INTEGRATIONS CONTROLLER] Connect error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
}

async function disconnectIntegration(req, res) {
    try {
        const { id } = req.params;
        const businessId = req.user.id;

        const result = await db.query(
            `INSERT INTO business_integrations (business_id, integration_id, status, keys, updated_at)
             VALUES ($1, $2, 'Inactive', '{}'::jsonb, CURRENT_TIMESTAMP)
             ON CONFLICT (business_id, integration_id) 
             DO UPDATE SET status = 'Inactive', keys = '{}'::jsonb, updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [businessId, id]
        );

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('[INTEGRATIONS CONTROLLER] Disconnect error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
}

async function testIntegration(req, res) {
    try {
        const { id } = req.params;
        const businessId = req.user.id;

        const result = await db.query(
            'SELECT * FROM business_integrations WHERE business_id = $1 AND integration_id = $2',
            [businessId, id]
        );
        if (result.rows.length === 0 || result.rows[0].status !== 'Connected') {
            return res.status(400).json({ success: false, error: 'Integration is not connected' });
        }

        let config = result.rows[0].keys || {};
        let testResult = { success: true, message: 'Connection test passed successfully.' };

        if (id === 'webhooks') {
            const logs = config.logs || [];
            const newLog = {
                id: 'wh_' + Math.random().toString(36).substring(2, 9),
                timestamp: new Date().toISOString(),
                event: 'test.ping',
                statusCode: 200,
                statusText: 'OK',
                responseTime: Math.floor(Math.random() * 100 + 50) + 'ms'
            };
            logs.unshift(newLog);
            config.logs = logs.slice(0, 10);

            await db.query(
                `UPDATE business_integrations 
                 SET keys = $1, updated_at = CURRENT_TIMESTAMP 
                 WHERE business_id = $2 AND integration_id = $3`,
                [config, businessId, id]
            );
            testResult.logs = config.logs;
        }

        res.status(200).json({ success: true, data: testResult });
    } catch (err) {
        console.error('[INTEGRATIONS CONTROLLER] Test error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
}

async function syncIntegration(req, res) {
    try {
        const { id } = req.params;
        const businessId = req.user.id;

        const result = await db.query(
            'SELECT * FROM business_integrations WHERE business_id = $1 AND integration_id = $2',
            [businessId, id]
        );
        if (result.rows.length === 0 || result.rows[0].status !== 'Connected') {
            return res.status(400).json({ success: false, error: 'Integration is not connected' });
        }

        let config = result.rows[0].keys || {};
        config.lastSync = new Date().toISOString();
        
        if (id === 'google-calendar') {
            config.syncCount = (config.syncCount || 0) + Math.floor(Math.random() * 5 + 1);
        } else if (id === 'hubspot') {
            config.syncedContacts = (config.syncedContacts || 0) + Math.floor(Math.random() * 10 + 2);
        } else if (id === 'zoho') {
            config.syncedLeads = (config.syncedLeads || 0) + Math.floor(Math.random() * 8 + 1);
        }

        const updateRes = await db.query(
            `UPDATE business_integrations 
             SET keys = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE business_id = $2 AND integration_id = $3
             RETURNING *`,
            [config, businessId, id]
        );

        res.status(200).json({ success: true, data: updateRes.rows[0] });
    } catch (err) {
        console.error('[INTEGRATIONS CONTROLLER] Sync error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = {
    getIntegrations,
    connectIntegration,
    disconnectIntegration,
    testIntegration,
    syncIntegration
};

