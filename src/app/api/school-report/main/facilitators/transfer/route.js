import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/utils/db';

// GET handler for released teachers
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
    const teacherId = searchParams.get('teacher_id');

    // Build query based on provided filters
    let query = `
      SELECT 
        rt.id as release_id,
        rt.school_id as from_school_id,
        s.name as from_school_name,
        rt.headteacher_id,
        h.first_name as headteacher_first_name,
        h.last_name as headteacher_last_name,
        rt.teacher_id,
        t.first_name,
        t.last_name,
        t.other_names,
        t.gender,
        t.email,
        t.phone_number,
        t.staff_number,
        t.rank,
        t.qualification,
        rt.comment,
        c.id as circuit_id,
        c.name as circuit_name,
        d.id as district_id,
        d.name as district_name,
        r.id as region_id,
        r.name as region_name,
        rt.created_at,
        rt.updated_at
      FROM release_teachers rt
      JOIN teachers t ON rt.teacher_id = t.id
      JOIN teachers h ON rt.headteacher_id = h.id
      JOIN schools s ON rt.school_id = s.id
      JOIN circuits c ON s.circuit_id = c.id
      JOIN districts d ON c.district_id = d.id
      JOIN regions r ON d.region_id = r.id
    `;

    const queryParams = [];

    // Add filters based on provided parameters
    if (teacherId) {
      query += ' WHERE rt.teacher_id = ?';
      queryParams.push(teacherId);
    } else if (schoolId) {
      query += ' WHERE rt.school_id = ?';
      queryParams.push(schoolId);
    } else if (circuitId) {
      query += ' WHERE c.id = ?';
      queryParams.push(circuitId);
    } else if (districtId) {
      query += ' WHERE d.id = ?';
      queryParams.push(districtId);
    } else if (regionId) {
      query += ' WHERE r.id = ?';
      queryParams.push(regionId);
    }

    query += ' ORDER BY r.name, d.name, c.name, s.name, t.last_name, t.first_name';

    // Execute query
    const [results] = await db.query(query, queryParams);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching released teachers data:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// POST handler for releasing a teacher
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
    if (!data.teacher_id || !data.school_id || !data.headteacher_id || !data.comment) {
      return NextResponse.json({ 
        message: 'Missing required fields: teacher_id, school_id, headteacher_id, and comment are required' 
      }, { status: 400 });
    }

    // Start a transaction
    await db.query('START TRANSACTION');

    try {
      // Check if teacher exists and belongs to the school
      const [teacherCheck] = await db.query(
        'SELECT id, current_school_id FROM teachers WHERE id = ?',
        [data.teacher_id]
      );

      if (!teacherCheck || teacherCheck.length === 0) {
        await db.query('ROLLBACK');
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      if (teacherCheck[0].current_school_id !== data.school_id) {
        await db.query('ROLLBACK');
        return NextResponse.json({ 
          message: 'Teacher does not belong to the specified school' 
        }, { status: 400 });
      }

      // Check if teacher is already released
      const [existingRelease] = await db.query(
        'SELECT id FROM release_teachers WHERE teacher_id = ?',
        [data.teacher_id]
      );

      if (existingRelease && existingRelease.length > 0) {
        await db.query('ROLLBACK');
        return NextResponse.json({ 
          message: 'Teacher is already in the release list' 
        }, { status: 400 });
      }

      // Set teacher's school_id to null (released)
      await db.query(
        'UPDATE teachers SET current_school_id = NULL, updated_at = NOW() WHERE id = ?',
        [data.teacher_id]
      );

      // Add teacher to release_teachers table
      const insertData = {
        school_id: data.school_id,
        headteacher_id: data.headteacher_id,
        teacher_id: data.teacher_id,
        comment: data.comment,
        created_at: new Date(),
        updated_at: new Date()
      };

      const fields = Object.keys(insertData);
      const placeholders = fields.map(() => '?').join(', ');
      const values = Object.values(insertData);

      const insertQuery = `
        INSERT INTO release_teachers (${fields.join(', ')})
        VALUES (${placeholders})
      `;

      const result = await db.query(insertQuery, values);
      
      // Commit transaction
      await db.query('COMMIT');

      return NextResponse.json({ 
        message: 'Teacher released successfully',
        id: result[0].insertId
      });
    } catch (error) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error releasing teacher:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// PUT handler for accepting a released teacher
export async function PUT(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.teacher_id || !data.new_school_id) {
      return NextResponse.json({ 
        message: 'Missing required fields: teacher_id and new_school_id are required' 
      }, { status: 400 });
    }

    // Start a transaction
    await db.query('START TRANSACTION');

    try {
      // Check if teacher exists in release_teachers
      const [releaseCheck] = await db.query(
        'SELECT id FROM release_teachers WHERE teacher_id = ?',
        [data.teacher_id]
      );

      if (!releaseCheck || releaseCheck.length === 0) {
        await db.query('ROLLBACK');
        return NextResponse.json({ 
          message: 'Teacher is not in the release list' 
        }, { status: 404 });
      }

      // Update teacher with new school_id
      await db.query(
        'UPDATE teachers SET current_school_id = ?, year_posted_to_school = YEAR(NOW()), updated_at = NOW() WHERE id = ?',
        [data.new_school_id, data.teacher_id]
      );

      // Remove teacher from release_teachers table
      await db.query(
        'DELETE FROM release_teachers WHERE teacher_id = ?',
        [data.teacher_id]
      );
      
      // Commit transaction
      await db.query('COMMIT');

      return NextResponse.json({ 
        message: 'Teacher transfer completed successfully'
      });
    } catch (error) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error accepting teacher transfer:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
