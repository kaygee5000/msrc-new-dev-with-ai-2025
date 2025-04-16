import { NextResponse } from 'next/server';

/**
 * GET handler for retrieving a single school by ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const response = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `
          SELECT s.*, c.name as circuit_name, d.name as district_name, r.name as region_name 
          FROM schools s
          LEFT JOIN circuits c ON s.circuit_id = c.id
          LEFT JOIN districts d ON c.district_id = d.id
          LEFT JOIN regions r ON d.region_id = r.id
          WHERE s.id = ${id}
        `
      }),
    });

    const data = await response.json();
    
    if (!data.rows || data.rows.length === 0) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data.rows[0]);
  } catch (error) {
    console.error('Error fetching school:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a school
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, code, circuit_id, address, contact, type } = body;

    if (!name || !code || !circuit_id) {
      return NextResponse.json(
        { error: 'Name, code, and circuit_id are required' },
        { status: 400 }
      );
    }

    // Verify circuit exists
    const circuitCheck = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `SELECT id FROM circuits WHERE id = ${circuit_id}`
      }),
    });

    const circuitData = await circuitCheck.json();
    if (!circuitData.rows || circuitData.rows.length === 0) {
      return NextResponse.json(
        { error: 'Circuit not found' },
        { status: 400 }
      );
    }

    const response = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `UPDATE schools SET 
              name = '${name}', 
              code = '${code}', 
              circuit_id = ${circuit_id}, 
              address = ${address ? `'${address}'` : 'NULL'}, 
              contact = ${contact ? `'${contact}'` : 'NULL'}, 
              type = ${type ? `'${type}'` : 'NULL'}, 
              updated_at = NOW() 
              WHERE id = ${id}`
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update school');
    }

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
    const { id } = params;
    
    // Check for associated data like enrollments, teacher assignments, etc.
    const checkEnrollmentsResponse = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `SELECT COUNT(*) as count FROM enrolments WHERE school_id = ${id}`
      }),
    });

    const checkEnrollmentsData = await checkEnrollmentsResponse.json();
    
    if (checkEnrollmentsData.rows[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete school with associated enrollment data' },
        { status: 400 }
      );
    }
    
    // Check for associated teachers
    const checkTeachersResponse = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `SELECT COUNT(*) as count FROM schools_teachers WHERE school_id = ${id}`
      }),
    });

    const checkTeachersData = await checkTeachersResponse.json();
    
    if (checkTeachersData.rows[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete school with associated teacher data' },
        { status: 400 }
      );
    }

    // No dependent data, proceed with deletion
    const response = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `DELETE FROM schools WHERE id = ${id}`
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete school');
    }

    return NextResponse.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json(
      { error: 'Failed to delete school' },
      { status: 500 }
    );
  }
}