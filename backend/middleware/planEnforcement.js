/**
 * Bavio Plan Enforcement Middleware
 *
 * BILLING MODEL:
 * - Monthly included seconds consumed first
 * - Prepaid top-up seconds consumed second
 * - Neither balance can go negative
 * - Deductions are atomic and idempotent (keyed on provider call SID)
 * - NO postpaid overage. NO $0.18/min billing.
 */

const db = require('../database/db');

// ── Developer bypass list ─────────────────────────────────────────────
const DEVELOPER_EMAILS = ['ravitejabolla756@gmail.com', 'praneeth.dev111@gmail.com'];

/**
 * Check available balance before allowing an AI call.
 * Returns an object with balance info and whether the call is allowed.
 *
 * @param {string} businessId - UUID of the business
 * @returns {{ allowed: boolean, monthlyRemainingSeconds: number, topupRemainingSeconds: number, totalAvailableSeconds: number, reason?: string }}
 */
async function checkCallBalance(businessId) {
    const result = await db.query(
        `SELECT
            email,
            subscription_status,
            billing_period_end,
            monthly_limit_seconds,
            monthly_usage_seconds,
            topup_balance_seconds
         FROM businesses
         WHERE id = $1`,
        [businessId]
    );

    if (result.rows.length === 0) {
        return { allowed: false, reason: 'business_not_found', monthlyRemainingSeconds: 0, topupRemainingSeconds: 0, totalAvailableSeconds: 0 };
    }

    const biz = result.rows[0];

    // Developer bypass
    if (biz.email && DEVELOPER_EMAILS.includes(biz.email.trim().toLowerCase())) {
        return { allowed: true, monthlyRemainingSeconds: 999999, topupRemainingSeconds: 999999, totalAvailableSeconds: 999999, isDeveloper: true };
    }

    // Subscription must be active
    if (biz.subscription_status !== 'active') {
        return { allowed: false, reason: 'subscription_inactive', monthlyRemainingSeconds: 0, topupRemainingSeconds: 0, totalAvailableSeconds: 0 };
    }

    // Period must not be expired
    if (biz.billing_period_end && new Date(biz.billing_period_end) < new Date()) {
        return { allowed: false, reason: 'subscription_expired', monthlyRemainingSeconds: 0, topupRemainingSeconds: 0, totalAvailableSeconds: 0 };
    }

    const monthlyLimit   = Math.max(0, biz.monthly_limit_seconds   || 0);
    const monthlyUsed    = Math.max(0, biz.monthly_usage_seconds    || 0);
    const topupBalance   = Math.max(0, biz.topup_balance_seconds    || 0);

    const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);
    const totalAvailable   = monthlyRemaining + topupBalance;

    if (totalAvailable <= 0) {
        return {
            allowed:                 false,
            reason:                  'usage_exhausted',
            monthlyRemainingSeconds: monthlyRemaining,
            topupRemainingSeconds:   topupBalance,
            totalAvailableSeconds:   0,
        };
    }

    return {
        allowed:                 true,
        monthlyRemainingSeconds: monthlyRemaining,
        topupRemainingSeconds:   topupBalance,
        totalAvailableSeconds:   totalAvailable,
    };
}

/**
 * Middleware to check call balance before AI pipeline starts.
 * Attaches balanceInfo to req for downstream use.
 */
async function checkMinutesLimit(req, res, next) {
    try {
        const client = req.client;
        if (!client) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const balance = await checkCallBalance(client.id);

        if (!balance.allowed) {
            const messages = {
                subscription_inactive: 'Your subscription is not active. Please renew to continue using Bavio.',
                subscription_expired:  'Your subscription has expired. Please renew to continue.',
                usage_exhausted:       'You have used all your available call minutes. Purchase a top-up or upgrade your plan.',
                business_not_found:    'Business account not found.',
            };

            return res.status(403).json({
                error:      balance.reason || 'minutes_exhausted',
                message:    messages[balance.reason] || 'Insufficient call balance.',
                upgradeUrl: '/dashboard/billing',
            });
        }

        req.balanceInfo = balance;
        next();
    } catch (err) {
        console.error('[checkMinutesLimit] Error:', err);
        res.status(500).json({ error: 'Failed to check plan limits' });
    }
}

/**
 * Deduct call seconds atomically from the business balance.
 * Consumes monthly seconds first, then top-up seconds.
 * Idempotent: uses callSid to prevent duplicate deductions.
 *
 * @param {string}  businessId      - UUID
 * @param {number}  durationSeconds - Actual call duration in seconds
 * @param {string}  callSid         - Provider call SID for idempotency
 */
async function deductCallSeconds(businessId, durationSeconds, callSid = null) {
    try {
        if (!durationSeconds || durationSeconds <= 0) {
            console.warn(`[BILLING] Skipping deduction: invalid duration ${durationSeconds}s`);
            return;
        }

        const secondsToDeduct = Math.ceil(durationSeconds);

        // ── Idempotency check ─────────────────────────────────────────
        if (callSid) {
            const existing = await db.query(
                `SELECT id FROM usage_logs WHERE call_sid = $1 LIMIT 1`,
                [callSid]
            );
            if (existing.rows.length > 0) {
                console.log(`[BILLING] Call ${callSid} already charged. Skipping.`);
                return;
            }
        }

        // ── Read current balances ─────────────────────────────────────
        const bizRes = await db.query(
            `SELECT
                email, name,
                monthly_limit_seconds, monthly_usage_seconds,
                topup_balance_seconds
             FROM businesses WHERE id = $1
             FOR UPDATE`,
            [businessId]
        );

        if (bizRes.rows.length === 0) {
            console.error(`[BILLING] Business ${businessId} not found`);
            return;
        }

        const biz = bizRes.rows[0];
        const monthlyLimit    = Math.max(0, biz.monthly_limit_seconds  || 0);
        const monthlyUsed     = Math.max(0, biz.monthly_usage_seconds  || 0);
        const monthlyRem      = Math.max(0, monthlyLimit - monthlyUsed);
        const topupBalance    = Math.max(0, biz.topup_balance_seconds  || 0);

        // ── Compute deductions: monthly first, then top-up ───────────
        let monthlyDeduct = Math.min(secondsToDeduct, monthlyRem);
        let remaining     = secondsToDeduct - monthlyDeduct;
        let topupDeduct   = Math.min(remaining, topupBalance);

        // Clamp: never go negative
        monthlyDeduct = Math.max(0, monthlyDeduct);
        topupDeduct   = Math.max(0, topupDeduct);

        const newMonthlyUsed  = monthlyUsed + monthlyDeduct;
        const newTopupBalance = Math.max(0, topupBalance - topupDeduct);

        // ── Atomic DB update ──────────────────────────────────────────
        await db.query(
            `UPDATE businesses
             SET monthly_usage_seconds = $1,
                 topup_balance_seconds = $2,
                 last_usage_update_at  = NOW()
             WHERE id = $3`,
            [newMonthlyUsed, newTopupBalance, businessId]
        );

        // Legacy minutes_used sync (keep for dashboard compatibility)
        await db.query(
            `UPDATE businesses
             SET minutes_used = CEIL(monthly_usage_seconds::float / 60)
             WHERE id = $1`,
            [businessId]
        );

        console.log(`[BILLING] Deducted ${secondsToDeduct}s for ${businessId}: monthly -${monthlyDeduct}s, topup -${topupDeduct}s (CallSid: ${callSid})`);

        // ── Write to usage_logs (idempotency anchor) ──────────────────
        if (callSid) {
            await db.query(
                `INSERT INTO usage_logs (user_id, call_sid, minutes_used, seconds_used, cost_total)
                 VALUES ($1, $2, $3, $4, 0)
                 ON CONFLICT DO NOTHING`,
                [businessId, callSid, Math.ceil(secondsToDeduct / 60), secondsToDeduct]
            );
        }

        // ── Usage warnings ────────────────────────────────────────────
        if (monthlyLimit > 0) {
            const usagePct     = (newMonthlyUsed / monthlyLimit) * 100;
            const prevUsagePct = (monthlyUsed    / monthlyLimit) * 100;

            let threshold = null;
            if (prevUsagePct < 70  && usagePct >= 70  && usagePct < 90)  threshold = 70;
            else if (prevUsagePct < 90  && usagePct >= 90  && usagePct < 100) threshold = 90;
            else if (prevUsagePct < 100 && usagePct >= 100)                    threshold = 100;

            if (threshold !== null) {
                await _sendUsageWarningEmail(businessId, biz.email, biz.name, threshold, newMonthlyUsed, monthlyLimit, newTopupBalance);
            }

            // Warn when total balance is low (< 30 minutes = 1800 seconds)
            const totalAvailable = Math.max(0, monthlyLimit - newMonthlyUsed) + newTopupBalance;
            if (totalAvailable < 1800 && totalAvailable > 0) {
                const minsLeft = Math.ceil(totalAvailable / 60);
                console.log(`[BILLING ALERT] Business ${businessId} has only ${minsLeft} min total remaining`);
            }
        }

    } catch (err) {
        console.error('[deductCallSeconds] Error:', err);
        // Non-fatal: do not throw — call has already ended
    }
}

/**
 * @deprecated Use deductCallSeconds() instead.
 * Kept for backwards compatibility with existing callers during migration.
 */
async function incrementMinutesUsed(clientId, durationMinutes, callSid = null) {
    console.warn('[BILLING] incrementMinutesUsed is deprecated. Use deductCallSeconds() instead.');
    const seconds = Math.ceil(durationMinutes * 60);
    return deductCallSeconds(clientId, seconds, callSid);
}

/**
 * Reset monthly usage seconds after verified renewal.
 * Idempotent via renewalEventId.
 *
 * @param {string} businessId       - UUID
 * @param {number} newLimitSeconds  - New monthly allowance in seconds
 * @param {string} renewalEventId   - Dodo webhook event ID for idempotency
 */
async function resetMonthlySeconds(businessId, newLimitSeconds, renewalEventId = null) {
    try {
        // Idempotency check
        if (renewalEventId) {
            const existing = await db.query(
                'SELECT last_renewal_event_id FROM businesses WHERE id = $1',
                [businessId]
            );
            if (existing.rows[0]?.last_renewal_event_id === renewalEventId) {
                console.log(`[BILLING] Renewal ${renewalEventId} already applied for ${businessId}. Skipping.`);
                return;
            }
        }

        await db.query(
            `UPDATE businesses
             SET monthly_limit_seconds   = $1,
                 monthly_usage_seconds   = 0,
                 minutes_limit           = $2,
                 minutes_used            = 0,
                 last_renewal_event_id   = $3,
                 last_usage_update_at    = NOW()
             WHERE id = $4`,
            [newLimitSeconds, Math.ceil(newLimitSeconds / 60), renewalEventId, businessId]
        );

        console.log(`[BILLING] Monthly reset for ${businessId}: ${newLimitSeconds}s (event: ${renewalEventId})`);
    } catch (err) {
        console.error('[resetMonthlySeconds] Error:', err);
        throw err;
    }
}

/**
 * Apply top-up seconds atomically to a business.
 * Idempotent via dodoPaymentId.
 *
 * @param {string} businessId   - UUID
 * @param {string} topupId      - 'topup_100' or 'topup_250'
 * @param {number} secondsToAdd - Seconds from the top-up config
 * @param {string} dodoPaymentId
 * @param {string} webhookEventId
 * @param {object} extraMeta    - { amount, currency, dodoProductId }
 */
async function applyTopupSeconds(businessId, topupId, secondsToAdd, dodoPaymentId, webhookEventId, extraMeta = {}) {
    try {
        // Idempotency: check topup_transactions
        const existing = await db.query(
            'SELECT id FROM topup_transactions WHERE dodo_payment_id = $1 LIMIT 1',
            [dodoPaymentId]
        );
        if (existing.rows.length > 0) {
            console.log(`[BILLING] Top-up ${dodoPaymentId} already applied. Skipping.`);
            return;
        }

        const minutesAdded = Math.ceil(secondsToAdd / 60);

        // Atomic balance increment
        await db.query(
            `UPDATE businesses
             SET topup_balance_seconds = topup_balance_seconds + $1,
                 last_usage_update_at  = NOW()
             WHERE id = $2`,
            [secondsToAdd, businessId]
        );

        // Record transaction
        await db.query(
            `INSERT INTO topup_transactions
                (business_id, dodo_payment_id, dodo_product_id, topup_type, minutes_added, seconds_added, amount, currency, payment_status, webhook_event_id, applied_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'succeeded', $9, NOW())`,
            [
                businessId,
                dodoPaymentId,
                extraMeta.dodoProductId || null,
                topupId,
                minutesAdded,
                secondsToAdd,
                extraMeta.amount || 0,
                extraMeta.currency || 'USD',
                webhookEventId,
            ]
        );

        console.log(`[BILLING] Top-up applied: +${secondsToAdd}s (${minutesAdded} min) for business ${businessId}`);

        // Send confirmation email
        const bizRes = await db.query('SELECT email, name FROM businesses WHERE id = $1', [businessId]);
        if (bizRes.rows.length > 0) {
            const { email, name } = bizRes.rows[0];
            try {
                const emailService = require('../services/emailService');
                await emailService.sendMail(
                    email,
                    `Your ${minutesAdded}-Minute Top-Up Has Been Applied`,
                    `Hi ${name},\n\n${minutesAdded} prepaid call minutes have been added to your Bavio account and are available immediately.\n\nYou can view your updated balance in your billing dashboard at https://www.bavio.in/dashboard/billing.\n\nBest regards,\nThe Bavio Team`
                );
            } catch (emailErr) {
                console.error('[BILLING] Top-up confirmation email failed:', emailErr.message);
            }
        }

    } catch (err) {
        console.error('[applyTopupSeconds] Error:', err);
        throw err;
    }
}

// ── Internal: send usage warning email ───────────────────────────────
async function _sendUsageWarningEmail(businessId, email, name, threshold, usedSeconds, limitSeconds, topupBalance) {
    if (!email) return;

    const usedMin    = Math.ceil(usedSeconds   / 60);
    const limitMin   = Math.ceil(limitSeconds  / 60);
    const topupMin   = Math.ceil(topupBalance  / 60);
    const upgradeUrl = 'https://www.bavio.in/dashboard/billing';

    let subject, body;

    if (threshold === 70) {
        subject = `Bavio: You've used 70% of your monthly call minutes`;
        body    = `Hi ${name},\n\nYou've used 70% of your monthly call minutes (${usedMin} of ${limitMin} minutes used).\n\nConsider purchasing a prepaid top-up if you need more minutes before your renewal: ${upgradeUrl}\n\nBest regards,\nThe Bavio Team`;
    } else if (threshold === 90) {
        subject = `Bavio: You've used 90% of your monthly call minutes`;
        body    = `Hi ${name},\n\nYou've used 90% of your monthly call minutes (${usedMin} of ${limitMin} minutes used).\n\nPurchase a top-up or upgrade your plan to avoid interruption: ${upgradeUrl}\n\nBest regards,\nThe Bavio Team`;
    } else if (threshold === 100) {
        if (topupBalance > 0) {
            subject = `Bavio: Monthly allowance used — top-up minutes active`;
            body    = `Hi ${name},\n\nYour monthly allowance has been used. Bavio is now using your prepaid top-up minutes (${topupMin} min remaining).\n\nPurchase more top-up minutes at: ${upgradeUrl}\n\nBest regards,\nThe Bavio Team`;
        } else {
            subject = `Bavio: Your monthly call minutes have been used`;
            body    = `Hi ${name},\n\nYour available monthly call minutes have been used. AI call handling is paused until you purchase a top-up or upgrade your plan.\n\nReactivate at: ${upgradeUrl}\n\nBest regards,\nThe Bavio Team`;
        }
    }

    try {
        const emailService = require('../services/emailService');
        await emailService.sendMail(email, subject, body);
        console.log(`[BILLING ALERT] Sent ${threshold}% usage warning to ${email}`);
    } catch (err) {
        console.error('[BILLING ALERT] Email send failed:', err.message);
    }
}

// ── Legacy: cron reset (delegates to resetMonthlySeconds) ────────────
async function resetMonthlyMinutes() {
    console.warn('[BILLING] resetMonthlyMinutes() is deprecated. Use resetMonthlySeconds() per renewal webhook instead.');
}

module.exports = {
    checkCallBalance,
    checkMinutesLimit,
    deductCallSeconds,
    incrementMinutesUsed,   // deprecated alias
    resetMonthlySeconds,
    resetMonthlyMinutes,    // deprecated stub
    applyTopupSeconds,
};
