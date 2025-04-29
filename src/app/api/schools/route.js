import { NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import CacheService from '@/utils/cache';
import { verifyServerAuth } from '@/utils/serverAuth';

/**
 * GET handler for retrieving schools
 */
export async function GET(request) {
  try {
    // Get search params
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('region_id') || searchParams.get('regionId');
    const districtId = searchParams.get('district_id') || searchParams.get('districtId');
    const circuitId = searchParams.get('circuit_id') || searchParams.get('circuitId');
    const id = searchParams.get('id');
    const search = searchParams.get('search') || '';
    
    // Pagination params
    const page = Math.max(0, parseInt(searchParams.get('page') || '0'));
    const limit = parseInt(searchParams.get('limit') || '10');
    
    console.log('Schools API called with params:', { regionId, districtId, circuitId, id, page, limit, search });
    
    // Create cache key based on query parameters
    const cacheKey = `schools:${id || ''}:${regionId || ''}:${districtId || ''}:${circuitId || ''}:${search}:${page}:${limit}`;
    
    // Use cache service for schools data
    const cachedOrFresh = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const db = await getConnection();
        
        // Handle fetching by ID if provided
        if (id) {
          const [rows] = await db.query(`
            SELECT 
              s.id, 
              s.name, 
              s.ges_code,
              s.district_id,
              s.circuit_id,
              d.region_id,
              d.name AS district_name,
              c.name AS circuit_name,
              r.name AS region_name
            FROM 
              schools s
              JOIN districts d ON s.district_id = d.id
              JOIN circuits c ON s.circuit_id = c.id
              JOIN regions r ON d.region_id = r.id
            WHERE s.id = ?
          `, [id]);
          
          // Transform the data to match the expected format
          const schools = rows.map(school => ({
            id: school.id,
            name: school.name,
            gesCode: school.ges_code,
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
          
          return { schools };
        }
        
        // Build the base query
        let query = `
          SELECT 
            s.id, 
            s.name, 
            s.ges_code,
            s.district_id,
            s.circuit_id,
            d.region_id,
            d.name AS district_name,
            c.name AS circuit_name,
            r.name AS region_name
          FROM 
            schools s
            JOIN districts d ON s.district_id = d.id
            JOIN circuits c ON s.circuit_id = c.id
            JOIN regions r ON d.region_id = r.id
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
        if (search) {
          query += " AND (s.name LIKE ? OR s.ges_code LIKE ?)";
          queryParams.push(`%${search}%`, `%${search}%`);
        }
        
        query += " ORDER BY s.name ASC";
        
        // Get total count for pagination
        const countQuery = query.replace('SELECT \n            s.id, \n            s.name, \n            s.ges_code,\n            s.district_id,\n            s.circuit_id,\n            d.region_id,\n            d.name AS district_name,\n            c.name AS circuit_name,\n            r.name AS region_name', 'SELECT COUNT(*) as total');
        
        const [countResult] = await db.query(countQuery, queryParams);
        const total = countResult[0].total;
        
        // Add pagination
        if (limit !== -1) {
          const offset = page * limit;
          query += " LIMIT ?, ?";
          queryParams.push(offset, limit);
        }
        
        console.log('SQL query:', query);
        console.log('Query params:', queryParams);
        
        // Execute the query
        const [rows] = await db.query(query, queryParams);
        
        // Transform the data to match the expected format
        const schools = rows.map(school => ({
          id: school.id,
          name: school.name,
          gesCode: school.ges_code,
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
        
        // Create pagination object
        const pagination = {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        };
        
        return { schools, pagination };
      },
      // Cache schools data for 6 hours (21600 seconds)
      21600
    );
    
    // Always wrap the response in NextResponse.json() with success and data fields
    return NextResponse.json({
      success: true,
      data: cachedOrFresh,
      total: cachedOrFresh.pagination?.total || 0
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch schools', 
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST handler for creating a new school
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
    const { name, ges_code, circuit_id, district_id, address = null, contact = null, type = null } = body;
    
    if (!name || !ges_code || !circuit_id) {
      return NextResponse.json({
        success: false,
        error: 'Name, ges_code, and circuit_id are required'
      }, { status: 400 });
    }
    
    const db = await getConnection();
    
    // Verify circuit exists and get associated district and region IDs
    const [circuitData] = await db.query(`
      SELECT c.id, c.district_id, d.region_id 
      FROM circuits c 
      JOIN districts d ON c.district_id = d.id 
      WHERE c.id = ?
    `, [circuit_id]);
    
    if (circuitData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Circuit not found'
      }, { status: 400 });
    }
    
    const circuitInfo = circuitData[0];
    const actualDistrictId = district_id || circuitInfo.district_id;
    const regionId = circuitInfo.region_id;
    
    // Insert a new school into the database
    const [result] = await db.query(
      'INSERT INTO schools (name, ges_code, circuit_id, district_id, address, contact, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [name, ges_code, circuit_id, actualDistrictId, address, contact, type]
    );
    
    // Invalidate relevant caches
    await CacheService.invalidateMultiple([
      'schools:*',
      `circuits:${circuit_id}:*`,
      `districts:${actualDistrictId}:*`,
      `regions:${regionId}:*`
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'School created successfully',
        id: result.insertId
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating school:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create school',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * PUT handler for updating a school
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
    const { id, name, ges_code, circuit_id, district_id, address = null, contact = null, type = null } = body;

    if (!id || !name || !ges_code || !circuit_id) {
      return NextResponse.json({
        success: false,
        error: 'ID, name, ges_code, and circuit_id are required'
      }, { status: 400 });
    }

    const db = await getConnection();
    
    // Get current school data to check for circuit/district change
    const [currentSchool] = await db.query(`
      SELECT s.district_id, s.circuit_id, d.region_id
      FROM schools s 
      JOIN districts d ON s.district_id = d.id 
      WHERE s.id = ?
    `, [id]);
    
    if (currentSchool.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'School not found'
      }, { status: 404 });
    }
    
    const oldCircuitId = currentSchool[0].circuit_id;
    const oldDistrictId = currentSchool[0].district_id;
    const oldRegionId = currentSchool[0].region_id;

    // Verify circuit exists and get new district/region information
    const [circuitData] = await db.query(`
      SELECT c.district_id, d.region_id 
      FROM circuits c 
      JOIN districts d ON c.district_id = d.id 
      WHERE c.id = ?
    `, [circuit_id]);
    
    if (circuitData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Circuit not found'
      }, { status: 400 });
    }
    
    const actualDistrictId = district_id || circuitData[0].district_id;
    const newRegionId = circuitData[0].region_id;

    // Update school
    await db.query(
      'UPDATE schools SET name = ?, ges_code = ?, circuit_id = ?, district_id = ?, address = ?, contact = ?, type = ?, updated_at = NOW() WHERE id = ?',
      [name, ges_code, circuit_id, actualDistrictId, address, contact, type, id]
    );
    
    // Invalidate caches
    const cachesToInvalidate = ['schools:*'];
    
    // If circuit changed, invalidate old and new circuit caches
    if (oldCircuitId !== circuit_id) {
      cachesToInvalidate.push(`circuits:${oldCircuitId}:*`);
      cachesToInvalidate.push(`circuits:${circuit_id}:*`);
    }
    
    // If district changed, invalidate old and new district caches
    if (oldDistrictId !== actualDistrictId) {
      cachesToInvalidate.push(`districts:${oldDistrictId}:*`);
      cachesToInvalidate.push(`districts:${actualDistrictId}:*`);
    }
    
    // If region changed, invalidate old and new region caches
    if (oldRegionId !== newRegionId) {
      cachesToInvalidate.push(`regions:${oldRegionId}:*`);
      cachesToInvalidate.push(`regions:${newRegionId}:*`);
    }
    
    await CacheService.invalidateMultiple(cachesToInvalidate);

    return NextResponse.json({
      success: true,
      data: {
        message: 'School updated successfully'
      }
    });
  } catch (error) {
    console.error('Error updating school:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update school',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE handler for removing a school
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
        error: 'School ID is required'
      }, { status: 400 });
    }
    
    const db = await getConnection();
    
    // Get school info before deletion to invalidate correct caches
    const [school] = await db.query(`
      SELECT s.circuit_id, s.district_id, d.region_id 
      FROM schools s 
      JOIN districts d ON s.district_id = d.id 
      WHERE s.id = ?
    `, [id]);
    
    if (school.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'School not found'
      }, { status: 404 });
    }
    
    const circuitId = school[0].circuit_id;
    const districtId = school[0].district_id;
    const regionId = school[0].region_id;
    
    // Check for dependent data (like facilitators or reports)
    const [facilitatorRows] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = 'facilitator'",
      [id]
    );
    
    if (facilitatorRows[0].count > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete school with associated facilitators'
      }, { status: 400 });
    }

    // Delete school
    await db.query('DELETE FROM schools WHERE id = ?', [id]);
    
    // Invalidate caches
    await CacheService.invalidateMultiple([
      'schools:*',
      `circuits:${circuitId}:*`,
      `districts:${districtId}:*`,
      `regions:${regionId}:*`
    ]);

    return NextResponse.json({
      success: true,
      data: {
        message: 'School deleted successfully'
      }
    });
  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete school',
      details: error.message
    }, { status: 500 });
  }
}