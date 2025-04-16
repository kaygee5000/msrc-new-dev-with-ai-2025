import { NextResponse } from 'next/server';
import pool from '../../../../utils/db';

export async function GET(request) {
  try {
    // Get counts for regions, districts, circuits, and schools
    const [regionCount] = await pool.query('SELECT COUNT(*) as count FROM regions');
    const [districtCount] = await pool.query('SELECT COUNT(*) as count FROM districts');
    const [circuitCount] = await pool.query('SELECT COUNT(*) as count FROM circuits');
    const [schoolCount] = await pool.query('SELECT COUNT(*) as count FROM schools');
    
    // Get latest submissions (from v_pregnancy_dashboard)
    const [latestSubmissions] = await pool.query(`
      SELECT *
      FROM v_pregnancy_dashboard
      ORDER BY submitted_at DESC
      LIMIT 10
    `);
    
    // Get activity logs
    const [activityLogs] = await pool.query(`
      SELECT al.*, u.name as user_name, u.role
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

    // Enrollment and attendance stats are not available in the new view, so return null or placeholder
    const enrollmentStats = { total_boys: null, total_girls: null, total_enrollment: null };
    const attendanceStats = { avg_boys_attendance: null, avg_girls_attendance: null, avg_attendance: null };
    const facilitatorStats = { avg_facilitator_attendance: null, avg_facilitator_punctuality: null };

    return NextResponse.json({
      counts: {
        regions: regionCount[0].count,
        districts: districtCount[0].count,
        circuits: circuitCount[0].count,
        schools: schoolCount[0].count
      },
      latestSubmissions,
      activityLogs,
      stats: {
        enrollment: enrollmentStats,
        attendance: attendanceStats,
        facilitator: facilitatorStats
      },
      success: true
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}