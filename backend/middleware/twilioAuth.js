const twilio = require('twilio');

function validateTwilioSignature(req, res, next) {
    const token = process.env.TWILIO_AUTH_TOKEN;
    const signature = req.headers['x-twilio-signature'] || req.headers['X-Twilio-Signature'];

    const isProd = process.env.NODE_ENV === 'production';
    const isPlaceholder = !token || token.includes('your_');

    if (isProd && isPlaceholder) {
        console.error('[TWILIO AUTH] Twilio Auth Token is not configured in production.');
        return res.status(403).json({ error: 'Forbidden: Twilio Auth Token not configured' });
    }

    if (isPlaceholder || !isProd) {
        console.warn('[TWILIO AUTH] Bypass signature check in non-production/sandbox mode');
        return next();
    }

    if (!signature) {
        console.error('[TWILIO AUTH] Missing X-Twilio-Signature header');
        return res.status(403).json({ error: 'Forbidden: Missing signature header' });
    }

    // Build absolute URL using process.env.PUBLIC_API_BASE_URL (bypasses proxy port/host discrepancies)
    const publicBaseUrl = process.env.PUBLIC_API_BASE_URL || `${req.protocol}://${req.headers.host}`;
    const url = publicBaseUrl + req.originalUrl;
    
    const params = req.body || {};

    const isValid = twilio.validateRequest(token, signature, url, params);

    if (!isValid) {
        console.error(`[TWILIO AUTH] Twilio Webhook signature validation failed for URL: ${url}`);
        return res.status(403).json({ error: 'Forbidden: Invalid signature' });
    }

    console.log(`[TWILIO AUTH] Validated webhook request successfully for: ${url}`);
    next();
}

module.exports = { validateTwilioSignature };
