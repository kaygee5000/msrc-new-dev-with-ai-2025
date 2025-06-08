import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/utils/db';

// GET handler for facilitators data
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
        f.id as facilitator_id,
        f.first_name,
        f.last_name,
        f.other_names,
        f.gender,
        f.phone_number,
        f.email,
        f.staff_number,
        f.rank,
        f.academic_qualification,
        f.professional_qualification,
        f.avatar,
        f.category,
        f.status,
        f.date_started_teacher,
        f.date_started_headteacher,
        f.is_headteacher,
        f.qualification,
        f.year_posted_to_school,
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
        fa.created_at,
        fa.updated_at
      FROM teachers f
      JOIN facilitator_assignments fa ON f.id = fa.facilitator_id
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

    query += ' ORDER BY r.name, d.name, c.name, s.name, f.last_name, f.first_name';

    // Execute query
    const [results] = await db.query(query, queryParams);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching facilitators data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for creating/updating facilitators
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
    if (!data.first_name || !data.last_name || !data.school_id || !data.year || !data.term) {
      return NextResponse.json({ 
        message: 'First name, last name, school ID, year, and term are required fields' 
      }, { status: 400 });
    }

    // Start a transaction
    await db.query('START TRANSACTION');

    try {
      let facilitatorId;
      
      if (data.facilitator_id) {
        // Update existing facilitator
        const [updateResult] = await db.query(
          `UPDATE teachers SET 
            first_name = ?,
            last_name = ?,
            other_names = ?,
            gender = ?,
            phone_number = ?,
            email = ?,
            staff_number = ?,
            rank = ?,
            academic_qualification = ?,
            professional_qualification = ?,
            qualification = ?,
            category = ?,
            status = ?,
            is_headteacher = ?,
            year_posted_to_school = ?,
            updated_at = NOW()
          WHERE id = ?`,
          [
            data.first_name,
            data.last_name,
            data.other_names || null,
            data.gender || null,
            data.phone_number || null,
            data.email || null,
            data.staff_number || null,
            data.rank || null,
            data.academic_qualification || null,
            data.professional_qualification || null,
            data.qualification || null,
            data.category || null,
            data.status || 'active',
            data.is_headteacher || 0,
            data.year_posted_to_school || null,
            data.facilitator_id
          ]
        );
        facilitatorId = data.facilitator_id;
      } else {
        // Insert new facilitator
        const [insertResult] = await db.query(
          `INSERT INTO teachers (
            first_name, last_name, other_names, gender, phone_number, email, 
            staff_number, rank, academic_qualification, professional_qualification,
            qualification, category, status, is_headteacher, year_posted_to_school,
            current_school_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            data.first_name,
            data.last_name,
            data.other_names || null,
            data.gender || null,
            data.phone_number || null,
            data.email || null,
            data.staff_number || null,
            data.rank || null,
            data.academic_qualification || null,
            data.professional_qualification || null,
            data.qualification || null,
            data.category || null,
            data.status || 'active',
            data.is_headteacher || 0,
            data.year_posted_to_school || null,
            data.school_id
          ]
        );
        facilitatorId = insertResult.insertId;
      }

      // Check if assignment exists
      const [existingAssignment] = await db.query(
        'SELECT id FROM facilitator_assignments WHERE facilitator_id = ? AND school_id = ? AND year = ? AND term = ?',
        [facilitatorId, data.school_id, data.year, data.term]
      );

      if (existingAssignment && existingAssignment.length > 0) {
        // Update existing assignment
        await db.query(
          `UPDATE facilitator_assignments SET updated_at = NOW() WHERE id = ?`,
          [existingAssignment[0].id]
        );
      } else {
        // Create new assignment
        await db.query(
          `INSERT INTO facilitator_assignments (
            facilitator_id, school_id, year, term, created_at, updated_at
          ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [facilitatorId, data.school_id, data.year, data.term]
        );
      }

      // Commit transaction
      await db.query('COMMIT');

      return NextResponse.json({ 
        facilitator_id: facilitatorId, 
        success: true 
      }, { status: 201 });
    } catch (error) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error saving facilitator data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE handler for facilitators
export async function DELETE(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const facilitatorId = searchParams.get('facilitator_id');
    const schoolId = searchParams.get('school_id');
    const year = searchParams.get('year');
    const term = searchParams.get('term');

    // Validate required parameters
    if (!facilitatorId || !schoolId || !year || !term) {
      return NextResponse.json({ 
        message: 'Facilitator ID, school ID, year, and term are required parameters' 
      }, { status: 400 });
    }

    // Delete assignment (not the facilitator record itself to preserve history)
    const [result] = await db.query(
      `DELETE FROM facilitator_assignments 
       WHERE facilitator_id = ? AND school_id = ? AND year = ? AND term = ?`,
      [facilitatorId, schoolId, year, term]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ 
        message: 'Facilitator assignment not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Facilitator assignment deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting facilitator assignment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
