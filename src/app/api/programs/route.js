import { NextResponse } from 'next/server';
import pool from '../../../utils/db';

/**
 * GET handler for retrieving programs
 */
export async function GET(request) {
  try {
    // Get search parameters
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const code = searchParams.get('code');
    
    // Build query
    let query = 'SELECT * FROM programs';
    const params = [];
    const whereClauses = [];
    
    if (active !== null) {
      whereClauses.push('active = ?');
      params.push(active === 'true' || active === '1' ? 1 : 0);
    }
    
    if (code) {
      whereClauses.push('code = ?');
      params.push(code);
    }
    
    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    query += ' ORDER BY name ASC';
    
    // Execute query
    const [rows] = await pool.query(query, params);
    
    return NextResponse.json({
      success: true,
      programs: rows
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
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
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.code) {
      return NextResponse.json({
        success: false,
        error: 'Name and code are required'
      }, { status: 400 });
    }
    
    // Check if program with code already exists
    const [existingPrograms] = await pool.query(
      'SELECT id FROM programs WHERE code = ?',
      [body.code]
    );
    
    if (existingPrograms.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'A program with this code already exists'
      }, { status: 400 });
    }
    
    // Insert new program
    const [result] = await pool.query(
      'INSERT INTO programs (name, code, description, active) VALUES (?, ?, ?, ?)',
      [body.name, body.code, body.description || null, body.active !== false]
    );
    
    // Fetch the newly created program
    const [programs] = await pool.query(
      'SELECT * FROM programs WHERE id = ?',
      [result.insertId]
    );
    
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
    const body = await request.json();
    
    // Validate required fields
    if (!body.id) {
      return NextResponse.json({
        success: false,
        error: 'Program ID is required'
      }, { status: 400 });
    }
    
    // Check if program exists
    const [existingPrograms] = await pool.query(
      'SELECT id FROM programs WHERE id = ?',
      [body.id]
    );
    
    if (existingPrograms.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Program not found'
      }, { status: 404 });
    }
    
    // Update program
    await pool.query(
      'UPDATE programs SET name = ?, code = ?, description = ?, active = ?, updated_at = NOW() WHERE id = ?',
      [body.name, body.code, body.description || null, body.active !== false, body.id]
    );
    
    // Fetch the updated program
    const [programs] = await pool.query(
      'SELECT * FROM programs WHERE id = ?',
      [body.id]
    );
    
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Program ID is required'
      }, { status: 400 });
    }
    
    // Check if program exists
    const [existingPrograms] = await pool.query(
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
    await pool.query('DELETE FROM programs WHERE id = ?', [id]);
    
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
