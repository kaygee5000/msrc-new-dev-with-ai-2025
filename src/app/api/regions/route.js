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

    // Query the database for regions
    const [rows] = await pool.query(`
      SELECT * FROM regions
      ${search ? `WHERE name LIKE ?` : ''}
      ORDER BY name
      LIMIT ?, ?
    `, [`%${search}%`, (page - 1) * limit, limit]);

    // Get total count for pagination
    const [[{ total }]] = await pool.query(`
      SELECT COUNT(*) as total FROM regions
      ${search ? `WHERE name LIKE ?` : ''}
    `, [`%${search}%`]);

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
      { error: 'Failed to fetch regions' },
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
    const { name, code } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Insert a new region into the database
    const [result] = await pool.query(`
      INSERT INTO regions (name, code, created_at, updated_at)
      VALUES (?, ?, NOW(), NOW())
    `, [name, code]);

    return NextResponse.json(
      { message: 'Region created successfully', id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating region:', error);
    return NextResponse.json(
      { error: 'Failed to create region' },
      { status: 500 }
    );
  }
}