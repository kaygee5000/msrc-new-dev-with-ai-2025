import { NextResponse } from 'next/server';
import db from '@/utils/db';

// API route for /api/rtp/itineraries
// Methods: GET (list), POST (create), PUT (edit), DELETE (delete)

export async function GET(req) {
  try {
    const [rows] = await db.query(`
      SELECT id, title, type, period, year, from_date, until_date, is_valid, deleted_at, created_at, updated_at
      FROM right_to_play_itineraries
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `);
    return NextResponse.json({ itineraries: rows });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch itineraries', details: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { title, type, period, year, from_date, until_date } = body;
    if (!title || !type || !period || !year || !from_date || !until_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const [result] = await db.query(
      `INSERT INTO right_to_play_itineraries (title, type, period, year, from_date, until_date, is_valid, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [title, type, period, year, from_date, until_date]
    );
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create itinerary', details: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, title, type, period, year, from_date, until_date } = body;
    if (!id || !title || !type || !period || !year || !from_date || !until_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    await db.query(
      `UPDATE right_to_play_itineraries SET title=?, type=?, period=?, year=?, from_date=?, until_date=?, updated_at=NOW() WHERE id=? AND deleted_at IS NULL`,
      [title, type, period, year, from_date, until_date, id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update itinerary', details: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing itinerary id' }, { status: 400 });
    }
    await db.query(
      `UPDATE right_to_play_itineraries SET deleted_at=NOW() WHERE id=? AND deleted_at IS NULL`,
      [id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete itinerary', details: error.message }, { status: 500 });
  }
}