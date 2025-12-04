import crypto from 'crypto';

// AES-256-GCM encryption
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16 bytes
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key from environment variable
 * In production, this should be a 32-byte (256-bit) key stored securely
 */
function getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    
    // Ensure the key is 32 bytes (256 bits) for AES-256
    // If the key is a hex string, convert it to buffer
    if (key.length === 64) {
        return Buffer.from(key, 'hex');
    }
    
    // Otherwise, use SHA-256 to derive a 32-byte key
    return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * @param {string} plaintext - The text to encrypt
 * @returns {string} - Base64 encoded encrypted data with salt, IV, auth tag, and ciphertext
 */
export function encrypt(plaintext) {
    if (!plaintext) {
        throw new Error('Cannot encrypt empty value');
    }

    try {
        const key = getEncryptionKey();
        
        // Generate random salt and IV
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);
        
        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        // Encrypt the data
        const encrypted = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final()
        ]);
        
        // Get the authentication tag
        const tag = cipher.getAuthTag();
        
        // Combine salt + iv + tag + encrypted data
        const result = Buffer.concat([salt, iv, tag, encrypted]);
        
        // Return as base64 string
        return result.toString('base64');
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt an encrypted string using AES-256-GCM
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {string} - The decrypted plaintext
 */
export function decrypt(encryptedData) {
    if (!encryptedData) {
        throw new Error('Cannot decrypt empty value');
    }

    try {
        const key = getEncryptionKey();
        
        // Convert from base64
        const buffer = Buffer.from(encryptedData, 'base64');
        
        // Extract components
        const salt = buffer.subarray(0, SALT_LENGTH);
        const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION);
        const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION);
        const encrypted = buffer.subarray(ENCRYPTED_POSITION);
        
        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        
        // Decrypt the data
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);
        
        return decrypted.toString('utf8');
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Generate a new random encryption key (for initial setup)
 * @returns {string} - A 64-character hex string (32 bytes)
 */
export function generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
}
