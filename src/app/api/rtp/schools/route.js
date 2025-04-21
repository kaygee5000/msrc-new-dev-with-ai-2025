/*
 * API Route: /api/rtp/schools
 * Description: Retrieves schools with RTP participation statistics
 * Query Parameters:
 *   - region_id: Filter by region
 *   - district_id: Filter by district
 *   - galop_status: Filter by GALOP status (1 for GALOP, 0 for non-GALOP)
 *   - response_status: Filter by response status ('all', 'responded', 'not-responded')
 *   - itinerary_id: Filter by specific itinerary
 */

import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const regionId = searchParams.get('region_id');
    const districtId = searchParams.get('district_id');
    const galopStatus = searchParams.get('galop_status');
    const responseStatus = searchParams.get('response_status') || 'all';
    const itineraryId = searchParams.get('itinerary_id');
    
    // Build base query
    let query = `
      SELECT 
        s.id, 
        s.name as school_name, 
        s.emis_code,
        s.is_galop,
        d.id as district_id,
        d.name as district_name,
        r.id as region_id,
        r.name as region_name,
        (
          SELECT COUNT(*) 
          FROM right_to_play_school_responses sr 
          WHERE sr.school_id = s.id AND sr.deleted_at IS NULL
        ) as total_school_output_submissions,
        (
          SELECT COUNT(*) 
          FROM right_to_play_consolidated_checklist_responses ccr 
          WHERE ccr.school_id = s.id AND ccr.deleted_at IS NULL
        ) as total_checklist_submissions,
        (
          SELECT COUNT(*) 
          FROM right_to_play_pip_responses pr 
          WHERE pr.school_id = s.id AND pr.deleted_at IS NULL
        ) as total_partners_submissions
      FROM 
        schools s
      JOIN districts d ON s.district_id = d.id
      JOIN regions r ON d.region_id = r.id
      WHERE 1=1
    `;
    
    // Add filters
    const queryParams = [];
    
    if (regionId) {
      query += ` AND r.id = ?`;
      queryParams.push(parseInt(regionId));
    }
    
    if (districtId) {
      query += ` AND d.id = ?`;
      queryParams.push(parseInt(districtId));
    }
    
    if (galopStatus !== null && galopStatus !== undefined) {
      query += ` AND s.is_galop = ?`;
      queryParams.push(parseInt(galopStatus));
    }
    
    // Handle response status filtering
    if (itineraryId && responseStatus !== 'all') {
      if (responseStatus === 'responded') {
        query += ` AND (
          EXISTS (SELECT 1 FROM right_to_play_school_responses sr WHERE sr.school_id = s.id AND sr.itinerary_id = ? AND sr.deleted_at IS NULL)
          OR EXISTS (SELECT 1 FROM right_to_play_consolidated_checklist_responses ccr WHERE ccr.school_id = s.id AND ccr.itinerary_id = ? AND ccr.deleted_at IS NULL)
          OR EXISTS (SELECT 1 FROM right_to_play_pip_responses pr WHERE pr.school_id = s.id AND pr.itinerary_id = ? AND pr.deleted_at IS NULL)
        )`;
        queryParams.push(parseInt(itineraryId), parseInt(itineraryId), parseInt(itineraryId));
      } else if (responseStatus === 'not-responded') {
        query += ` AND NOT (
          EXISTS (SELECT 1 FROM right_to_play_school_responses sr WHERE sr.school_id = s.id AND sr.itinerary_id = ? AND sr.deleted_at IS NULL)
          OR EXISTS (SELECT 1 FROM right_to_play_consolidated_checklist_responses ccr WHERE ccr.school_id = s.id AND ccr.itinerary_id = ? AND ccr.deleted_at IS NULL)
          OR EXISTS (SELECT 1 FROM right_to_play_pip_responses pr WHERE pr.school_id = s.id AND pr.itinerary_id = ? AND pr.deleted_at IS NULL)
        )`;
        queryParams.push(parseInt(itineraryId), parseInt(itineraryId), parseInt(itineraryId));
      }
    }
    
    // Add itinerary-specific response counts if an itinerary was specified
    if (itineraryId) {
      query = query.replace(
        'FROM schools s',
        `(
          SELECT COUNT(*) 
          FROM right_to_play_school_responses sr 
          WHERE sr.school_id = s.id AND sr.itinerary_id = ${parseInt(itineraryId)} AND sr.deleted_at IS NULL
        ) as itinerary_school_output_submissions,
        (
          SELECT COUNT(*) 
          FROM right_to_play_consolidated_checklist_responses ccr 
          WHERE ccr.school_id = s.id AND ccr.itinerary_id = ${parseInt(itineraryId)} AND ccr.deleted_at IS NULL
        ) as itinerary_checklist_submissions,
        (
          SELECT COUNT(*) 
          FROM right_to_play_pip_responses pr 
          WHERE pr.school_id = s.id AND pr.itinerary_id = ${parseInt(itineraryId)} AND pr.deleted_at IS NULL
        ) as itinerary_partners_submissions
        FROM schools s`
      );
    }
    
    // Order by and limit
    query += ` ORDER BY r.name, d.name, s.name LIMIT 200`;
    
    // Execute query
    const [schools] = await db.query(query, queryParams);
    
    // Calculate additional metrics for each school
    schools.forEach(school => {
      school.total_submissions = 
        school.total_school_output_submissions + 
        school.total_checklist_submissions + 
        school.total_partners_submissions;

      // Compute participation percentage across categories
      const hasOutput = school.total_school_output_submissions > 0;
      const hasChecklist = school.total_checklist_submissions > 0;
      const hasPartners = school.total_partners_submissions > 0;
      const categoriesCompleted = [hasOutput, hasChecklist, hasPartners].filter(Boolean).length;
      school.participation_percentage = Math.round((categoriesCompleted / 3) * 100);

      // Rename fields for client
      school.output_submissions = school.total_school_output_submissions;
      school.checklist_submissions = school.total_checklist_submissions;
      school.partners_submissions = school.total_partners_submissions;
      delete school.total_school_output_submissions;
      delete school.total_checklist_submissions;
      delete school.total_partners_submissions;

      if (itineraryId) {
        school.itinerary_total_submissions = 
          school.itinerary_school_output_submissions + 
          school.itinerary_checklist_submissions + 
          school.itinerary_partners_submissions;
        school.has_responded_to_itinerary = school.itinerary_total_submissions > 0;

        // Rename itinerary-specific fields
        school.itinerary_output_submissions = school.itinerary_school_output_submissions;
        school.itinerary_checklist_submissions = school.itinerary_checklist_submissions;
        school.itinerary_partners_submissions = school.itinerary_partners_submissions;
        delete school.itinerary_school_output_submissions;
        delete school.itinerary_checklist_submissions;
        delete school.itinerary_partners_submissions;
      }
    });
    
    return NextResponse.json({
      status: 'success',
      count: schools.length,
      schools: schools
    });
    
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch schools', details: error.message },
      { status: 500 }
    );
  }
}