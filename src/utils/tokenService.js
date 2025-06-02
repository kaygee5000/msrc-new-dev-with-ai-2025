/**
 * Token Service for consistent token management across the application
 * Uses CacheService for token storage with proper TTL
 */

import CacheService from './cache';
import { generateToken } from './password';

// Token types and their default TTL in seconds
const TOKEN_TYPES = {
  PASSWORD_RESET: {
    prefix: 'reset',
    ttl: 60 * 60, // 1 hour
  },
  OTP: {
    prefix: 'otp',
    ttl: 10 * 60, // 10 minutes
  },
  EMAIL_VERIFICATION: {
    prefix: 'verify',
    ttl: 24 * 60 * 60, // 24 hours
  },
};

/**
 * TokenService for managing tokens with CacheService
 */
class TokenService {
  /**
   * Create a new token for a specific purpose
   * @param {string} type - Token type (from TOKEN_TYPES)
   * @param {string} identifier - User identifier (email, id, etc.)
   * @param {Object} data - Additional data to store with token
   * @param {number} customTtl - Optional custom TTL in seconds
   * @returns {Object} - Token object with token and expiry
   */
  static async createToken(type, identifier, data = {}, customTtl = null) {
    const tokenType = TOKEN_TYPES[type];
    if (!tokenType) {
      throw new Error(`Invalid token type: ${type}`);
    }

    const token = generateToken();
    const expiresAt = Date.now() + (customTtl || tokenType.ttl) * 1000;
    
    const tokenData = {
      ...data,
      identifier,
      expiresAt,
    };
    
    // Store token in cache
    const cacheKey = `${tokenType.prefix}:${token}`;
    await CacheService.set(
      cacheKey,
      tokenData,
      customTtl || tokenType.ttl
    );
    
    return {
      token,
      expiresAt,
    };
  }
  
  /**
   * Verify a token and return its data
   * @param {string} type - Token type (from TOKEN_TYPES)
   * @param {string} token - Token to verify
   * @returns {Promise<Object|null>} - Token data or null if invalid
   */
  static async verifyToken(type, token) {
    const tokenType = TOKEN_TYPES[type];
    if (!tokenType || !token) {
      return null;
    }
    
    const cacheKey = `${tokenType.prefix}:${token}`;
    const tokenData = await CacheService.get(cacheKey);
    
    if (!tokenData) {
      return null;
    }
    
    // Check if token is expired
    if (Date.now() > tokenData.expiresAt) {
      await CacheService.invalidate(cacheKey);
      return null;
    }
    
    return tokenData;
  }
  
  /**
   * Invalidate a token
   * @param {string} type - Token type (from TOKEN_TYPES)
   * @param {string} token - Token to invalidate
   * @returns {Promise<boolean>} - True if invalidated
   */
  static async invalidateToken(type, token) {
    const tokenType = TOKEN_TYPES[type];
    if (!tokenType || !token) {
      return false;
    }
    
    const cacheKey = `${tokenType.prefix}:${token}`;
    await CacheService.invalidate(cacheKey);
    return true;
  }
}

export default TokenService;
