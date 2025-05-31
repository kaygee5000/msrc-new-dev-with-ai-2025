const mysql = require('mysql2/promise');

async function getSampleRow(connection, tableName) {
  try {
    const [rows] = await connection.query(`SELECT * FROM ${tableName} LIMIT 1`);
    if (rows.length > 0) {
      const row = rows[0];
      console.log(`\nSample row from ${tableName}:`);
      
      // Format the output for better readability
      const formattedRow = {};
      for (const [key, value] of Object.entries(row)) {
        // Skip null values
        if (value === null || value === undefined) continue;
        
        // Convert dates to ISO strings
        formattedRow[key] = value instanceof Date ? value.toISOString() : value;
      }
      
      console.log(JSON.stringify(formattedRow, null, 2));
    } else {
      console.log(`No data found in ${tableName}`);
    }
  } catch (error) {
    console.error(`Error getting sample from ${tableName}:`, error.message);
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

    await getSampleRow(connection, tableName);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
