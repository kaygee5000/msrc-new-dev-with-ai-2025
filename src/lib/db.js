import { createPool } from 'mysql2/promise';

const pool = createPool({
  host: process.env.DB_HOST || 'field.msrcghana.org',
  user: process.env.DB_USER || 'forge',
  password: process.env.DB_PASSWORD || 'qv0NqfPLRLPEtMHm4snH',
  database: process.env.DB_NAME || 'field_msrcghana_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;