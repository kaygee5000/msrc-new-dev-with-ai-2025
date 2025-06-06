import mysql from 'mysql2/promise';

/**
 * Centralized MySQL database connection and utilities
 * This file consolidates all database connection functionality
 */

// Define connection config with environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Enable SSL if required
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false // For self-signed certificates
  } : undefined,
  // Add timeouts
  connectTimeout: 10000, // 10 seconds
  // Enable keep-alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000 // 10 seconds
};

// Create connection pool with retry logic
const createPoolWithRetry = async (retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const pool = mysql.createPool(dbConfig);
      // Test the connection
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      console.log('Successfully connected to the database');
      return pool;
    } catch (error) {
      if (i === retries - 1) {
        console.error('Failed to connect to database after retries:', error);
        throw error;
      }
      console.warn(`Database connection failed (attempt ${i + 1}/${retries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Initialize the pool (reuse global in development)
let pool;
if (process.env.NODE_ENV === 'development') {
  // Use a single pool across module reloads
  if (!globalThis.__mysqlPool) {
    globalThis.__mysqlPool = await createPoolWithRetry();
    console.log('Created new global MySQL pool');
  } else {
    console.log('Reusing global MySQL pool');
  }
  pool = globalThis.__mysqlPool;
} else {
  // Production: fresh pool
  try {
    pool = await createPoolWithRetry();
  } catch (error) {
    console.error('Fatal: Could not connect to database:', error);
    // process.exit(1);
  }
}

/**
 * Get a connection from the pool
 * @returns {Promise<Object>} MySQL connection
 */
export async function getConnection() {
  if (!pool) {
    throw new Error('Database connection not initialized');
  }
  return pool;
}

export async function createPool() {
  return mysql.createPool(dbConfig);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (pool) {
    await pool.end();
    console.log('Database connection pool closed');
  }
  process.exit(0);
});

// Export the pool as the default export for backward compatibility
export default pool;