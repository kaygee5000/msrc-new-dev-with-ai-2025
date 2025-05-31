/**
 * Debug script to test the statistics endpoints with specific parameters
 */
const mysql = require('mysql2/promise');

async function testStatisticsEndpoints() {
  const connection = await mysql.createConnection({
    host: 'field.msrcghana.org',
    user: 'forge',
    password: 'qv0NqfPLRLPEtMHm4snH',
    database: 'field_msrcghana_db',
    port: 3306
  });

  try {
    // Test parameters
    const schoolId = 8454;
    const year = '2021/2022';
    const term = '2';
    const weekNumber = 3;

    console.log(`Testing statistics for School ID: ${schoolId}, Year: ${year}, Term: ${term}, Week: ${weekNumber}`);
    
    // 1. Check if enrollment data exists
    console.log('\n=== Testing Enrollment Data ===');
    const [enrollmentRows] = await connection.query(`
      SELECT * FROM school_enrolment_totals 
      WHERE school_id = ? AND year = ? AND term = ?
      ORDER BY week_number DESC
    `, [schoolId, year, term]);
    
    console.log(`Found ${enrollmentRows.length} enrollment records`);
    if (enrollmentRows.length > 0) {
      console.log('Sample enrollment record:');
      console.log(JSON.stringify(enrollmentRows[0], null, 2));
    }
    
    // 2. Check if student attendance data exists
    console.log('\n=== Testing Student Attendance Data ===');
    const [attendanceRows] = await connection.query(`
      SELECT * FROM school_student_attendance_totals 
      WHERE school_id = ? AND year = ? AND term = ?
      ORDER BY week_number DESC
    `, [schoolId, year, term]);
    
    console.log(`Found ${attendanceRows.length} student attendance records`);
    if (attendanceRows.length > 0) {
      console.log('Sample student attendance record:');
      console.log(JSON.stringify(attendanceRows[0], null, 2));
    }
    
    // 3. Check if teacher attendance data exists
    console.log('\n=== Testing Teacher Attendance Data ===');
    const [teacherRows] = await connection.query(`
      SELECT * FROM teacher_attendances 
      WHERE school_id = ? AND year = ? AND term = ?
      ORDER BY week_number DESC
    `, [schoolId, year, term]);
    
    console.log(`Found ${teacherRows.length} teacher attendance records`);
    if (teacherRows.length > 0) {
      console.log('Sample teacher attendance record:');
      console.log(JSON.stringify(teacherRows[0], null, 2));
    }
    
    // 4. Check if specific week data exists
    if (weekNumber) {
      console.log(`\n=== Testing Week ${weekNumber} Data ===`);
      
      const [weekEnrollment] = await connection.query(`
        SELECT * FROM school_enrolment_totals 
        WHERE school_id = ? AND year = ? AND term = ? AND week_number = ?
      `, [schoolId, year, term, weekNumber]);
      
      console.log(`Found ${weekEnrollment.length} enrollment records for week ${weekNumber}`);
      
      const [weekAttendance] = await connection.query(`
        SELECT * FROM school_student_attendance_totals 
        WHERE school_id = ? AND year = ? AND term = ? AND week_number = ?
      `, [schoolId, year, term, weekNumber]);
      
      console.log(`Found ${weekAttendance.length} student attendance records for week ${weekNumber}`);
      
      const [weekTeacher] = await connection.query(`
        SELECT * FROM teacher_attendances 
        WHERE school_id = ? AND year = ? AND term = ? AND week_number = ?
      `, [schoolId, year, term, weekNumber]);
      
      console.log(`Found ${weekTeacher.length} teacher attendance records for week ${weekNumber}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testStatisticsEndpoints();
