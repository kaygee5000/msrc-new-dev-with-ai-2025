import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('regionId');
    const districtId = searchParams.get('districtId');
    const circuitId = searchParams.get('circuitId');
    
    // Build WHERE clause based on filters
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (regionId) {
      whereClause += ' AND region_id = ?';
      params.push(regionId);
    }
    
    if (districtId) {
      whereClause += ' AND district_id = ?';
      params.push(districtId);
    }
    
    if (circuitId) {
      whereClause += ' AND circuit_id = ?';
      params.push(circuitId);
    }
    
    // Get overall counts
    const overallQuery = `
      SELECT
        COUNT(DISTINCT school_id) as total_schools,
        COUNT(DISTINCT CASE WHEN response_text = 'pregnant' THEN id END) as pregnant_count,
        COUNT(DISTINCT CASE WHEN response_text = 'dropped_out' THEN id END) as dropped_out_count,
        COUNT(DISTINCT CASE WHEN response_text = 'returned' THEN id END) as returned_count,
        COUNT(DISTINCT id) as total_cases
      FROM v_pregnancy_dashboard
      ${whereClause}
    `;
    
    const [overallResults] = await db.execute(overallQuery, params);
    const overall = overallResults[0] || {
      total_schools: 0,
      pregnant_count: 0,
      dropped_out_count: 0,
      returned_count: 0,
      total_cases: 0
    };
    
    // Calculate reentry rate
    const totalDroppedAndReturned = (overall.dropped_out_count || 0) + (overall.returned_count || 0);
    const reentryRate = totalDroppedAndReturned > 0 
      ? Math.round((overall.returned_count || 0) * 100 / totalDroppedAndReturned * 100) / 100
      : 0;
    
    // Get trend data (current month vs previous month)
    const trendQuery = `
      SELECT
        COUNT(DISTINCT CASE WHEN submitted_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN id END) as current_month,
        COUNT(DISTINCT CASE WHEN submitted_at >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH) 
                           AND submitted_at < DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN id END) as previous_month
      FROM v_pregnancy_dashboard
      ${whereClause}
    `;
    
    const [trendResults] = await db.execute(trendQuery, params);
    const trend = trendResults[0] || { current_month: 0, previous_month: 0 };
    
    // Calculate percentage change
    const percentageChange = trend.previous_month > 0
      ? Math.round(((trend.current_month - trend.previous_month) / trend.previous_month) * 100)
      : 0;
    
    // Determine trend direction
    const trendDirection = trend.current_month > trend.previous_month 
      ? 'increasing' 
      : trend.current_month < trend.previous_month 
        ? 'decreasing' 
        : 'stable';
    
    // Get monthly data for the past 6 months
    const monthlyQuery = `
      SELECT
        DATE_FORMAT(submitted_at, '%Y-%m') as month,
        COUNT(DISTINCT CASE WHEN response_text = 'pregnant' THEN id END) as pregnant_count,
        COUNT(DISTINCT CASE WHEN response_text = 'dropped_out' THEN id END) as dropped_out_count,
        COUNT(DISTINCT CASE WHEN response_text = 'returned' THEN id END) as returned_count
      FROM v_pregnancy_dashboard
      ${whereClause} AND submitted_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(submitted_at, '%Y-%m')
      ORDER BY month ASC
    `;
    
    const [monthlyResults] = await db.execute(monthlyQuery, params);
    
    // Format response
    const response = {
      overview: {
        totalSchools: overall.total_schools || 0,
        pregnantInSchool: overall.pregnant_count || 0,
        droppedOut: overall.dropped_out_count || 0,
        returnedToSchool: overall.returned_count || 0,
        reentryRate: reentryRate,
        totalCases: overall.total_cases || 0
      },
      trend: {
        direction: trendDirection,
        percentageChange: percentageChange,
        currentMonth: trend.current_month || 0,
        previousMonth: trend.previous_month || 0
      },
      monthlyData: monthlyResults.map(item => ({
        month: item.month,
        pregnantInSchool: item.pregnant_count || 0,
        droppedOut: item.dropped_out_count || 0,
        returnedToSchool: item.returned_count || 0
      }))
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching reentry summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reentry summary' },
      { status: 500 }
    );
  }
}
