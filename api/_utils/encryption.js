import crypto from 'crypto';

/**
 * Encryption utility for customer data in URLs
 * Uses AES-256-GCM for secure encryption/decryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key from environment variable
 * Falls back to a default key if not set (for development only)
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;

  if (!key || key.trim() === '') {
    console.error('ENCRYPTION_KEY environment variable is not set');
    return null;
  }

  if (key.length < 32) {
    console.error('ENCRYPTION_KEY must be at least 32 characters long');
    return null;
  }

  // Use first 32 characters for AES-256
  return crypto.createHash('sha256').update(key.substring(0, 32)).digest();
}

/**
 * Encrypt customer data
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted string (base64 encoded)
 */
export function encrypt(text) {
  if (!text || text.trim() === '') {
    return '';
  }

  try {
    const key = getEncryptionKey();
    if (!key) {
      console.error('Encryption skipped: no key available');
      return '';
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'base64')
    ]);

    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error.message);
    return '';
  }
}

/**
 * Decrypt customer data
 * @param {string} encryptedText - Encrypted string (base64 encoded)
 * @returns {string} - Decrypted text
 */
export function decrypt(encryptedText) {
  if (!encryptedText || encryptedText.trim() === '') {
    return '';
  }

  try {
    const key = getEncryptionKey();
    if (!key) {
      console.error('Decryption skipped: no key available');
      return '';
    }
    const combined = Buffer.from(encryptedText, 'base64');

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, TAG_POSITION);
    const tag = combined.subarray(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = combined.subarray(ENCRYPTED_POSITION);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    return '';
  }
}

/**
 * Encrypt customer data object
 * @param {object} data - Object containing customer data
 * @returns {string} - Encrypted JSON string
 */
export function encryptCustomerData(data) {
  try {
    const jsonString = JSON.stringify(data);
    return encrypt(jsonString);
  } catch (error) {
    console.error('Error encrypting customer data');
    return '';
  }
}

/**
 * Decrypt customer data object
 * @param {string} encryptedData - Encrypted JSON string
 * @returns {object} - Decrypted customer data object
 */
export function decryptCustomerData(encryptedData) {
  try {
    if (!encryptedData || encryptedData.trim() === '') {
      return {};
    }
    
    const decrypted = decrypt(encryptedData);
    if (!decrypted || decrypted.trim() === '') {
      return {};
    }
    
    const parsed = JSON.parse(decrypted);
    // Validate that we got actual data
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    
    return parsed;
  } catch (error) {
    console.error('Error decrypting customer data');
    return {};
  }
}
