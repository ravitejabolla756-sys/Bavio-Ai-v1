/**
 * Email Service — Bavio AI Backend
 * 
 * Stub implementation: logs emails to console.
 * For production: replace with Nodemailer + SMTP or SendGrid.
 */

/**
 * Send an email.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Plain text body
 * @returns {Promise<void>}
 */
async function sendMail(to, subject, body) {
    if (!to) {
        console.warn('[EmailService] sendMail called with no recipient, skipping.');
        return;
    }
    // TODO: Integrate Nodemailer or SendGrid for real email sending
    console.log(`[EmailService] Would send email to: ${to}`);
    console.log(`[EmailService] Subject: ${subject}`);
    console.log(`[EmailService] Body: ${body}`);
}

module.exports = { sendMail };
