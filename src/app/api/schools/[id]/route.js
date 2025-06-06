import { NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import { aggregateEnrollment, aggregateStudentAttendance, aggregateTeacherAttendance } from '@/utils/statisticsHelpers';

/**
 * GET handler for retrieving a single school by ID
 */
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const db = await getConnection();
    
    // Get URL search params for statistics filtering
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const term = searchParams.get('term');
    const weekNumber = searchParams.get('weekNumber') ||  searchParams.get('week');
    
    // Get school with related data
    const [rows] = await db.query(`
      SELECT s.*, c.name as circuit_name, d.name as district_name, r.name as region_name 
      FROM schools s
      LEFT JOIN circuits c ON s.circuit_id = c.id
      LEFT JOIN districts d ON c.district_id = d.id
      LEFT JOIN regions r ON d.region_id = r.id
      WHERE s.id = ?
    `, [id]);
    
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Fetch statistics from dedicated endpoints
    const baseUrl = new URL(request.url).origin;
    const queryParams = new URLSearchParams({ schoolId: id, year, term });
    queryParams.append('aggregate', 'true');
    if (weekNumber) queryParams.append('weekNumber', weekNumber);
    const statsEndpoints = [
      'enrolment',
      'student-attendance',
      'teacher-attendance'
    ];
    const statsPromises = statsEndpoints.map(ep =>
      fetch(`${baseUrl}/api/statistics/${ep}?${queryParams}`)
        .then(r => r.json().then(j => j.data).catch(() => null))
        .catch(() => null)
    );
    const [enrolment, studentAttendance, teacherAttendance] = await Promise.all(statsPromises);
    
    // transform and aggregate stats using helpers
    const enrolmentAgg = Array.isArray(enrolment) ? aggregateEnrollment(enrolment) : enrolment;
    const studentAgg = Array.isArray(studentAttendance) ? aggregateStudentAttendance(studentAttendance) : studentAttendance;
    const teacherAgg = Array.isArray(teacherAttendance) ? aggregateTeacherAttendance(teacherAttendance) : teacherAttendance;

    return NextResponse.json({
      success: true,
      school: rows[0],
      statistics: {
        enrolment: enrolmentAgg,
        studentAttendance: studentAgg,
        teacherAttendance: teacherAgg
      }
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    return NextResponse.json(
      { success: false,
        error: 'Failed to fetch school',
        status: 500 
    });
  }
}

/**
 * PUT handler for updating a school
 */
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { name, code, circuit_id, address, contact, type } = body;

    if (!name || !code || !circuit_id) {
      return NextResponse.json(
        { error: 'Name, code, and circuit_id are required' },
        { status: 400 }
      );
    }

    const db = await getConnection();

    // Verify circuit exists
    const [circuitRows] = await db.query(
      'SELECT id FROM circuits WHERE id = ?', 
      [circuit_id]
    );

    if (!circuitRows || circuitRows.length === 0) {
      return NextResponse.json(
        { error: 'Circuit not found' },
        { status: 400 }
      );
    }

    // Update school
    await db.query(
      `UPDATE schools SET 
        name = ?, 
        code = ?, 
        circuit_id = ?, 
        address = ?, 
        contact = ?, 
        type = ?, 
        updated_at = NOW() 
      WHERE id = ?`,
      [name, code, circuit_id, address || null, contact || null, type || null, id]
    );

    return NextResponse.json({ message: 'School updated successfully' });
  } catch (error) {
    console.error('Error updating school:', error);
    return NextResponse.json(
      { error: 'Failed to update school' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing a school
 */
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const db = await getConnection();
    
    // Check for associated data like enrollments, teacher assignments, etc.
    const [enrollmentsRows] = await db.query(
      'SELECT COUNT(*) as count FROM enrolments WHERE school_id = ?',
      [id]
    );
    
    if (enrollmentsRows[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete school with associated enrollment data' },
        { status: 400 }
      );
    }
    
    // Check for associated teachers
    const [teachersRows] = await db.query(
      'SELECT COUNT(*) as count FROM schools_teachers WHERE school_id = ?',
      [id]
    );
    
    if (teachersRows[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete school with associated teacher data' },
        { status: 400 }
      );
    }

    // No dependent data, proceed with deletion
    await db.query('DELETE FROM schools WHERE id = ?', [id]);

    return NextResponse.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json(
      { error: 'Failed to delete school' },
      { status: 500 }
    );
  }
}