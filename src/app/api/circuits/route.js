import { NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import CacheService from '@/utils/cache';
import { verifyServerAuth } from '@/utils/serverAuth';

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
    const id = searchParams.get('id');
    
    console.log('Circuits API called with params:', { page, limit, search, districtId, regionId, id });
    
    // Create cache key based on query parameters
    const cacheKey = `circuits:${id || ''}:${districtId || ''}:${regionId || ''}:${search}:${page}:${limit}`;
    
    // Use cache service for circuits data
    const cachedOrFresh = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const db = await getConnection();
        
        // Handle fetching by ID if provided
        if (id) {
          const [rows] = await db.query(`
            SELECT c.*, d.name as district_name, r.name as region_name 
            FROM circuits c
            LEFT JOIN districts d ON c.district_id = d.id
            LEFT JOIN regions r ON d.region_id = r.id
            WHERE c.id = ?
          `, [id]);
          
          return { circuits: rows };
        }
        
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
        
        console.log('SQL where clause:', whereClause);
        console.log('SQL params:', params);
        
        // Query the database for circuits with district and region names
        let queryParams = [...params];
        if (limit !== -1) {
          queryParams.push((page - 1) * limit, limit);
        }
        
        const queryString = `
          SELECT c.*, d.name as district_name, r.name as region_name 
          FROM circuits c
          LEFT JOIN districts d ON c.district_id = d.id
          LEFT JOIN regions r ON d.region_id = r.id
          ${whereClause}
          ORDER BY c.name
          ${limit !== -1 ? 'LIMIT ?, ?' : ''}
        `;
        
        console.log('SQL query:', queryString);
        console.log('Query params:', queryParams);
        
        const [rows] = await db.query(queryString, queryParams);
        
        // Only get pagination if not requesting all records
        let pagination = {};
        if (limit !== -1) {
          // Get total count for pagination
          const countParams = [...params]; // Create a copy of the params array
          const [countResult] = await db.query(`
            SELECT COUNT(*) as total 
            FROM circuits c
            LEFT JOIN districts d ON c.district_id = d.id
            LEFT JOIN regions r ON d.region_id = r.id
            ${whereClause}
          `, countParams);
          
          const total = countResult[0].total;
          
          pagination = {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
          };
        }
        
        return {
          circuits: rows,
          pagination
        };
      },
      // Cache circuits data for 6 hours (21600 seconds)
      21600
    );
    
    // Always wrap the response in NextResponse.json() with success and data fields
    return NextResponse.json({
      success: true,
      data: cachedOrFresh
    });
  } catch (error) {
    console.error('Error fetching circuits:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch circuits', 
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST handler for creating a new circuit
 */
export async function POST(request) {
  try {
    // Verify authorization
    const authResult = await verifyServerAuth(request, ['admin']);
    if (!authResult.success) {
      return NextResponse.json({
        success: false,
        error: authResult.message
      }, { status: authResult.status });
    }
    
    const body = await request.json();
    const { name, district_id, description } = body;

    if (!name || !district_id) {
      return NextResponse.json({
        success: false,
        error: 'Name and district_id are required'
      }, { status: 400 });
    }

    const db = await getConnection();
    
    // Verify district exists and get region_id
    const [districtRows] = await db.query(
      'SELECT id, region_id FROM districts WHERE id = ?', 
      [district_id]
    );
    
    if (districtRows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'District not found'
      }, { status: 400 });
    }
    
    const regionId = districtRows[0].region_id;

    // Insert a new circuit into the database
    const [result] = await db.query(
      'INSERT INTO circuits (name, district_id, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [name, district_id, description || null]
    );
    
    // Invalidate relevant caches
    await CacheService.invalidateMultiple([
      'circuits:*',
      `districts:${district_id}:*`, // Also invalidate district cache
      `regions:${regionId}:*` // Also invalidate region cache
    ]);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Circuit created successfully',
        id: result.insertId
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating circuit:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create circuit',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * PUT handler for updating a circuit
 */
export async function PUT(request) {
  try {
    // Verify authorization
    const authResult = await verifyServerAuth(request, ['admin']);
    if (!authResult.success) {
      return NextResponse.json({
        success: false,
        error: authResult.message
      }, { status: authResult.status });
    }
    
    const body = await request.json();
    const { id, name, district_id, description } = body;

    if (!id || !name || !district_id) {
      return NextResponse.json({
        success: false,
        error: 'ID, name, and district_id are required'
      }, { status: 400 });
    }

    const db = await getConnection();
    
    // Get current circuit data to check for district change
    const [currentCircuit] = await db.query(
      'SELECT c.district_id, d.region_id FROM circuits c JOIN districts d ON c.district_id = d.id WHERE c.id = ?', 
      [id]
    );
    
    if (currentCircuit.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Circuit not found'
      }, { status: 404 });
    }
    
    const oldDistrictId = currentCircuit[0].district_id;
    const oldRegionId = currentCircuit[0].region_id;

    // Verify district exists and get new region_id
    const [districtRows] = await db.query(
      'SELECT id, region_id FROM districts WHERE id = ?', 
      [district_id]
    );
    
    if (districtRows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'District not found'
      }, { status: 400 });
    }
    
    const newRegionId = districtRows[0].region_id;

    // Update circuit
    await db.query(
      'UPDATE circuits SET name = ?, district_id = ?, description = ?, updated_at = NOW() WHERE id = ?',
      [name, district_id, description || null, id]
    );
    
    // Invalidate caches
    const cachesToInvalidate = ['circuits:*'];
    
    // If district changed, invalidate old and new district caches
    if (oldDistrictId !== district_id) {
      cachesToInvalidate.push(`districts:${oldDistrictId}:*`);
      cachesToInvalidate.push(`districts:${district_id}:*`);
    }
    
    // If region changed as a result of district change, invalidate old and new region caches
    if (oldRegionId !== newRegionId) {
      cachesToInvalidate.push(`regions:${oldRegionId}:*`);
      cachesToInvalidate.push(`regions:${newRegionId}:*`);
    }
    
    await CacheService.invalidateMultiple(cachesToInvalidate);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Circuit updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating circuit:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update circuit',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE handler for removing a circuit
 */
export async function DELETE(request) {
  try {
    // Verify authorization
    const authResult = await verifyServerAuth(request, ['admin']);
    if (!authResult.success) {
      return NextResponse.json({
        success: false,
        error: authResult.message
      }, { status: authResult.status });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Circuit ID is required'
      }, { status: 400 });
    }
    
    const db = await getConnection();
    
    // Get circuit info before deletion to invalidate correct district and region caches
    const [circuit] = await db.query(
      'SELECT c.district_id, d.region_id FROM circuits c JOIN districts d ON c.district_id = d.id WHERE c.id = ?',
      [id]
    );
    
    if (circuit.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Circuit not found'
      }, { status: 404 });
    }
    
    const districtId = circuit[0].district_id;
    const regionId = circuit[0].region_id;
    
    // Check for dependent schools
    const [schoolRows] = await db.query(
      'SELECT COUNT(*) as count FROM schools WHERE circuit_id = ?',
      [id]
    );
    
    if (schoolRows[0].count > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete circuit with associated schools'
      }, { status: 400 });
    }

    // Delete circuit
    await db.query('DELETE FROM circuits WHERE id = ?', [id]);
    
    // Invalidate caches
    await CacheService.invalidateMultiple([
      'circuits:*',
      `districts:${districtId}:*`,
      `regions:${regionId}:*`
    ]);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Circuit deleted successfully'
      }
    });
  } catch (error) {
    console.error('Error deleting circuit:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete circuit',
      details: error.message
    }, { status: 500 });
  }
}