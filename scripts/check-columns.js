const mysql = require('mysql2/promise');

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

    // Get column names
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'field_msrcghana_db' 
      AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [tableName]);

    console.log(`\nColumns in ${tableName}:`);
    console.table(columns);

    // Get row count
    const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    console.log(`\nTotal rows: ${count[0].count}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
