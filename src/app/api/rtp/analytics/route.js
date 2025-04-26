import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getConnectionConfig } from '@/utils/db';

/**
 * GET /api/rtp/analytics
 * Fetches analytical data for the RTP dashboard using existing tables
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

    // Create database connection
    const connection = await mysql.createConnection(getConnectionConfig());
    
    try {
      // Build base query conditions for filtering
      const baseConditions = [];
      const baseParams = [];
      
      baseConditions.push('AND qa.deleted_at IS NULL');
      baseConditions.push('AND qa.itinerary_id = ?');
      baseParams.push(parseInt(itineraryId));
      
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
      
      // 1. Get summary statistics
      const summary = await getSummaryData(connection, whereClause, baseParams);
      
      // 2. Get school-level indicators
      const schoolOutputs = await getSchoolOutputIndicators(connection, whereClause, baseParams, viewMode);
      
      // 3. Get district-level indicators (simplified since we don't have the district responses table yet)
      const districtOutputs = await getDistrictOutputIndicators(connection, whereClause, baseParams);
      
      // 4. Get school type breakdown
      const schoolTypeBreakdown = await getSchoolTypeBreakdown(connection, whereClause, baseParams);
      
      // 5. Get district submission details
      const districtSubmissions = await getDistrictSubmissions(connection, whereClause, baseParams);
      
      // 6. Get gender analysis if requested
      const genderAnalysis = viewMode === 'gender-disaggregated' 
        ? await getGenderAnalysis(connection, whereClause, baseParams, schoolOutputs)
        : null;
      
      // Combine all data into a single response
      const dashboardData = {
        summary,
        outputIndicators: {
          schoolLevel: schoolOutputs,
          districtLevel: districtOutputs
        },
        schoolTypeBreakdown,
        districtSubmissions,
        genderAnalysis: genderAnalysis || undefined
      };
      
      return NextResponse.json({
        status: 'success',
        data: dashboardData
      });
    } finally {
      // Always close the connection
      await connection.end();
    }
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
async function getSummaryData(connection, whereClause, params) {
  try {
    // 1. Total schools in the itinerary
    const [totalSchoolsResult] = await connection.execute(`
      SELECT COUNT(DISTINCT qa.school_id) as total_schools
      FROM right_to_play_question_answers qa
      JOIN schools s ON qa.school_id = s.id
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
        .replace('AND qa.itinerary_id = ?', '')
        .replace('AND qa.deleted_at IS NULL', '');
    }
    
    const [totalPotentialSchoolsResult] = await connection.execute(`
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
    const [districtsResult] = await connection.execute(`
      SELECT COUNT(DISTINCT d.id) as participating_districts
      FROM right_to_play_question_answers qa
      JOIN schools s ON qa.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      WHERE 1=1 ${whereClause}
    `, params);
    
    // 5. Get total teachers trained (aggregate across all school responses)
    // Assuming questions with IDs 4-9 contain teacher training information
    const [teachersResult] = await connection.execute(`
      SELECT 
        SUM(CASE WHEN qa.question_id = 4 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as male_pbl,
        SUM(CASE WHEN qa.question_id = 5 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as female_pbl,
        SUM(CASE WHEN qa.question_id = 6 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as male_ece,
        SUM(CASE WHEN qa.question_id = 7 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as female_ece,
        SUM(CASE WHEN qa.question_id = 8 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as male_other,
        SUM(CASE WHEN qa.question_id = 9 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as female_other
      FROM right_to_play_question_answers qa
      JOIN schools s ON qa.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      WHERE qa.question_id IN (4, 5, 6, 7, 8, 9) ${whereClause}
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
    return {
      totalSchools: 0,
      responseRate: 0,
      participatingDistricts: 0,
      totalTeachersTrained: {
        total: 0,
        male: 0,
        female: 0
      },
      totalPotentialSchools: 0
    };
  }
}

/**
 * Get school-level output indicators
 */
async function getSchoolOutputIndicators(connection, whereClause, params, viewMode) {
  try {
    // Get totals for all numeric indicators
    const [indicatorTotals] = await connection.execute(`
      SELECT
        # Teacher Champions
        SUM(CASE WHEN qa.question_id = 1 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as male_teacher_champions,
        SUM(CASE WHEN qa.question_id = 2 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as female_teacher_champions,
        
        # INSET Trainings
        SUM(CASE WHEN qa.question_id = 3 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as inset_trainings,
        
        # Teachers by training type
        SUM(CASE WHEN qa.question_id = 4 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as male_teachers_pbl,
        SUM(CASE WHEN qa.question_id = 5 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as female_teachers_pbl,
        SUM(CASE WHEN qa.question_id = 6 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as male_teachers_ece,
        SUM(CASE WHEN qa.question_id = 7 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as female_teachers_ece,
        SUM(CASE WHEN qa.question_id = 8 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as male_teachers_other,
        SUM(CASE WHEN qa.question_id = 9 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as female_teachers_other,
        SUM(CASE WHEN qa.question_id = 10 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as male_teachers_no_training,
        SUM(CASE WHEN qa.question_id = 11 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as female_teachers_no_training,
        
        # Student enrollment
        SUM(CASE WHEN qa.question_id = 12 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as boys_enrolled,
        SUM(CASE WHEN qa.question_id = 13 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as girls_enrolled,
        SUM(CASE WHEN qa.question_id = 14 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as boys_special_needs,
        SUM(CASE WHEN qa.question_id = 15 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as girls_special_needs,
        
        # Mentoring visits
        SUM(CASE WHEN qa.question_id = 16 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as mentoring_visits,
        
        # Teacher transfers
        SUM(CASE WHEN qa.question_id = 17 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as male_teacher_transfers,
        SUM(CASE WHEN qa.question_id = 18 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as female_teacher_transfers
      FROM right_to_play_question_answers qa
      JOIN schools s ON qa.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      WHERE qa.question_id BETWEEN 1 AND 18 ${whereClause}
    `, params);
    
    const totals = indicatorTotals[0] || {};
    
    // Get district breakdown for key indicators if requested
    let districtBreakdown = null;
    
    if (viewMode === 'gender-disaggregated') {
      const [districtData] = await connection.execute(`
        SELECT 
          d.id as district_id,
          d.name as district,
          
          # Teacher Champions
          SUM(CASE WHEN qa.question_id = 1 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as male_teacher_champions,
          SUM(CASE WHEN qa.question_id = 2 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as female_teacher_champions,
          
          # Teachers trained in PBL
          SUM(CASE WHEN qa.question_id = 4 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as male_teachers_pbl,
          SUM(CASE WHEN qa.question_id = 5 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as female_teachers_pbl,
          
          # Student enrollment
          SUM(CASE WHEN qa.question_id = 12 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as boys_enrolled,
          SUM(CASE WHEN qa.question_id = 13 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as girls_enrolled,
          
          # Special needs students
          SUM(CASE WHEN qa.question_id = 14 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as boys_special_needs,
          SUM(CASE WHEN qa.question_id = 15 THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) as girls_special_needs
        FROM right_to_play_question_answers qa
        JOIN schools s ON qa.school_id = s.id
        JOIN districts d ON s.district_id = d.id
        WHERE qa.question_id IN (1, 2, 4, 5, 12, 13, 14, 15) ${whereClause}
        GROUP BY d.id, d.name
        ORDER BY d.name ASC
      `, params);
      
      districtBreakdown = districtData;
    }
    
    // Format the results
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
    return {
      teacherChampions: { total: 0, male: 0, female: 0 },
      insetTrainings: 0,
      teachersPBL: { total: 0, male: 0, female: 0 },
      teachersECE: { total: 0, male: 0, female: 0 },
      teachersOther: { total: 0, male: 0, female: 0 },
      teachersNoTraining: { total: 0, male: 0, female: 0 },
      studentsEnrolled: { total: 0, male: 0, female: 0 },
      studentsSpecialNeeds: { total: 0, male: 0, female: 0 },
      mentoringVisits: 0,
      teacherTransfers: { total: 0, male: 0, female: 0 }
    };
  }
}

/**
 * Get district-level output indicators (simplified since we don't have the district responses table yet)
 */
async function getDistrictOutputIndicators(connection, whereClause, params) {
  try {
    // Since we don't have the district_response tables yet, we'll return a simplified structure
    // with zeros for all values. This allows the frontend to render correctly without errors.
    
    return {
      districtTeamSupportPlans: 0,
      trainingProvided: 0,
      districtTeamMembersTrained: {
        total: 0,
        male: 0,
        female: 0
      },
      districtsMentoringPlans: 0,
      districtTeamsFormed: 0,
      financialSupportDistricts: 0,
      planningMeetings: 0,
      planningAttendees: {
        total: 0,
        male: 0,
        female: 0
      },
      schoolsVisited: 0,
      trainersFromDST: {
        total: 0,
        male: 0,
        female: 0
      },
      nationalMeetings: 0,
      nationalAttendees: {
        total: 0,
        male: 0,
        female: 0
      }
    };
  } catch (error) {
    console.error('Error getting district output indicators:', error);
    return {
      districtTeamSupportPlans: 0,
      trainingProvided: 0,
      districtTeamMembersTrained: { total: 0, male: 0, female: 0 },
      districtsMentoringPlans: 0,
      districtTeamsFormed: 0,
      financialSupportDistricts: 0,
      planningMeetings: 0,
      planningAttendees: { total: 0, male: 0, female: 0 },
      schoolsVisited: 0,
      trainersFromDST: { total: 0, male: 0, female: 0 },
      nationalMeetings: 0,
      nationalAttendees: { total: 0, male: 0, female: 0 }
    };
  }
}

/**
 * Get breakdown of GALOP vs non-GALOP schools
 */
async function getSchoolTypeBreakdown(connection, whereClause, params) {
  try {
    const [breakdown] = await connection.execute(`
      SELECT 
        SUM(CASE WHEN s.is_galop = 1 THEN 1 ELSE 0 END) as galop_count,
        SUM(CASE WHEN s.is_galop = 0 OR s.is_galop IS NULL THEN 1 ELSE 0 END) as non_galop_count
      FROM right_to_play_question_answers qa
      JOIN schools s ON qa.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      WHERE 1=1 ${whereClause}
      GROUP BY qa.itinerary_id
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
async function getDistrictSubmissions(connection, whereClause, params) {
  try {
    // Modify the where clause to work with our query
    const modifiedWhereClause = whereClause.replace('AND qa.deleted_at IS NULL', '');
    
    const [submissions] = await connection.execute(`
      SELECT 
        d.id as district_id,
        d.name as district,
        COUNT(DISTINCT qa.school_id) as submissions,
        COUNT(DISTINCT s.id) as total_schools,
        ROUND((COUNT(DISTINCT qa.school_id) / COUNT(DISTINCT s.id)) * 100) as percentage
      FROM districts d
      JOIN schools s ON s.district_id = d.id
      LEFT JOIN (
        SELECT DISTINCT school_id, itinerary_id 
        FROM right_to_play_question_answers 
        WHERE deleted_at IS NULL AND itinerary_id = ?
      ) qa ON qa.school_id = s.id
      WHERE s.deleted_at IS NULL
      GROUP BY d.id, d.name
      ORDER BY percentage DESC
    `, [params[0]]); // Just use the itinerary_id
    
    return submissions;
  } catch (error) {
    console.error('Error getting district submissions:', error);
    return [];
  }
}

/**
 * Get gender analysis for the dashboard
 */
async function getGenderAnalysis(connection, whereClause, params, schoolOutputs) {
  try {
    // Make sure schoolOutputs is defined and has the expected structure
    const safeSchoolOutputs = schoolOutputs || {
      teacherChampions: { male: 0, female: 0 },
      teachersPBL: { male: 0, female: 0 },
      teachersECE: { male: 0, female: 0 },
      teachersOther: { male: 0, female: 0 },
      teachersNoTraining: { male: 0, female: 0 },
      studentsEnrolled: { male: 0, female: 0 },
      studentsSpecialNeeds: { male: 0, female: 0 }
    };
    
    // Safe getters for nested properties
    const getValue = (obj, path, defaultValue = 0) => {
      const value = path.split('.').reduce((o, key) => (o && o[key] !== undefined) ? o[key] : undefined, obj);
      return value !== undefined ? value : defaultValue;
    };
    
    // Use the school outputs that we already have to calculate gender gaps
    return {
      teacherTrainingGap: {
        totalTeachers: {
          male: getValue(safeSchoolOutputs, 'teachersPBL.male') + 
                getValue(safeSchoolOutputs, 'teachersECE.male') + 
                getValue(safeSchoolOutputs, 'teachersOther.male'),
          female: getValue(safeSchoolOutputs, 'teachersPBL.female') + 
                  getValue(safeSchoolOutputs, 'teachersECE.female') + 
                  getValue(safeSchoolOutputs, 'teachersOther.female'),
          gap: (getValue(safeSchoolOutputs, 'teachersPBL.female') + 
                getValue(safeSchoolOutputs, 'teachersECE.female') + 
                getValue(safeSchoolOutputs, 'teachersOther.female')) - 
               (getValue(safeSchoolOutputs, 'teachersPBL.male') + 
                getValue(safeSchoolOutputs, 'teachersECE.male') + 
                getValue(safeSchoolOutputs, 'teachersOther.male'))
        },
        teacherChampions: {
          male: getValue(safeSchoolOutputs, 'teacherChampions.male'),
          female: getValue(safeSchoolOutputs, 'teacherChampions.female'),
          gap: getValue(safeSchoolOutputs, 'teacherChampions.female') - 
               getValue(safeSchoolOutputs, 'teacherChampions.male')
        },
        teachersPBL: {
          male: getValue(safeSchoolOutputs, 'teachersPBL.male'),
          female: getValue(safeSchoolOutputs, 'teachersPBL.female'),
          gap: getValue(safeSchoolOutputs, 'teachersPBL.female') - 
               getValue(safeSchoolOutputs, 'teachersPBL.male')
        },
        teachersECE: {
          male: getValue(safeSchoolOutputs, 'teachersECE.male'),
          female: getValue(safeSchoolOutputs, 'teachersECE.female'),
          gap: getValue(safeSchoolOutputs, 'teachersECE.female') - 
               getValue(safeSchoolOutputs, 'teachersECE.male')
        },
        teachersOther: {
          male: getValue(safeSchoolOutputs, 'teachersOther.male'),
          female: getValue(safeSchoolOutputs, 'teachersOther.female'),
          gap: getValue(safeSchoolOutputs, 'teachersOther.female') - 
               getValue(safeSchoolOutputs, 'teachersOther.male')
        },
        teachersNoTraining: {
          male: getValue(safeSchoolOutputs, 'teachersNoTraining.male'),
          female: getValue(safeSchoolOutputs, 'teachersNoTraining.female'),
          gap: getValue(safeSchoolOutputs, 'teachersNoTraining.female') - 
               getValue(safeSchoolOutputs, 'teachersNoTraining.male')
        }
      },
      enrollmentGap: {
        totalEnrollment: {
          male: getValue(safeSchoolOutputs, 'studentsEnrolled.male'),
          female: getValue(safeSchoolOutputs, 'studentsEnrolled.female'),
          gap: getValue(safeSchoolOutputs, 'studentsEnrolled.female') - 
               getValue(safeSchoolOutputs, 'studentsEnrolled.male'),
          gapPercentage: getValue(safeSchoolOutputs, 'studentsEnrolled.male') > 0 
            ? ((getValue(safeSchoolOutputs, 'studentsEnrolled.female') - 
                getValue(safeSchoolOutputs, 'studentsEnrolled.male')) / 
                getValue(safeSchoolOutputs, 'studentsEnrolled.male')) * 100
            : 0
        },
        specialNeeds: {
          male: getValue(safeSchoolOutputs, 'studentsSpecialNeeds.male'),
          female: getValue(safeSchoolOutputs, 'studentsSpecialNeeds.female'),
          gap: getValue(safeSchoolOutputs, 'studentsSpecialNeeds.female') - 
               getValue(safeSchoolOutputs, 'studentsSpecialNeeds.male'),
          gapPercentage: getValue(safeSchoolOutputs, 'studentsSpecialNeeds.male') > 0 
            ? ((getValue(safeSchoolOutputs, 'studentsSpecialNeeds.female') - 
                getValue(safeSchoolOutputs, 'studentsSpecialNeeds.male')) / 
                getValue(safeSchoolOutputs, 'studentsSpecialNeeds.male')) * 100
            : 0
        }
      },
      // Simplified district level gaps since we don't have that data yet
      districtLevelGaps: {
        teamMembers: {
          male: 0,
          female: 0,
          gap: 0,
          gapPercentage: 0
        },
        planningAttendees: {
          male: 0,
          female: 0,
          gap: 0,
          gapPercentage: 0
        },
        trainers: {
          male: 0,
          female: 0,
          gap: 0,
          gapPercentage: 0
        }
      },
      // Simplified performance comparison since we don't have outcomes data yet
      performanceComparison: {
        lessonPlans: {
          male: 0,
          female: 0,
          gap: 0
        },
        teachingSkills: {
          male: 0,
          female: 0,
          gap: 0
        }
      }
    };
  } catch (error) {
    console.error('Error getting gender analysis:', error);
    // Return a default structure to avoid undefined errors in the frontend
    return {
      teacherTrainingGap: {
        totalTeachers: { male: 0, female: 0, gap: 0 },
        teacherChampions: { male: 0, female: 0, gap: 0 },
        teachersPBL: { male: 0, female: 0, gap: 0 },
        teachersECE: { male: 0, female: 0, gap: 0 },
        teachersOther: { male: 0, female: 0, gap: 0 },
        teachersNoTraining: { male: 0, female: 0, gap: 0 }
      },
      enrollmentGap: {
        totalEnrollment: { male: 0, female: 0, gap: 0, gapPercentage: 0 },
        specialNeeds: { male: 0, female: 0, gap: 0, gapPercentage: 0 }
      },
      districtLevelGaps: {
        teamMembers: { male: 0, female: 0, gap: 0, gapPercentage: 0 },
        planningAttendees: { male: 0, female: 0, gap: 0, gapPercentage: 0 },
        trainers: { male: 0, female: 0, gap: 0, gapPercentage: 0 }
      },
      performanceComparison: {
        lessonPlans: { male: 0, female: 0, gap: 0 },
        teachingSkills: { male: 0, female: 0, gap: 0 }
      }
    };
  }
}