import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/utils/db';

// GET handler for facilitator strands covered data
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

    // Build query based on provided filters
    let query = `
      SELECT 
        sc.id as strands_id,
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
        sc.year,
        sc.term,
        sc.semester,
        sc.semester_week_number,
        sc.units_covered_object,
        sc.cs_comments,
        sc.created_at,
        sc.updated_at
      FROM strands_covered sc
      JOIN teachers t ON sc.teacher_id = t.id
      JOIN schools s ON sc.school_id = s.id
      JOIN circuits c ON s.circuit_id = c.id
      JOIN districts d ON c.district_id = d.id
      JOIN regions r ON d.region_id = r.id
      WHERE sc.year = ? AND sc.term = ?
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

    query += ' ORDER BY r.name, d.name, c.name, s.name, t.last_name, t.first_name';

    // Execute query
    const [results] = await db.query(query, queryParams);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching facilitator strands covered data:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// POST handler for creating/updating facilitator strands covered
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
    if (!data.teacher_id || !data.school_id || !data.year || !data.term) {
      return NextResponse.json({ 
        message: 'Missing required fields: teacher_id, school_id, year, and term are required' 
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
      `SELECT id FROM strands_covered 
       WHERE teacher_id = ? AND school_id = ? AND year = ? AND term = ?
       ${data.semester_week_number ? 'AND semester_week_number = ?' : ''}`,
      data.semester_week_number 
        ? [data.teacher_id, data.school_id, data.year, data.term, data.semester_week_number]
        : [data.teacher_id, data.school_id, data.year, data.term]
    );

    let result;
    if (existingRecord && existingRecord.length > 0) {
      // Update existing record
      const updateFields = [];
      const updateValues = [];

      // Build dynamic update query
      Object.keys(data).forEach(key => {
        if (key !== 'id' && key !== 'teacher_id' && key !== 'school_id' && key !== 'year' && key !== 'term' && key !== 'semester_week_number') {
          if (key === 'units_covered_object' && typeof data[key] === 'object') {
            updateFields.push(`${key} = ?`);
            updateValues.push(JSON.stringify(data[key]));
          } else {
            updateFields.push(`${key} = ?`);
            updateValues.push(data[key]);
          }
        }
      });

      if (updateFields.length === 0) {
        return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
      }

      updateFields.push('updated_at = NOW()');
      
      const updateQuery = `
        UPDATE strands_covered 
        SET ${updateFields.join(', ')} 
        WHERE teacher_id = ? AND school_id = ? AND year = ? AND term = ?
        ${data.semester_week_number ? 'AND semester_week_number = ?' : ''}
      `;
      
      const updateQueryParams = data.semester_week_number 
        ? [...updateValues, data.teacher_id, data.school_id, data.year, data.term, data.semester_week_number]
        : [...updateValues, data.teacher_id, data.school_id, data.year, data.term];
      
      result = await db.query(updateQuery, updateQueryParams);

      return NextResponse.json({ 
        message: 'Facilitator strands covered updated successfully',
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

      // Handle JSON fields
      if (insertData.units_covered_object && typeof insertData.units_covered_object === 'object') {
        insertData.units_covered_object = JSON.stringify(insertData.units_covered_object);
      }

      const fields = Object.keys(insertData);
      const placeholders = fields.map(() => '?').join(', ');
      const values = Object.values(insertData);

      const insertQuery = `
        INSERT INTO strands_covered (${fields.join(', ')})
        VALUES (${placeholders})
      `;

      result = await db.query(insertQuery, values);

      return NextResponse.json({ 
        message: 'Facilitator strands covered created successfully',
        id: result[0].insertId
      });
    }
  } catch (error) {
    console.error('Error saving facilitator strands covered data:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
