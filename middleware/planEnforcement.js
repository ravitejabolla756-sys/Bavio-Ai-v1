const db = require('../database/db');

/**
 * Middleware to check if client has remaining minutes before processing
 * Returns 403 if limit exceeded
 */
async function checkMinutesLimit(req, res, next) {
    try {
        const client = req.client;
        
        if (!client) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Refresh client data to get latest minutes
        const result = await db.query(
            'SELECT minutes_limit, minutes_used, plan FROM businesses WHERE id = $1',
            [client.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Business not found' });
        }

        const { minutes_limit, minutes_used, plan } = result.rows[0];
        const minutesRemaining = minutes_limit - minutes_used;

        if (minutes_remaining <= 0) {
            return res.status(403).json({
                error: 'Monthly minutes limit reached',
                plan: plan,
                minutesLimit: minutes_limit,
                minutesUsed: minutes_used,
                upgradeUrl: '/billing/subscribe',
                message: `You've used all ${minutes_limit} minutes in your ${plan} plan. Upgrade to continue.`
            });
        }

        // Attach minutes info to request for later use
        req.minutesInfo = {
            limit: minutes_limit,
            used: minutes_used,
            remaining: minutes_remaining,
            plan: plan
        };

        next();
    } catch (err) {
        console.error('checkMinutesLimit error:', err);
        res.status(500).json({ error: 'Failed to check plan limits' });
    }
}

/**
 * Increment minutes used after a call
 * @param {number} clientId - Client ID
 * @param {number} durationMinutes - Call duration in minutes
 */
async function incrementMinutesUsed(clientId, durationMinutes) {
    try {
        await db.query(
            'UPDATE businesses SET minutes_used = minutes_used + $1 WHERE id = $2',
            [Math.ceil(durationMinutes), clientId]
        );
        console.log(`Incremented minutes for client ${clientId}: +${durationMinutes}`);
    } catch (err) {
        console.error('incrementMinutesUsed error:', err);
    }
}

/**
 * Reset minutes_used at the start of billing cycle
 * Could be called by a cron job
 */
async function resetMonthlyMinutes() {
    try {
        await db.query(
            "UPDATE businesses SET minutes_used = 0 WHERE plan != 'free'"
        );
        console.log('Reset monthly minutes for all paid businesses');
    } catch (err) {
        console.error('resetMonthlyMinutes error:', err);
    }
}

/**
 * Middleware to track call duration and deduct minutes
 * Should be used after call completion
 */
function trackCallMinutes(durationSeconds) {
    return async (req, res, next) => {
        // This is a post-call middleware
        // Original response will be overridden to track minutes
        const originalJson = res.json.bind(res);
        
        res.json = function(data) {
            // If call was successful, increment minutes
            if (res.statusCode < 400 && req.client) {
                const durationMinutes = Math.ceil(durationSeconds / 60);
                incrementMinutesUsed(req.client.id, durationMinutes);
            }
            return originalJson(data);
        };
        
        next();
    };
}

module.exports = {
    checkMinutesLimit,
    incrementMinutesUsed,
    resetMonthlyMinutes,
    trackCallMinutes
};
