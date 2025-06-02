import mysql from 'mysql2/promise';

/**
 * Centralized MySQL database connection and utilities
 * This file consolidates all database connection functionality
 */

// Create a centralized MySQL connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'field.msrcghana.org',
  user: process.env.DB_USER || process.env.DB_USERNAME || 'forge',
  password: process.env.DB_PASSWORD || 'qv0NqfPLRLPEtMHm4snH',
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'field_msrcghana_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Get a connection from the pool
 * @returns {Promise<Object>} MySQL connection
 */
export async function getConnection() {
  return pool;
}

/**
 * Get connection configuration
 * @returns {Object} Database connection configuration
 */
export function getConnectionConfig() {
  return {
    host: process.env.DB_HOST || 'field.msrcghana.org',
    user: process.env.DB_USER || process.env.DB_USERNAME || 'forge',
    password: process.env.DB_PASSWORD || 'qv0NqfPLRLPEtMHm4snH',
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'field_msrcghana_db',
    port: process.env.DB_PORT || 3306
  };
}

/**
 * Get a user by ID
 * @param {string|number} id - User's ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserById(id) {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

/**
 * Get a user by email
 * @param {string} email - User's email address
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserByEmail(email) {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

/**
 * Normalize a Ghanaian phone number for comparison.
 * Removes spaces, leading zeros, and country code, leaving only the last 9 digits.
 * @param {string} phone
 * @returns {string}
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, '');
  
  // Remove country code if present (Ghana is +233)
  if (normalized.startsWith('233')) {
    normalized = normalized.substring(3);
  }
  
  // Remove leading zero if present
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1);
  }
  
  // Return the last 9 digits (standard Ghanaian number length)
  return normalized.slice(-9);
}

/**
 * Get a user by phone number, matching various formats.
 * @param {string} phone - User's phone number
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserByPhone(phone) {
  try {
    const normalizedPhone = normalizePhone(phone);
    
    // Use LIKE to match phone numbers regardless of format
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE phone_number LIKE ? LIMIT 1',
      [`%${normalizedPhone}%`]
    );
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error fetching user by phone:', error);
    return null;
  }
}

// Export the pool as the default export for backward compatibility
export default pool;