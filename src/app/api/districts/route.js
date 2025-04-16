import { NextResponse } from 'next/server';
import pool from '../../../utils/db';

/**
 * GET handler for retrieving districts
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const regionId = searchParams.get('region_id');
    
    // Build parameters and conditions for the SQL queries
    const params = [];
    let whereClause = '';
    
    if (search) {
      whereClause += `WHERE d.name LIKE ?`;
      params.push(`%${search}%`);
    }
    
    if (regionId) {
      whereClause += `${whereClause ? ' AND' : 'WHERE'} d.region_id = ?`;
      params.push(regionId);
    }
    
    // Query the database for districts with region names
    const [rows] = await pool.query(`
      SELECT d.*, r.name as region_name 
      FROM districts d
      LEFT JOIN regions r ON d.region_id = r.id
      ${whereClause}
      ORDER BY d.name
      LIMIT ?, ?
    `, [...params, (page - 1) * limit, limit]);
    
    // Get total count for pagination
    const countParams = [...params]; // Create a copy of the params array
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM districts d
      ${regionId ? 'LEFT JOIN regions r ON d.region_id = r.id' : ''}
      ${whereClause}
    `, countParams);
    
    const total = countResult[0].total;

    return NextResponse.json({
      districts: rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch districts' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new district
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, code, region_id } = body;

    if (!name || !code || !region_id) {
      return NextResponse.json(
        { error: 'Name, code, and region_id are required' },
        { status: 400 }
      );
    }

    // Verify region exists
    const [regionRows] = await pool.query('SELECT id FROM regions WHERE id = ?', [region_id]);
    
    if (regionRows.length === 0) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 400 }
      );
    }

    // Insert a new district into the database
    const [result] = await pool.query(
      'INSERT INTO districts (name, code, region_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [name, code, region_id]
    );

    return NextResponse.json(
      { message: 'District created successfully', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating district:', error);
    return NextResponse.json(
      { error: 'Failed to create district' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a district
 * This would typically be in the [id]/route.js file but adding it here for completeness
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, code, region_id } = body;

    if (!id || !name || !code || !region_id) {
      return NextResponse.json(
        { error: 'ID, name, code, and region_id are required' },
        { status: 400 }
      );
    }

    // Verify district exists
    const [districtRows] = await pool.query('SELECT id FROM districts WHERE id = ?', [id]);
    
    if (districtRows.length === 0) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 404 }
      );
    }

    // Verify region exists
    const [regionRows] = await pool.query('SELECT id FROM regions WHERE id = ?', [region_id]);
    
    if (regionRows.length === 0) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 400 }
      );
    }

    // Update district
    await pool.query(
      'UPDATE districts SET name = ?, code = ?, region_id = ?, updated_at = NOW() WHERE id = ?',
      [name, code, region_id, id]
    );

    return NextResponse.json(
      { message: 'District updated successfully' }
    );
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
 * This would typically be in the [id]/route.js file but adding it here for completeness
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'District ID is required' },
        { status: 400 }
      );
    }
    
    // Check for dependent circuits
    const [circuitRows] = await pool.query(
      'SELECT COUNT(*) as count FROM circuits WHERE district_id = ?',
      [id]
    );
    
    if (circuitRows[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete district with associated circuits' },
        { status: 400 }
      );
    }

    // Delete district
    await pool.query('DELETE FROM districts WHERE id = ?', [id]);

    return NextResponse.json(
      { message: 'District deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting district:', error);
    return NextResponse.json(
      { error: 'Failed to delete district' },
      { status: 500 }
    );
  }
}