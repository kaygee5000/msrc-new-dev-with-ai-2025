import { NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import { aggregateEnrollment, aggregateStudentAttendance, aggregateTeacherAttendance } from '@/utils/statisticsHelpers';

/**
 * GET handler for retrieving a single region by ID
 */
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const db = await getConnection();
    
    // Query the database for the region
    const [rows] = await db.query('SELECT * FROM regions WHERE id = ?', [id]);
    
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 404 }
      );
    }

    // 2. District count
    const [districtCountRows] = await db.query(
      'SELECT COUNT(*) AS districtCount FROM districts WHERE region_id = ?',
      [id]
    );
    const districtCount = districtCountRows[0]?.districtCount || 0;
    // 3. Circuit count
    const [circuitCountRows] = await db.query(
      'SELECT COUNT(*) AS circuitCount FROM circuits WHERE region_id = ?',
      [id]
    );
    const circuitCount = circuitCountRows[0]?.circuitCount || 0;
    // 4. School count
    const [schoolCountRows] = await db.query(
      'SELECT COUNT(*) AS schoolCount FROM schools WHERE region_id = ?',
      [id]
    );
    const schoolCount = schoolCountRows[0]?.schoolCount || 0;

    // Build query params for stats endpoints
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const term = searchParams.get('term');
    const baseUrl = new URL(request.url).origin;
    const queryParams = new URLSearchParams({ regionId: id });
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
      region: rows[0],
      districtCount,
      circuitCount,
      schoolCount,
      statistics: {
        enrolment: enrolmentAgg,
        studentAttendance: studentAgg,
        teacherAttendance: teacherAgg
      }
    });
  } catch (error) {
    console.error('Error fetching region:', error);
    return NextResponse.json(
      { error: 'Failed to fetch region' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a region
 */
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { name, code } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    const db = await getConnection();

    // Update region
    await db.query(
      'UPDATE regions SET name = ?, code = ?, updated_at = NOW() WHERE id = ?',
      [name, code, id]
    );

    return NextResponse.json({ message: 'Region updated successfully' });
  } catch (error) {
    console.error('Error updating region:', error);
    return NextResponse.json(
      { error: 'Failed to update region' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing a region
 */
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const db = await getConnection();
    
    // Check if region has associated districts
    const [districtRows] = await db.query(
      'SELECT COUNT(*) as count FROM districts WHERE region_id = ?',
      [id]
    );
    
    if (districtRows[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete region with associated districts' },
        { status: 400 }
      );
    }

    // No districts, proceed with deletion
    await db.query('DELETE FROM regions WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Region deleted successfully' });
  } catch (error) {
    console.error('Error deleting region:', error);
    return NextResponse.json(
      { error: 'Failed to delete region' },
      { status: 500 }
    );
  }
}