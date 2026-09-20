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

function isReviewAccount(email) {
    return (
        process.env.NODE_ENV !== 'production' &&
        process.env.BAVIO_ENABLE_REVIEW_ACCOUNT === 'true' &&
        process.env.BAVIO_REVIEW_ACCOUNT_EMAIL &&
        email &&
        email.trim().toLowerCase() === process.env.BAVIO_REVIEW_ACCOUNT_EMAIL.trim().toLowerCase()
    );
}

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

    // Review account bypass (development only)
    if (isReviewAccount(biz.email)) {
        return { allowed: true, monthlyRemainingSeconds: 999999, topupRemainingSeconds: 999999, totalAvailableSeconds: 999999, isReview: true };
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
/**
 * Deduct actual call seconds from a business account atomically with strict idempotency.
 *
 * Atomicity & Idempotency Guarantee:
 * Uses a single PostgreSQL transaction with row-level locking (FOR UPDATE)
 * and an atomic claim on usage_logs(call_sid).
 * If a call_sid was already claimed/charged, the transaction safely aborts without
 * mutating balance, guaranteeing that duplicate or concurrent callbacks never double-charge.
 *
 * @param {string}  businessId      - UUID
 * @param {number}  durationSeconds - Actual call duration in seconds
 * @param {string}  callSid         - Provider call SID for idempotency
 * @param {object}  detailedMetrics - Optional COGS metrics
 * @param {object}  options         - Optional overrides, e.g. { db } for dependency injection
 */
async function deductCallSeconds(businessId, durationSeconds, callSid = null, detailedMetrics = null, options = {}) {
    if (!businessId) {
        console.warn('[BILLING] Skipping deduction: missing businessId');
        return { success: false, reason: 'MISSING_BUSINESS_ID' };
    }

    if (!durationSeconds || durationSeconds <= 0) {
        console.warn(`[BILLING] Skipping deduction: invalid duration ${durationSeconds}s`);
        return { success: false, reason: 'INVALID_DURATION' };
    }

    // ── 1. Strict Fail-Closed Check for callSid ────────────────────
    if (!callSid) {
        if (options.allowUnanchored || options.isSimulation) {
            console.warn(`[BILLING] Non-billable simulation flow invoked without callSid for business ${businessId}.`);
            return {
                success: true,
                isSimulation: true,
                deductedSeconds: 0,
                reason: 'SIMULATION_NON_BILLABLE'
            };
        }
        console.error(`[BILLING CORE ERROR] Missing callSid on billable call deduction for business ${businessId}. Failing closed.`);
        return {
            success: false,
            reason: 'BILLING_IDEMPOTENCY_KEY_MISSING',
            deductedSeconds: 0
        };
    }

    const secondsToDeduct = Math.ceil(durationSeconds);
    const dbInstance = options.db || db;
    const pool = dbInstance.pool || dbInstance;
    const client = await pool.connect();
    let inTransaction = false;

    try {
        await client.query('BEGIN');
        inTransaction = true;

        // ── 2. Lock and retrieve business and canonical user balances ──
        const bizRes = await client.query(
            `SELECT
                b.id AS business_id,
                b.email,
                b.name,
                b.country,
                b.monthly_limit_seconds,
                b.monthly_usage_seconds,
                b.topup_balance_seconds,
                u.id AS user_id
             FROM businesses b
             LEFT JOIN users u ON u.id = b.id
             WHERE b.id = $1
             FOR UPDATE OF b`,
            [businessId]
        );

        if (bizRes.rows.length === 0) {
            console.error(`[BILLING] Business ${businessId} not found`);
            await client.query('ROLLBACK');
            inTransaction = false;
            return { success: false, reason: 'BUSINESS_NOT_FOUND', deductedSeconds: 0 };
        }

        const biz = bizRes.rows[0];

        // Ensure canonical user_id exists in users table (guarantees FK integrity)
        if (!biz.user_id) {
            console.error(`[BILLING CORE ERROR] Business ${businessId} has no corresponding user_id in users table. Aborting deduction.`);
            await client.query('ROLLBACK');
            inTransaction = false;
            return { success: false, reason: 'USER_REFERENCE_NOT_FOUND', deductedSeconds: 0 };
        }

        // ── 3. Explicitly derive country_code (no false 'US' default) ──
        const rawCountry = detailedMetrics?.telephony?.country ||
                           detailedMetrics?.telephony?.region ||
                           options.countryCode ||
                           biz.country;
        const countryCode = (rawCountry && typeof rawCountry === 'string' && rawCountry.trim().length >= 2)
            ? rawCountry.trim().slice(0, 2).toUpperCase()
            : null;

        if (!countryCode) {
            console.error(`[BILLING CORE ERROR] Cannot derive country_code for business ${businessId}. Aborting deduction.`);
            await client.query('ROLLBACK');
            inTransaction = false;
            return { success: false, reason: 'COUNTRY_CODE_UNRESOLVED', deductedSeconds: 0 };
        }

        // ── 4. Explicit billing month and year ─────────────────────────
        const now = new Date();
        const billingMonth = now.getUTCMonth() + 1;
        const billingYear  = now.getUTCFullYear();

        // ── 5. Atomic Idempotency Claim with Full Core Durability ──────
        // If already claimed, ON CONFLICT DO NOTHING returns 0 rows.
        const claimRes = await client.query(
            `INSERT INTO usage_logs (
                user_id, country_code, call_sid, minutes_used, cost_total,
                billing_month, billing_year, created_at
             )
             VALUES (
                $1, $2, $3, $4, 0,
                $5, $6, NOW()
             )
             ON CONFLICT (call_sid) WHERE call_sid IS NOT NULL DO NOTHING
             RETURNING id`,
            [biz.user_id, countryCode, callSid, Math.ceil(secondsToDeduct / 60), billingMonth, billingYear]
        );

        if (claimRes.rows.length === 0) {
            console.log(`[BILLING] Call ${callSid} already charged (atomic idempotency claim rejected). Skipping.`);
            await client.query('ROLLBACK');
            inTransaction = false;
            return { success: true, alreadyCharged: true, deductedSeconds: 0 };
        }

        // ── 3. Compute deductions: monthly first, then top-up ───────────
        const monthlyLimit    = Math.max(0, biz.monthly_limit_seconds  || 0);
        const monthlyUsed     = Math.max(0, biz.monthly_usage_seconds  || 0);
        const monthlyRem      = Math.max(0, monthlyLimit - monthlyUsed);
        const topupBalance    = Math.max(0, biz.topup_balance_seconds  || 0);

        let monthlyDeduct = Math.min(secondsToDeduct, monthlyRem);
        let remaining     = secondsToDeduct - monthlyDeduct;
        let topupDeduct   = Math.min(remaining, topupBalance);

        // Clamp: never go negative
        monthlyDeduct = Math.max(0, monthlyDeduct);
        topupDeduct   = Math.max(0, topupDeduct);

        const newMonthlyUsed  = monthlyUsed + monthlyDeduct;
        const newTopupBalance = Math.max(0, topupBalance - topupDeduct);

        // ── 4. Atomic DB balance update ─────────────────────────────────
        const newMinutesUsed = Math.ceil(newMonthlyUsed / 60);
        await client.query(
            `UPDATE businesses
             SET monthly_usage_seconds = $1,
                 topup_balance_seconds = $2,
                 minutes_used          = $3,
                 last_usage_update_at  = NOW()
             WHERE id = $4`,
            [newMonthlyUsed, newTopupBalance, newMinutesUsed, businessId]
        );

        // ── 5. Optional telemetry persistence (Non-fatal) ───────────────
        if (callSid && detailedMetrics) {
            try {
                const telephony = detailedMetrics.telephony || {};
                const stt = detailedMetrics.stt || {};
                const llm = detailedMetrics.llm || {};
                const tts = detailedMetrics.tts || {};

                const costTelephony = (telephony.billedSeconds || secondsToDeduct) * 0.0002167 +
                                      (telephony.recordingUsed ? (telephony.billedSeconds || secondsToDeduct) * 0.0000417 : 0);
                const costStt = (stt.seconds || 0) * 0.0000717;

                let costLlm = 0;
                const llmProv = (llm.provider || 'cerebras').toLowerCase();
                if (llmProv === 'groq') {
                    costLlm = (llm.inputTokens || 0) * 0.0000007 + (llm.outputTokens || 0) * 0.0000009;
                } else {
                    costLlm = ((llm.inputTokens || 0) + (llm.outputTokens || 0)) * 0.0000006;
                }

                const costTts = (tts.characters || 0) * 0.000015;
                const costTotal = costTelephony + costStt + costLlm + costTts;

                await client.query(
                    `UPDATE usage_logs
                     SET cost_telephony = $1,
                         cost_stt       = $2,
                         cost_tts       = $3,
                         cost_total     = $4,
                         stt_minutes    = $5,
                         tts_characters = $6
                     WHERE call_sid = $7`,
                    [
                        costTelephony,
                        costStt,
                        costTts,
                        costTotal,
                        (stt.seconds || 0) / 60,
                        tts.characters || 0,
                        callSid
                    ]
                );
            } catch (telemetryErr) {
                // Structured warning: optional telemetry failed, but core billing is unaffected
                console.warn('[BILLING TELEMETRY] Optional detailed telemetry persistence skipped non-fatally:', telemetryErr.message);
            }
        }

        // ── 6. Commit transaction ───────────────────────────────────────
        await client.query('COMMIT');
        inTransaction = false;

        console.log(`[BILLING] Deducted ${secondsToDeduct}s for ${businessId}: monthly -${monthlyDeduct}s, topup -${topupDeduct}s (CallSid: ${callSid})`);

        // ── 7. Async notifications outside transaction ─────────────────
        _dispatchUsageAlerts(dbInstance, businessId, biz, monthlyLimit, monthlyUsed, newMonthlyUsed, newTopupBalance).catch(alertErr => {
            console.warn('[BILLING ALERT] Asynchronous warning processing encountered an error:', alertErr.message);
        });

        return {
            success: true,
            alreadyCharged: false,
            deductedSeconds: secondsToDeduct,
            monthlyDeduct,
            topupDeduct,
            newMonthlyUsed,
            newTopupBalance
        };

    } catch (err) {
        if (inTransaction) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackErr) {
                console.error('[BILLING ROLLBACK] Rollback error:', rollbackErr.message);
            }
        }
        console.error('[BILLING CORE ERROR] Atomic deduction transaction aborted:', err.message);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Handle usage alert thresholds and notifications outside the billing transaction.
 */
async function _dispatchUsageAlerts(dbInstance, businessId, biz, monthlyLimit, monthlyUsed, newMonthlyUsed, newTopupBalance) {
    if (monthlyLimit <= 0) return;

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
        await dbInstance.query(
            `INSERT INTO notifications (business_id, title, message, type, status, created_at)
             VALUES ($1, 'Low Call Minutes Remaining', $2, 'warning', 'unread', NOW())`,
            [businessId, `Your Bavio account has only ${minsLeft} minutes remaining. Please buy top-up minutes to avoid interruptions.`]
        );
    } else if (totalAvailable <= 0) {
        await dbInstance.query(
            `INSERT INTO notifications (business_id, title, message, type, status, created_at)
             VALUES ($1, 'Call Minutes Exhausted', 'Your Bavio account call minutes are fully exhausted. Inbound call handling is paused.', 'error', 'unread', NOW())`,
            [businessId]
        );
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
