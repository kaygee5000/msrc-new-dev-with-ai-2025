const mysql = require('mysql2/promise');

async function getTableStructure(connection, tableName) {
  try {
    const [rows] = await connection.query(`DESCRIBE ${tableName}`);
    console.log(`\n=== Structure of ${tableName} ===`);
    console.table(rows);
  } catch (error) {
    console.error(`Error getting structure for ${tableName}:`, error.message);
  }
}

async function getSampleData(connection, tableName, limit = 1) {
  try {
    const [rows] = await connection.query(`SELECT * FROM ${tableName} LIMIT ?`, [limit]);
    console.log(`\n=== Sample data from ${tableName} ===`);
    if (rows.length > 0) {
      // Convert to plain objects to avoid circular references
      const plainRows = rows.map(row => ({
        ...row,
        // Convert any Date objects to ISO strings
        ...Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            value instanceof Date ? value.toISOString() : value
          ])
        )
      }));
      console.table(plainRows);
    } else {
      console.log('No data found');
    }
  } catch (error) {
    console.error(`Error getting sample data from ${tableName}:`, error.message);
  }
}

async function main() {
  const connection = await mysql.createConnection({
    host: 'field.msrcghana.org',
    user: 'forge',
    password: 'qv0NqfPLRLPEtMHm4snH',
    database: 'field_msrcghana_db',
    port: 3306
  });

  try {
    const tableName = process.argv[2];
    if (!tableName) {
      console.log('Please provide a table name as an argument');
      return;
    }

    await getTableStructure(connection, tableName);
    await getSampleData(connection, tableName);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
