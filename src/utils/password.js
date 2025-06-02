/**
 * Password utility for consistent password hashing and verification
 * Uses bcrypt for secure password management
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Generate a random password
 * @param {number} length - Length of the password (default: 8)
 * @returns {string} - Random password
 */
export function generatePassword(length = 8) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  
  // Ensure at least one character from each category
  password += charset.substring(0, 26).charAt(Math.floor(Math.random() * 26)); // lowercase
  password += charset.substring(26, 52).charAt(Math.floor(Math.random() * 26)); // uppercase
  password += charset.substring(52, 62).charAt(Math.floor(Math.random() * 10)); // number
  password += charset.substring(62).charAt(Math.floor(Math.random() * (charset.length - 62))); // special
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Hashed password to compare against
 * @returns {Promise<boolean>} - True if password matches hash
 */
export async function verifyPassword(password, hash) {
  // Handle legacy password format (salt:hash from crypto.pbkdf2Sync)
  if (hash.includes(':')) {
    const [salt, storedHash] = hash.split(':');
    const calculatedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return calculatedHash === storedHash;
  }
  
  // Handle bcrypt format
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a secure random token
 * @param {number} bytes - Number of bytes for token (default: 32)
 * @returns {string} - Hex-encoded random token
 */
export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}
