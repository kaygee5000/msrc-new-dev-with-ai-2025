import { NextResponse } from 'next/server';
import db from '@/utils/db';
import { aggregateEnrollment } from '@/utils/statisticsHelpers';

/**
 * GET handler for school enrollment statistics
 * Retrieves enrollment data filtered by school, circuit, district, or region
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const circuitId = searchParams.get('circuitId');
    const districtId = searchParams.get('districtId');
    const regionId = searchParams.get('regionId');
    const year = searchParams.get('year') || '2024/2025'; // Default to current academic year
    const term = searchParams.get('term') || '1'; // Default to first term
    const weekNumber = searchParams.get('weekNumber');
    const aggregate = searchParams.get('aggregate') === 'true';
    
    console.log('Enrollment API called with params:', { 
      schoolId, circuitId, districtId, regionId, year, term, weekNumber, aggregate 
    });

    let query = `
      SELECT 
        id, school_id, circuit_id, district_id, region_id,
        normal_boys_total, normal_girls_total,
        special_boys_total, special_girls_total,
        total_population, term, week_number, year
      FROM school_enrolment_totals
      WHERE year = ? AND term = ?
    `;
    
    const params = [year, term];
    
    // Add week filter if provided
    if (!aggregate && weekNumber) {
      query += ' AND week_number = ?';
      params.push(weekNumber);
    }
    
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
    
    // If week is specified, get that exact week, otherwise get the most recent
    if (!aggregate) {
      // if not aggregating, get most recent
      query += ' ORDER BY week_number DESC LIMIT 1';
    }
    
    console.log('Enrollment query:', query);
    console.log('Enrollment params:', params);
    
    const [rows] = await db.query(query, params);
    
    console.log(`Enrollment query returned ${rows.length} rows`);
    
    if (!aggregate) {
      if (rows.length === 0) {
        return NextResponse.json({ success: true, data: null });
      }
      return NextResponse.json({ success: true, data: rows[0] || null });
    }
    // aggregate case
    const data = aggregateEnrollment(rows);
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('Error fetching enrolment data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrolment data' },
      { status: 500 }
    );
  }
}
