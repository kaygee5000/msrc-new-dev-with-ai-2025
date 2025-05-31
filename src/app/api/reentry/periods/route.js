import { NextResponse } from 'next/server';
import db from '@/utils/db';

/**
 * GET - Fetch distinct periods (year, term, week combinations) that have data
 * Optional query parameters:
 * - entityType: Filter by entity type (school, circuit, district, region)
 * - entityId: Filter by entity ID
 * - limit: Limit the number of periods returned (default: 20)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Build query conditions based on entity filters
    let whereConditions = '';
    const queryParams = [];

    if (entityType && entityId) {
      switch (entityType.toLowerCase()) {
        case 'school':
          whereConditions = 'WHERE ptr.school_id = ?';
          queryParams.push(entityId);
          break;
        case 'circuit':
          whereConditions = 'WHERE s.circuit_id = ?';
          queryParams.push(entityId);
          break;
        case 'district':
          whereConditions = 'WHERE s.district_id = ?';
          queryParams.push(entityId);
          break;
        case 'region':
          whereConditions = 'WHERE s.region_id = ?';
          queryParams.push(entityId);
          break;
        default:
          // No filter if entity type is not recognized
          break;
      }
    }

    // Query to get distinct year, term, week combinations that have data
    const periodsQuery = `
      SELECT DISTINCT 
        ptr.year, 
        ptr.term, 
        ptr.week,
        MAX(ptr.created_at) as last_updated,
        COUNT(DISTINCT ptr.school_id) as school_count,
        COUNT(DISTINCT s.circuit_id) as circuit_count,
        COUNT(DISTINCT s.district_id) as district_count,
        COUNT(DISTINCT s.region_id) as region_count
      FROM pregnancy_tracker_responses ptr
      JOIN schools s ON ptr.school_id = s.id
      LEFT JOIN circuits c ON s.circuit_id = c.id
      LEFT JOIN districts d ON s.district_id = d.id
      LEFT JOIN regions r ON s.region_id = r.id
      ${whereConditions}
      GROUP BY ptr.year, ptr.term, ptr.week
      ORDER BY ptr.year DESC, ptr.term DESC, ptr.week DESC
      LIMIT ?
    `;
    
    queryParams.push(limit);

    console.log('Periods query:', periodsQuery);
    console.log('Query parameters:', queryParams);
    
    const periods = await db.query(periodsQuery, queryParams);
    
    console.log('Periods data:', periods);
    
    // Extract the actual periods data from the database response
    // MySQL returns [rows, fields] where rows is the first element
    const periodsData = periods[0] || [];
    
    // Transform the periods into a more usable format
    const transformedPeriods = periodsData.map(period => {
      // Convert term to number if it's a string
      const termNumber = typeof period.term === 'string' ? parseInt(period.term, 10) : period.term;
      
      // Ensure year is a number
      const yearNumber = typeof period.year === 'string' ? parseInt(period.year, 10) : period.year;
      
      return {
        year: yearNumber,
        term: termNumber,
        week: period.week,
        label: `${yearNumber} Term ${termNumber} Week ${period.week}`,
        lastUpdated: period.last_updated,
        counts: {
          schools: parseInt(period.school_count, 10) || 0,
          circuits: parseInt(period.circuit_count, 10) || 0,
          districts: parseInt(period.district_count, 10) || 0,
          regions: parseInt(period.region_count, 10) || 0
        }
      };
    }).filter(period => period.year && period.term && period.week); // Filter out any periods with missing data
    
    console.log('Transformed periods after conversion:', transformedPeriods);
    
    // Get entity name if entityId and entityType are provided
    let entityName = null;
    if (entityType && entityId) {
      const entityTableMap = {
        'school': 'schools',
        'circuit': 'circuits',
        'district': 'districts',
        'region': 'regions'
      };
      
      const table = entityTableMap[entityType.toLowerCase()];
      if (table) {
        const entityQuery = `SELECT name FROM ${table} WHERE id = ? LIMIT 1`;
        const [entityResult] = await db.query(entityQuery, [entityId]);
        if (entityResult && entityResult.length > 0) {
          entityName = entityResult[0].name;
        }
      }
    }
    
    // Group periods by year and term for easier consumption by the UI
    const groupedPeriods = {};
    
    console.log('Transformed periods:', transformedPeriods);
    transformedPeriods.forEach(period => {
      if (!period.year || !period.term) return; // Skip if year or term is missing
      
      const yearKey = String(period.year);
      const termKey = String(period.term);
      
      if (!groupedPeriods[yearKey]) {
        groupedPeriods[yearKey] = {};
      }
      
      if (!groupedPeriods[yearKey][termKey]) {
        groupedPeriods[yearKey][termKey] = [];
      }
      
      groupedPeriods[yearKey][termKey].push({
        week: period.week,
        label: `Week ${period.week}`,
        lastUpdated: period.lastUpdated,
        counts: period.counts
      });
    });
    
    // Get unique years and terms for dropdowns
    const years = [...new Set(transformedPeriods.map(p => p.year))].sort((a, b) => b - a);
    const terms = [...new Set(transformedPeriods.map(p => p.term))].sort((a, b) => a - b);
    
    return NextResponse.json({
      periods: transformedPeriods,
      groupedPeriods,
      years,
      terms,
      latestPeriod: transformedPeriods.length > 0 ? transformedPeriods[0] : null,
      entityFilter: entityType && entityId ? { 
        type: entityType, 
        id: entityId,
        name: entityName
      } : null
    });
  } catch (error) {
    console.error('Error fetching periods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch periods data' },
      { status: 500 }
    );
  }
}
