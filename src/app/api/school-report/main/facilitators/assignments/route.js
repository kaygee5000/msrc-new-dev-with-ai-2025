import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/utils/db';

// GET handler for teacher assignments
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const schoolId = searchParams.get('school_id');
    const year = searchParams.get('year');
    const term = searchParams.get('term');

    // Build query based on provided filters
    let query = `
      SELECT 
        fa.id,
        fa.teacher_id,
        t.first_name,
        t.last_name,
        t.other_names,
        t.staff_number,
        t.rank,
        fa.school_id,
        s.name as school_name,
        c.id as circuit_id,
        c.name as circuit_name,
        d.id as district_id,
        d.name as district_name,
        r.id as region_id,
        r.name as region_name,
        fa.year,
        fa.term,
        fa.created_at,
        fa.updated_at
      FROM facilitator_assignments fa
      JOIN teachers t ON fa.teacher_id = t.id
      JOIN schools s ON fa.school_id = s.id
      JOIN circuits c ON s.circuit_id = c.id
      JOIN districts d ON c.district_id = d.id
      JOIN regions r ON d.region_id = r.id
      WHERE 1=1
    `;

    const queryParams = [];

    // Add filters based on provided parameters
    if (teacherId) {
      query += ' AND fa.teacher_id = ?';
      queryParams.push(teacherId);
    }
    
    if (schoolId) {
      query += ' AND fa.school_id = ?';
      queryParams.push(schoolId);
    }
    
    if (year) {
      query += ' AND fa.year = ?';
      queryParams.push(year);
    }
    
    if (term) {
      query += ' AND fa.term = ?';
      queryParams.push(term);
    }

    query += ' ORDER BY r.name, d.name, c.name, s.name, t.last_name, t.first_name';

    // Execute query
    const [results] = await db.query(query, queryParams);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// POST handler for creating/updating teacher assignments
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

    // Start a transaction
    await db.query('START TRANSACTION');

    try {
      // Check if teacher exists
      const [teacherCheck] = await db.query(
        'SELECT id FROM teachers WHERE id = ? AND deleted_at IS NULL',
        [data.teacher_id]
      );

      if (!teacherCheck || teacherCheck.length === 0) {
        await db.query('ROLLBACK');
        return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
      }

      // Check if assignment exists
      const [existingAssignment] = await db.query(
        'SELECT id FROM facilitator_assignments WHERE teacher_id = ? AND school_id = ? AND year = ? AND term = ?',
        [data.teacher_id, data.school_id, data.year, data.term]
      );

      let assignmentId;
      if (existingAssignment && existingAssignment.length > 0) {
        // Update existing assignment
        await db.query(
          `UPDATE facilitator_assignments SET updated_at = NOW() WHERE id = ?`,
          [existingAssignment[0].id]
        );
        assignmentId = existingAssignment[0].id;
      } else {
        // Create new assignment
        const [insertResult] = await db.query(
          `INSERT INTO facilitator_assignments (
            teacher_id, school_id, year, term, created_at, updated_at
          ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [data.teacher_id, data.school_id, data.year, data.term]
        );
        assignmentId = insertResult.insertId;
      }

      // Update teacher's current school if requested
      if (data.update_current_school) {
        await db.query(
          'UPDATE teachers SET current_school_id = ?, updated_at = NOW() WHERE id = ?',
          [data.school_id, data.teacher_id]
        );
      }

      // Commit transaction
      await db.query('COMMIT');

      return NextResponse.json({ 
        message: 'Teacher assignment saved successfully',
        id: assignmentId
      });
    } catch (error) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error saving teacher assignment:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// DELETE handler for teacher assignments
export async function DELETE(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // Alternative parameters if id is not provided
    const teacherId = searchParams.get('teacher_id');
    const schoolId = searchParams.get('school_id');
    const year = searchParams.get('year');
    const term = searchParams.get('term');

    let query;
    let queryParams;

    if (id) {
      query = 'DELETE FROM facilitator_assignments WHERE id = ?';
      queryParams = [id];
    } else if (teacherId && schoolId && year && term) {
      query = 'DELETE FROM facilitator_assignments WHERE teacher_id = ? AND school_id = ? AND year = ? AND term = ?';
      queryParams = [teacherId, schoolId, year, term];
    } else {
      return NextResponse.json({ 
        message: 'Either assignment ID or all of (teacher_id, school_id, year, term) are required' 
      }, { status: 400 });
    }

    // Delete assignment
    const [result] = await db.query(query, queryParams);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher assignment:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
