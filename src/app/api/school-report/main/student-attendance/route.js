import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/utils/db';

// GET handler for student attendance data
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('school_id');
    const circuitId = searchParams.get('circuit_id');
    const districtId = searchParams.get('district_id');
    const regionId = searchParams.get('region_id');
    const year = searchParams.get('year');
    const term = searchParams.get('term');

    // Validate required parameters
    if (!year || !term) {
      return NextResponse.json({ message: 'Year and term are required parameters' }, { status: 400 });
    }
    
    // Get optional week parameter
    const week = searchParams.get('week');

    // Build query based on provided filters
    let query = `
      SELECT 
        s.id as school_id,
        s.name as school_name,
        c.id as circuit_id,
        c.name as circuit_name,
        d.id as district_id,
        d.name as district_name,
        r.id as region_id,
        r.name as region_name,
        sa.year,
        sa.term,
        sa.week_number,
        sa.attendance_data,
        sa.created_at,
        sa.updated_at
      FROM student_attendances sa
      JOIN schools s ON sa.school_id = s.id
      JOIN circuits c ON s.circuit_id = c.id
      JOIN districts d ON c.district_id = d.id
      JOIN regions r ON d.region_id = r.id
      WHERE sa.year = ? AND sa.term = ?
    `;

    const queryParams = [year, term];

    // Add filters based on provided parameters
    if (schoolId) {
      query += ' AND s.id = ?';
      queryParams.push(schoolId);
    } else if (circuitId) {
      query += ' AND c.id = ?';
      queryParams.push(circuitId);
    } else if (districtId) {
      query += ' AND d.id = ?';
      queryParams.push(districtId);
    } else if (regionId) {
      query += ' AND r.id = ?';
      queryParams.push(regionId);
    }
    
    // Add week filter if provided
    if (week) {
      query += ' AND sa.week_number = ?';
      queryParams.push(week);
    }

    query += ' ORDER BY r.name, d.name, c.name, s.name, sa.week_number';

    // Execute query
    const [results] = await db.query(query, queryParams);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching student attendance data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for creating/updating student attendance data
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.school_id || !data.year || !data.term || !data.week_number) {
      return NextResponse.json({ 
        message: 'School ID, year, term, and week number are required fields' 
      }, { status: 400 });
    }

    // Calculate attendance rate
    const totalEnrolled = (data.boys_present || 0) + (data.girls_present || 0) + 
                         (data.boys_absent || 0) + (data.girls_absent || 0);
    const totalPresent = (data.boys_present || 0) + (data.girls_present || 0);
    const attendanceRate = totalEnrolled > 0 ? (totalPresent / totalEnrolled) * 100 : 0;

    // Check if record exists
    const [existing] = await db.query(
      'SELECT id FROM student_attendances WHERE school_id = ? AND year = ? AND term = ? AND week_number = ?',
      [data.school_id, data.year, data.term, data.week_number]
    );

    let result;
    
    if (existing && existing.length > 0) {
      // Update existing record
      const [updateResult] = await db.query(
        `UPDATE student_attendance SET 
          boys_present = ?,
          girls_present = ?,
          total_present = ?,
          boys_absent = ?,
          girls_absent = ?,
          total_absent = ?,
          attendance_rate = ?,
          updated_at = NOW()
        WHERE school_id = ? AND year = ? AND term = ? AND grade = ? AND month = ? AND week = ?`,
        [
          data.boys_present || 0,
          data.girls_present || 0,
          totalPresent,
          data.boys_absent || 0,
          data.girls_absent || 0,
          (data.boys_absent || 0) + (data.girls_absent || 0),
          attendanceRate,
          data.school_id,
          data.year,
          data.term,
          data.week_number
        ]
      );
      result = { id: existing[0].id, updated: true };
    } else {
      // Insert new record
      const [insertResult] = await db.query(
        `INSERT INTO student_attendances (
          school_id, year, term, grade, month, week, 
          boys_present, girls_present, total_present,
          boys_absent, girls_absent, total_absent,
          attendance_rate, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          data.school_id,
          data.year,
          data.term,
          data.week_number,
          data.boys_present || 0,
          data.girls_present || 0,
          totalPresent,
          data.boys_absent || 0,
          data.girls_absent || 0,
          (data.boys_absent || 0) + (data.girls_absent || 0),
          attendanceRate
        ]
      );
      result = { id: insertResult.insertId, created: true };
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error saving student attendance data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
