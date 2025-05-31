import { NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import CacheService from '@/utils/cache';
import { verifyServerAuth } from '@/utils/serverAuth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const id = searchParams.get('id');

    const cacheKey = `regions:${id || ''}:${search}:${page}:${limit}`;

    const result = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const db = await getConnection();

        if (id) {
          const [rows] = await db.execute(
            'SELECT * FROM regions WHERE id = ? AND deleted_at IS NULL',
            [id]
          );
          return { success: true, data: rows };
        }

        let query = 'SELECT * FROM regions WHERE deleted_at IS NULL';
        let countQuery = 'SELECT COUNT(*) as total FROM regions WHERE deleted_at IS NULL';
        const params = [];
        const countParams = [];

        if (search) {
          query += ' AND name LIKE ?';
          countQuery += ' AND name LIKE ?';
          params.push(`%${search}%`);
          countParams.push(`%${search}%`);
        }

        query += ' ORDER BY name';

        if (limit !== -1) {
          query += ` LIMIT ${(page - 1) * limit}, ${limit}`;
        }

        const [rows] = await db.execute(query, params);

        let pagination = {};
        if (limit !== -1) {
          const [[{ total }]] = await db.execute(countQuery, countParams);
          pagination = {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          };
        }

        return { regions: rows, pagination };
      },
      21600
    );

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch regions', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authResult = await verifyServerAuth(request, ['admin']);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.message }, { status: authResult.status });
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const db = await getConnection();
    const [result] = await db.execute(
      `INSERT INTO regions (name, description, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())`,
      [name, description || null]
    );

    await CacheService.invalidate('regions:*');

    return NextResponse.json({
      success: true,
      message: 'Region created successfully',
      data: { id: result.insertId },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating region:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create region', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const authResult = await verifyServerAuth(request, ['admin']);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.message }, { status: authResult.status });
    }

    const { id, name, description } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ success: false, error: 'ID and name are required' }, { status: 400 });
    }

    const db = await getConnection();
    await db.execute(
      `UPDATE regions SET name = ?, description = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [name, description || null, id]
    );

    await CacheService.invalidate('regions:*');

    return NextResponse.json({ success: true, message: 'Region updated successfully' });
  } catch (error) {
    console.error('Error updating region:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update region', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const authResult = await verifyServerAuth(request, ['admin']);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.message }, { status: authResult.status });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required for deletion' }, { status: 400 });
    }

    const db = await getConnection();
    await db.execute(`UPDATE regions SET deleted_at = NOW() WHERE id = ?`, [id]);

    await CacheService.invalidate('regions:*');

    return NextResponse.json({ success: true, message: 'Region soft deleted successfully' });
  } catch (error) {
    console.error('Error deleting region:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete region', details: error.message },
      { status: 500 }
    );
  }
}
