import { NextResponse } from 'next/server';
import { aggregateEnrollment, aggregateStudentAttendance, aggregateTeacherAttendance } from '@/utils/statisticsHelpers';
import { getConnection } from '@/utils/db';

/**
 * GET handler for retrieving a single circuit by ID
 */
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const db = await getConnection();
    
    // Get circuit with related district and region data
    const [rows] = await db.query(`
      SELECT c.*, d.name as district_name, r.name as region_name 
      FROM circuits c
      LEFT JOIN districts d ON c.district_id = d.id
      LEFT JOIN regions r ON d.region_id = r.id
      WHERE c.id = ?
    `, [id]);
    
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Circuit not found' },
        { status: 404 }
      );
    }

    // Fetch statistics from dedicated endpoints
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const term = searchParams.get('term');
    const weekNumber = searchParams.get('week') || searchParams.get('weekNumber');
    const baseUrl = new URL(request.url).origin;
    const queryParams = new URLSearchParams({ circuitId: id });
    if (year) queryParams.append('year', year);
    if (term) queryParams.append('term', term);
    queryParams.append('aggregate', 'true');
    if (weekNumber) queryParams.append('weekNumber', weekNumber);
    const statsEndpoints = ['enrolment', 'student-attendance', 'teacher-attendance'];
   
    const statsPromises = statsEndpoints.map(ep =>
      fetch(`${baseUrl}/api/statistics/${ep}?${queryParams}`)
        .then(r => r.json().then(j => j.data).catch(() => null))
        .catch(() => null)
    );
    const [enrolment, studentAttendance, teacherAttendance] = await Promise.all(statsPromises);
    const enrolmentAgg = Array.isArray(enrolment) ? aggregateEnrollment(enrolment) : enrolment;
    const studentAgg = Array.isArray(studentAttendance) ? aggregateStudentAttendance(studentAttendance) : studentAttendance;
    const teacherAgg = Array.isArray(teacherAttendance) ? aggregateTeacherAttendance(teacherAttendance) : teacherAttendance;
    return NextResponse.json({
      success: true,
      circuit: rows[0],
      statistics: { enrolment: enrolmentAgg, studentAttendance: studentAgg, teacherAttendance: teacherAgg }
    });
  } catch (error) {
    console.error('Error fetching circuit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch circuit' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a circuit
 */
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { name, code, district_id } = body;

    if (!name || !code || !district_id) {
      return NextResponse.json(
        { error: 'Name, code, and district_id are required' },
        { status: 400 }
      );
    }

    const db = await getConnection();

    // Verify district exists
    const [districtRows] = await db.query(
      'SELECT id FROM districts WHERE id = ?', 
      [district_id]
    );

    if (!districtRows || districtRows.length === 0) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 400 }
      );
    }

    // Update circuit
    await db.query(
      'UPDATE circuits SET name = ?, code = ?, district_id = ?, updated_at = NOW() WHERE id = ?',
      [name, code, district_id, id]
    );

    return NextResponse.json({ message: 'Circuit updated successfully' });
  } catch (error) {
    console.error('Error updating circuit:', error);
    return NextResponse.json(
      { error: 'Failed to update circuit' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing a circuit
 */
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const db = await getConnection();
    
    // Check if circuit has associated schools
    const [schoolRows] = await db.query(
      'SELECT COUNT(*) as count FROM schools WHERE circuit_id = ?',
      [id]
    );
    
    if (schoolRows[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete circuit with associated schools' },
        { status: 400 }
      );
    }

    // No schools, proceed with deletion
    await db.query('DELETE FROM circuits WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Circuit deleted successfully' });
  } catch (error) {
    console.error('Error deleting circuit:', error);
    return NextResponse.json(
      { error: 'Failed to delete circuit' },
      { status: 500 }
    );
  }
}