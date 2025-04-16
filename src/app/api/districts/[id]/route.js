import { NextResponse } from 'next/server';

/**
 * GET handler for retrieving a single district by ID
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
          SELECT d.*, r.name as region_name 
          FROM districts d
          LEFT JOIN regions r ON d.region_id = r.id
          WHERE d.id = ${id}
        `
      }),
    });

    const data = await response.json();
    
    if (!data.rows || data.rows.length === 0) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data.rows[0]);
  } catch (error) {
    console.error('Error fetching district:', error);
    return NextResponse.json(
      { error: 'Failed to fetch district' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a district
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, code, region_id } = body;

    if (!name || !code || !region_id) {
      return NextResponse.json(
        { error: 'Name, code, and region_id are required' },
        { status: 400 }
      );
    }

    // Verify region exists
    const regionCheck = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `SELECT id FROM regions WHERE id = ${region_id}`
      }),
    });

    const regionData = await regionCheck.json();
    if (!regionData.rows || regionData.rows.length === 0) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 400 }
      );
    }

    const response = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `UPDATE districts SET name = '${name}', code = '${code}', region_id = ${region_id}, updated_at = NOW() WHERE id = ${id}`
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update district');
    }

    return NextResponse.json({ message: 'District updated successfully' });
  } catch (error) {
    console.error('Error updating district:', error);
    return NextResponse.json(
      { error: 'Failed to update district' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing a district
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Check if district has associated circuits
    const checkResponse = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `SELECT COUNT(*) as count FROM circuits WHERE district_id = ${id}`
      }),
    });

    const checkData = await checkResponse.json();
    
    if (checkData.rows[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete district with associated circuits' },
        { status: 400 }
      );
    }

    // No circuits, proceed with deletion
    const response = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `DELETE FROM districts WHERE id = ${id}`
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete district');
    }

    return NextResponse.json({ message: 'District deleted successfully' });
  } catch (error) {
    console.error('Error deleting district:', error);
    return NextResponse.json(
      { error: 'Failed to delete district' },
      { status: 500 }
    );
  }
}