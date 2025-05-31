const mysql = require('mysql2/promise');

async function testConnection() {
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
    
    // 1. Check if students table exists
    console.log('\n=== Examining Students Table ===');
    try {
      // Check if students table exists
      const [tables] = await connection.query("SHOW TABLES LIKE 'students'");
      if (tables.length === 0) {
        console.log('Students table not found');
        return;
      }
      
      // Get table structure
      console.log('\n=== Students Table Structure ===');
      const [columns] = await connection.query('DESCRIBE students');
      console.table(columns);
      
      // Get row count
      const [count] = await connection.query('SELECT COUNT(*) as count FROM students');
      console.log(`\nTotal students: ${count[0].count}`);
      
      // Get gender distribution
      const [genderDist] = await connection.query(
        'SELECT gender, COUNT(*) as count FROM students GROUP BY gender'
      );
      console.log('\nGender Distribution:');
      console.table(genderDist);
      
      // Show sample data
      console.log('\n=== Sample Student Data (first 5 rows) ===');
      const [students] = await connection.query(
        'SELECT id, first_name, last_name, gender, date_of_birth, created_at FROM students LIMIT 5'
      );
      console.table(students);
      
    } catch (err) {
      console.error('Error examining students table:', err.message);
    }
    
    // 2. Check for enrollment data
    console.log('\n=== Checking for Enrollment Data ===');
    try {
      // Check if student_enrolments table exists
      const [tables] = await connection.query("SHOW TABLES LIKE 'student_enrolments'");
      if (tables.length === 0) {
        console.log('Student enrolments table not found');
        return;
      }
      
      // Get table structure
      console.log('\n=== Student Enrolments Table Structure ===');
      const [columns] = await connection.query('DESCRIBE student_enrolments');
      console.table(columns);
      
      // Get current academic year
      console.log('\n=== Academic Years ===');
      const [years] = await connection.query(
        'SELECT DISTINCT academic_year FROM student_enrolments ORDER BY academic_year DESC'
      );
      console.table(years);
      
      // Get enrollment counts by year
      const [enrollmentCounts] = await connection.query(`
        SELECT academic_year, COUNT(*) as student_count 
        FROM student_enrolments 
        GROUP BY academic_year 
        ORDER BY academic_year DESC
      `);
      console.log('\nEnrollment Counts by Academic Year:');
      console.table(enrollmentCounts);
      
      // Show sample enrollment data
      console.log('\n=== Sample Enrollment Data (first 5 rows) ===');
      const [enrollments] = await connection.query(`
        SELECT e.*, s.first_name, s.last_name, s.gender
        FROM student_enrolments e
        JOIN students s ON e.student_id = s.id
        ORDER BY e.academic_year DESC, e.class_level
        LIMIT 5
      `);
      console.table(enrollments);
      
    } catch (err) {
      console.error('Error examining enrollment data:', err.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.sqlState) console.error('SQL State:', error.sqlState);
    if (error.sqlMessage) console.error('SQL Message:', error.sqlMessage);
  } finally {
    if (connection) await connection.end();
  }
}

testConnection();
