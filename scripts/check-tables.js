const mysql = require('mysql2/promise');

async function checkTable(connection, tableName) {
  try {
    const [rows] = await connection.query(`SHOW COLUMNS FROM ${tableName}`);
    console.log(`\n=== ${tableName} Columns ===`);
    console.table(rows);
    
    const [sample] = await connection.query(`SELECT * FROM ${tableName} LIMIT 1`);
    console.log(`\nSample row from ${tableName}:`);
    console.table(sample);
    
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error.message);
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
    await checkTable(connection, 'school_enrolment_totals');
    await checkTable(connection, 'school_student_attendance_totals');
    await checkTable(connection, 'teacher_attendances');
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
