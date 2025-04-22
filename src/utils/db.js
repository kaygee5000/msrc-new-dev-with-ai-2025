import mysql from 'mysql2/promise';

// Create a centralized MySQL connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'msrc',
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
 * @returns {Object} Connection configuration
 */
export function getConnectionConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'msrc',
  };
}

/**
 * Get a user by ID
 * @param {string|number} id - User's ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserById(id) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id]
    );
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
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
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
function normalizePhone(phone) {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  // Remove leading country code '233' if present
  if (digits.startsWith('233')) {
    digits = digits.slice(3);
  }
  // Remove leading zero if present
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  // Only keep the last 9 digits (Ghanaian numbers)
  return digits.slice(-9);
}

/**
 * Get a user by phone number, matching various formats.
 * @param {string} phone - User's phone number
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function getUserByPhone(phone) {
  try {
    const normalizedInput = normalizePhone(phone);
    // Use SQL LIKE to match any phone ending with the normalized 9 digits
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', ''), '_', '') LIKE ? LIMIT 1",
      [`%${normalizedInput}`]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error fetching user by phone:', error);
    return null;
  }
}

export default pool;