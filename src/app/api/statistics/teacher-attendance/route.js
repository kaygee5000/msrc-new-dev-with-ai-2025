import { NextResponse } from 'next/server';
import db from '@/utils/db';

/**
 * GET handler for teacher attendance statistics
 * Retrieves teacher attendance data filtered by school, circuit, district, or region
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const circuitId = searchParams.get('circuitId');
    const districtId = searchParams.get('districtId');
    const regionId = searchParams.get('regionId');
    const year = searchParams.get('year') || '2024/2025';
    const term = searchParams.get('term') || '1';
    const weekNumber = searchParams.get('weekNumber');
    
    console.log('Teacher Attendance API called with params:', { 
      schoolId, circuitId, districtId, regionId, year, term, weekNumber 
    });

    let query = `
      SELECT 
        id, school_id, circuit_id, district_id, region_id,
        school_session_days, days_present, days_punctual, days_absent,
        days_absent_with_permission, days_absent_without_permission,
        lesson_plan_ratings, excises_given, excises_marked, position,
        week_number, term, year, created_at
      FROM teacher_attendances
      WHERE year = ? AND term = ?
    `;
    
    const params = [year, term];
    
    // Add week filter if provided
    if (weekNumber) {
      query += ' AND week_number = ?';
      params.push(weekNumber);
    }
    
    if (schoolId) {
      query += ' AND school_id = ?';
      params.push(schoolId);
    } else if (circuitId) {
      query += ' AND circuit_id = ?';
      params.push(circuitId);
    } else if (districtId) {
      query += ' AND district_id = ?';
      params.push(districtId);
    } else if (regionId) {
      query += ' AND region_id = ?';
      params.push(regionId);
    }
    
    query += ' ORDER BY week_number DESC';
    
    console.log('Teacher attendance query:', query);
    console.log('Teacher attendance params:', params);
    
    const [rows] = await db.query(query, params);
    
    console.log(`Teacher attendance query returned ${rows.length} rows`);
    
    if (rows.length === 0) {
      console.log('No teacher attendance data found for the specified parameters');
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalTeachers: 0,
            totalDaysPresent: 0,
            totalDaysPunctual: 0,
            totalDaysAbsent: 0,
            totalExercisesGiven: 0,
            totalExercisesMarked: 0,
            avgAttendanceRate: 0,
            avgPunctualityRate: 0,
            avgExerciseCompletionRate: 0
          },
          details: []
        }
      });
    }
    
    // Calculate summary statistics
    const summary = {
      totalTeachers: rows.length,
      totalDaysPresent: rows.reduce((sum, row) => sum + (row.days_present || 0), 0),
      totalDaysPunctual: rows.reduce((sum, row) => sum + (row.days_punctual || 0), 0),
      totalDaysAbsent: rows.reduce((sum, row) => sum + (row.days_absent || 0), 0),
      totalExercisesGiven: rows.reduce((sum, row) => sum + (row.excises_given || 0), 0),
      totalExercisesMarked: rows.reduce((sum, row) => sum + (row.excises_marked || 0), 0),
      avgAttendanceRate: rows.length > 0 
        ? (rows.reduce((sum, row) => {
            const sessionDays = row.school_session_days || 1;
            return sum + ((row.days_present || 0) / sessionDays);
          }, 0) / rows.length) * 100
        : 0,
      avgPunctualityRate: rows.length > 0
        ? (rows.reduce((sum, row) => {
            const daysPresent = row.days_present || 1;
            return sum + ((row.days_punctual || 0) / daysPresent);
          }, 0) / rows.length) * 100
        : 0,
      avgExerciseCompletionRate: rows.length > 0
        ? (rows.reduce((sum, row) => {
            const exercisesGiven = row.excises_given || 1;
            return sum + ((row.excises_marked || 0) / exercisesGiven);
          }, 0) / rows.length) * 100
        : 0
    };
    
    // Format the summary values to 2 decimal places
    Object.keys(summary).forEach(key => {
      if (typeof summary[key] === 'number' && key.startsWith('avg')) {
        summary[key] = parseFloat(summary[key].toFixed(2));
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        summary,
        details: rows
      }
    });
    
  } catch (error) {
    console.error('Error fetching teacher attendance data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teacher attendance data' },
      { status: 500 }
    );
  }
}
