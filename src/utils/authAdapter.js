import CacheService from './cache';

/**
 * A custom NextAuth.js adapter for authentication using CacheService
 * This implements the minimal required adapter methods for Email Provider
 */
export function AuthAdapter() {
  return {
    // Create a verification token (used for email sign-in)
    async createVerificationToken(token) {
      try {
        const { identifier, token: tokenValue, expires } = token;
        // Store token with expiry
        const key = `emailToken:${identifier}:${tokenValue}`;
        await CacheService.set(
          key, 
          token, 
          Math.ceil((expires.getTime() - Date.now()) / 1000) // Convert ms to seconds
        );
        return token;
      } catch (error) {
        console.error('Error in createVerificationToken:', error);
        throw error;
      }
    },

    // Get a verification token
    async useVerificationToken({ identifier, token }) {
      try {
        const key = `emailToken:${identifier}:${token}`;
        const result = await CacheService.get(key);
        
        if (!result) return null;
        
        // Delete the token after use (one-time use)
        await CacheService.invalidate(key);
        
        return {
          ...result,
          expires: new Date(result.expires)
        };
      } catch (error) {
        console.error('Error in useVerificationToken:', error);
        return null;
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
      try {
        const { sessionToken, userId, expires } = session;
        const key = `session:${sessionToken}`;
        await CacheService.set(
          key, 
          { ...session, userId: String(userId) }, 
          Math.ceil((expires.getTime() - Date.now()) / 1000) // Convert ms to seconds
        );
        return session;
      } catch (error) {
        console.error('Error in createSession:', error);
        throw error;
      }
    },
    
    async getSessionAndUser(sessionToken) {
      // Sessions are JWT-based, so we don't need this
      return null;
    },
    
    async getSession(sessionToken) {
      try {
        const key = `session:${sessionToken}`;
        const session = await CacheService.get(key);
        
        if (!session) return null;
        
        // Check if session has expired
        if (new Date(session.expires) < new Date()) {
          await CacheService.invalidate(key);
          return null;
        }
        
        return {
          ...session,
          expires: new Date(session.expires)
        };
      } catch (error) {
        console.error('Error in getSession:', error);
        return null;
      }
    },
    
    async updateSession(session) {
      try {
        const { sessionToken } = session;
        const key = `session:${sessionToken}`;
        
        // Get existing session
        const existingSession = await CacheService.get(key);
        if (!existingSession) return null;
        
        // Update session
        const updatedSession = {
          ...existingSession,
          ...session
        };
        
        await CacheService.set(
          key, 
          updatedSession, 
          Math.ceil((new Date(updatedSession.expires).getTime() - Date.now()) / 1000)
        );
        
        return updatedSession;
      } catch (error) {
        console.error('Error in updateSession:', error);
        throw error;
      }
    },
    
    async deleteSession(sessionToken) {
      try {
        await CacheService.invalidate(`session:${sessionToken}`);
      } catch (error) {
        console.error('Error in deleteSession:', error);
        throw error;
      }
    }
  };
}