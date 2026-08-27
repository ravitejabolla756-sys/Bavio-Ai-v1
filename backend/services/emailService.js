/**
 * Email Service — Bavio AI Backend
 * Direct Resend HTTP API Transactional Email Dispatcher
 */

const axios = require('axios');

/**
 * Send branded Bavio 6-Digit OTP Verification Email via Resend HTTP API.
 * @param {string} to - Recipient email
 * @param {string} otpCode - 6-digit OTP string
 * @returns {Promise<{ success: boolean; messageId?: string; error?: string }>}
 */
async function sendOtpEmail(to, otpCode) {
  if (!to || !otpCode) {
    return { success: false, error: 'Recipient email and OTP code are required' };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Bavio AI <noreply@bavio.in>';
  const subject = 'Verify your Bavio account';

  if (!resendApiKey) {
    console.error('[EmailService] ❌ CRITICAL: RESEND_API_KEY is not configured in process.env');
    return {
      success: false,
      error: 'Email verification service is currently unavailable. Please contact support.'
    };
  }

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

  try {
    console.log(`[EmailService] Resend API request attempted to recipient (from: ${from})`);

    const resendRes = await axios.post(
      'https://api.resend.com/emails',
      {
        from: from,
        to: [to],
        subject: subject,
        html: html,
        text: text,
      },
      {
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const messageId = resendRes.data?.id || 'resend-ok';
    console.log(`[EmailService] ✅ Resend success with message ID: ${messageId}`);
    return { success: true, messageId };
  } catch (resendErr) {
    const statusCode = resendErr.response?.status || 500;
    const providerErrData = resendErr.response?.data;
    const safeMsg = providerErrData?.message || resendErr.message || 'Email delivery failed';

    console.error(`[EmailService] ❌ Resend failure (HTTP ${statusCode}): ${safeMsg}`);
    if (providerErrData?.name) {
      console.error(`[EmailService] Provider error type: ${providerErrData.name}`);
    }

    return {
      success: false,
      error: `Email delivery failed: ${safeMsg}`
    };
  }
}

/**
 * Send branded Bavio Password Reset Link Email via Resend HTTP API.
 * @param {string} to - Recipient email
 * @param {string} resetUrl - Complete reset password URL with token
 * @returns {Promise<{ success: boolean; messageId?: string; error?: string }>}
 */
async function sendPasswordResetEmail(to, resetUrl) {
  if (!to || !resetUrl) {
    return { success: false, error: 'Recipient email and reset URL are required' };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Bavio AI <noreply@bavio.in>';
  const subject = 'Reset your Bavio password';

  if (!resendApiKey) {
    console.error('[EmailService] ❌ CRITICAL: RESEND_API_KEY is not configured in process.env');
    return {
      success: false,
      error: 'Password reset email service is currently unavailable. Please contact support.'
    };
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your Bavio password</title>
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
                Reset Your Password
              </h1>
            </td>
          </tr>
          <!-- Description -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #5A5A66;">
                We received a request to reset your password for your Bavio AI account. Click the button below to choose a new password.
              </p>
            </td>
          </tr>
          <!-- Action Button -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <a href="${resetUrl}" target="_blank" style="background-color: #FF6B00; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; display: inline-block; letter-spacing: 0.5px; text-transform: uppercase;">
                Reset Password
              </a>
            </td>
          </tr>
          <!-- Expiration & Security info -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 12px; color: #8A8A96; line-height: 1.5;">
                This link expires in <strong>15 minutes</strong> and can only be used once.<br />
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
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

  const text = `Bavio AI\n\nReset your password by visiting the link below:\n${resetUrl}\n\nThis link expires in 15 minutes.\nIf you did not request a password reset, please ignore this email.`;

  try {
    console.log(`[EmailService] Resend password reset API request attempted to recipient (from: ${from})`);

    const resendRes = await axios.post(
      'https://api.resend.com/emails',
      {
        from: from,
        to: [to],
        subject: subject,
        html: html,
        text: text,
      },
      {
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const messageId = resendRes.data?.id || 'resend-ok';
    console.log(`[EmailService] ✅ Resend password reset email success with message ID: ${messageId}`);
    return { success: true, messageId };
  } catch (resendErr) {
    const statusCode = resendErr.response?.status || 500;
    const providerErrData = resendErr.response?.data;
    const safeMsg = providerErrData?.message || resendErr.message || 'Password reset email delivery failed';

    console.error(`[EmailService] ❌ Resend password reset failure (HTTP ${statusCode}): ${safeMsg}`);
    return {
      success: false,
      error: `Email delivery failed: ${safeMsg}`
    };
  }
}

/**
 * Generic mail sender helper for backwards compatibility.
 */
async function sendMail(to, subject, body, isHtml = false) {
  if (!to) return;
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Bavio AI <noreply@bavio.in>';
  if (!resendApiKey) {
    console.error('[EmailService] RESEND_API_KEY is not set');
    return;
  }
  try {
    console.log(`[EmailService] Generic email dispatch attempted to recipient`);
    const res = await axios.post(
      'https://api.resend.com/emails',
      {
        from: from,
        to: [to],
        subject: subject,
        [isHtml ? 'html' : 'text']: body,
      },
      {
        headers: {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    console.log(`[EmailService] ✅ Generic email success. Message ID: ${res.data?.id}`);
  } catch (err) {
    console.error(`[EmailService] ❌ Generic email failed (HTTP ${err.response?.status || 500}):`, err.response?.data?.message || err.message);
  }
}

module.exports = {
  sendOtpEmail,
  sendPasswordResetEmail,
  sendMail
};
