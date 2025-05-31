const mysql = require('mysql2/promise');

async function examineTable(connection, tableName) {
  console.log(`\n=== Structure of ${tableName} ===`);
  
  // Get table structure
  const [columns] = await connection.query(`DESCRIBE ${tableName}`);
  console.table(columns);
  
  // Get row count
  const [count] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
  console.log(`\nTotal rows: ${count[0].count}`);
  
  // Show sample data
  console.log(`\n=== Sample Data (first 2 rows) ===`);
  const [rows] = await connection.query(`SELECT * FROM ${tableName} LIMIT 2`);
  console.table(rows);
}

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'field.msrcghana.org',
      user: 'forge',
      password: 'qv0NqfPLRLPEtMHm4snH',
      database: 'field_msrcghana_db',
      port: 3306
    });
    
    console.log('Successfully connected to MySQL database');
    
    // Examine each table
    await examineTable(connection, 'school_enrolment_totals');
    await examineTable(connection, 'school_student_attendance_totals');
    await examineTable(connection, 'teacher_attendances');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.sqlState) console.error('SQL State:', error.sqlState);
    if (error.sqlMessage) console.error('SQL Message:', error.sqlMessage);
  } finally {
    if (connection) await connection.end();
  }
}

main();
