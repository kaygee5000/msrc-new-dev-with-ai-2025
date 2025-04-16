import { NextResponse } from 'next/server';
import pool from '../../../utils/db';

/**
 * GET handler for retrieving circuits
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const districtId = searchParams.get('district_id');
    const regionId = searchParams.get('region_id');
    
    // Build parameters and conditions for the SQL queries
    const params = [];
    let whereClause = '';
    
    if (search) {
      whereClause += `WHERE c.name LIKE ?`;
      params.push(`%${search}%`);
    }
    
    if (districtId) {
      whereClause += `${whereClause ? ' AND' : 'WHERE'} c.district_id = ?`;
      params.push(districtId);
    }
    
    if (regionId) {
      whereClause += `${whereClause ? ' AND' : 'WHERE'} d.region_id = ?`;
      params.push(regionId);
    }
    
    // Query the database for circuits with district and region names
    const [rows] = await pool.query(`
      SELECT c.*, d.name as district_name, r.name as region_name 
      FROM circuits c
      LEFT JOIN districts d ON c.district_id = d.id
      LEFT JOIN regions r ON d.region_id = r.id
      ${whereClause}
      ORDER BY c.name
      LIMIT ?, ?
    `, [...params, (page - 1) * limit, limit]);
    
    // Get total count for pagination
    const countParams = [...params]; // Create a copy of the params array
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM circuits c
      LEFT JOIN districts d ON c.district_id = d.id
      LEFT JOIN regions r ON d.region_id = r.id
      ${whereClause}
    `, countParams);
    
    const total = countResult[0].total;

    return NextResponse.json({
      circuits: rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching circuits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch circuits' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new circuit
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, code, district_id } = body;

    if (!name || !code || !district_id) {
      return NextResponse.json(
        { error: 'Name, code, and district_id are required' },
        { status: 400 }
      );
    }

    // Verify district exists
    const [districtRows] = await pool.query('SELECT id FROM districts WHERE id = ?', [district_id]);
    
    if (districtRows.length === 0) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 400 }
      );
    }

    // Insert a new circuit into the database
    const [result] = await pool.query(
      'INSERT INTO circuits (name, code, district_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [name, code, district_id]
    );

    return NextResponse.json(
      { message: 'Circuit created successfully', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating circuit:', error);
    return NextResponse.json(
      { error: 'Failed to create circuit' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a circuit
 * This would typically be in the [id]/route.js file but adding it here for completeness
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, code, district_id } = body;

    if (!id || !name || !code || !district_id) {
      return NextResponse.json(
        { error: 'ID, name, code, and district_id are required' },
        { status: 400 }
      );
    }

    // Verify circuit exists
    const [circuitRows] = await pool.query('SELECT id FROM circuits WHERE id = ?', [id]);
    
    if (circuitRows.length === 0) {
      return NextResponse.json(
        { error: 'Circuit not found' },
        { status: 404 }
      );
    }

    // Verify district exists
    const [districtRows] = await pool.query('SELECT id FROM districts WHERE id = ?', [district_id]);
    
    if (districtRows.length === 0) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 400 }
      );
    }

    // Update circuit
    await pool.query(
      'UPDATE circuits SET name = ?, code = ?, district_id = ?, updated_at = NOW() WHERE id = ?',
      [name, code, district_id, id]
    );

    return NextResponse.json(
      { message: 'Circuit updated successfully' }
    );
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
 * This would typically be in the [id]/route.js file but adding it here for completeness
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Circuit ID is required' },
        { status: 400 }
      );
    }
    
    // Check for dependent schools
    const [schoolRows] = await pool.query(
      'SELECT COUNT(*) as count FROM schools WHERE circuit_id = ?',
      [id]
    );
    
    if (schoolRows[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete circuit with associated schools' },
        { status: 400 }
      );
    }

    // Delete circuit
    await pool.query('DELETE FROM circuits WHERE id = ?', [id]);

    return NextResponse.json(
      { message: 'Circuit deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting circuit:', error);
    return NextResponse.json(
      { error: 'Failed to delete circuit' },
      { status: 500 }
    );
  }
}