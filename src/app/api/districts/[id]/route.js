import { NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';

/**
 * GET handler for retrieving a single district by ID
 */
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    console.log('Districts [id] API called with ID:', id);
    
    const db = await getConnection();
    
    // Get district with related region data
    const [rows] = await db.query(`
      SELECT d.*, r.name as region_name 
      FROM districts d
      LEFT JOIN regions r ON d.region_id = r.id
      WHERE d.id = ?
    `, [id]);
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'District not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching district:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch district',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * PUT handler for updating a district
 */
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { name, code, region_id } = body;

    if (!name || !code || !region_id) {
      return NextResponse.json(
        { error: 'Name, code, and region_id are required' },
        { status: 400 }
      );
    }

    const db = await getConnection();

    // Verify region exists
    const [regionRows] = await db.query(
      'SELECT id FROM regions WHERE id = ?',
      [region_id]
    );

    if (!regionRows || regionRows.length === 0) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 400 }
      );
    }

    // Update district
    await db.query(
      'UPDATE districts SET name = ?, code = ?, region_id = ?, updated_at = NOW() WHERE id = ?',
      [name, code, region_id, id]
    );

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
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const db = await getConnection();
    
    // Check if district has associated circuits
    const [circuitRows] = await db.query(
      'SELECT COUNT(*) as count FROM circuits WHERE district_id = ?',
      [id]
    );
    
    if (circuitRows[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete district with associated circuits' },
        { status: 400 }
      );
    }

    // No circuits, proceed with deletion
    await db.query('DELETE FROM districts WHERE id = ?', [id]);

    return NextResponse.json({ message: 'District deleted successfully' });
  } catch (error) {
    console.error('Error deleting district:', error);
    return NextResponse.json(
      { error: 'Failed to delete district' },
      { status: 500 }
    );
  }
}