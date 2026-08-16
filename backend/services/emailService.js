/**
 * Email Service — Bavio AI Backend
 * 
 * Supports SMTP (Resend, SendGrid, Gmail, AWS SES, etc.)
 * Provides branded transactional emails including 6-digit OTP verification codes.
 */

const nodemailer = require('nodemailer');

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465,
    auth: {
      user: user,
      pass: pass,
    },
  });
}

/**
 * Send branded Bavio 6-Digit OTP Verification Email
 * @param {string} to - Recipient email
 * @param {string} otpCode - 6-digit OTP string
 * @returns {Promise<{ success: boolean; messageId?: string; error?: string }>}
 */
async function sendOtpEmail(to, otpCode) {
  if (!to || !otpCode) {
    return { success: false, error: 'Recipient email and OTP code are required' };
  }

  const from = process.env.SMTP_FROM || 'Bavio AI <hello@bavio.in>';
  const subject = 'Verify your Bavio account';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your Bavio account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F4EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #14141A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F7F4EF; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="520" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; border: 1px solid #E5E0D8; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="display: inline-block; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #14141A;">
                Bavio <span style="color: #FF6B00;">AI</span>
              </div>
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td align="center" style="padding-bottom: 12px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #14141A; letter-spacing: -0.5px;">
                Your Verification Code
              </h1>
            </td>
          </tr>
          <!-- Description -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #5A5A66;">
                Use the 6-digit code below to complete your Bavio account verification.
              </p>
            </td>
          </tr>
          <!-- OTP Code Box -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <div style="background-color: #FAF7F2; border: 1px solid #E5E0D8; border-radius: 14px; padding: 18px 32px; display: inline-block; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; color: #FF6B00; text-align: center;">
                ${otpCode}
              </div>
            </td>
          </tr>
          <!-- Expiration info -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 12px; color: #8A8A96; line-height: 1.5;">
                This code expires in <strong>10 minutes</strong>.<br />
                If you did not request this verification, please safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="border-top: 1px solid #E5E0D8; padding-top: 20px;">
              <p style="margin: 0; font-size: 11px; color: #8A8A96;">
                &copy; ${new Date().getFullYear()} Bavio AI. Autonomous Voice Operations Platform.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `Bavio AI\n\nYour verification code is: ${otpCode}\n\nThis code expires in 10 minutes.\nIf you did not request this account, you can ignore this email.`;

  const transporter = getTransporter();

  // 1. If SMTP is configured, attempt delivery via SMTP transporter
  if (transporter) {
    try {
      console.log(`[EmailService] Dispatching OTP email via SMTP to: ${to}...`);
      const info = await transporter.sendMail({
        from: from,
        to: to,
        subject: subject,
        text: text,
        html: html,
      });
      console.log(`[EmailService] ✅ Email delivered to ${to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] ❌ SMTP delivery failed for ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  // 2. Localhost / Console fallback when SMTP credentials are not yet set
  console.log('====== [EmailService Verification OTP] ======');
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`OTP:     ${otpCode}`);
  console.log('=============================================');
  return { success: true, messageId: 'console-fallback-' + Date.now() };
}

module.exports = { sendOtpEmail };
