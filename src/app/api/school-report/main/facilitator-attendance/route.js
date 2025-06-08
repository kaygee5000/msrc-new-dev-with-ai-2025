import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/utils/db';

// GET handler for facilitator attendance data
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
        fa.id as attendance_id,
        f.id as facilitator_id,
        f.first_name,
        f.last_name,
        s.id as school_id,
        s.name as school_name,
        c.id as circuit_id,
        c.name as circuit_name,
        d.id as district_id,
        d.name as district_name,
        r.id as region_id,
        r.name as region_name,
        fa.year,
        fa.term,
        fa.month,
        fa.week,
        fa.days_present,
        fa.days_absent,
        fa.days_late,
        fa.attendance_rate,
        fa.punctuality_rate,
        fa.created_at,
        fa.updated_at
      FROM facilitator_attendance fa
      JOIN facilitators f ON fa.facilitator_id = f.id
      JOIN schools s ON fa.school_id = s.id
      JOIN circuits c ON s.circuit_id = c.id
      JOIN districts d ON c.district_id = d.id
      JOIN regions r ON d.region_id = r.id
      WHERE fa.year = ? AND fa.term = ?
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
      query += ' AND fa.week = ?';
      queryParams.push(week);
    }

    query += ' ORDER BY r.name, d.name, c.name, s.name, f.last_name, f.first_name, fa.month, fa.week';

    // Execute query
    const [results] = await pool.query(query, queryParams);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching facilitator attendance data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for creating/updating facilitator attendance
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
    if (!data.facilitator_id || !data.school_id || !data.year || !data.term || !data.month || !data.week) {
      return NextResponse.json({ 
        message: 'Facilitator ID, school ID, year, term, month, and week are required fields' 
      }, { status: 400 });
    }

    // Calculate rates
    const totalDays = 5; // Assuming 5-day school week
    const daysPresent = data.days_present || 0;
    const daysLate = data.days_late || 0;
    const daysAbsent = data.days_absent || 0;
    
    const attendanceRate = ((daysPresent + daysLate) / totalDays) * 100;
    const punctualityRate = daysPresent > 0 ? (daysPresent / (daysPresent + daysLate)) * 100 : 0;

    // Check if record exists
    const [existing] = await pool.query(
      `SELECT id FROM facilitator_attendance 
       WHERE facilitator_id = ? AND school_id = ? AND year = ? AND term = ? AND month = ? AND week = ?`,
      [data.facilitator_id, data.school_id, data.year, data.term, data.month, data.week]
    );

    let result;
    
    if (existing && existing.length > 0) {
      // Update existing record
      const [updateResult] = await pool.query(
        `UPDATE facilitator_attendance SET 
          days_present = ?,
          days_absent = ?,
          days_late = ?,
          attendance_rate = ?,
          punctuality_rate = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          daysPresent,
          daysAbsent,
          daysLate,
          attendanceRate,
          punctualityRate,
          existing[0].id
        ]
      );
      result = { id: existing[0].id, updated: true };
    } else {
      // Insert new record
      const [insertResult] = await pool.query(
        `INSERT INTO facilitator_attendance (
          facilitator_id, school_id, year, term, month, week,
          days_present, days_absent, days_late,
          attendance_rate, punctuality_rate, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          data.facilitator_id,
          data.school_id,
          data.year,
          data.term,
          data.month,
          data.week,
          daysPresent,
          daysAbsent,
          daysLate,
          attendanceRate,
          punctualityRate
        ]
      );
      result = { id: insertResult.insertId, created: true };
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error saving facilitator attendance data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
