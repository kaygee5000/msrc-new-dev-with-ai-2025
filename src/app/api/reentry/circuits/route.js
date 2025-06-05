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
    const districtId = searchParams.get('districtId');
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
      whereClause += ' AND c.name LIKE ?';
      params.push(`%${search}%`);
    }
    
    if (districtId) {
      whereClause += ' AND c.district_id = ?';
      params.push(districtId);
    }
    
    if (regionId) {
      whereClause += ' AND c.region_id = ?';
      params.push(regionId);
    }
    
    // Map sort fields to actual database columns
    const sortFieldMap = {
      name: 'c.name',
      district: 'district_name',
      region: 'region_name',
      pregnantCount: 'pregnant_count',
      droppedOutCount: 'dropped_out_count',
      returnedCount: 'returned_count',
      reentryRate: 'reentry_rate',
      totalCases: 'total_cases'
    };
    
    const sortField = sortFieldMap[sortBy] || 'c.name';
    const orderDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    // First, get a list of circuits with their basic info
    const circuitsQuery = `
      SELECT 
        c.id,
        c.name,
        c.district_id,
        d.name as district_name,
        c.region_id,
        r.name as region_name
      FROM circuits c
      LEFT JOIN districts d ON c.district_id = d.id
      LEFT JOIN regions r ON c.region_id = r.id
      ${whereClause}
      GROUP BY c.id, c.name, c.district_id, d.name, c.region_id, r.name
      ORDER BY ${sortField === 'c.name' || sortField === 'district_name' || sortField === 'region_name' ? sortField : 'c.name'} ${orderDirection}
      LIMIT ? OFFSET ?
    `;
    
    // Add pagination params
    params.push(limit, offset);
    
    // Execute circuits query
    const [circuits] = await db.execute(circuitsQuery, params);
    
    // Get pregnancy stats for each circuit
    const circuitIds = circuits.map(circuit => circuit.id);
    
    if (circuitIds.length > 0) {
      // Get pregnancy stats from the dashboard view
      const statsQuery = `
        SELECT 
          circuit_id,
          COUNT(DISTINCT school_id) as total_schools,
          COUNT(DISTINCT CASE WHEN response_text = 'pregnant' THEN id END) as pregnant_count,
          COUNT(DISTINCT CASE WHEN response_text = 'dropped_out' THEN id END) as dropped_out_count,
          COUNT(DISTINCT CASE WHEN response_text = 'returned' THEN id END) as returned_count,
          COUNT(DISTINCT id) as total_cases
        FROM v_pregnancy_dashboard
        WHERE circuit_id IN (${circuitIds.map(() => '?').join(',')})
        GROUP BY circuit_id
      `;
      
      const [stats] = await db.execute(statsQuery, circuitIds);
      
      // Create a map of circuit_id to stats
      const statsMap = stats.reduce((map, stat) => {
        map[stat.circuit_id] = stat;
        return map;
      }, {});
      
      // Calculate trend data
      const trendQuery = `
        SELECT 
          circuit_id,
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
        WHERE circuit_id IN (${circuitIds.map(() => '?').join(',')})
        GROUP BY circuit_id
      `;
      
      const [trends] = await db.execute(trendQuery, circuitIds);
      
      // Create a map of circuit_id to trend
      const trendMap = trends.reduce((map, item) => {
        map[item.circuit_id] = item.trend;
        return map;
      }, {});
      
      // Combine circuit data with stats
      circuits.forEach(circuit => {
        const circuitStats = statsMap[circuit.id] || {
          total_schools: 0,
          pregnant_count: 0,
          dropped_out_count: 0,
          returned_count: 0,
          total_cases: 0
        };
        
        // Calculate reentry rate
        const totalDroppedAndReturned = (circuitStats.dropped_out_count || 0) + (circuitStats.returned_count || 0);
        const reentryRate = totalDroppedAndReturned > 0 
          ? Math.round((circuitStats.returned_count || 0) * 100 / totalDroppedAndReturned * 100) / 100
          : 0;
        
        circuit.stats = {
          totalSchools: circuitStats.total_schools || 0,
          pregnantInSchool: circuitStats.pregnant_count || 0,
          droppedOut: circuitStats.dropped_out_count || 0,
          returnedToSchool: circuitStats.returned_count || 0,
          totalCases: circuitStats.total_cases || 0,
          reentryRate: reentryRate,
          trend: trendMap[circuit.id] || 'stable'
        };
        
        // Determine status based on thresholds
        circuit.status = reentryRate >= 70 ? 'good' : reentryRate >= 50 ? 'warning' : 'critical';
      });
    }
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM circuits c
      ${whereClause}
    `;
    
    const [countResults] = await db.execute(countQuery, params.slice(0, -2)); // Remove limit/offset params
    const totalCount = countResults[0]?.total || 0;
    
    return NextResponse.json({
      data: circuits,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching circuits data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch circuits data' },
      { status: 500 }
    );
  }
}
