import { NextResponse } from 'next/server';
import db from '@/utils/db';

// Returns time-series data for re-entries (line chart)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('regionId');
    const districtId = searchParams.get('districtId');
    const circuitId = searchParams.get('circuitId');
    const schoolId = searchParams.get('schoolId');
    const term = searchParams.get('term');
    // Build WHERE clause
    const where = [];
    if (regionId) where.push(`region_id = ${db.escape(regionId)}`);
    if (districtId) where.push(`district_id = ${db.escape(districtId)}`);
    if (circuitId) where.push(`circuit_id = ${db.escape(circuitId)}`);
    if (schoolId) where.push(`school_id = ${db.escape(schoolId)}`);
    if (term) where.push(`class_level = ${db.escape(term)}`); // adjust if term is a different column
    where.push(`question_code = 'GDRTS'`); // Re-entry count
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    // Group by month/year for trend
    const [rows] = await db.query(`
      SELECT DATE_FORMAT(submitted_at, '%Y-%m') AS period, SUM(COALESCE(response_number,0)) AS count
      FROM v_pregnancy_dashboard
      ${whereClause}
      GROUP BY period
      ORDER BY period ASC
    `);
    return NextResponse.json({ trends: rows });
  } catch (error) {
    console.error('Error fetching reentry trends:', error);
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}
