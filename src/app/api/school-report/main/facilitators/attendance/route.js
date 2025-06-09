import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/utils/db';

// GET handler for facilitator attendance data (includes attendance, exercises, lesson plans)
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
        ta.id as attendance_id,
        t.id as facilitator_id,
        t.first_name,
        t.last_name,
        t.other_names,
        t.gender,
        t.staff_number,
        t.rank,
        t.qualification,
        s.id as school_id,
        s.name as school_name,
        c.id as circuit_id,
        c.name as circuit_name,
        d.id as district_id,
        d.name as district_name,
        r.id as region_id,
        r.name as region_name,
        ta.year,
        ta.term,
        ta.week_number,
        ta.school_session_days,
        ta.days_present,
        ta.days_absent,
        ta.days_punctual,
        ta.reason_of_absence,
        ta.days_absent_with_permission,
        ta.days_absent_without_permission,
        ta.lesson_plan_ratings,
        ta.excises_given,
        ta.excises_marked,
        ta.cs_comments,
        ta.created_at,
        ta.updated_at
      FROM teacher_attendances ta
      JOIN teachers t ON ta.teacher_id = t.id
      JOIN schools s ON ta.school_id = s.id
      JOIN circuits c ON s.circuit_id = c.id
      JOIN districts d ON c.district_id = d.id
      JOIN regions r ON d.region_id = r.id
      WHERE ta.year = ? AND ta.term = ?
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
      query += ' AND ta.week_number = ?';
      queryParams.push(week);
    }

    query += ' ORDER BY r.name, d.name, c.name, s.name, t.last_name, t.first_name, ta.week_number';

    // Execute query
    const [results] = await db.query(query, queryParams);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching facilitator attendance data:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
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
    if (!data.teacher_id || !data.school_id || !data.year || !data.term || !data.week_number) {
      return NextResponse.json({ 
        message: 'Missing required fields: teacher_id, school_id, year, term, and week_number are required' 
      }, { status: 400 });
    }

    // Get circuit, district, region IDs from school
    const [schoolInfo] = await db.query(
      `SELECT circuit_id, districts.id as district_id, regions.id as region_id 
       FROM schools 
       JOIN circuits ON schools.circuit_id = circuits.id
       JOIN districts ON circuits.district_id = districts.id
       JOIN regions ON districts.region_id = regions.id
       WHERE schools.id = ?`,
      [data.school_id]
    );

    if (!schoolInfo || schoolInfo.length === 0) {
      return NextResponse.json({ message: 'School not found' }, { status: 404 });
    }

    // Check if record exists
    const [existingRecord] = await db.query(
      `SELECT id FROM teacher_attendances 
       WHERE teacher_id = ? AND school_id = ? AND year = ? AND term = ? AND week_number = ?`,
      [data.teacher_id, data.school_id, data.year, data.term, data.week_number]
    );

    let result;
    if (existingRecord && existingRecord.length > 0) {
      // Update existing record
      const updateFields = [];
      const updateValues = [];

      // Build dynamic update query
      Object.keys(data).forEach(key => {
        if (key !== 'id' && key !== 'teacher_id' && key !== 'school_id' && key !== 'year' && key !== 'term' && key !== 'week_number') {
          updateFields.push(`${key} = ?`);
          updateValues.push(data[key]);
        }
      });

      if (updateFields.length === 0) {
        return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
      }

      updateFields.push('updated_at = NOW()');
      
      const updateQuery = `
        UPDATE teacher_attendances 
        SET ${updateFields.join(', ')} 
        WHERE teacher_id = ? AND school_id = ? AND year = ? AND term = ? AND week_number = ?
      `;
      
      result = await db.query(
        updateQuery,
        [...updateValues, data.teacher_id, data.school_id, data.year, data.term, data.week_number]
      );

      return NextResponse.json({ 
        message: 'Facilitator attendance updated successfully',
        id: existingRecord[0].id
      });
    } else {
      // Insert new record
      const insertData = {
        ...data,
        circuit_id: schoolInfo[0].circuit_id,
        district_id: schoolInfo[0].district_id,
        region_id: schoolInfo[0].region_id,
        created_at: new Date(),
        updated_at: new Date()
      };

      const fields = Object.keys(insertData);
      const placeholders = fields.map(() => '?').join(', ');
      const values = Object.values(insertData);

      const insertQuery = `
        INSERT INTO teacher_attendances (${fields.join(', ')})
        VALUES (${placeholders})
      `;

      result = await db.query(insertQuery, values);

      return NextResponse.json({ 
        message: 'Facilitator attendance created successfully',
        id: result[0].insertId
      });
    }
  } catch (error) {
    console.error('Error saving facilitator attendance data:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
