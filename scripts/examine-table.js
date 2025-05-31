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
    // Get table names from command line arguments
    const tableNames = process.argv.slice(2);
    
    if (tableNames.length === 0) {
      console.log('Please provide table names as arguments');
      return;
    }

    for (const tableName of tableNames) {
      try {
        // Get column information
        const [columns] = await connection.query(`
          SELECT 
            COLUMN_NAME, 
            DATA_TYPE, 
            IS_NULLABLE, 
            COLUMN_KEY, 
            COLUMN_DEFAULT, 
            EXTRA
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = 'field_msrcghana_db' 
          AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [tableName]);

        console.log(`\n=== Structure of ${tableName} ===`);
        console.table(columns);
        
        // Get sample data
        const [rows] = await connection.query(`SELECT * FROM ${tableName} LIMIT 2`);
        console.log(`\nSample data from ${tableName}:`);
        console.table(rows);
        
      } catch (error) {
        console.error(`Error examining table ${tableName}:`, error.message);
      }
    }
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
