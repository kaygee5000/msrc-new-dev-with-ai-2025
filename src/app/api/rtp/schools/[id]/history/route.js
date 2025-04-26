/*
 * API Route: /api/rtp/schools/[id]/history
 * Description: Retrieves detailed submission history for a specific school
 * Query Parameters:
 *   - itinerary_id: (Optional) Filter by specific itinerary
 */

import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET(req, { params }) {
  try {
    const schoolId = params.id;
    const { searchParams } = new URL(req.url);
    const itineraryId = searchParams.get('itinerary_id');
    
    // First, fetch the school details
    const [[school]] = await db.query(
      `SELECT s.*, d.name as district_name, r.name as region_name
       FROM schools s
       JOIN districts d ON s.district_id = d.id
       JOIN regions r ON d.region_id = r.id
       WHERE s.id = ?`,
      [schoolId]
    );
    
    if (!school) {
      return NextResponse.json(
        { status: 'error', message: 'School not found' },
        { status: 404 }
      );
    }
    
    // Build base query for history
    let queryParams = [schoolId];
    let itineraryFilter = '';
    
    if (itineraryId) {
      itineraryFilter = ' AND i.id = ?';
      queryParams.push(parseInt(itineraryId));
    }
    
    // Fetch school output responses
    const [schoolOutputResponses] = await db.query(
      `SELECT 
        sr.id, 
        'school-output' as response_type,
        i.id as itinerary_id,
        i.title as itinerary_title,
        sr.submitted_at,
        u.name as submitted_by_name,
        (
          SELECT COUNT(*) 
          FROM right_to_play_school_response_answers sra
          WHERE sra.response_id = sr.id
        ) as answer_count
       FROM right_to_play_school_responses sr
       JOIN right_to_play_itineraries i ON sr.itinerary_id = i.id
       JOIN users u ON sr.submitted_by = u.id
       WHERE sr.school_id = ? ${itineraryFilter}
       AND sr.deleted_at IS NULL
       ORDER BY sr.submitted_at DESC`,
      queryParams
    );
    
    // Fetch consolidated checklist responses
    const [checklistResponses] = await db.query(
      `SELECT 
        cr.id, 
        'consolidated-checklist' as response_type,
        i.id as itinerary_id,
        i.title as itinerary_title,
        cr.submitted_at,
        u.name as submitted_by_name,
        t.name as teacher_name,
        (
          SELECT COUNT(*) 
          FROM right_to_play_consolidated_checklist_answers cra
          WHERE cra.response_id = cr.id
        ) as answer_count
       FROM right_to_play_consolidated_checklist_responses cr
       JOIN right_to_play_itineraries i ON cr.itinerary_id = i.id
       JOIN users u ON cr.submitted_by = u.id
       LEFT JOIN teachers t ON cr.teacher_id = t.id
       WHERE cr.school_id = ? ${itineraryFilter}
       AND cr.deleted_at IS NULL
       ORDER BY cr.submitted_at DESC`,
      queryParams
    );
    
    // Fetch partners in play responses
    const [partnersResponses] = await db.query(
      `SELECT 
        pr.id, 
        'partners-in-play' as response_type,
        i.id as itinerary_id,
        i.title as itinerary_title,
        pr.submitted_at,
        u.name as submitted_by_name,
        t.name as teacher_name,
        pr.subject,
        pr.learning_environment_score,
        pr.ltp_skills_score,
        (
          SELECT COUNT(*) 
          FROM right_to_play_pip_answers pa
          WHERE pa.response_id = pr.id
        ) as answer_count
       FROM right_to_play_pip_responses pr
       JOIN right_to_play_itineraries i ON pr.itinerary_id = i.id
       JOIN users u ON pr.submitted_by = u.id
       JOIN teachers t ON pr.teacher_id = t.id
       WHERE pr.school_id = ? ${itineraryFilter}
       AND pr.deleted_at IS NULL
       ORDER BY pr.submitted_at DESC`,
      queryParams
    );
    
    // Group responses by itinerary for easier frontend consumption
    const responsesByItinerary = {};
    
    // Helper function to add a response to the grouped object
    const addResponseToGroup = (response) => {
      const itineraryId = response.itinerary_id;
      
      if (!responsesByItinerary[itineraryId]) {
        responsesByItinerary[itineraryId] = {
          itinerary_id: itineraryId,
          itinerary_title: response.itinerary_title,
          school_output: [],
          consolidated_checklist: [],
          partners_in_play: []
        };
      }
      
      // Remove redundant fields
      delete response.itinerary_id;
      delete response.itinerary_title;
      
      // Add to appropriate array based on response type
      if (response.response_type === 'school-output') {
        responsesByItinerary[itineraryId].school_output.push(response);
      } else if (response.response_type === 'consolidated-checklist') {
        responsesByItinerary[itineraryId].consolidated_checklist.push(response);
      } else if (response.response_type === 'partners-in-play') {
        responsesByItinerary[itineraryId].partners_in_play.push(response);
      }
    };
    
    // Group all responses
    [...schoolOutputResponses, ...checklistResponses, ...partnersResponses].forEach(addResponseToGroup);
    
    // Convert to array and sort by itinerary title
    const groupedResponses = Object.values(responsesByItinerary).sort((a, b) => 
      a.itinerary_title.localeCompare(b.itinerary_title)
    );
    
    // Return combined results
    return NextResponse.json({
      status: 'success',
      school: {
        id: school.id,
        name: school.name,
        ges_code: school.ges_code,
        is_galop: school.is_galop,
        district_name: school.district_name,
        region_name: school.region_name
      },
      submissions: {
        school_output_count: schoolOutputResponses.length,
        checklist_count: checklistResponses.length,
        partners_count: partnersResponses.length,
        total_count: schoolOutputResponses.length + checklistResponses.length + partnersResponses.length,
        by_itinerary: groupedResponses
      }
    });
    
  } catch (error) {
    console.error('Error fetching school history:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch school history', details: error.message },
      { status: 500 }
    );
  }
}