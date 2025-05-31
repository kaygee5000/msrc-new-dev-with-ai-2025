import { NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import CacheService from '@/utils/cache';

/**
 * GET handler for retrieving statistics for a specific district
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Get period parameters
    const year = searchParams.get('year');
    const term = searchParams.get('term');
    const week = searchParams.get('week');
    
    // Create cache key for this district's stats
    const cacheKey = `district:${id}:stats:${year || 'all'}:${term || 'all'}:${week || 'all'}`;
    
    // Use cache service for district stats data
    const cachedOrFresh = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const db = await getConnection();
        
        try {
          // Get enrollment data aggregated by district
          let enrollmentQuery = `
            SELECT 
              SUM(total_population) as totalStudents,
              SUM(normal_boys_total + special_boys_total) as boys,
              SUM(normal_girls_total + special_girls_total) as girls
            FROM school_enrolment_totals
            WHERE district_id = ?
          `;
          
          const enrollmentParams = [id];
          
          if (year) {
            enrollmentQuery += ' AND year = ?';
            enrollmentParams.push(year);
          }
          
          if (term) {
            enrollmentQuery += ' AND term = ?';
            enrollmentParams.push(term);
          }
          
          if (week) {
            enrollmentQuery += ' AND week_number = ?';
            enrollmentParams.push(week);
          }
          
          enrollmentQuery += ' GROUP BY district_id';
          
          const [enrollmentRows] = await db.query(enrollmentQuery, enrollmentParams);
          
          // Get student attendance data aggregated by district
          let attendanceQuery = `
            SELECT 
              SUM(total_population) as totalEnrolled,
              SUM(normal_boys_total + normal_girls_total + 
              special_boys_total + special_girls_total) as totalPresent
            FROM school_student_attendance_totals
            WHERE district_id = ?
          `;
          
          const attendanceParams = [id];
          
          if (year) {
            attendanceQuery += ' AND year = ?';
            attendanceParams.push(year);
          }
          
          if (term) {
            attendanceQuery += ' AND term = ?';
            attendanceParams.push(term);
          }
          
          if (week) {
            attendanceQuery += ' AND week_number = ?';
            attendanceParams.push(week);
          }
          
          attendanceQuery += ' GROUP BY district_id';
          
          const [attendanceRows] = await db.query(attendanceQuery, attendanceParams);
          
          // Get teacher attendance data aggregated by district
          let teacherQuery = `
            SELECT 
              COUNT(DISTINCT id) as totalTeachers,
              SUM(days_present) / SUM(school_session_days) * 100 as attendanceRate,
              SUM(days_punctual) / SUM(days_present) * 100 as punctualityRate,
              SUM(excises_marked) / NULLIF(SUM(excises_given), 0) * 100 as exerciseCompletionRate
            FROM teacher_attendances
            WHERE district_id = ?
          `;
          
          const teacherParams = [id];
          
          if (year) {
            teacherQuery += ' AND year = ?';
            teacherParams.push(year);
          }
          
          if (term) {
            teacherQuery += ' AND term = ?';
            teacherParams.push(term);
          }
          
          if (week) {
            teacherQuery += ' AND week_number = ?';
            teacherParams.push(week);
          }
          
          teacherQuery += ' GROUP BY district_id';
          
          const [teacherRows] = await db.query(teacherQuery, teacherParams);
          
          // Get counts for this district
          const [schoolCountRows] = await db.query(
            'SELECT COUNT(*) as schoolCount FROM schools WHERE district_id = ?', 
            [id]
          );
          
          const [circuitCountRows] = await db.query(
            'SELECT COUNT(*) as circuitCount FROM circuits WHERE district_id = ?', 
            [id]
          );
          
          // Format the response
          const enrollment = enrollmentRows[0] ? {
            totalStudents: enrollmentRows[0].totalStudents || 0,
            genderDistribution: {
              boys: enrollmentRows[0].boys || 0,
              girls: enrollmentRows[0].girls || 0
            }
          } : null;
          
          const studentAttendance = attendanceRows[0] ? {
            totalEnrolled: attendanceRows[0].totalEnrolled || 0,
            totalPresent: attendanceRows[0].totalPresent || 0,
            attendanceRate: attendanceRows[0].totalEnrolled > 0 
              ? Math.round((attendanceRows[0].totalPresent / attendanceRows[0].totalEnrolled) * 100)
              : 0
          } : null;
          
          const teacherAttendance = teacherRows[0] ? {
            totalTeachers: teacherRows[0].totalTeachers || 0,
            attendanceRate: parseFloat(teacherRows[0].attendanceRate || 0),
            punctualityRate: parseFloat(teacherRows[0].punctualityRate || 0),
            exerciseCompletionRate: parseFloat(teacherRows[0].exerciseCompletionRate || 0)
          } : null;
          
          return {
            enrolment: enrollment,
            studentAttendance: studentAttendance,
            teacherAttendance: teacherAttendance,
            schoolCount: schoolCountRows[0]?.schoolCount || 0,
            circuitCount: circuitCountRows[0]?.circuitCount || 0
          };
          
        } catch (error) {
          console.error('Database error:', error);
          throw new Error('Failed to fetch district statistics from database');
        }
      },
      // Cache for 1 hour
      3600
    );
    
    return NextResponse.json({
      success: true,
      ...cachedOrFresh
    });
    
  } catch (error) {
    console.error('Error in district stats API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to fetch district statistics' 
      },
      { status: 500 }
    );
  }
}