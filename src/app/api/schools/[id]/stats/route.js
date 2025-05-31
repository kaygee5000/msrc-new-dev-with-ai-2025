import { NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import CacheService from '@/utils/cache';

/**
 * GET handler for retrieving statistics for a specific school
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Get period parameters
    const year = searchParams.get('year');
    const term = searchParams.get('term');
    const week = searchParams.get('week');
    
    // Create cache key for this school's stats
    const cacheKey = `school:${id}:stats:${year || 'all'}:${term || 'all'}:${week || 'all'}`;
    
    // Use cache service for school stats data
    const cachedOrFresh = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const db = await getConnection();
        
        try {
          // Get enrollment data
          let enrollmentQuery = `
            SELECT 
              total_population as totalStudents,
              normal_boys_total + special_boys_total as boys,
              normal_girls_total + special_girls_total as girls
            FROM school_enrolment_totals
            WHERE school_id = ?
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
          
          enrollmentQuery += ' ORDER BY created_at DESC LIMIT 1';
          
          const [enrollmentRows] = await db.query(enrollmentQuery, enrollmentParams);
          
          // Get student attendance data
          let attendanceQuery = `
            SELECT 
              total_population as totalEnrolled,
              normal_boys_total + normal_girls_total + 
              special_boys_total + special_girls_total as totalPresent
            FROM school_student_attendance_totals
            WHERE school_id = ?
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
          
          attendanceQuery += ' ORDER BY created_at DESC LIMIT 1';
          
          const [attendanceRows] = await db.query(attendanceQuery, attendanceParams);
          
          // Get teacher attendance data
          let teacherQuery = `
            SELECT 
              COUNT(*) as totalTeachers,
              SUM(days_present) / SUM(school_session_days) * 100 as attendanceRate,
              SUM(days_punctual) / SUM(days_present) * 100 as punctualityRate,
              SUM(excises_marked) / NULLIF(SUM(excises_given), 0) * 100 as exerciseCompletionRate
            FROM teacher_attendances
            WHERE school_id = ?
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
          
          const [teacherRows] = await db.query(teacherQuery, teacherParams);
          
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
            attendanceRate: parseFloat(teacherRows[0].attendanceRate || 0).toFixed(1),
            punctualityRate: parseFloat(teacherRows[0].punctualityRate || 0).toFixed(1),
            exerciseCompletionRate: parseFloat(teacherRows[0].exerciseCompletionRate || 0).toFixed(1)
          } : null;
          
          return {
              enrolment: enrollment,
              studentAttendance: studentAttendance,
              teacherAttendance: teacherAttendance
          }
          
        } catch (error) {
          console.error('Database error:', error);
          throw new Error('Failed to fetch statistics from database');
        }
      },
      // Cache for 1 hour
      3600
    );
    
    return NextResponse.json({
      success: true,
      ...cachedOrFresh
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error in school stats API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to fetch school statistics' 
      },
      { status: 500 }
    );
  }
}
