import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import crypto from 'crypto';
import pool from '@/utils/db';

/**
 * Verify password using crypto
 * @param {string} password - The password to verify
 * @param {string} hashedPassword - The stored hashed password
 * @returns {Promise<boolean>} - Whether the password matches
 */
async function verifyPassword(password, hashedPassword) {
  try {
    // Check if the password is hashed using our custom format (salt:hash)
    if (hashedPassword.includes(':')) {
      const [salt, storedHash] = hashedPassword.split(':');
      const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      return storedHash === hash;
    } 
    
    // For backwards compatibility or other hashing methods
    return false;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Configure NextAuth
export const authOptions = {
  providers: [
    // Credentials provider for username/password authentication
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }
          
          // Find user by email
          const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
            [credentials.email]
          );
          
          if (!users.length) return null;
          
          const user = users[0];
          
          // Verify password
          const isPasswordValid = await verifyPassword(credentials.password, user.password);
          
          if (!isPasswordValid) return null;
          
          // Update last login timestamp
          await pool.query(
            'UPDATE users SET birth_date = NOW() WHERE id = ?',
            [user.id]
          );
          
          // Remove password from user object before returning
          const { password: _, ...userWithoutPassword } = user;
          
          // Return user object which will be saved in the JWT token
          return {
            id: user.id,
            email: user.email,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name,
            role: user.role,
            type: user.type,
          };
        } catch (error) {
          console.error('NextAuth authorize error:', error);
          return null;
        }
      }
    })
  ],
  
  // Configure session handling
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  // Customize pages
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  // Configure callbacks
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.type = user.type;
      }
      
      // If user exists in token, enrich with program roles
      if (token.id) {
        try {
          const [programRoles] = await pool.query(`
            SELECT upr.*, p.name as program_name, p.code as program_code 
            FROM user_program_roles upr
            JOIN programs p ON upr.program_id = p.id
            WHERE upr.user_id = ?
          `, [token.id]);
          
          if (programRoles.length) {
            token.programRoles = programRoles;
          }
        } catch (error) {
          console.error('Error fetching program roles for JWT:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.type = token.type;
        session.user.programRoles = token.programRoles || [];
      }
      return session;
    }
  },
  
  // Enable debugging in development
  debug: process.env.NODE_ENV === 'development',
};

// Export handlers for Next.js
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };