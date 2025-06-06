import { NextResponse } from 'next/server';
import db from '@/utils/db';
import { aggregateStudentAttendance } from '@/utils/statisticsHelpers';

/**
 * GET handler for student attendance statistics
 * Retrieves student attendance data filtered by school, circuit, district, or region
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
    const aggregate = searchParams.get('aggregate') === 'true';
    
    console.log('Student Attendance API called with params:', { 
      schoolId, circuitId, districtId, regionId, year, term, weekNumber, aggregate 
    });

    let query = `
      SELECT 
        id, school_id, circuit_id, district_id, region_id,
        normal_boys_total, normal_girls_total,
        special_boys_total, special_girls_total,
        total_population, term, week_number, year
      FROM school_student_attendance_totals
      WHERE year = ? AND term = ?
    `;
    
    const params = [year, term];
    
    // Add week filter if provided when not aggregating
    if (!aggregate && weekNumber) {
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
    
    if (!aggregate) {
      query += ' ORDER BY week_number DESC';
      // Limit to 1 record if week number is specified
      if (weekNumber) query += ' LIMIT 1';
    }
    
    console.log('Student attendance query:', query);
    console.log('Student attendance params:', params);
    
    const [rows] = await db.query(query, params);
    
    console.log(`Student attendance query returned ${rows.length} rows`);
    
    if (rows.length === 0) {
      console.log('No student attendance data found for the specified parameters');
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    // Calculate attendance rates
    const processedData = rows.map(row => {
      const totalEnrolled = row.total_population || 0;
      const totalPresent = (row.normal_boys_total || 0) + 
                          (row.normal_girls_total || 0) + 
                          (row.special_boys_total || 0) + 
                          (row.special_girls_total || 0);
      
      const attendanceRate = totalEnrolled > 0 ? (totalPresent / totalEnrolled) * 100 : 0;
      
      return {
        ...row,
        attendance_rate: parseFloat(attendanceRate.toFixed(2))
      };
    });
    
    if (!aggregate) {
      return NextResponse.json({ success: true, data: processedData });
    }
    // aggregate case
    const aggData = aggregateStudentAttendance(rows);
    return NextResponse.json({ success: true, data: aggData });
    
  } catch (error) {
    console.error('Error fetching student attendance data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student attendance data' },
      { status: 500 }
    );
  }
}
