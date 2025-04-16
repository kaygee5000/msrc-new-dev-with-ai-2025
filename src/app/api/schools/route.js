import { NextResponse } from 'next/server';
import db from '@/utils/db';

/**
 * GET handler for retrieving schools
 */
export async function GET(request) {
  try {
    // Get search params
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('region_id');
    const districtId = searchParams.get('district_id') || '2'; // Default to district ID 2
    const circuitId = searchParams.get('circuit_id');
    
    let query = `
      SELECT 
        s.id, 
        s.name, 
        s.district_id,
        s.circuit_id,
        d.region_id,
        d.name AS district_name,
        c.name AS circuit_name,
        r.name AS region_name
      FROM 
        field_msrcghana_db.schools s
        JOIN field_msrcghana_db.districts d ON s.district_id = d.id
        JOIN field_msrcghana_db.circuits c ON s.circuit_id = c.id
        JOIN field_msrcghana_db.regions r ON d.region_id = r.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Add filters based on provided parameters
    if (regionId) {
      query += " AND d.region_id = ?";
      queryParams.push(regionId);
    }
    
    if (districtId) {
      query += " AND s.district_id = ?";
      queryParams.push(districtId);
    }
    
    if (circuitId) {
      query += " AND s.circuit_id = ?";
      queryParams.push(circuitId);
    }
    
    query += " ORDER BY s.name ASC";
    
    // Execute the query
    const [rows] = await db.query(query, queryParams);
    
    // Transform the data to match the expected format
    const schools = rows.map(school => ({
      id: school.id,
      name: school.name,
      regionId: school.region_id,
      districtId: school.district_id,
      circuitId: school.circuit_id,
      district: { 
        id: school.district_id,
        name: school.district_name 
      },
      circuit: { 
        id: school.circuit_id,
        name: school.circuit_name 
      },
      region: { 
        id: school.region_id,
        name: school.region_name 
      }
    }));
    
    return NextResponse.json({ schools }, { status: 200 });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json({ message: 'Failed to fetch schools', error: error.message }, { status: 500 });
  }
}

/**
 * POST handler for creating a new school
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, code, circuit_id, address = null, contact = null, type = null } = body;

    if (!name || !code || !circuit_id) {
      return NextResponse.json(
        { error: 'Name, code, and circuit_id are required' },
        { status: 400 }
      );
    }

    // Verify circuit exists
    const [circuitRows] = await db.query('SELECT id FROM circuits WHERE id = ?', [circuit_id]);
    
    if (circuitRows.length === 0) {
      return NextResponse.json(
        { error: 'Circuit not found' },
        { status: 400 }
      );
    }

    // Insert a new school into the database
    const [result] = await db.query(
      'INSERT INTO schools (name, code, circuit_id, address, contact, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [name, code, circuit_id, address, contact, type]
    );

    return NextResponse.json(
      { message: 'School created successfully', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating school:', error);
    return NextResponse.json(
      { error: 'Failed to create school' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a school
 * This would typically be in the [id]/route.js file but adding it here for completeness
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, code, circuit_id, address = null, contact = null, type = null } = body;

    if (!id || !name || !code || !circuit_id) {
      return NextResponse.json(
        { error: 'ID, name, code, and circuit_id are required' },
        { status: 400 }
      );
    }

    // Verify school exists
    const [schoolRows] = await db.query('SELECT id FROM schools WHERE id = ?', [id]);
    
    if (schoolRows.length === 0) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Verify circuit exists
    const [circuitRows] = await db.query('SELECT id FROM circuits WHERE id = ?', [circuit_id]);
    
    if (circuitRows.length === 0) {
      return NextResponse.json(
        { error: 'Circuit not found' },
        { status: 400 }
      );
    }

    // Update school
    await db.query(
      'UPDATE schools SET name = ?, code = ?, circuit_id = ?, address = ?, contact = ?, type = ?, updated_at = NOW() WHERE id = ?',
      [name, code, circuit_id, address, contact, type, id]
    );

    return NextResponse.json(
      { message: 'School updated successfully' }
    );
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
 * This would typically be in the [id]/route.js file but adding it here for completeness
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }
    
    // Check for dependent data (like facilitators or reports)
    const [facilitatorRows] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = 'facilitator'",
      [id]
    );
    
    if (facilitatorRows[0].count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete school with associated facilitators' },
        { status: 400 }
      );
    }

    // Delete school
    await db.query('DELETE FROM schools WHERE id = ?', [id]);

    return NextResponse.json(
      { message: 'School deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json(
      { error: 'Failed to delete school' },
      { status: 500 }
    );
  }
}