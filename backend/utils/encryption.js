const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || '7e0341f2ee874653ce795be1851359683e92e769db290b69965697ae80da0a5e5745972bd30e6b51088fbc878ea141f97acec678ca57855eb024064f44f4d220';

// Ensure key is exactly 32 bytes
const KEY = crypto.createHash('sha256').update(SECRET_KEY).digest();

/**
 * Encrypt a text string using AES-256-CBC.
 */
function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a cipher text string.
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[Encryption] Decryption failed:', err.message);
    return null;
  }
}

module.exports = { encrypt, decrypt };
