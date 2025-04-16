import { NextResponse } from 'next/server';

/**
 * GET handler for retrieving a single region by ID
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
        sql: `SELECT * FROM regions WHERE id = ${id}`
      }),
    });

    const data = await response.json();
    
    if (!data.rows || data.rows.length === 0) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data.rows[0]);
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
    const { id } = params;
    const body = await request.json();
    const { name, code } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    const response = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `UPDATE regions SET name = '${name}', code = '${code}', updated_at = NOW() WHERE id = ${id}`
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update region');
    }

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
    const { id } = params;
    
    // Check if region has associated districts
    const checkResponse = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `SELECT COUNT(*) as count FROM districts WHERE region_id = ${id}`
      }),
    });

    const checkData = await checkResponse.json();
    
    if (checkData.rows[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete region with associated districts' },
        { status: 400 }
      );
    }

    // No districts, proceed with deletion
    const response = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `DELETE FROM regions WHERE id = ${id}`
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete region');
    }

    return NextResponse.json({ message: 'Region deleted successfully' });
  } catch (error) {
    console.error('Error deleting region:', error);
    return NextResponse.json(
      { error: 'Failed to delete region' },
      { status: 500 }
    );
  }
}