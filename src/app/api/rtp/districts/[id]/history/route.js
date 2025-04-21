/*
 * API Route: /api/rtp/districts/[id]/history
 * Description: Retrieves detailed submission history for a specific district
 * Query Parameters:
 *   - itinerary_id: (Optional) Filter by specific itinerary
 */

import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET(req, { params }) {
  try {
    const districtId = params.id;
    const { searchParams } = new URL(req.url);
    const itineraryId = searchParams.get('itinerary_id');
    
    // First, fetch the district details
    const [[district]] = await db.query(
      `SELECT d.*, r.name as region_name,
        (SELECT COUNT(*) FROM schools s WHERE s.district_id = d.id) as total_schools,
        (SELECT COUNT(*) FROM schools s WHERE s.district_id = d.id AND s.is_galop = 1) as galop_schools
       FROM districts d
       JOIN regions r ON d.region_id = r.id
       WHERE d.id = ?`,
      [districtId]
    );
    
    if (!district) {
      return NextResponse.json(
        { status: 'error', message: 'District not found' },
        { status: 404 }
      );
    }
    
    // Build base query for history
    let queryParams = [districtId];
    let itineraryFilter = '';
    
    if (itineraryId) {
      itineraryFilter = ' AND i.id = ?';
      queryParams.push(parseInt(itineraryId));
    }
    
    // Fetch district output responses
    const [districtOutputResponses] = await db.query(
      `SELECT 
        dr.id, 
        'district-output' as response_type,
        i.id as itinerary_id,
        i.title as itinerary_title,
        dr.submitted_at,
        u.name as submitted_by_name,
        (
          SELECT COUNT(*) 
          FROM right_to_play_district_response_answers dra
          WHERE dra.response_id = dr.id
        ) as answer_count
       FROM right_to_play_district_responses dr
       JOIN right_to_play_itineraries i ON dr.itinerary_id = i.id
       JOIN users u ON dr.submitted_by = u.id
       WHERE dr.district_id = ? ${itineraryFilter}
       AND dr.deleted_at IS NULL
       ORDER BY dr.submitted_at DESC`,
      queryParams
    );
    
    // Fetch school output responses for schools in this district
    const [schoolOutputResponses] = await db.query(
      `SELECT 
        s.id as school_id,
        s.name as school_name,
        sr.id as response_id, 
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
       JOIN schools s ON sr.school_id = s.id
       JOIN right_to_play_itineraries i ON sr.itinerary_id = i.id
       JOIN users u ON sr.submitted_by = u.id
       WHERE s.district_id = ? ${itineraryFilter}
       AND sr.deleted_at IS NULL
       ORDER BY s.name, sr.submitted_at DESC`,
      queryParams
    );
    
    // Fetch consolidated checklist responses for schools in this district
    const [checklistResponses] = await db.query(
      `SELECT 
        s.id as school_id,
        s.name as school_name,
        cr.id as response_id, 
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
       JOIN schools s ON cr.school_id = s.id
       JOIN right_to_play_itineraries i ON cr.itinerary_id = i.id
       JOIN users u ON cr.submitted_by = u.id
       LEFT JOIN teachers t ON cr.teacher_id = t.id
       WHERE s.district_id = ? ${itineraryFilter}
       AND cr.deleted_at IS NULL
       ORDER BY s.name, cr.submitted_at DESC`,
      queryParams
    );
    
    // Fetch partners in play responses for schools in this district
    const [partnersResponses] = await db.query(
      `SELECT 
        s.id as school_id,
        s.name as school_name,
        pr.id as response_id, 
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
       JOIN schools s ON pr.school_id = s.id
       JOIN right_to_play_itineraries i ON pr.itinerary_id = i.id
       JOIN users u ON pr.submitted_by = u.id
       JOIN teachers t ON pr.teacher_id = t.id
       WHERE s.district_id = ? ${itineraryFilter}
       AND pr.deleted_at IS NULL
       ORDER BY s.name, pr.submitted_at DESC`,
      queryParams
    );
    
    // Calculate district-level statistics
    const schoolsWithOutput = new Set(schoolOutputResponses.map(r => r.school_id));
    const schoolsWithChecklist = new Set(checklistResponses.map(r => r.school_id));
    const schoolsWithPartners = new Set(partnersResponses.map(r => r.school_id));
    
    // Group responses by itinerary and school for easier frontend consumption
    const responsesByItinerary = {};
    
    // Helper function to add a district response to the grouped object
    const addDistrictResponseToGroup = (response) => {
      const itineraryId = response.itinerary_id;
      
      if (!responsesByItinerary[itineraryId]) {
        responsesByItinerary[itineraryId] = {
          itinerary_id: itineraryId,
          itinerary_title: response.itinerary_title,
          district_output: [],
          schools: {}
        };
      }
      
      // Remove redundant fields
      const { itinerary_id, itinerary_title, ...rest } = response;
      
      // Add to appropriate array based on response type
      if (response.response_type === 'district-output') {
        responsesByItinerary[itineraryId].district_output.push(rest);
      }
    };
    
    // Helper function to add a school response to the grouped object
    const addSchoolResponseToGroup = (response) => {
      const itineraryId = response.itinerary_id;
      const schoolId = response.school_id;
      
      if (!responsesByItinerary[itineraryId]) {
        responsesByItinerary[itineraryId] = {
          itinerary_id: itineraryId,
          itinerary_title: response.itinerary_title,
          district_output: [],
          schools: {}
        };
      }
      
      if (!responsesByItinerary[itineraryId].schools[schoolId]) {
        responsesByItinerary[itineraryId].schools[schoolId] = {
          school_id: schoolId,
          school_name: response.school_name,
          school_output: [],
          consolidated_checklist: [],
          partners_in_play: []
        };
      }
      
      // Remove redundant fields
      const { itinerary_id, itinerary_title, school_id, school_name, response_id, ...rest } = response;
      rest.id = response_id;
      
      // Add to appropriate array based on response type
      if (response.response_type === 'school-output') {
        responsesByItinerary[itineraryId].schools[schoolId].school_output.push(rest);
      } else if (response.response_type === 'consolidated-checklist') {
        responsesByItinerary[itineraryId].schools[schoolId].consolidated_checklist.push(rest);
      } else if (response.response_type === 'partners-in-play') {
        responsesByItinerary[itineraryId].schools[schoolId].partners_in_play.push(rest);
      }
    };
    
    // Group all responses
    districtOutputResponses.forEach(addDistrictResponseToGroup);
    [...schoolOutputResponses, ...checklistResponses, ...partnersResponses].forEach(addSchoolResponseToGroup);
    
    // Process the grouped data to convert objects to arrays
    const processedResponses = Object.values(responsesByItinerary).map(itinerary => {
      // Convert schools object to array
      itinerary.schools = Object.values(itinerary.schools);
      
      // Sort schools by name
      itinerary.schools.sort((a, b) => a.school_name.localeCompare(b.school_name));
      
      return itinerary;
    });
    
    // Sort by itinerary title
    processedResponses.sort((a, b) => a.itinerary_title.localeCompare(b.itinerary_title));
    
    // Return combined results
    return NextResponse.json({
      status: 'success',
      district: {
        id: district.id,
        name: district.name,
        region_name: district.region_name,
        total_schools: district.total_schools,
        galop_schools: district.galop_schools
      },
      statistics: {
        district_output_submissions: districtOutputResponses.length,
        schools_with_output: schoolsWithOutput.size,
        schools_with_checklist: schoolsWithChecklist.size,
        schools_with_partners: schoolsWithPartners.size,
        school_participation_percentage: Math.round(
          (Math.max(schoolsWithOutput.size, schoolsWithChecklist.size, schoolsWithPartners.size) / 
          Math.max(district.total_schools, 1)) * 100
        )
      },
      submissions: processedResponses
    });
    
  } catch (error) {
    console.error('Error fetching district history:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch district history', details: error.message },
      { status: 500 }
    );
  }
}