import { NextResponse } from 'next/server';
import db from '@/utils/db';

// Returns district-level aggregation for re-entries (bar chart)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('regionId');
    const term = searchParams.get('term');
    const where = [];
    if (regionId) where.push(`region_id = ${db.escape(regionId)}`);
    if (term) where.push(`class_level = ${db.escape(term)}`); // adjust if term is a different column
    where.push(`question_code = 'GDRTS'`); // Re-entry count
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const [rows] = await db.query(`
      SELECT district_name AS district, SUM(COALESCE(response_number,0)) AS count
      FROM v_pregnancy_dashboard
      ${whereClause}
      GROUP BY district_id, district_name
      ORDER BY count DESC
    `);
    return NextResponse.json({ districts: rows });
  } catch (error) {
    console.error('Error fetching reentry districts:', error);
    return NextResponse.json({ error: 'Failed to fetch districts' }, { status: 500 });
  }
}
