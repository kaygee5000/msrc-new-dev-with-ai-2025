import { NextResponse } from 'next/server';
import db from '@/utils/db';

// Returns paginated/filterable raw data for the data table
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('regionId');
    const districtId = searchParams.get('districtId');
    const circuitId = searchParams.get('circuitId');
    const schoolId = searchParams.get('schoolId');
    const term = searchParams.get('term');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const offset = (page - 1) * pageSize;
    const where = [];
    if (regionId) where.push(`region_id = ${db.escape(regionId)}`);
    if (districtId) where.push(`district_id = ${db.escape(districtId)}`);
    if (circuitId) where.push(`circuit_id = ${db.escape(circuitId)}`);
    if (schoolId) where.push(`school_id = ${db.escape(schoolId)}`);
    if (term) where.push(`class_level = ${db.escape(term)}`); // adjust if term is a different column
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    // Get total count for pagination
    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM v_pregnancy_dashboard ${whereClause}`);
    // Get paginated rows
    const [rows] = await db.query(`
      SELECT *
      FROM v_pregnancy_dashboard
      ${whereClause}
      ORDER BY submitted_at DESC
      LIMIT ? OFFSET ?
    `, [pageSize, offset]);
    return NextResponse.json({ rows, total });
  } catch (error) {
    console.error('Error fetching reentry table:', error);
    return NextResponse.json({ error: 'Failed to fetch table data' }, { status: 500 });
  }
}
