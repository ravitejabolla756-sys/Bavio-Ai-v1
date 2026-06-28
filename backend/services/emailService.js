/**
 * Email Service — Bavio AI Backend
 * 
 * Uses Nodemailer to send actual transactional emails.
 * Reads SMTP credentials from environment variables:
 * - SMTP_HOST (e.g., smtp.gmail.com, smtp.resend.com)
 * - SMTP_PORT (e.g., 587 or 465)
 * - SMTP_USER
 * - SMTP_PASS
 * - SMTP_FROM (e.g., "Bavio AI <noreply@bavio.in>")
 * 
 * If SMTP credentials are not fully configured, it falls back to console logging.
 */

const nodemailer = require('nodemailer');

// Initialize SMTP transporter if variables are present
let transporter = null;

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || 'Bavio AI <noreply@bavio.in>';

if (host && user && pass) {
    try {
        transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: port === 465, // true for 465, false for other ports
            auth: {
                user: user,
                pass: pass
            }
        });
        console.log('[EmailService] SMTP transporter initialized successfully.');
    } catch (e) {
        console.error('[EmailService] Failed to initialize SMTP transporter:', e.message);
    }
} else {
    console.log('[EmailService] SMTP credentials not fully configured. Using console logging fallback.');
}

/**
 * Send an email.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Plain text or HTML body
 * @param {boolean} isHtml - Whether the body is HTML
 * @returns {Promise<void>}
 */
async function sendMail(to, subject, body, isHtml = false) {
    if (!to) {
        console.warn('[EmailService] sendMail called with no recipient, skipping.');
        return;
    }

    if (transporter) {
        try {
            const mailOptions = {
                from: from,
                to: to,
                subject: subject,
                [isHtml ? 'html' : 'text']: body
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`[EmailService] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
        } catch (error) {
            console.error(`[EmailService] Error sending email to ${to}:`, error.message);
            // Fallback console log in case of SMTP failure
            logFallback(to, subject, body);
        }
    } else {
        logFallback(to, subject, body);
    }
}

function logFallback(to, subject, body) {
    console.log('====== [EmailService Fallback Log] ======');
    console.log(`To:      ${to}`);
    console.log(`From:    ${from}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${body}`);
    console.log('=========================================');
}

module.exports = { sendMail };
