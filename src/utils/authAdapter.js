import { getRedisClient } from './redis';

/**
 * A custom NextAuth.js adapter for Redis
 * This implements the minimal required adapter methods for Email Provider
 */
export function RedisAdapter() {
  // Helper function to get Redis client with error handling
  const getClient = async () => {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not available');
      }
      return client;
    } catch (error) {
      console.error('Failed to get Redis client:', error);
      throw new Error('Database connection failed');
    }
  };

  return {
    // Create a verification token (used for email sign-in)
    async createVerificationToken(token) {
      try {
        const { identifier, token: tokenValue, expires } = token;
        const redis = await getClient();
        // Store token with expiry (in milliseconds)
        const key = `emailToken:${identifier}:${tokenValue}`;
        await redis.set(key, JSON.stringify(token), {
          PX: expires.getTime() - Date.now()
        });
        return token;
      } catch (error) {
        console.error('Error in createVerificationToken:', error);
        throw error;
      }
    },

    // Get a verification token
    async useVerificationToken({ identifier, token }) {
      try {
        const redis = await getClient();
        const key = `emailToken:${identifier}:${token}`;
        const result = await redis.get(key);
        
        if (!result) return null;
        
        // Delete the token after use (one-time use)
        await redis.del(key);
        
        return JSON.parse(result);
      } catch (error) {
        console.error('Error in useVerificationToken:', error);
        throw error;
      }
    },

    // Create a user - not actually needed for our implementation
    // since users are already in MySQL, but required by the adapter interface
    async createUser(user) {
      // This is a stub - the real user creation is handled by the MySQL DB
      return user;
    },

    // Get a user by email - forwards to MySQL
    async getUserByEmail(email) {
      // This is handled by the custom provider implementation
      return null;
    },

    // Get a user by ID - forwards to MySQL
    async getUserByAccount({ providerAccountId, provider }) {
      // This is handled by the custom provider implementation
      return null;
    },

    // These are additional methods, implemented as stubs to satisfy the adapter interface
    async getUser(id) {
      // This is handled by the custom provider implementation
      return null;
    },
    
    async updateUser(user) {
      // This is a stub
      return user;
    },
    
    async linkAccount(account) {
      // This is a stub
      return account;
    },
    
    async createSession(session) {
      // Sessions are JWT-based, so we don't need this
      return session;
    },
    
    async getSessionAndUser(sessionToken) {
      // Sessions are JWT-based, so we don't need this
      return null;
    },
    
    async updateSession(session) {
      // Sessions are JWT-based, so we don't need this
      return session;
    },
    
    async deleteSession(sessionToken) {
      // Sessions are JWT-based, so we don't need this
      return null;
    }
  };
}