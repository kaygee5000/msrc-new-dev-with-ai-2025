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
    const status = searchParams.get('status') || 'all';
    const metric = searchParams.get('metric') || 'all';
    
    // Sorting params
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (search) {
      whereClause += ' AND r.name LIKE ?';
      params.push(`%${search}%`);
    }
    
    // Map sort fields to actual database columns
    const sortFieldMap = {
      name: 'r.name',
      pregnantCount: 'pregnant_count',
      droppedOutCount: 'dropped_out_count',
      returnedCount: 'returned_count',
      reentryRate: 'reentry_rate',
      totalCases: 'total_cases'
    };
    
    const sortField = sortFieldMap[sortBy] || 'r.name';
    const orderDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    // First, get a list of regions with their basic info
    const regionsQuery = `
      SELECT 
        r.id,
        r.name
      FROM regions r
      ${whereClause}
      GROUP BY r.id, r.name
      ORDER BY ${sortField === 'r.name' ? sortField : 'r.name'} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    // Add pagination params
    params.push(limit, offset);
    
    // Execute regions query
    const [regions] = await db.execute(regionsQuery, params);
    
    // Get pregnancy stats for each region
    const regionIds = regions.map(region => region.id);
    
    if (regionIds.length > 0) {
      // Get pregnancy stats from the dashboard view
      const statsQuery = `
        SELECT 
          region_id,
          COUNT(DISTINCT school_id) as total_schools,
          COUNT(DISTINCT CASE WHEN response_text = 'pregnant' THEN id END) as pregnant_count,
          COUNT(DISTINCT CASE WHEN response_text = 'dropped_out' THEN id END) as dropped_out_count,
          COUNT(DISTINCT CASE WHEN response_text = 'returned' THEN id END) as returned_count,
          COUNT(DISTINCT id) as total_cases
        FROM v_pregnancy_dashboard
        WHERE region_id IN (${regionIds.map(() => '?').join(',')})
        GROUP BY region_id
      `;
      
      const [stats] = await db.execute(statsQuery, regionIds);
      
      // Create a map of region_id to stats
      const statsMap = stats.reduce((map, stat) => {
        map[stat.region_id] = stat;
        return map;
      }, {});
      
      // Calculate trend data
      const trendQuery = `
        SELECT 
          region_id,
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
        WHERE region_id IN (${regionIds.map(() => '?').join(',')})
        GROUP BY region_id
      `;
      
      const [trends] = await db.execute(trendQuery, regionIds);
      
      // Create a map of region_id to trend
      const trendMap = trends.reduce((map, item) => {
        map[item.region_id] = item.trend;
        return map;
      }, {});
      
      // Combine region data with stats
      regions.forEach(region => {
        const regionStats = statsMap[region.id] || {
          total_schools: 0,
          pregnant_count: 0,
          dropped_out_count: 0,
          returned_count: 0,
          total_cases: 0
        };
        
        // Calculate reentry rate
        const totalDroppedAndReturned = (regionStats.dropped_out_count || 0) + (regionStats.returned_count || 0);
        const reentryRate = totalDroppedAndReturned > 0 
          ? Math.round((regionStats.returned_count || 0) * 100 / totalDroppedAndReturned * 100) / 100
          : 0;
        
        region.stats = {
          totalSchools: regionStats.total_schools || 0,
          pregnantInSchool: regionStats.pregnant_count || 0,
          droppedOut: regionStats.dropped_out_count || 0,
          returnedToSchool: regionStats.returned_count || 0,
          totalCases: regionStats.total_cases || 0,
          reentryRate: reentryRate,
          trend: trendMap[region.id] || 'stable'
        };
        
        // Determine status based on thresholds
        region.status = reentryRate >= 70 ? 'good' : reentryRate >= 50 ? 'warning' : 'critical';
      });
    }
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM regions r
      ${whereClause}
    `;
    
    const [countResults] = await db.execute(countQuery, params.slice(0, -2)); // Remove limit/offset params
    const totalCount = countResults[0]?.total || 0;
    
    return NextResponse.json({
      data: regions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching regions data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regions data' },
      { status: 500 }
    );
  }
}
