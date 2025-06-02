import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import pool from '@/utils/db';
import { RedisAdapter } from '@/utils/authAdapter';
import { verifyPassword } from '@/utils/password';
import EmailService from '@/utils/emailService';
import CacheService from '@/utils/cache';

/**
 * Normalize a phone number to a standard format for comparison
 * @param {string} phoneNumber - The phone number to normalize
 * @returns {string} - The normalized phone number
 */
function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  let digits = phoneNumber.replace(/\D/g, '');
  
  // Ghana specific handling (example assuming Ghana's country code is 233)
  // If it starts with 0, remove the 0 as it's a local prefix
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  
  // If it doesn't have the country code and is 9 digits (typical mobile number length in Ghana)
  // add the country code
  if (digits.length === 9) {
    digits = '233' + digits;
  }
  
  return digits;
}

/**
 * Get a user's program roles from the database
 * @param {number} userId - The user ID
 * @returns {Promise<Array>} - The program roles
 */
async function getUserProgramRoles(userId) {
  try {
    const [programRoles] = await pool.query(`
      SELECT upr.*, p.name as program_name, p.code as program_code 
      FROM user_program_roles upr
      JOIN programs p ON upr.program_id = p.id
      WHERE upr.user_id = ?
    `, [userId]);
    
    return programRoles || [];
  } catch (error) {
    console.error('Error fetching program roles:', error);
    return [];
  }
}

/**
 * Format the user object for the JWT token
 * @param {Object} user - The user from the database
 * @returns {Promise<Object>} - The formatted user object
 */
async function formatUserForToken(user) {
  // Remove sensitive fields
  const { password, ...userWithoutPassword } = user;
  
  // Get user's program roles
  const programRoles = await getUserProgramRoles(user.id);
  
  return {
    ...userWithoutPassword,
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || user.email,
    programRoles
  };
}

// Configure NextAuth
export const authOptions = {
  adapter: RedisAdapter(),  // Using our custom Redis adapter
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
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [credentials.email]
          );
          
          // console.log('Users found:', users, 'credentials', credentials);
          
          if (!users.length) return null;
          
          const user = users[0];
          
          // Verify password using our utility
          const isPasswordValid = await verifyPassword(credentials.password, user.password);
          
          if (!isPasswordValid) return null;
          
          // Update last login timestamp
          await pool.query(
            'UPDATE users SET updated_at = NOW() WHERE id = ?',
            [user.id]
          );
          
          // Return formatted user object for token
          return await formatUserForToken(user);
        } catch (error) {
          console.error('NextAuth authorize error:', error);
          return null;
        }
      }
    }),
    
    // Email provider for passwordless login with magic links
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM,
      maxAge: 10 * 60, // Magic links are valid for 10 min
      
      // Custom function to send the email
      async sendVerificationRequest({ identifier, url, provider }) {
        try {
          const [users] = await pool.query(
            'SELECT first_name, last_name, name FROM users WHERE email = ? LIMIT 1',
            [identifier]
          );
          
          // Get user name for personalized email
          const user = users.length ? users[0] : null;
          const name = user 
            ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name 
            : 'mSRC User';
          
          // Use our EmailService for consistent email templates
          await EmailService.sendMagicLinkEmail({
            email: identifier,
            name,
            magicLink: url
          });
          
          console.log(`Magic link sent to ${identifier}`);
        } catch (error) {
          console.error('Error sending verification email', error);
          throw new Error('Failed to send verification email');
        }
      }
    }),
    
    // Custom OTP Provider for SMS-based login
    CredentialsProvider({
      id: "otp-login",
      name: "OTP Login",
      credentials: {
        phoneOrEmail: { label: "Phone/Email", type: "text" },
        otp: { label: "One-Time Code", type: "text" },
        type: { label: "Type", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.phoneOrEmail || !credentials?.otp || !credentials?.type) {
            return null;
          }
          
          // Get the OTP data from CacheService
          const otpKey = `otp:${credentials.phoneOrEmail}`;
          const otpDataString = await CacheService.get(otpKey);
          
          if (!otpDataString) {
            throw new Error("Verification code expired or not found");
          }
          
          const otpData = JSON.parse(otpDataString);
          
          // Verify the OTP matches and hasn't expired
          if (otpData.otp !== credentials.otp) {
            // Increment failed attempts
            otpData.attempts = (otpData.attempts || 0) + 1;
            
            // If too many failed attempts, invalidate the OTP
            if (otpData.attempts >= 5) {
              await CacheService.del(otpKey);
              throw new Error("Too many failed attempts. Please request a new code.");
            }
            
            // Save updated attempts
            await CacheService.set(otpKey, JSON.stringify(otpData), 'KEEPTTL');
            throw new Error("Invalid verification code");
          }
          
          // Check expiration
          if (Date.now() > otpData.expiresAt) {
            await CacheService.del(otpKey);
            throw new Error("Verification code has expired");
          }
          
          // Find user by email or phone with flexible matching
          let user;
          if (credentials.type === 'email') {
            const [users] = await pool.query(
              'SELECT * FROM users WHERE email = ? LIMIT 1',
              [credentials.phoneOrEmail]
            );
            user = users.length > 0 ? users[0] : null;
          } else if (credentials.type === 'phone') {
            // Normalize the phone number for comparison
            const normalizedPhone = normalizePhoneNumber(credentials.phoneOrEmail);
            
            // Get all users to check various phone formats
            const [users] = await pool.query(
              'SELECT * FROM users'
            );
            
            // Find a user with a matching phone number in any format
            user = users.find(u => normalizePhoneNumber(u.phone_number) === normalizedPhone);
          }
          
          if (!user) {
            throw new Error("User not found");
          }
          
          // Delete the OTP after successful verification
          await CacheService.del(otpKey);
          
          // Update last login timestamp
          await pool.query(
            'UPDATE users SET updated_at = NOW() WHERE id = ?',
            [user.id]
          );
          
          // Return formatted user object for token
          return await formatUserForToken(user);
        } catch (error) {
          console.error('OTP login error:', error);
          throw new Error(error.message || "Authentication failed");
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
    signOut: '/',
  },
  
  // Configure callbacks
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in - user object contains all user data from authorize
      if (user) {
        // Copy all properties from user to token
        Object.assign(token, user);
      }
      
      return token;
    },
    async session({ session, token }) {
      // Send all token properties to the client session
      session.user = {
        ...session.user,
        ...token
      };
      
      // Ensure these critical properties exist
      if (!session.user.programRoles) {
        session.user.programRoles = [];
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