import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET(request) {
  try {
    // Get and log the full URL for debugging
    const url = new URL(request.url);
    console.log("Full request URL:", url.toString());
    
    // Log all raw search params for debugging
    const rawParams = Object.fromEntries(url.searchParams.entries());
    console.log("Raw search params:", rawParams);
    
    // Pagination validation with explicit parseInt base 10
    const page = Math.max(0, parseInt(url.searchParams.get('page') || '0', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)));
    const offset = page * limit;

    // Safely extract and validate all filter parameters
    const searchParam = url.searchParams.get('search');
    const search = typeof searchParam === 'string' ? searchParam.trim() : '';
    
    const circuitIdParam = url.searchParams.get('circuitId');
    const circuitId = circuitIdParam ? String(circuitIdParam) : null;
    
    const districtIdParam = url.searchParams.get('districtId');
    const districtId = districtIdParam ? String(districtIdParam) : null;
    
    const regionIdParam = url.searchParams.get('regionId');
    const regionId = regionIdParam ? String(regionIdParam) : null;

    // Sort field validation
    const sortFieldMap = {
      name: 's.name',
      circuit: 'circuit_name',
      district: 'district_name',
      region: 'region_name',
      pregnantCount: 'pregnant_count',
      droppedOutCount: 'dropped_out_count',
      returnedCount: 'returned_count',
      reentryRate: 'reentry_rate',
      totalCases: 'total_cases'
    };
    const sortBy = sortFieldMap[url.searchParams.get('sortBy')] || 's.name';
    const sortOrder = url.searchParams.get('sortOrder') === 'DESC' ? 'DESC' : 'ASC';

    // Build WHERE clause and params
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND s.name LIKE ?';
      params.push(`%${search}%`);
    }
    console.log("params", params);
    if (circuitId) {
      whereClause += ' AND s.circuit_id = ?';
      params.push(circuitId);
    }
    if (districtId) {
      whereClause += ' AND s.district_id = ?';
      params.push(districtId);
    }
    if (regionId) {
      whereClause += ' AND s.region_id = ?';
      params.push(regionId);
    }
    console.log("whereClause", whereClause);
    // Main query
    const schoolsQuery = `
      SELECT 
        s.id,
        s.name,
        s.ges_code as code,
        s.circuit_id,
        c.name as circuit_name,
        s.district_id,
        d.name as district_name,
        s.region_id,
        r.name as region_name
      FROM schools s
      LEFT JOIN circuits c ON s.circuit_id = c.id
      LEFT JOIN districts d ON s.district_id = d.id
      LEFT JOIN regions r ON s.region_id = r.id
      ${whereClause}
      GROUP BY s.id
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    console.log("schoolsQuery", schoolsQuery, "params", [...params], "limit", limit, "offset", offset);
    const [schools] = await db.query(schoolsQuery, [...params, limit, offset]);

    // Fetch stats if there are schools
    let statsMap = {};
    if (schools.length > 0) {
      const schoolIds = schools.map(s => s.id);
      const placeholders = schoolIds.map(() => '?').join(',');
      const statsQuery = `
        SELECT 
          school_id,
          COUNT(DISTINCT CASE WHEN question_code = 'PGISA' AND response_text = 'pregnant' THEN id END) as pregnant_count,
          COUNT(DISTINCT CASE WHEN question_code = 'PGDOS' AND response_text = 'dropped_out' THEN id END) as dropped_out_count,
          COUNT(DISTINCT CASE WHEN question_code = 'PGRES' AND response_text = 'returned' THEN id END) as returned_count,
          COUNT(DISTINCT id) as total_cases,
          MAX(submitted_at) as latest_case_date
        FROM v_pregnancy_dashboard
        WHERE school_id IN (${placeholders})
        GROUP BY school_id
      `;
      
      console.log("statsQuery", statsQuery, "schoolIds", schoolIds);
      const [stats] = await db.query(statsQuery, schoolIds);
      statsMap = stats.reduce((map, stat) => {
        map[stat.school_id] = stat;
        return map;
      }, {});
    }

    // Compose response (add stats to each school)
    return NextResponse.json({
      data: schools.map(school => ({
        ...school,
        stats: statsMap[school.id] || {}
      })),
      pagination: {
        page,
        limit,
        total: schools.length // For real total, run a COUNT(*) query with the same WHERE
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
