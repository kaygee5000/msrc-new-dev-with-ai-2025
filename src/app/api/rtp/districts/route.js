/*
 * API Route: /api/rtp/districts
 * Description: Retrieves districts with RTP submission statistics
 * Query Parameters:
 *   - region_id: Filter by region
 *   - response_status: Filter by response status ('all', 'responded', 'not-responded')
 *   - itinerary_id: Filter by specific itinerary
 */

import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const regionId = searchParams.get('region_id');
    const responseStatus = searchParams.get('response_status') || 'all';
    const itineraryId = searchParams.get('itinerary_id');
    
    // Build base query
    let query = `
      SELECT 
        d.id, 
        d.name as district_name, 
        r.id as region_id,
        r.name as region_name,
        (
          SELECT COUNT(*) 
          FROM schools s 
          WHERE s.district_id = d.id
        ) as total_schools,
        (
          SELECT COUNT(*) 
          FROM schools s 
          WHERE s.district_id = d.id AND s.is_galop = 1
        ) as galop_schools,
        (
          SELECT COUNT(*) 
          FROM right_to_play_district_responses dr 
          WHERE dr.district_id = d.id AND dr.deleted_at IS NULL
        ) as total_district_output_submissions,
        (
          SELECT COUNT(DISTINCT s.id) 
          FROM schools s
          LEFT JOIN right_to_play_question_answers qa ON s.id = qa.school_id AND qa.deleted_at IS NULL
          WHERE s.district_id = d.id AND qa.id IS NOT NULL
        ) as schools_with_output_submissions,
        (
          SELECT COUNT(DISTINCT s.id) 
          FROM schools s
          LEFT JOIN right_to_play_consolidated_checklist_responses ccr ON s.id = ccr.school_id AND ccr.deleted_at IS NULL
          WHERE s.district_id = d.id AND ccr.id IS NOT NULL
        ) as schools_with_checklist_submissions,
        (
          SELECT COUNT(DISTINCT s.id) 
          FROM schools s
          LEFT JOIN right_to_play_pip_responses pr ON s.id = pr.school_id AND pr.deleted_at IS NULL
          WHERE s.district_id = d.id AND pr.id IS NOT NULL
        ) as schools_with_partner_submissions
      FROM 
        districts d
      JOIN regions r ON d.region_id = r.id
      WHERE 1=1
    `;
    
    // Add filters
    const queryParams = [];
    
    if (regionId) {
      query += ` AND r.id = ?`;
      queryParams.push(parseInt(regionId));
    }
    
    // Handle response status filtering
    if (itineraryId && responseStatus !== 'all') {
      if (responseStatus === 'responded') {
        query += ` AND EXISTS (
          SELECT 1 FROM right_to_play_district_responses dr 
          WHERE dr.district_id = d.id AND dr.itinerary_id = ? AND dr.deleted_at IS NULL
        )`;
        queryParams.push(parseInt(itineraryId));
      } else if (responseStatus === 'not-responded') {
        query += ` AND NOT EXISTS (
          SELECT 1 FROM right_to_play_district_responses dr 
          WHERE dr.district_id = d.id AND dr.itinerary_id = ? AND dr.deleted_at IS NULL
        )`;
        queryParams.push(parseInt(itineraryId));
      }
    }
    
    // Add itinerary-specific response counts if an itinerary was specified
    if (itineraryId) {
      query = query.replace(
        'FROM districts d',
        `(
          SELECT COUNT(*) 
          FROM right_to_play_district_responses dr 
          WHERE dr.district_id = d.id AND dr.itinerary_id = ${parseInt(itineraryId)} AND dr.deleted_at IS NULL
        ) as itinerary_district_output_submissions,
        (
          SELECT COUNT(DISTINCT s.id) 
          FROM schools s
          LEFT JOIN right_to_play_question_answers qa ON s.id = qa.school_id 
          WHERE s.district_id = d.id AND qa.itinerary_id = ${parseInt(itineraryId)} AND qa.deleted_at IS NULL
        ) as itinerary_schools_with_output_submissions,
        (
          SELECT COUNT(DISTINCT s.id) 
          FROM schools s
          LEFT JOIN right_to_play_consolidated_checklist_responses ccr ON s.id = ccr.school_id 
          WHERE s.district_id = d.id AND ccr.itinerary_id = ${parseInt(itineraryId)} AND ccr.deleted_at IS NULL
        ) as itinerary_schools_with_checklist_submissions,
        (
          SELECT COUNT(DISTINCT s.id) 
          FROM schools s
          LEFT JOIN right_to_play_pip_responses pr ON s.id = pr.school_id 
          WHERE s.district_id = d.id AND pr.itinerary_id = ${parseInt(itineraryId)} AND pr.deleted_at IS NULL
        ) as itinerary_schools_with_partner_submissions
        FROM districts d`
      );
    }
    
    // Order by and limit
    query += ` ORDER BY r.name, d.name LIMIT 200`;
    
    // Execute query
    const [districts] = await db.query(query, queryParams);
    
    // Calculate additional metrics for each district
    districts.forEach(district => {
      // Calculate overall school participation percentage
      const schoolsWithAnySubmission = Math.max(
        district.schools_with_output_submissions, 
        district.schools_with_checklist_submissions, 
        district.schools_with_partner_submissions
      );
      district.school_participation_percentage = 
        district.total_schools > 0 
          ? Math.round((schoolsWithAnySubmission / district.total_schools) * 100) 
          : 0;
      
      // Calculate itinerary-specific metrics if applicable
      if (itineraryId) {
        const itinerarySchoolsWithAnySubmission = Math.max(
          district.itinerary_schools_with_output_submissions || 0, 
          district.itinerary_schools_with_checklist_submissions || 0, 
          district.itinerary_schools_with_partner_submissions || 0
        );
        district.itinerary_school_participation_percentage = 
          district.total_schools > 0 
            ? Math.round((itinerarySchoolsWithAnySubmission / district.total_schools) * 100) 
            : 0;
        
        district.has_responded_to_itinerary = (district.itinerary_district_output_submissions || 0) > 0;
      }
    });
    
    return NextResponse.json({
      status: 'success',
      count: districts.length,
      districts: districts
    });
    
  } catch (error) {
    console.error('Error fetching districts:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch districts', details: error.message },
      { status: 500 }
    );
  }
}