import { NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import { aggregateEnrollment, aggregateStudentAttendance, aggregateTeacherAttendance } from '@/utils/statisticsHelpers';

/**
 * GET handler for retrieving a single district by ID
 */
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id: districtId } = resolvedParams;
    const db = await getConnection();

    // Get district with region data
    const [rows] = await db.query(`
      SELECT d.*, r.name as region_name
      FROM districts d
      LEFT JOIN regions r ON d.region_id = r.id
      WHERE d.id = ?
    `, [districtId]);

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 404 }
      );
    }

    // 2. Circuit count
    const [circuitCountRows] = await db.query(
      'SELECT COUNT(*) AS circuitCount FROM circuits WHERE district_id = ?',
      [districtId]
    );
    const circuitCount = circuitCountRows[0]?.circuitCount || 0;

    // 3. School count
    const [schoolCountRows] = await db.query(
      'SELECT COUNT(*) AS schoolCount FROM schools WHERE district_id = ?',
      [districtId]
    );
    const schoolCount = schoolCountRows[0]?.schoolCount || 0;

    // Build query params for stats endpoints
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const term = searchParams.get('term');
    const baseUrl = new URL(request.url).origin;
    const queryParams = new URLSearchParams({ districtId });
    if (year) queryParams.append('year', year);
    if (term) queryParams.append('term', term);
    queryParams.append('aggregate', 'true');

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
      district: rows[0],
      circuitCount,
      schoolCount,
      statistics: {
        enrolment: enrolmentAgg,
        studentAttendance: studentAgg,
        teacherAttendance: teacherAgg
      }
    });
  } catch (error) {
    console.error('Error fetching district:', error);
    return NextResponse.json(
      { error: 'Failed to fetch district' },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting a district
export async function DELETE(request, { params: routeParams }) {
  let db;
  try {
    const { id: districtId } = routeParams;
    db = await getConnection();

    // Check if district has associated circuits
    const [circuitRows] = await db.query(
      'SELECT COUNT(*) as count FROM circuits WHERE district_id = ?',
      [districtId]
    );
    if (circuitRows[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete district with associated circuits' },
        { status: 400 }
      );
    }

    // No circuits, proceed with deletion
    await db.query('DELETE FROM districts WHERE id = ?', [districtId]);
    return NextResponse.json({ message: 'District deleted successfully' });

  } catch (error) {
    console.error('Error deleting district:', error);
    return NextResponse.json(
      { error: 'Failed to delete district' },
      { status: 500 }
    );
  } finally {
    if (db && db.release) db.release();
  }
}