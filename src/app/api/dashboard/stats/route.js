import { NextResponse } from 'next/server';
import pool from '../../../../utils/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let term = searchParams.get('term');
    let year = searchParams.get('year');

    // Auto-detect latest term/year if not provided
    if (!term || !year) {
      const [latest] = await pool.query(`
        SELECT term, year FROM school_enrolment_totals ORDER BY year DESC, term DESC LIMIT 1
      `);
      if (latest.length > 0) {
        term = term || latest[0].term;
        year = year || latest[0].year;
      }
    }

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
    
    // Enrollment: sum latest week per school for the term/year
    const [enrollmentRows] = await pool.query(`
      SELECT s.id as school_id, s.name as school_name,
        e.normal_boys_total, e.normal_girls_total, e.special_boys_total, e.special_girls_total, e.total_population
      FROM schools s
      JOIN (
        SELECT t1.* FROM school_enrolment_totals t1
        INNER JOIN (
          SELECT school_id, MAX(week_number) as max_week
          FROM school_enrolment_totals
          WHERE term = ? AND year = ?
          GROUP BY school_id
        ) t2
        ON t1.school_id = t2.school_id AND t1.week_number = t2.max_week AND t1.term = ? AND t1.year = ?
      ) e ON s.id = e.school_id
    `, [term, year, term, year]);
    const enrollmentStats = {
      total_boys: enrollmentRows.reduce((a, r) => a + (r.normal_boys_total + r.special_boys_total), 0),
      total_girls: enrollmentRows.reduce((a, r) => a + (r.normal_girls_total + r.special_girls_total), 0),
      total_enrollment: enrollmentRows.reduce((a, r) => a + (r.total_population || 0), 0),
      per_school: enrollmentRows
    };

    // Student attendance: sum latest week per school for the term/year
    const [attendanceRows] = await pool.query(`
      SELECT s.id as school_id, s.name as school_name,
        a.normal_boys_total, a.normal_girls_total, a.total_population
      FROM schools s
      JOIN (
        SELECT t1.* FROM school_student_attendance_totals t1
        INNER JOIN (
          SELECT school_id, MAX(week_number) as max_week
          FROM school_student_attendance_totals
          WHERE term = ? AND year = ?
          GROUP BY school_id
        ) t2
        ON t1.school_id = t2.school_id AND t1.week_number = t2.max_week AND t1.term = ? AND t1.year = ?
      ) a ON s.id = a.school_id
    `, [term, year, term, year]);
    const attendanceStats = {
      avg_boys_attendance: attendanceRows.length ? (attendanceRows.reduce((a, r) => a + (r.normal_boys_total || 0), 0) / attendanceRows.length) : null,
      avg_girls_attendance: attendanceRows.length ? (attendanceRows.reduce((a, r) => a + (r.normal_girls_total || 0), 0) / attendanceRows.length) : null,
      avg_attendance: attendanceRows.length ? (attendanceRows.reduce((a, r) => a + ((r.normal_boys_total + r.normal_girls_total) / (r.total_population || 1)), 0) / attendanceRows.length) * 100 : null,
      per_school: attendanceRows
    };

    // Facilitator attendance: sum latest week per school for the term/year
    const [facilitatorRows] = await pool.query(`
      SELECT s.id as school_id, s.name as school_name,
        f.total_days_present, f.total_days_punctual, f.school_session_days
      FROM schools s
      JOIN (
        SELECT t1.* FROM latest_teacher_attendances t1
        INNER JOIN (
          SELECT school_id, MAX(week_number) as max_week
          FROM latest_teacher_attendances
          WHERE term = ? AND year = ?
          GROUP BY school_id
        ) t2
        ON t1.school_id = t2.school_id AND t1.week_number = t2.max_week AND t1.term = ? AND t1.year = ?
      ) f ON s.id = f.school_id
    `, [term, year, term, year]);
    const facilitatorStats = {
      avg_facilitator_attendance: facilitatorRows.length ? (facilitatorRows.reduce((a, r) => a + ((r.total_days_present || 0) / (r.school_session_days || 1)), 0) / facilitatorRows.length) * 100 : null,
      avg_facilitator_punctuality: facilitatorRows.length ? (facilitatorRows.reduce((a, r) => a + ((r.total_days_punctual || 0) / (r.school_session_days || 1)), 0) / facilitatorRows.length) * 100 : null,
      per_school: facilitatorRows
    };

    // Get activity logs (join user_logs with users for user_name and role)
    const [activityLogs] = await pool.query(`
      SELECT al.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.type
      FROM user_logs al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

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