import { NextResponse } from 'next/server';
import db from '@/utils/db';

/**
 * GET /api/rtp/analytics
 * Fetches analytical data for the RTP dashboard
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const itineraryId = searchParams.get('itineraryId');
    const schoolType = searchParams.get('schoolType'); // 'all', 'galop', or 'non-galop'
    const viewMode = searchParams.get('viewMode') || 'combined'; // 'combined', 'gender-disaggregated'
    const districtId = searchParams.get('districtId'); // optional district filter
    const regionId = searchParams.get('regionId'); // optional region filter
    
    // Validate required parameters
    if (!itineraryId) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Missing required parameter: itineraryId' 
      }, { status: 400 });
    }
    
    // Build base query conditions for filtering
    const baseConditions = [
      'AND r.deleted_at IS NULL',
      'AND i.id = ?'
    ];
    const baseParams = [parseInt(itineraryId)];
    
    // Add optional filters
    if (schoolType === 'galop') {
      baseConditions.push('AND s.is_galop = 1');
    } else if (schoolType === 'non-galop') {
      baseConditions.push('AND (s.is_galop = 0 OR s.is_galop IS NULL)');
    }
    
    if (districtId) {
      baseConditions.push('AND s.district_id = ?');
      baseParams.push(parseInt(districtId));
    }
    
    if (regionId) {
      baseConditions.push('AND d.region_id = ?');
      baseParams.push(parseInt(regionId));
    }
    
    // Combine conditions for query building
    const whereClause = baseConditions.join(' ');
    
    // 1. Get summary statistics for the dashboard
    const summary = await getSummaryData(whereClause, baseParams);
    
    // 2. Get school-level output indicators
    const schoolOutputs = await getSchoolOutputIndicators(whereClause, baseParams, viewMode);
    
    // 3. Get district-level output indicators
    const districtOutputs = await getDistrictOutputIndicators(whereClause, baseParams, viewMode);
    
    // 4. Calculate outcome indicators
    const outcomeIndicators = await getOutcomeIndicators(whereClause, baseParams, viewMode);
    
    // 5. Get trend data over time (if available)
    const trends = await getTrendData(itineraryId, schoolType, districtId, regionId);
    
    // 6. Get school type breakdown
    const schoolTypeBreakdown = await getSchoolTypeBreakdown(whereClause, baseParams);
    
    // 7. Get district submission details
    const districtSubmissions = await getDistrictSubmissions(whereClause, baseParams);
    
    // 8. Get gender analysis if requested
    const genderAnalysis = viewMode === 'gender-disaggregated' 
      ? await getGenderAnalysis(whereClause, baseParams)
      : null;
    
    // Combine all data into a single response
    const dashboardData = {
      summary,
      outputIndicators: {
        schoolLevel: schoolOutputs,
        districtLevel: districtOutputs
      },
      outcomeIndicators,
      trends,
      schoolTypeBreakdown,
      districtSubmissions,
      genderAnalysis: genderAnalysis || undefined
    };
    
    return NextResponse.json({
      status: 'success',
      data: dashboardData
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Failed to generate analytics', 
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Get summary statistics for the dashboard
 */
async function getSummaryData(whereClause, params) {
  try {
    // 1. Total schools in the itinerary
    const [totalSchoolsResult] = await db.query(`
      SELECT COUNT(DISTINCT r.school_id) as total_schools
      FROM right_to_play_school_responses r
      JOIN right_to_play_itineraries i ON r.itinerary_id = i.id
      JOIN schools s ON r.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      WHERE 1=1 ${whereClause}
    `, params);
    
    // 2. Total schools that could participate (all schools in relevant districts)
    const districtParams = [...params];
    let districtFilter = '';
    
    // If district filter is applied, use it for potential schools calculation
    if (params.length > 1) {
      const [itineraryId, ...otherParams] = params;
      districtParams.splice(0, 1); // Remove itinerary ID
      districtFilter = whereClause
        .replace('AND i.id = ?', '')
        .replace('AND r.deleted_at IS NULL', '');
    }
    
    const [totalPotentialSchoolsResult] = await db.query(`
      SELECT COUNT(DISTINCT s.id) as total_potential_schools
      FROM schools s
      JOIN districts d ON s.district_id = d.id
      WHERE s.deleted_at IS NULL ${districtFilter}
    `, districtParams);
    
    // 3. Calculate response rate
    const totalSchools = totalSchoolsResult[0]?.total_schools || 0;
    const totalPotentialSchools = totalPotentialSchoolsResult[0]?.total_potential_schools || 1; // Avoid division by zero
    const responseRate = Math.round((totalSchools / totalPotentialSchools) * 100);
    
    // 4. Get participating districts
    const [districtsResult] = await db.query(`
      SELECT COUNT(DISTINCT d.id) as participating_districts
      FROM right_to_play_school_responses r
      JOIN right_to_play_itineraries i ON r.itinerary_id = i.id
      JOIN schools s ON r.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      WHERE 1=1 ${whereClause}
    `, params);
    
    // 5. Get total teachers trained (aggregate across all school responses)
    const [teachersResult] = await db.query(`
      SELECT 
        SUM(CASE 
          WHEN q.id = 4 THEN CAST(a.answer_value AS UNSIGNED) 
          ELSE 0 
        END) as male_pbl,
        SUM(CASE 
          WHEN q.id = 5 THEN CAST(a.answer_value AS UNSIGNED) 
          ELSE 0 
        END) as female_pbl,
        SUM(CASE 
          WHEN q.id = 6 THEN CAST(a.answer_value AS UNSIGNED) 
          ELSE 0 
        END) as male_ece,
        SUM(CASE 
          WHEN q.id = 7 THEN CAST(a.answer_value AS UNSIGNED) 
          ELSE 0 
        END) as female_ece,
        SUM(CASE 
          WHEN q.id = 8 THEN CAST(a.answer_value AS UNSIGNED) 
          ELSE 0 
        END) as male_other,
        SUM(CASE 
          WHEN q.id = 9 THEN CAST(a.answer_value AS UNSIGNED) 
          ELSE 0 
        END) as female_other
      FROM right_to_play_school_response_answers a
      JOIN right_to_play_questions q ON a.question_id = q.id
      JOIN right_to_play_school_responses r ON a.response_id = r.id
      JOIN right_to_play_itineraries i ON r.itinerary_id = i.id
      JOIN schools s ON r.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      WHERE q.id IN (4, 5, 6, 7, 8, 9) ${whereClause}
    `, params);
    
    const trainedTeachers = teachersResult[0] || { male_pbl: 0, female_pbl: 0, male_ece: 0, female_ece: 0, male_other: 0, female_other: 0 };
    const maleTrained = parseInt(trainedTeachers.male_pbl || 0) + parseInt(trainedTeachers.male_ece || 0) + parseInt(trainedTeachers.male_other || 0);
    const femaleTrained = parseInt(trainedTeachers.female_pbl || 0) + parseInt(trainedTeachers.female_ece || 0) + parseInt(trainedTeachers.female_other || 0);
    
    return {
      totalSchools,
      responseRate,
      participatingDistricts: districtsResult[0]?.participating_districts || 0,
      totalTeachersTrained: {
        total: maleTrained + femaleTrained,
        male: maleTrained,
        female: femaleTrained
      },
      totalPotentialSchools
    };
  } catch (error) {
    console.error('Error getting summary data:', error);
    throw error;
  }
}

/**
 * Get school-level output indicators
 */
async function getSchoolOutputIndicators(whereClause, params, viewMode) {
  try {
    // 1. Get totals for all numeric indicators
    const [indicatorTotals] = await db.query(`
      SELECT
        # Teacher Champions
        SUM(CASE WHEN q.id = 1 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as male_teacher_champions,
        SUM(CASE WHEN q.id = 2 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as female_teacher_champions,
        
        # INSET Trainings
        SUM(CASE WHEN q.id = 3 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as inset_trainings,
        
        # Teachers by training type
        SUM(CASE WHEN q.id = 4 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as male_teachers_pbl,
        SUM(CASE WHEN q.id = 5 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as female_teachers_pbl,
        SUM(CASE WHEN q.id = 6 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as male_teachers_ece,
        SUM(CASE WHEN q.id = 7 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as female_teachers_ece,
        SUM(CASE WHEN q.id = 8 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as male_teachers_other,
        SUM(CASE WHEN q.id = 9 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as female_teachers_other,
        SUM(CASE WHEN q.id = 10 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as male_teachers_no_training,
        SUM(CASE WHEN q.id = 11 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as female_teachers_no_training,
        
        # Student enrollment
        SUM(CASE WHEN q.id = 12 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as boys_enrolled,
        SUM(CASE WHEN q.id = 13 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as girls_enrolled,
        SUM(CASE WHEN q.id = 14 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as boys_special_needs,
        SUM(CASE WHEN q.id = 15 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as girls_special_needs,
        
        # Mentoring visits
        SUM(CASE WHEN q.id = 16 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as mentoring_visits,
        
        # Teacher transfers
        SUM(CASE WHEN q.id = 17 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as male_teacher_transfers,
        SUM(CASE WHEN q.id = 18 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as female_teacher_transfers
      FROM right_to_play_school_response_answers a
      JOIN right_to_play_questions q ON a.question_id = q.id
      JOIN right_to_play_school_responses r ON a.response_id = r.id
      JOIN right_to_play_itineraries i ON r.itinerary_id = i.id
      JOIN schools s ON r.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      WHERE q.id BETWEEN 1 AND 18 ${whereClause}
    `, params);
    
    const totals = indicatorTotals[0] || {};
    
    // 2. Get district breakdown for key indicators if requested
    let districtBreakdown = null;
    
    if (viewMode === 'gender-disaggregated') {
      const [districtData] = await db.query(`
        SELECT 
          d.id as district_id,
          d.name as district,
          
          # Teacher Champions
          SUM(CASE WHEN q.id = 1 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as male_teacher_champions,
          SUM(CASE WHEN q.id = 2 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as female_teacher_champions,
          
          # Teachers trained in PBL
          SUM(CASE WHEN q.id = 4 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as male_teachers_pbl,
          SUM(CASE WHEN q.id = 5 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as female_teachers_pbl,
          
          # Student enrollment
          SUM(CASE WHEN q.id = 12 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as boys_enrolled,
          SUM(CASE WHEN q.id = 13 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as girls_enrolled,
          
          # Special needs students
          SUM(CASE WHEN q.id = 14 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as boys_special_needs,
          SUM(CASE WHEN q.id = 15 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as girls_special_needs
        FROM right_to_play_school_response_answers a
        JOIN right_to_play_questions q ON a.question_id = q.id
        JOIN right_to_play_school_responses r ON a.response_id = r.id
        JOIN right_to_play_itineraries i ON r.itinerary_id = i.id
        JOIN schools s ON r.school_id = s.id
        JOIN districts d ON s.district_id = d.id
        WHERE q.id IN (1, 2, 4, 5, 12, 13, 14, 15) ${whereClause}
        GROUP BY d.id, d.name
        ORDER BY d.name ASC
      `, params);
      
      districtBreakdown = districtData;
    }
    
    // 3. Format the results
    return {
      teacherChampions: {
        total: parseInt(totals.male_teacher_champions || 0) + parseInt(totals.female_teacher_champions || 0),
        male: parseInt(totals.male_teacher_champions || 0),
        female: parseInt(totals.female_teacher_champions || 0),
        byDistrict: districtBreakdown ? districtBreakdown.map(d => ({
          district: d.district,
          male: parseInt(d.male_teacher_champions || 0),
          female: parseInt(d.female_teacher_champions || 0)
        })) : undefined
      },
      insetTrainings: parseInt(totals.inset_trainings || 0),
      teachersPBL: {
        total: parseInt(totals.male_teachers_pbl || 0) + parseInt(totals.female_teachers_pbl || 0),
        male: parseInt(totals.male_teachers_pbl || 0),
        female: parseInt(totals.female_teachers_pbl || 0),
        byDistrict: districtBreakdown ? districtBreakdown.map(d => ({
          district: d.district,
          male: parseInt(d.male_teachers_pbl || 0),
          female: parseInt(d.female_teachers_pbl || 0)
        })) : undefined
      },
      teachersECE: {
        total: parseInt(totals.male_teachers_ece || 0) + parseInt(totals.female_teachers_ece || 0),
        male: parseInt(totals.male_teachers_ece || 0),
        female: parseInt(totals.female_teachers_ece || 0)
      },
      teachersOther: {
        total: parseInt(totals.male_teachers_other || 0) + parseInt(totals.female_teachers_other || 0),
        male: parseInt(totals.male_teachers_other || 0),
        female: parseInt(totals.female_teachers_other || 0)
      },
      teachersNoTraining: {
        total: parseInt(totals.male_teachers_no_training || 0) + parseInt(totals.female_teachers_no_training || 0),
        male: parseInt(totals.male_teachers_no_training || 0),
        female: parseInt(totals.female_teachers_no_training || 0)
      },
      studentsEnrolled: {
        total: parseInt(totals.boys_enrolled || 0) + parseInt(totals.girls_enrolled || 0),
        male: parseInt(totals.boys_enrolled || 0),
        female: parseInt(totals.girls_enrolled || 0),
        byDistrict: districtBreakdown ? districtBreakdown.map(d => ({
          district: d.district,
          male: parseInt(d.boys_enrolled || 0),
          female: parseInt(d.girls_enrolled || 0)
        })) : undefined
      },
      studentsSpecialNeeds: {
        total: parseInt(totals.boys_special_needs || 0) + parseInt(totals.girls_special_needs || 0),
        male: parseInt(totals.boys_special_needs || 0),
        female: parseInt(totals.girls_special_needs || 0),
        byDistrict: districtBreakdown ? districtBreakdown.map(d => ({
          district: d.district,
          male: parseInt(d.boys_special_needs || 0),
          female: parseInt(d.girls_special_needs || 0)
        })) : undefined
      },
      mentoringVisits: parseInt(totals.mentoring_visits || 0),
      teacherTransfers: {
        total: parseInt(totals.male_teacher_transfers || 0) + parseInt(totals.female_teacher_transfers || 0),
        male: parseInt(totals.male_teacher_transfers || 0),
        female: parseInt(totals.female_teacher_transfers || 0)
      }
    };
  } catch (error) {
    console.error('Error getting school output indicators:', error);
    throw error;
  }
}

/**
 * Get district-level output indicators
 */
async function getDistrictOutputIndicators(whereClause, params, viewMode) {
  try {
    // For district-level indicators, we need to adapt the where clause
    // since these are stored in a different table
    const districtWhereClause = whereClause
      .replace('r.deleted_at IS NULL', 'dr.deleted_at IS NULL')
      .replace('r.itinerary_id', 'dr.itinerary_id')
      .replace('s.district_id', 'dr.district_id');
    
    // 1. Get totals for all district-level indicators
    const [indicatorTotals] = await db.query(`
      SELECT
        # District support teams
        SUM(CASE WHEN q.id = 101 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as district_teams_with_plans,
        SUM(CASE WHEN q.id = 102 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as trainings_for_dst,
        SUM(CASE WHEN q.id = 103 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as dst_members_trained,
        SUM(CASE WHEN q.id = 104 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as districts_with_mentoring_plans,
        SUM(CASE WHEN q.id = 105 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as dst_teams_trained,
        
        # Gender breakdown of DST members
        SUM(CASE WHEN q.id = 106 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as male_dst_members,
        SUM(CASE WHEN q.id = 107 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as female_dst_members,
        
        # Financial support
        SUM(CASE WHEN q.id = 108 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as districts_with_financial_support,
        
        # Planning meetings
        SUM(CASE WHEN q.id = 109 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as planning_meetings,
        SUM(CASE WHEN q.id = 110 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as male_meeting_attendees,
        SUM(CASE WHEN q.id = 111 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as female_meeting_attendees,
        
        # School visits and trainers
        SUM(CASE WHEN q.id = 112 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as schools_visited,
        SUM(CASE WHEN q.id = 113 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as male_trainers_from_dst,
        SUM(CASE WHEN q.id = 114 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as female_trainers_from_dst,
        
        # National meetings
        SUM(CASE WHEN q.id = 115 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as national_meetings,
        SUM(CASE WHEN q.id = 116 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as male_national_attendees,
        SUM(CASE WHEN q.id = 117 THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as female_national_attendees
      FROM right_to_play_district_response_answers a
      JOIN right_to_play_questions q ON a.question_id = q.id
      JOIN right_to_play_district_responses dr ON a.response_id = dr.id
      JOIN right_to_play_itineraries i ON dr.itinerary_id = i.id
      JOIN districts d ON dr.district_id = d.id
      WHERE q.id BETWEEN 101 AND 117 ${districtWhereClause}
    `, params);
    
    const totals = indicatorTotals[0] || {};
    
    // Format the results
    return {
      districtTeamSupportPlans: parseInt(totals.district_teams_with_plans || 0),
      trainingProvided: parseInt(totals.trainings_for_dst || 0),
      districtTeamMembersTrained: {
        total: parseInt(totals.dst_members_trained || 0),
        male: parseInt(totals.male_dst_members || 0),
        female: parseInt(totals.female_dst_members || 0)
      },
      districtsMentoringPlans: parseInt(totals.districts_with_mentoring_plans || 0),
      districtTeamsFormed: parseInt(totals.dst_teams_trained || 0),
      financialSupportDistricts: parseInt(totals.districts_with_financial_support || 0),
      planningMeetings: parseInt(totals.planning_meetings || 0),
      planningAttendees: {
        total: parseInt(totals.male_meeting_attendees || 0) + parseInt(totals.female_meeting_attendees || 0),
        male: parseInt(totals.male_meeting_attendees || 0),
        female: parseInt(totals.female_meeting_attendees || 0)
      },
      schoolsVisited: parseInt(totals.schools_visited || 0),
      trainersFromDST: {
        total: parseInt(totals.male_trainers_from_dst || 0) + parseInt(totals.female_trainers_from_dst || 0),
        male: parseInt(totals.male_trainers_from_dst || 0),
        female: parseInt(totals.female_trainers_from_dst || 0)
      },
      nationalMeetings: parseInt(totals.national_meetings || 0),
      nationalAttendees: {
        total: parseInt(totals.male_national_attendees || 0) + parseInt(totals.female_national_attendees || 0),
        male: parseInt(totals.male_national_attendees || 0),
        female: parseInt(totals.female_national_attendees || 0)
      }
    };
  } catch (error) {
    console.error('Error getting district output indicators:', error);
    throw error;
  }
}

/**
 * Calculate outcome indicators as specified in the PRD
 */
async function getOutcomeIndicators(whereClause, params, viewMode) {
  try {
    // 1. Get total primary school enrollment (already calculated in school outputs)
    const schoolOutputs = await getSchoolOutputIndicators(whereClause, params, 'combined');
    
    // 2. Percentage of schools with implementation plans (from Consolidated Checklist Q17)
    const [implementationPlansData] = await db.query(`
      SELECT
        COUNT(DISTINCT r.school_id) as total_schools,
        SUM(CASE WHEN q.id = 301 AND a.answer_value = 'yes' THEN 1 ELSE 0 END) as schools_with_plans
      FROM right_to_play_consolidated_checklist_answers a
      JOIN right_to_play_questions q ON a.question_id = q.id
      JOIN right_to_play_consolidated_checklist_responses r ON a.response_id = r.id
      JOIN right_to_play_itineraries i ON r.itinerary_id = i.id
      JOIN schools s ON r.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      WHERE q.id = 301 ${whereClause.replace('r.deleted_at IS NULL', 'r.deleted_at IS NULL')}
    `, params);
    
    // 3. Percentage of schools with LTP development plans (from Consolidated Checklist Q18 with file upload)
    const [ltpDevPlansData] = await db.query(`
      SELECT
        COUNT(DISTINCT r.school_id) as total_schools,
        SUM(CASE WHEN q.id = 302 AND a.upload_file_path IS NOT NULL THEN 1 ELSE 0 END) as schools_with_ltp_plans
      FROM right_to_play_consolidated_checklist_answers a
      JOIN right_to_play_questions q ON a.question_id = q.id
      JOIN right_to_play_consolidated_checklist_responses r ON a.response_id = r.id
      JOIN right_to_play_itineraries i ON r.itinerary_id = i.id
      JOIN schools s ON r.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      WHERE q.id = 302 ${whereClause.replace('r.deleted_at IS NULL', 'r.deleted_at IS NULL')}
    `, params);
    
    // 4. Percentage of teachers with LTP lesson plans (from Consolidated Checklist Q19)
    const [ltpLessonPlansData] = await db.query(`
      SELECT
        COUNT(DISTINCT r.id) as total_responses,
        SUM(CASE WHEN q.id = 303 AND a.answer_value = 'yes' THEN 1 ELSE 0 END) as teachers_with_ltp_plans,
        # Gender breakdown if requested
        SUM(CASE WHEN q.id = 303 AND a.answer_value = 'yes' AND t.gender = 'male' THEN 1 ELSE 0 END) as male_teachers_with_plans,
        SUM(CASE WHEN q.id = 303 AND a.answer_value = 'yes' AND t.gender = 'female' THEN 1 ELSE 0 END) as female_teachers_with_plans,
        SUM(CASE WHEN q.id = 303 AND t.gender = 'male' THEN 1 ELSE 0 END) as total_male_teachers,
        SUM(CASE WHEN q.id = 303 AND t.gender = 'female' THEN 1 ELSE 0 END) as total_female_teachers
      FROM right_to_play_consolidated_checklist_answers a
      JOIN right_to_play_questions q ON a.question_id = q.id
      JOIN right_to_play_consolidated_checklist_responses r ON a.response_id = r.id
      JOIN right_to_play_itineraries i ON r.itinerary_id = i.id
      JOIN schools s ON r.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      LEFT JOIN teachers t ON r.teacher_id = t.id
      WHERE q.id = 303 ${whereClause.replace('r.deleted_at IS NULL', 'r.deleted_at IS NULL')}
    `, params);
    
    // 5. Percentage of learning environments with LTP methods (from Partners in Play Q43, Q44, Q45)
    const [learningEnvironmentsData] = await db.query(`
      SELECT
        AVG(pip.learning_environment_score) as avg_environment_score,
        (AVG(pip.learning_environment_score) / 5) * 100 as environment_score_percentage
      FROM right_to_play_pip_responses pip
      JOIN right_to_play_itineraries i ON pip.itinerary_id = i.id
      JOIN schools s ON pip.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      WHERE pip.learning_environment_score IS NOT NULL ${whereClause.replace('r.deleted_at IS NULL', 'pip.deleted_at IS NULL').replace('r.itinerary_id', 'pip.itinerary_id')}
    `, params);
    
    // 6. Percentage of teachers with LTP skills (Partners in Play scoring)
    const [teacherSkillsData] = await db.query(`
      SELECT
        AVG(pip.ltp_skills_score) as avg_skills_score,
        (AVG(pip.ltp_skills_score) / 5) * 100 as skills_score_percentage,
        # Gender breakdown if requested
        AVG(CASE WHEN t.gender = 'male' THEN pip.ltp_skills_score ELSE NULL END) as male_avg_skills_score,
        AVG(CASE WHEN t.gender = 'female' THEN pip.ltp_skills_score ELSE NULL END) as female_avg_skills_score,
        (AVG(CASE WHEN t.gender = 'male' THEN pip.ltp_skills_score ELSE NULL END) / 5) * 100 as male_skills_percentage,
        (AVG(CASE WHEN t.gender = 'female' THEN pip.ltp_skills_score ELSE NULL END) / 5) * 100 as female_skills_percentage
      FROM right_to_play_pip_responses pip
      JOIN right_to_play_itineraries i ON pip.itinerary_id = i.id
      JOIN schools s ON pip.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      LEFT JOIN teachers t ON pip.teacher_id = t.id
      WHERE pip.ltp_skills_score IS NOT NULL ${whereClause.replace('r.deleted_at IS NULL', 'pip.deleted_at IS NULL').replace('r.itinerary_id', 'pip.itinerary_id')}
    `, params);
    
    // Calculate percentages
    const implementationPlans = implementationPlansData[0] || { total_schools: 0, schools_with_plans: 0 };
    const ltpDevPlans = ltpDevPlansData[0] || { total_schools: 0, schools_with_ltp_plans: 0 };
    const ltpLessonPlans = ltpLessonPlansData[0] || { 
      total_responses: 0, 
      teachers_with_ltp_plans: 0,
      male_teachers_with_plans: 0,
      female_teachers_with_plans: 0,
      total_male_teachers: 0,
      total_female_teachers: 0
    };
    const learningEnvironments = learningEnvironmentsData[0] || { environment_score_percentage: 0 };
    const teacherSkills = teacherSkillsData[0] || { 
      skills_score_percentage: 0,
      male_skills_percentage: 0,
      female_skills_percentage: 0
    };
    
    const implementationPlansPercentage = implementationPlans.total_schools > 0 
      ? Math.round((implementationPlans.schools_with_plans / implementationPlans.total_schools) * 100) 
      : 0;
    
    const ltpDevPlansPercentage = ltpDevPlans.total_schools > 0 
      ? Math.round((ltpDevPlans.schools_with_ltp_plans / ltpDevPlans.total_schools) * 100) 
      : 0;
    
    const ltpLessonPlansPercentage = ltpLessonPlans.total_responses > 0 
      ? Math.round((ltpLessonPlans.teachers_with_ltp_plans / ltpLessonPlans.total_responses) * 100) 
      : 0;
    
    const maleLtpLessonPlansPercentage = ltpLessonPlans.total_male_teachers > 0
      ? Math.round((ltpLessonPlans.male_teachers_with_plans / ltpLessonPlans.total_male_teachers) * 100) 
      : 0;
    
    const femaleLtpLessonPlansPercentage = ltpLessonPlans.total_female_teachers > 0
      ? Math.round((ltpLessonPlans.female_teachers_with_plans / ltpLessonPlans.total_female_teachers) * 100) 
      : 0;
    
    const learningEnvironmentsPercentage = Math.round(learningEnvironments.environment_score_percentage || 0);
    const teacherSkillsPercentage = Math.round(teacherSkills.skills_score_percentage || 0);
    const maleSkillsPercentage = Math.round(teacherSkills.male_skills_percentage || 0);
    const femaleSkillsPercentage = Math.round(teacherSkills.female_skills_percentage || 0);
    
    return {
      schoolsWithImplementationPlans: implementationPlansPercentage,
      schoolsWithLTPDevPlans: ltpDevPlansPercentage,
      teachersWithLTPLessonPlans: {
        total: ltpLessonPlansPercentage,
        male: maleLtpLessonPlansPercentage,
        female: femaleLtpLessonPlansPercentage
      },
      learningEnvironmentsWithLTPMethods: learningEnvironmentsPercentage,
      teachersWithLTPSkills: {
        total: teacherSkillsPercentage,
        male: maleSkillsPercentage,
        female: femaleSkillsPercentage
      },
      // Add detailed breakdowns for transparent analysis
      calculationDetails: {
        implementationPlans: {
          schoolsWithPlans: implementationPlans.schools_with_plans,
          totalSchools: implementationPlans.total_schools,
          formula: "schools_with_plans / total_schools * 100"
        },
        ltpDevPlans: {
          schoolsWithPlans: ltpDevPlans.schools_with_ltp_plans,
          totalSchools: ltpDevPlans.total_schools,
          formula: "schools_with_ltp_plans / totalSchools * 100"
        },
        ltpLessonPlans: {
          teachersWithPlans: ltpLessonPlans.teachers_with_ltp_plans,
          totalTeachers: ltpLessonPlans.total_responses,
          maleTeachersWithPlans: ltpLessonPlans.male_teachers_with_plans,
          femaleTeachersWithPlans: ltpLessonPlans.female_teachers_with_plans,
          totalMaleTeachers: ltpLessonPlans.total_male_teachers,
          totalFemaleTeachers: ltpLessonPlans.total_female_teachers,
          formula: "teachers_with_plans / total_teachers * 100"
        },
        learningEnvironments: {
          averageScore: parseFloat(learningEnvironments.avg_environment_score || 0).toFixed(2),
          maxPossibleScore: 5,
          formula: "average_score / max_possible_score * 100"
        },
        teacherSkills: {
          averageScore: parseFloat(teacherSkills.avg_skills_score || 0).toFixed(2),
          maleAverageScore: parseFloat(teacherSkills.male_avg_skills_score || 0).toFixed(2),
          femaleAverageScore: parseFloat(teacherSkills.female_avg_skills_score || 0).toFixed(2),
          maxPossibleScore: 5,
          formula: "average_score / max_possible_score * 100"
        }
      }
    };
  } catch (error) {
    console.error('Error calculating outcome indicators:', error);
    throw error;
  }
}

/**
 * Get trend data by comparing with previous itineraries
 */
async function getTrendData(currentItineraryId, schoolType, districtId, regionId) {
  try {
    // 1. Get the current itinerary's details
    const [currentItinerary] = await db.query(`
      SELECT period, year FROM right_to_play_itineraries WHERE id = ?
    `, [currentItineraryId]);
    
    if (!currentItinerary.length) {
      throw new Error('Current itinerary not found');
    }
    
    // 2. Get previous itineraries from the same year or before
    const currPeriod = currentItinerary[0].period;
    const currYear = currentItinerary[0].year;
    
    // Find previous itineraries in chronological order (this year and previous year)
    const [previousItineraries] = await db.query(`
      SELECT id, title, period, year 
      FROM right_to_play_itineraries 
      WHERE deleted_at IS NULL
      AND ((year = ? AND period < ?) OR (year = ? AND period >= ?))
      ORDER BY year DESC, period DESC
      LIMIT 3
    `, [currYear, currPeriod, currYear - 1, 1]);
    
    if (previousItineraries.length === 0) {
      // No trend data available
      return {
        responseRates: [0],
        schoolParticipation: [0],
        teacherTraining: {
          total: [0],
          male: [0],
          female: [0]
        },
        teachersWithSkills: {
          total: [0],
          male: [0],
          female: [0]
        },
        itineraries: []
      };
    }
    
    // 3. Collect data for each itinerary
    const trendData = {
      responseRates: [],
      schoolParticipation: [],
      teacherTraining: {
        total: [],
        male: [],
        female: []
      },
      teachersWithSkills: {
        total: [],
        female: [],
        male: []
      },
      itineraries: []
    };
    
    // Include current itinerary
    const allItineraries = [...previousItineraries, { 
      id: currentItineraryId,
      title: 'Current',
      period: currPeriod,
      year: currYear
    }];
    
    // Sort by chronological order (oldest first)
    allItineraries.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.period - b.period;
    });
    
    // Create base conditions for filters
    const baseConditions = ['AND r.deleted_at IS NULL'];
    const baseParams = [];
    
    if (schoolType === 'galop') {
      baseConditions.push('AND s.is_galop = 1');
    } else if (schoolType === 'non-galop') {
      baseConditions.push('AND (s.is_galop = 0 OR s.is_galop IS NULL)');
    }
    
    if (districtId) {
      baseConditions.push('AND s.district_id = ?');
      baseParams.push(parseInt(districtId));
    }
    
    if (regionId) {
      baseConditions.push('AND d.region_id = ?');
      baseParams.push(parseInt(regionId));
    }
    
    for (const itinerary of allItineraries) {
      // Add this itinerary to the list
      trendData.itineraries.push({
        id: itinerary.id,
        title: itinerary.title,
        period: itinerary.period,
        year: itinerary.year
      });
      
      // Get participation data for this itinerary
      const itineraryParams = [itinerary.id, ...baseParams];
      const whereClause = `AND i.id = ? ${baseConditions.join(' ')}`;
      
      // Get school participation count
      const [schoolCount] = await db.query(`
        SELECT COUNT(DISTINCT r.school_id) as count
        FROM right_to_play_school_responses r
        JOIN right_to_play_itineraries i ON r.itinerary_id = i.id
        JOIN schools s ON r.school_id = s.id
        JOIN districts d ON s.district_id = d.id
        WHERE 1=1 ${whereClause}
      `, itineraryParams);
      
      // Get response rate
      const [potentialSchools] = await db.query(`
        SELECT COUNT(DISTINCT s.id) as count
        FROM schools s
        JOIN districts d ON s.district_id = d.id
        WHERE s.deleted_at IS NULL ${baseConditions.join(' ').replace('r.deleted_at IS NULL', '')}
      `, baseParams);
      
      const schoolParticipation = schoolCount[0]?.count || 0;
      const totalPotentialSchools = potentialSchools[0]?.count || 1; // Avoid division by zero
      const responseRate = Math.round((schoolParticipation / totalPotentialSchools) * 100);
      
      // Get teacher training data
      const [teacherData] = await db.query(`
        SELECT 
          SUM(CASE WHEN q.id IN (4, 6, 8) THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as male_trained,
          SUM(CASE WHEN q.id IN (5, 7, 9) THEN CAST(a.answer_value AS UNSIGNED) ELSE 0 END) as female_trained
        FROM right_to_play_school_response_answers a
        JOIN right_to_play_questions q ON a.question_id = q.id
        JOIN right_to_play_school_responses r ON a.response_id = r.id
        JOIN right_to_play_itineraries i ON r.itinerary_id = i.id
        JOIN schools s ON r.school_id = s.id
        JOIN districts d ON s.district_id = d.id
        WHERE q.id IN (4, 5, 6, 7, 8, 9) ${whereClause}
      `, itineraryParams);
      
      const maleTrained = parseInt(teacherData[0]?.male_trained || 0);
      const femaleTrained = parseInt(teacherData[0]?.female_trained || 0);
      const totalTrained = maleTrained + femaleTrained;
      
      // Get teacher skills data
      const [skillsData] = await db.query(`
        SELECT
          (AVG(pip.ltp_skills_score) / 5) * 100 as skills_percentage,
          (AVG(CASE WHEN t.gender = 'male' THEN pip.ltp_skills_score ELSE NULL END) / 5) * 100 as male_skills_percentage,
          (AVG(CASE WHEN t.gender = 'female' THEN pip.ltp_skills_score ELSE NULL END) / 5) * 100 as female_skills_percentage
        FROM right_to_play_pip_responses pip
        JOIN right_to_play_itineraries i ON pip.itinerary_id = i.id
        JOIN schools s ON pip.school_id = s.id
        JOIN districts d ON s.district_id = d.id
        LEFT JOIN teachers t ON pip.teacher_id = t.id
        WHERE pip.ltp_skills_score IS NOT NULL ${whereClause.replace('r.deleted_at IS NULL', 'pip.deleted_at IS NULL').replace('r.itinerary_id', 'pip.itinerary_id')}
      `, itineraryParams);
      
      const skillsPercentage = Math.round(skillsData[0]?.skills_percentage || 0);
      const maleSkillsPercentage = Math.round(skillsData[0]?.male_skills_percentage || 0);
      const femaleSkillsPercentage = Math.round(skillsData[0]?.female_skills_percentage || 0);
      
      // Add to trend data
      trendData.responseRates.push(responseRate);
      trendData.schoolParticipation.push(schoolParticipation);
      trendData.teacherTraining.total.push(totalTrained);
      trendData.teacherTraining.male.push(maleTrained);
      trendData.teacherTraining.female.push(femaleTrained);
      trendData.teachersWithSkills.total.push(skillsPercentage);
      trendData.teachersWithSkills.male.push(maleSkillsPercentage);
      trendData.teachersWithSkills.female.push(femaleSkillsPercentage);
    }
    
    return trendData;
  } catch (error) {
    console.error('Error getting trend data:', error);
    // Return empty trend data structure on error
    return {
      responseRates: [0],
      schoolParticipation: [0],
      teacherTraining: {
        total: [0],
        male: [0],
        female: [0]
      },
      teachersWithSkills: {
        total: [0],
        male: [0],
        female: [0]
      },
      itineraries: []
    };
  }
}

/**
 * Get breakdown of GALOP vs non-GALOP schools
 */
async function getSchoolTypeBreakdown(whereClause, params) {
  try {
    const [breakdown] = await db.query(`
      SELECT 
        SUM(CASE WHEN s.is_galop = 1 THEN 1 ELSE 0 END) as galop_count,
        SUM(CASE WHEN s.is_galop = 0 OR s.is_galop IS NULL THEN 1 ELSE 0 END) as non_galop_count
      FROM right_to_play_school_responses r
      JOIN right_to_play_itineraries i ON r.itinerary_id = i.id
      JOIN schools s ON r.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      WHERE 1=1 ${whereClause}
      GROUP BY i.id
    `, params);
    
    return {
      galop: parseInt(breakdown[0]?.galop_count || 0),
      nonGalop: parseInt(breakdown[0]?.non_galop_count || 0)
    };
  } catch (error) {
    console.error('Error getting school type breakdown:', error);
    return { galop: 0, nonGalop: 0 };
  }
}

/**
 * Get district submissions breakdown
 */
async function getDistrictSubmissions(whereClause, params) {
  try {
    const [submissions] = await db.query(`
      SELECT 
        d.id as district_id,
        d.name as district,
        COUNT(DISTINCT r.school_id) as submissions,
        COUNT(DISTINCT s.id) as total_schools,
        ROUND((COUNT(DISTINCT r.school_id) / COUNT(DISTINCT s.id)) * 100) as percentage
      FROM districts d
      JOIN schools s ON s.district_id = d.id
      LEFT JOIN right_to_play_school_responses r ON r.school_id = s.id AND r.deleted_at IS NULL
      LEFT JOIN right_to_play_itineraries i ON r.itinerary_id = i.id
      WHERE s.deleted_at IS NULL
      ${whereClause.replace('r.deleted_at IS NULL', '')}
      GROUP BY d.id, d.name
      ORDER BY percentage DESC
    `, params);
    
    return submissions;
  } catch (error) {
    console.error('Error getting district submissions:', error);
    return [];
  }
}

/**
 * Get gender analysis for the dashboard
 */
async function getGenderAnalysis(whereClause, params) {
  try {
    // Get school output data needed for gender analysis
    const schoolOutputs = await getSchoolOutputIndicators(whereClause, params, 'gender-disaggregated');
    const districtOutputs = await getDistrictOutputIndicators(whereClause, params, 'gender-disaggregated');
    const outcomeIndicators = await getOutcomeIndicators(whereClause, params, 'gender-disaggregated');
    
    // Calculate gender gaps
    return {
      teacherTrainingGap: {
        totalTeachers: {
          male: schoolOutputs.teachersPBL.male + schoolOutputs.teachersECE.male + schoolOutputs.teachersOther.male,
          female: schoolOutputs.teachersPBL.female + schoolOutputs.teachersECE.female + schoolOutputs.teachersOther.female,
          gap: (schoolOutputs.teachersPBL.female + schoolOutputs.teachersECE.female + schoolOutputs.teachersOther.female) - 
               (schoolOutputs.teachersPBL.male + schoolOutputs.teachersECE.male + schoolOutputs.teachersOther.male)
        },
        teacherChampions: {
          male: schoolOutputs.teacherChampions.male,
          female: schoolOutputs.teacherChampions.female,
          gap: schoolOutputs.teacherChampions.female - schoolOutputs.teacherChampions.male
        },
        teachersPBL: {
          male: schoolOutputs.teachersPBL.male,
          female: schoolOutputs.teachersPBL.female,
          gap: schoolOutputs.teachersPBL.female - schoolOutputs.teachersPBL.male
        },
        teachersECE: {
          male: schoolOutputs.teachersECE.male,
          female: schoolOutputs.teachersECE.female,
          gap: schoolOutputs.teachersECE.female - schoolOutputs.teachersECE.male
        },
        teachersOther: {
          male: schoolOutputs.teachersOther.male,
          female: schoolOutputs.teachersOther.female,
          gap: schoolOutputs.teachersOther.female - schoolOutputs.teachersOther.male
        },
        teachersNoTraining: {
          male: schoolOutputs.teachersNoTraining.male,
          female: schoolOutputs.teachersNoTraining.female,
          gap: schoolOutputs.teachersNoTraining.female - schoolOutputs.teachersNoTraining.male
        }
      },
      enrollmentGap: {
        totalEnrollment: {
          male: schoolOutputs.studentsEnrolled.male,
          female: schoolOutputs.studentsEnrolled.female,
          gap: schoolOutputs.studentsEnrolled.female - schoolOutputs.studentsEnrolled.male,
          gapPercentage: schoolOutputs.studentsEnrolled.male > 0 
            ? ((schoolOutputs.studentsEnrolled.female - schoolOutputs.studentsEnrolled.male) / schoolOutputs.studentsEnrolled.male) * 100
            : 0
        },
        specialNeeds: {
          male: schoolOutputs.studentsSpecialNeeds.male,
          female: schoolOutputs.studentsSpecialNeeds.female,
          gap: schoolOutputs.studentsSpecialNeeds.female - schoolOutputs.studentsSpecialNeeds.male,
          gapPercentage: schoolOutputs.studentsSpecialNeeds.male > 0 
            ? ((schoolOutputs.studentsSpecialNeeds.female - schoolOutputs.studentsSpecialNeeds.male) / schoolOutputs.studentsSpecialNeeds.male) * 100
            : 0
        }
      },
      districtLevelGaps: {
        teamMembers: {
          male: districtOutputs.districtTeamMembersTrained.male,
          female: districtOutputs.districtTeamMembersTrained.female,
          gap: districtOutputs.districtTeamMembersTrained.female - districtOutputs.districtTeamMembersTrained.male,
          gapPercentage: districtOutputs.districtTeamMembersTrained.male > 0 
            ? ((districtOutputs.districtTeamMembersTrained.female - districtOutputs.districtTeamMembersTrained.male) / districtOutputs.districtTeamMembersTrained.male) * 100
            : 0
        },
        planningAttendees: {
          male: districtOutputs.planningAttendees.male,
          female: districtOutputs.planningAttendees.female,
          gap: districtOutputs.planningAttendees.female - districtOutputs.planningAttendees.male,
          gapPercentage: districtOutputs.planningAttendees.male > 0 
            ? ((districtOutputs.planningAttendees.female - districtOutputs.planningAttendees.male) / districtOutputs.planningAttendees.male) * 100
            : 0
        },
        trainers: {
          male: districtOutputs.trainersFromDST.male,
          female: districtOutputs.trainersFromDST.female,
          gap: districtOutputs.trainersFromDST.female - districtOutputs.trainersFromDST.male,
          gapPercentage: districtOutputs.trainersFromDST.male > 0 
            ? ((districtOutputs.trainersFromDST.female - districtOutputs.trainersFromDST.male) / districtOutputs.trainersFromDST.male) * 100
            : 0
        }
      },
      performanceComparison: {
        lessonPlans: {
          male: outcomeIndicators.teachersWithLTPLessonPlans.male,
          female: outcomeIndicators.teachersWithLTPLessonPlans.female,
          gap: outcomeIndicators.teachersWithLTPLessonPlans.female - outcomeIndicators.teachersWithLTPLessonPlans.male
        },
        teachingSkills: {
          male: outcomeIndicators.teachersWithLTPSkills.male,
          female: outcomeIndicators.teachersWithLTPSkills.female,
          gap: outcomeIndicators.teachersWithLTPSkills.female - outcomeIndicators.teachersWithLTPSkills.male
        }
      }
    };
  } catch (error) {
    console.error('Error getting gender analysis:', error);
    return null;
  }
}