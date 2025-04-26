import { NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import CacheService from '@/utils/cache';
import { verifyServerAuth } from '@/utils/serverAuth';

/**
 * GET handler for retrieving programs
 */
export async function GET(request) {
  try {
    // Get search parameters
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const active = searchParams.get('active');
    
    // Create cache key based on query parameters
    const cacheKey = `programs:${code || ''}:${active || ''}`;
    
    // Use cache service for programs data with transform option
    const cachedOrFresh = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const db = await getConnection();
        
        // Build query
        let query = 'SELECT * FROM programs';
        const params = [];
        const whereClauses = [];
        
        if (code) {
          whereClauses.push('code = ?');
          params.push(code);
        }
        
        if (active === 'true') {
          console.log('Active is true');
          whereClauses.push('status = "active"');
        }
        
        if (whereClauses.length > 0) {
          query += ' WHERE ' + whereClauses.join(' AND ');
        }
        
        query += ' ORDER BY name ASC';
        
        log('Executing query:', query, "params:",params);
        try {
          // Execute query with proper error handling
          const [rows] = await db.execute(query, params);
          
          console.log('Fetched programs:', rows);
          // Check if rows is undefined or null
          
          return {
            success: true,
            programs: rows || []  // Always return an array, even if empty
          };
        } catch (dbError) {
          console.error('Database error fetching programs:', dbError);
          return {
            success: false,
            error: 'Database error fetching programs',
            details: dbError.message
          };
        }
      },
      // Cache programs data for 12 hours (43200 seconds) as they rarely change
      43200
    );

    // Always wrap the response in NextResponse.json()
    return NextResponse.json(cachedOrFresh, { 
      status: cachedOrFresh.success ? 200 : 500 
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    // Ensure we always return a valid JSON response
    return NextResponse.json({
      success: false,
      error: error.message || 'Error fetching programs'
    }, { status: 500 });
  }
}

/**
 * POST handler for creating a new program
 */
export async function POST(request) {
  try {
    // Verify authorization
    const authResult = await verifyServerAuth(request, ['admin']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.message },
        { status: authResult.status }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.code) {
      return NextResponse.json({
        success: false,
        error: 'Name and code are required'
      }, { status: 400 });
    }
    
    const db = await getConnection();
    
    // Check if program with code already exists
    const [existingPrograms] = await db.execute(
      'SELECT id FROM programs WHERE code = ?',
      [body.code]
    );
    
    if (existingPrograms.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'A program with this code already exists'
      }, { status: 400 });
    }
    
    // Insert new program with status
    const [result] = await db.execute(
      'INSERT INTO programs (name, code, description, status) VALUES (?, ?, ?, ?)',
      [body.name, body.code, body.description || null, body.status || 'active']
    );
    
    // Fetch the newly created program
    const [programs] = await db.execute(
      'SELECT * FROM programs WHERE id = ?',
      [result.insertId]
    );
    
    // Invalidate the programs cache
    await CacheService.invalidate('programs:*');
    
    return NextResponse.json({
      success: true,
      program: programs[0]
    });
  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error creating program'
    }, { status: 500 });
  }
}

/**
 * PUT handler for updating an existing program
 */
export async function PUT(request) {
  try {
    // Verify authorization
    const authResult = await verifyServerAuth(request, ['admin']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.message },
        { status: authResult.status }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.id) {
      return NextResponse.json({
        success: false,
        error: 'Program ID is required'
      }, { status: 400 });
    }
    
    const db = await getConnection();
    
    // Check if program exists
    const [existingPrograms] = await db.execute(
      'SELECT id FROM programs WHERE id = ?',
      [body.id]
    );
    
    if (existingPrograms.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Program not found'
      }, { status: 404 });
    }
    
    // Update program with status
    await db.execute(
      'UPDATE programs SET name = ?, code = ?, description = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [body.name, body.code, body.description || null, body.status || 'active', body.id]
    );
    
    // Fetch the updated program
    const [programs] = await db.execute(
      'SELECT * FROM programs WHERE id = ?',
      [body.id]
    );
    
    // Invalidate the programs cache
    await CacheService.invalidate('programs:*');
    
    return NextResponse.json({
      success: true,
      program: programs[0]
    });
  } catch (error) {
    console.error('Error updating program:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error updating program'
    }, { status: 500 });
  }
}

/**
 * DELETE handler for removing a program
 */
export async function DELETE(request) {
  try {
    // Verify authorization
    const authResult = await verifyServerAuth(request, ['admin']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.message },
        { status: authResult.status }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Program ID is required'
      }, { status: 400 });
    }
    
    const db = await getConnection();
    
    // Check if program exists
    const [existingPrograms] = await db.execute(
      'SELECT id FROM programs WHERE id = ?',
      [id]
    );
    
    if (existingPrograms.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Program not found'
      }, { status: 404 });
    }
    
    // Delete program
    await db.execute('DELETE FROM programs WHERE id = ?', [id]);
    
    // Invalidate the programs cache
    await CacheService.invalidate('programs:*');
    
    return NextResponse.json({
      success: true,
      message: 'Program deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting program:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error deleting program'
    }, { status: 500 });
  }
}
