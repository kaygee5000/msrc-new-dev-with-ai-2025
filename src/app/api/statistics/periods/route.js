import { NextResponse } from 'next/server';
import db from '@/utils/db';

/**
 * GET handler for available submission periods
 * Retrieves distinct weeks, terms, and years from the enrollment data
 */
async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const circuitId = searchParams.get('circuitId');
    const districtId = searchParams.get('districtId');
    const regionId = searchParams.get('regionId');
    
    // Base query to get distinct periods from enrollment data
    let query = `
      SELECT DISTINCT 
        year, 
        term, 
        week_number
      FROM school_enrolment_totals
      WHERE 1=1
    `;
    
    const params = [];
    
    // Add filters if provided
    if (schoolId) {
      query += ' AND school_id = ?';
      params.push(schoolId);
    } else if (circuitId) {
      query += ' AND circuit_id = ?';
      params.push(circuitId);
    } else if (districtId) {
      query += ' AND district_id = ?';
      params.push(districtId);
    } else if (regionId) {
      query += ' AND region_id = ?';
      params.push(regionId);
    }
    
    // Order by most recent first
    query += ' ORDER BY year DESC, term DESC, week_number DESC';
    
    const [rows] = await db.query(query, params);
    
    // Group periods by academic year and term
    const groupedPeriods = {};
    
    rows.forEach(row => {
      const { year, term, week_number } = row;
      
      if (!groupedPeriods[year]) {
        groupedPeriods[year] = {};
      }
      
      if (!groupedPeriods[year][term]) {
        groupedPeriods[year][term] = [];
      }
      
      groupedPeriods[year][term].push(week_number);
    });
    
    // Convert to a more structured format
    const formattedPeriods = Object.entries(groupedPeriods).map(([year, terms]) => {
      return {
        year,
        terms: Object.entries(terms).map(([term, weeks]) => {
          return {
            term,
            weeks: weeks.sort((a, b) => a - b) // Sort weeks in ascending order
          };
        })
      };
    });
    
    return NextResponse.json({
      success: true,
      periods: formattedPeriods
    });
    
  } catch (error) {
    console.error('Error fetching submission periods:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submission periods' },
      { status: 500 }
    );
  }
}

export { GET };
