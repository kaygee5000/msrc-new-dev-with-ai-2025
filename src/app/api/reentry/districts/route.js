import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination params
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = page * limit;
    
    // Search and filter params
    const search = searchParams.get('search') || '';
    const regionId = searchParams.get('regionId');
    const status = searchParams.get('status') || 'all';
    const metric = searchParams.get('metric') || 'all';
    
    // Sorting params
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (search) {
      whereClause += ' AND d.name LIKE ?';
      params.push(`%${search}%`);
    }
    
    if (regionId) {
      whereClause += ' AND d.region_id = ?';
      params.push(regionId);
    }
    
    // Map sort fields to actual database columns
    const sortFieldMap = {
      name: 'd.name',
      region: 'region_name',
      pregnantCount: 'pregnant_count',
      droppedOutCount: 'dropped_out_count',
      returnedCount: 'returned_count',
      reentryRate: 'reentry_rate',
      totalCases: 'total_cases'
    };
    
    const sortField = sortFieldMap[sortBy] || 'd.name';
    const orderDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    // First, get a list of districts with their basic info
    const districtsQuery = `
      SELECT 
        d.id,
        d.name,
        d.region_id,
        r.name as region_name
      FROM districts d
      LEFT JOIN regions r ON d.region_id = r.id
      ${whereClause}
      GROUP BY d.id, d.name, d.region_id, r.name
      ORDER BY ${sortField === 'd.name' || sortField === 'region_name' ? sortField : 'd.name'} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    // Add pagination params
    params.push(limit, offset);
    
    // Execute districts query
    const [districts] = await db.execute(districtsQuery, params);
    
    // Get pregnancy stats for each district
    const districtIds = districts.map(district => district.id);
    
    if (districtIds.length > 0) {
      // Get pregnancy stats from the dashboard view
      const statsQuery = `
        SELECT 
          district_id,
          COUNT(DISTINCT school_id) as total_schools,
          COUNT(DISTINCT CASE WHEN response_text = 'pregnant' THEN id END) as pregnant_count,
          COUNT(DISTINCT CASE WHEN response_text = 'dropped_out' THEN id END) as dropped_out_count,
          COUNT(DISTINCT CASE WHEN response_text = 'returned' THEN id END) as returned_count,
          COUNT(DISTINCT id) as total_cases
        FROM v_pregnancy_dashboard
        WHERE district_id IN (${districtIds.map(() => '?').join(',')})
        GROUP BY district_id
      `;
      
      const [stats] = await db.execute(statsQuery, districtIds);
      
      // Create a map of district_id to stats
      const statsMap = stats.reduce((map, stat) => {
        map[stat.district_id] = stat;
        return map;
      }, {});
      
      // Calculate trend data
      const trendQuery = `
        SELECT 
          district_id,
          CASE 
            WHEN COUNT(CASE WHEN submitted_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN 1 END) >
                 COUNT(CASE WHEN submitted_at >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH) 
                           AND submitted_at < DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN 1 END)
            THEN 'increasing'
            WHEN COUNT(CASE WHEN submitted_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN 1 END) <
                 COUNT(CASE WHEN submitted_at >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH) 
                           AND submitted_at < DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN 1 END)
            THEN 'decreasing'
            ELSE 'stable'
          END as trend
        FROM v_pregnancy_dashboard
        WHERE district_id IN (${districtIds.map(() => '?').join(',')})
        GROUP BY district_id
      `;
      
      const [trends] = await db.execute(trendQuery, districtIds);
      
      // Create a map of district_id to trend
      const trendMap = trends.reduce((map, item) => {
        map[item.district_id] = item.trend;
        return map;
      }, {});
      
      // Combine district data with stats
      districts.forEach(district => {
        const districtStats = statsMap[district.id] || {
          total_schools: 0,
          pregnant_count: 0,
          dropped_out_count: 0,
          returned_count: 0,
          total_cases: 0
        };
        
        // Calculate reentry rate
        const totalDroppedAndReturned = (districtStats.dropped_out_count || 0) + (districtStats.returned_count || 0);
        const reentryRate = totalDroppedAndReturned > 0 
          ? Math.round((districtStats.returned_count || 0) * 100 / totalDroppedAndReturned * 100) / 100
          : 0;
        
        district.stats = {
          totalSchools: districtStats.total_schools || 0,
          pregnantInSchool: districtStats.pregnant_count || 0,
          droppedOut: districtStats.dropped_out_count || 0,
          returnedToSchool: districtStats.returned_count || 0,
          totalCases: districtStats.total_cases || 0,
          reentryRate: reentryRate,
          trend: trendMap[district.id] || 'stable'
        };
        
        // Determine status based on thresholds
        district.status = reentryRate >= 70 ? 'good' : reentryRate >= 50 ? 'warning' : 'critical';
      });
    }
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT d.id) as total
      FROM districts d
      ${whereClause}
    `;
    
    const [countResults] = await db.execute(countQuery, params.slice(0, -2)); // Remove limit/offset params
    const totalCount = countResults[0]?.total || 0;
    
    return NextResponse.json({
      data: districts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching districts data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch districts data' },
      { status: 500 }
    );
  }
}
