/**
 * Password generation and hashing utilities
 */

/**
 * Generate a random password
 * @param {number} length - Length of the password, defaults to 8
 * @param {boolean} includeSpecial - Whether to include special characters
 * @returns {string} The generated password
 */
export function generatePassword(length = 8, includeSpecial = true) {
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numberChars = '0123456789';
  const specialChars = includeSpecial ? '!@#$%^&*()_-+=<>?' : '';
  
  // Combine all characters
  const allChars = lowerChars + upperChars + numberChars + specialChars;
  
  let password = '';
  
  // Ensure password has at least one character from each required set
  password += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length));
  password += upperChars.charAt(Math.floor(Math.random() * upperChars.length));
  password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
  
  if (includeSpecial) {
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  }
  
  // Fill the rest of the password with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password chars
  return password.split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

/**
 * Generate a random OTP code
 * @param {number} length - Length of the OTP, defaults to 6
 * @returns {string} The generated OTP code
 */
export function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  
  return otp;
}

// Import and re-export hash functions for convenience
import { hashPassword } from './hash.js';
export { hashPassword };