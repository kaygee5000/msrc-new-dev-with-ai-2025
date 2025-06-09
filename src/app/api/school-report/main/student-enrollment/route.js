import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/utils/db';

// GET handler for student enrollment data
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
        se.year,
        se.term,
        se.enrolment_data,
        se.created_at,
        se.updated_at
      FROM enrolments se
      JOIN schools s ON se.school_id = s.id
      JOIN circuits c ON s.circuit_id = c.id
      JOIN districts d ON c.district_id = d.id
      JOIN regions r ON d.region_id = r.id
      WHERE se.year = ? AND se.term = ?
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
      query += ' AND se.week_number = ?';
      queryParams.push(week);
    }

    query += ' ORDER BY r.name, d.name, c.name, s.name';

    // Execute query
    const [results] = await db.query(query, queryParams);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching student enrollment data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for creating/updating student enrollment data
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
    if (!data.school_id || !data.year || !data.term || !data.grade) {
      return NextResponse.json({ 
        message: 'School ID, year, term, and grade are required fields' 
      }, { status: 400 });
    }

    // Check if record exists
    const [existing] = await db.query(
      'SELECT id FROM enrolments WHERE school_id = ? AND year = ? AND term = ? AND grade = ?',
      [data.school_id, data.year, data.term, data.grade]
    );

    let result;
    
    if (existing && existing.length > 0) {
      // Update existing record
      const [updateResult] = await db.query(
        `UPDATE enrolments SET 
          boys_enrolled = ?,
          girls_enrolled = ?,
          total_enrolled = ?,
          updated_at = NOW()
        WHERE school_id = ? AND year = ? AND term = ? AND grade = ?`,
        [
          data.boys_enrolled || 0,
          data.girls_enrolled || 0,
          data.total_enrolled || (data.boys_enrolled || 0) + (data.girls_enrolled || 0),
          data.school_id,
          data.year,
          data.term,
          data.grade
        ]
      );
      result = { id: existing[0].id, updated: true };
    } else {
      // Insert new record
      const [insertResult] = await db.query(
        `INSERT INTO enrolments (
          school_id, year, term, grade, boys_enrolled, girls_enrolled, total_enrolled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          data.school_id,
          data.year,
          data.term,
          data.grade,
          data.boys_enrolled || 0,
          data.girls_enrolled || 0,
          data.total_enrolled || (data.boys_enrolled || 0) + (data.girls_enrolled || 0)
        ]
      );
      result = { id: insertResult.insertId, created: true };
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error saving student enrollment data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
