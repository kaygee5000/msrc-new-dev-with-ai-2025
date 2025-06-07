// src/app/api/districts/[id]/stats/route.js
import { NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import CacheService from '@/utils/cache';

/**
 * GET handler for retrieving statistics for a specific district
 */
export async function GET(request, { params }) {
  try {
    const { id: districtId } = await params;
    const { searchParams } = new URL(request.url);

    // Get period parameters
    const year = searchParams.get('year');
    const term = searchParams.get('term');
    const week = searchParams.get('week');

    // Create cache key for this district's stats
    const cacheKey = `district:${districtId}:stats:${year || 'all'}:${term || 'all'}:${week || 'all'}`;

    // Use cache service for district stats data
    const cachedOrFresh = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const db = await getConnection();
        try {
          // 1. District details
          const [districtRows] = await db.query(
            `SELECT d.*, r.name AS region_name
               FROM districts d
               LEFT JOIN regions r ON d.region_id = r.id
               WHERE d.id = ?`,
            [districtId]
          );
          const district = districtRows[0] || null;

          // 2. Circuit count
          const [circuitCountRows] = await db.query(
            'SELECT COUNT(*) AS circuitCount FROM circuits WHERE district_id = ?',
            [districtId]
          );
          const circuitCount = circuitCountRows[0]?.circuitCount || 0;

          // 3. School count
          const [schoolCountRows] = await db.query(
            'SELECT COUNT(*) AS schoolCount FROM schools WHERE district_id = ?',
            [districtId]
          );
          const schoolCount = schoolCountRows[0]?.schoolCount || 0;

          // 4. Enrollment aggregation
          let enrolmentQuery = `
            SELECT
              SUM(total_population) AS totalStudents,
              SUM(normal_boys_total + special_boys_total) AS boys,
              SUM(normal_girls_total + special_girls_total) AS girls
            FROM school_enrolment_totals
            WHERE district_id = ?`;
          const enrolmentParams = [districtId];
          if (year) { enrolmentQuery += ' AND year = ?'; enrolmentParams.push(year); }
          if (term) { enrolmentQuery += ' AND term = ?'; enrolmentParams.push(term); }
          if (week) { enrolmentQuery += ' AND week_number = ?'; enrolmentParams.push(week); }
          enrolmentQuery += ' GROUP BY district_id';
          const [enrolmentRows] = await db.query(enrolmentQuery, enrolmentParams);
          const enrolment = enrolmentRows[0] ? {
            totalStudents: enrolmentRows[0].totalStudents || 0,
            genderDistribution: {
              boys: enrolmentRows[0].boys || 0,
              girls: enrolmentRows[0].girls || 0
            }
          } : null;

          // 5. Student attendance aggregation
          let attendanceQuery = `
            SELECT
              SUM(total_population) AS totalEnrolled,
              SUM(normal_boys_total + normal_girls_total + special_boys_total + special_girls_total) AS totalPresent
            FROM school_student_attendance_totals
            WHERE district_id = ?`;
          const attendanceParams = [districtId];
          if (year) { attendanceQuery += ' AND year = ?'; attendanceParams.push(year); }
          if (term) { attendanceQuery += ' AND term = ?'; attendanceParams.push(term); }
          if (week) { attendanceQuery += ' AND week_number = ?'; attendanceParams.push(week); }
          attendanceQuery += ' GROUP BY district_id';
          const [attendanceRows] = await db.query(attendanceQuery, attendanceParams);
          const studentAttendance = attendanceRows[0] ? {
            totalEnrolled: attendanceRows[0].totalEnrolled || 0,
            totalPresent: attendanceRows[0].totalPresent || 0,
            attendanceRate: attendanceRows[0].totalEnrolled > 0
              ? Math.round((attendanceRows[0].totalPresent / attendanceRows[0].totalEnrolled) * 100)
              : 0
          } : null;

          // 6. Teacher attendance aggregation
          let teacherQuery = `
            SELECT
              COUNT(DISTINCT id) AS totalTeachers,
              SUM(days_present) / SUM(school_session_days) * 100 AS attendanceRate,
              SUM(excises_marked) / NULLIF(SUM(excises_given), 0) * 100 AS exerciseCompletionRate
            FROM teacher_attendances
            WHERE district_id = ?`;
          const teacherParams = [districtId];
          if (year) { teacherQuery += ' AND year = ?'; teacherParams.push(year); }
          if (term) { teacherQuery += ' AND term = ?'; teacherParams.push(term); }
          if (week) { teacherQuery += ' AND week_number = ?'; teacherParams.push(week); }
          teacherQuery += ' GROUP BY district_id';
          const [teacherRows] = await db.query(teacherQuery, teacherParams);
          const teacherAttendance = teacherRows[0] ? {
            totalTeachers: teacherRows[0].totalTeachers || 0,
            attendanceRate: parseFloat(teacherRows[0].attendanceRate || 0),
            exerciseCompletionRate: parseFloat(teacherRows[0].exerciseCompletionRate || 0)
          } : null;

          return { district, circuitCount, schoolCount, enrolment, studentAttendance, teacherAttendance };
        } finally {
          if (db && db.release) db.release();
        }
      },
      3600 // cache for 1 hour
    );

    return NextResponse.json({ success: true, district: cachedOrFresh.district, statistics: {
      enrolment: cachedOrFresh.enrolment,
      studentAttendance: cachedOrFresh.studentAttendance,
      teacherAttendance: cachedOrFresh.teacherAttendance,
      circuitCount: cachedOrFresh.circuitCount,
      schoolCount: cachedOrFresh.schoolCount
    }});
  } catch (error) {
    console.error('Error in district stats API:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch district statistics' },
      { status: 500 }
    );
  }
}