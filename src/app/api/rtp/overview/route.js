import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getConnectionConfig } from '@/utils/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const itineraryId = searchParams.get('itineraryId');
    if (!itineraryId) {
      return NextResponse.json({ success: false, error: 'Missing itineraryId' }, { status: 400 });
    }
    const conn = await mysql.createConnection(getConnectionConfig());
    try {
      // totalSchoolSubmissions = count of distinct schools submitting school output
      const [[{ schoolCount }]] = await conn.execute(
        `SELECT COUNT(DISTINCT school_id) AS schoolCount FROM right_to_play_question_answers WHERE itinerary_id = ?`,
        [itineraryId]
      );
      
      // Count distinct districts with district output responses
      const [[{ districtCount }]] = await conn.execute(
        `SELECT COUNT(DISTINCT district_id) AS districtCount FROM right_to_play_district_responses WHERE itinerary_id = ?`,
        [itineraryId]
      );
      
      // Count schools with consolidated checklist responses
      const [[{ checklistCount }]] = await conn.execute(
        `SELECT COUNT(DISTINCT school_id) AS checklistCount FROM right_to_play_consolidated_checklist_responses WHERE itinerary_id = ?`,
        [itineraryId]
      );
      
      // Count schools with Partners in Play responses
      const [[{ pipCount }]] = await conn.execute(
        `SELECT COUNT(DISTINCT school_id) AS pipCount FROM right_to_play_pip_responses WHERE itinerary_id = ?`,
        [itineraryId]
      );
      
      const totalSchoolSubmissions = schoolCount;

      // activeSchools = distinct schools submitting school output
      const [[{ activeSchools }]] = await conn.execute(
        `SELECT COUNT(DISTINCT school_id) AS activeSchools FROM right_to_play_question_answers WHERE itinerary_id = ?`,
        [itineraryId]
      );
      
      // total schools invited (all schools)
      const [[{ totalSchools }]] = await conn.execute(
        `SELECT COUNT(*) AS totalSchools FROM schools WHERE deleted_at IS NULL`
      );
      
      const responseRate = totalSchools ? (activeSchools / totalSchools) * 100 : 0;
      
      // Get total districts for district output indicators
      const [[{ totalDistricts }]] = await conn.execute(
        `SELECT COUNT(DISTINCT district_id) AS totalDistricts FROM schools WHERE deleted_at IS NULL`
      );
      
      // Initialize category summary
      const categorySummary = {
        schoolOutput: { total: totalSchools, completed: schoolCount || 0 },
        districtOutput: { total: totalDistricts, completed: districtCount || 0 },
        consolidatedChecklist: { total: totalSchools, completed: checklistCount || 0 },
        partnersInPlay: { total: totalSchools, completed: pipCount || 0 }
      };
      
      // Calculate completion rate - schools that submitted all required categories
      // A school is considered "complete" if it has submitted data for school output, consolidated checklist, and partners in play
      const [[{ completeSchools }]] = await conn.execute(
        `SELECT COUNT(DISTINCT s.id) AS completeSchools
         FROM schools s
         WHERE EXISTS (SELECT 1 FROM right_to_play_question_answers a WHERE a.school_id = s.id AND a.itinerary_id = ?)
           AND EXISTS (SELECT 1 FROM right_to_play_consolidated_checklist_responses r WHERE r.school_id = s.id AND r.itinerary_id = ?)
           AND EXISTS (SELECT 1 FROM right_to_play_pip_responses r WHERE r.school_id = s.id AND r.itinerary_id = ?)`,
        [itineraryId, itineraryId, itineraryId]
      );
      
      const completionRate = totalSchools ? (completeSchools / totalSchools) * 100 : 0;
      
      // Return the compiled statistics
      return NextResponse.json({ 
        success: true, 
        data: { 
          stats: { 
            totalSchoolSubmissions, 
            activeSchools, 
            responseRate, 
            completionRate, 
            totalSchools, 
            categorySummary,
            // Additional detailed statistics
            detailedCounts: {
              schoolOutputCount: schoolCount || 0,
              districtOutputCount: districtCount || 0,
              consolidatedChecklistCount: checklistCount || 0,
              partnersInPlayCount: pipCount || 0
            }
          } 
        } 
      });
    } finally {
      await conn.end();
    }
  } catch (error) {
    console.error('Overview API error:', error);
    // Return actual error message for debugging
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}