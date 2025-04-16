import { NextResponse } from 'next/server';

/**
 * GET handler for retrieving a single circuit by ID
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
          SELECT c.*, d.name as district_name, r.name as region_name 
          FROM circuits c
          LEFT JOIN districts d ON c.district_id = d.id
          LEFT JOIN regions r ON d.region_id = r.id
          WHERE c.id = ${id}
        `
      }),
    });

    const data = await response.json();
    
    if (!data.rows || data.rows.length === 0) {
      return NextResponse.json(
        { error: 'Circuit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data.rows[0]);
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
    const { id } = params;
    const body = await request.json();
    const { name, code, district_id } = body;

    if (!name || !code || !district_id) {
      return NextResponse.json(
        { error: 'Name, code, and district_id are required' },
        { status: 400 }
      );
    }

    // Verify district exists
    const districtCheck = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `SELECT id FROM districts WHERE id = ${district_id}`
      }),
    });

    const districtData = await districtCheck.json();
    if (!districtData.rows || districtData.rows.length === 0) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 400 }
      );
    }

    const response = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `UPDATE circuits SET name = '${name}', code = '${code}', district_id = ${district_id}, updated_at = NOW() WHERE id = ${id}`
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update circuit');
    }

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
    const { id } = params;
    
    // Check if circuit has associated schools
    const checkResponse = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `SELECT COUNT(*) as count FROM schools WHERE circuit_id = ${id}`
      }),
    });

    const checkData = await checkResponse.json();
    
    if (checkData.rows[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete circuit with associated schools' },
        { status: 400 }
      );
    }

    // No schools, proceed with deletion
    const response = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `DELETE FROM circuits WHERE id = ${id}`
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete circuit');
    }

    return NextResponse.json({ message: 'Circuit deleted successfully' });
  } catch (error) {
    console.error('Error deleting circuit:', error);
    return NextResponse.json(
      { error: 'Failed to delete circuit' },
      { status: 500 }
    );
  }
}