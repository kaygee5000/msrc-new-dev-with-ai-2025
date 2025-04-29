import { NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import CacheService from '@/utils/cache';
import { verifyServerAuth } from '@/utils/serverAuth';

/**
 * GET handler for retrieving districts
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(0, parseInt(searchParams.get('page') || '0')); // Ensure page is at least 0, default to 0
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const regionId = searchParams.get('regionId'); // Match parameter name with client-side
    const id = searchParams.get('id');
    
    console.log('Districts API called with params:', { page, limit, search, regionId, id });
    
    // Create cache key based on query parameters
    const cacheKey = `districts:${id || ''}:${regionId || ''}:${search}:${page}:${limit}`;
    
    // Use cache service for districts data
    const cachedOrFresh = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const db = await getConnection();
        
        // Handle fetching by ID if provided
        if (id) {
          const [rows] = await db.query(`
            SELECT d.*, r.name as region_name 
            FROM districts d
            LEFT JOIN regions r ON d.region_id = r.id
            WHERE d.id = ?
          `, [id]);
          
          return { districts: rows };
        }
        
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
        
        console.log('SQL where clause:', whereClause);
        console.log('SQL params:', params);
        
        // Query the database for districts with region names
        let queryParams = [...params];
        if (limit !== -1) {
          // Ensure offset is never negative
          const offset = Math.max(0, page * limit);
          queryParams.push(offset, limit);
        }
        
        const queryString = `
          SELECT d.*, r.name as region_name 
          FROM districts d
          LEFT JOIN regions r ON d.region_id = r.id
          ${whereClause}
          ORDER BY d.name
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
            FROM districts d
            ${regionId ? 'LEFT JOIN regions r ON d.region_id = r.id' : ''}
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
          districts: rows,
          pagination
        };
      },
      // Cache districts data for 6 hours (21600 seconds)
      21600
    );
    
    // Always wrap the response in NextResponse.json() with success and data fields
    return NextResponse.json({
      success: true,
      data: cachedOrFresh
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch districts', 
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST handler for creating a new district
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
    const { name, region_id, description } = body;

    if (!name || !region_id) {
      return NextResponse.json({
        success: false,
        error: 'Name and region_id are required'
      }, { status: 400 });
    }

    const db = await getConnection();
    
    // Verify region exists
    const [regionRows] = await db.query('SELECT id FROM regions WHERE id = ?', [region_id]);
    
    if (regionRows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Region not found'
      }, { status: 400 });
    }

    // Insert a new district into the database
    const [result] = await db.query(
      'INSERT INTO districts (name, region_id, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [name, region_id, description || null]
    );
    
    // Invalidate relevant caches
    await CacheService.invalidateMultiple([
      'districts:*',
      `regions:${region_id}:*` // Also invalidate region cache since district count may have changed
    ]);

    return NextResponse.json({
      success: true,
      data: {
        message: 'District created successfully',
        id: result.insertId
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating district:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create district',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * PUT handler for updating a district
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
    const { id, name, region_id, description } = body;

    if (!id || !name || !region_id) {
      return NextResponse.json({
        success: false,
        error: 'ID, name, and region_id are required'
      }, { status: 400 });
    }

    const db = await getConnection();
    
    // Get current district data to check for region change
    const [currentDistrict] = await db.query('SELECT region_id FROM districts WHERE id = ?', [id]);
    
    if (currentDistrict.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'District not found'
      }, { status: 404 });
    }
    
    const oldRegionId = currentDistrict[0].region_id;

    // Verify region exists
    const [regionRows] = await db.query('SELECT id FROM regions WHERE id = ?', [region_id]);
    
    if (regionRows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Region not found'
      }, { status: 400 });
    }

    // Update district
    await db.query(
      'UPDATE districts SET name = ?, region_id = ?, description = ?, updated_at = NOW() WHERE id = ?',
      [name, region_id, description || null, id]
    );
    
    // Invalidate caches
    const cachesToInvalidate = ['districts:*'];
    
    // If region changed, invalidate old and new region caches
    if (oldRegionId !== region_id) {
      cachesToInvalidate.push(`regions:${oldRegionId}:*`);
      cachesToInvalidate.push(`regions:${region_id}:*`);
    }
    
    await CacheService.invalidateMultiple(cachesToInvalidate);

    return NextResponse.json({
      success: true,
      data: {
        message: 'District updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating district:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update district',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE handler for removing a district
 */
export async function DELETE(request) {
  try {
    // Verify authorization
    const authResult = await verifyServerAuth(request, ['admin']);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.message },
        { status: authResult.status }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'District ID is required' },
        { status: 400 }
      );
    }
    
    const db = await getConnection();
    
    // Get district info before deletion to invalidate correct region cache
    const [district] = await db.query('SELECT region_id FROM districts WHERE id = ?', [id]);
    
    if (district.length === 0) {
      return NextResponse.json(
        { error: 'District not found' },
        { status: 404 }
      );
    }
    
    const regionId = district[0].region_id;
    
    // Check for dependent circuits
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

    // Delete district
    await db.query('DELETE FROM districts WHERE id = ?', [id]);
    
    // Invalidate caches
    await CacheService.invalidateMultiple([
      'districts:*',
      `regions:${regionId}:*` // Also invalidate region cache
    ]);

    return NextResponse.json(
      { message: 'District deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting district:', error);
    return NextResponse.json(
      { error: 'Failed to delete district', details: error.message },
      { status: 500 }
    );
  }
}