import { NextResponse } from 'next/server';
import pool from '../../../utils/db';

/**
 * GET handler for retrieving regions
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    let query = 'SELECT * FROM regions';
    let countQuery = 'SELECT COUNT(*) as total FROM regions';
    const params = [];
    const countParams = [];
    if (search) {
      query += ' WHERE name LIKE ?';
      countQuery += ' WHERE name LIKE ?';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }
    query += ' ORDER BY name LIMIT ?, ?';
    params.push((page - 1) * limit, limit);

    // Query the database for regions
    const [rows] = await pool.query(query, params);
    // Get total count for pagination
    const [[{ total }]] = await pool.query(countQuery, countParams);

    return NextResponse.json({
      regions: rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regions', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new region
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Insert a new region into the database
    const [result] = await pool.query(`
      INSERT INTO regions (name, description, created_at, updated_at)
      VALUES (?, ?, NOW(), NOW())
    `, [name, description || null]);

    return NextResponse.json(
      { message: 'Region created successfully', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating region:', error);
    return NextResponse.json(
      { error: 'Failed to create region', details: error.message },
      { status: 500 }
    );
  }
}