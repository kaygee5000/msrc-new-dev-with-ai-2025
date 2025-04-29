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
    const showCalculations = searchParams.get('showCalculations') === 'true'; // show calculation details
    const dataSource = searchParams.get('dataSource'); // filter by data source: 'school', 'district', 'checklist', 'pip'
    const questionId = searchParams.get('questionId'); // filter by specific question ID
    const fromDate = searchParams.get('fromDate'); // filter by date range
    const toDate = searchParams.get('toDate'); // filter by date range
    
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
      
      // Add date range filters if provided
      if (fromDate) {
        baseConditions.push('AND qa.created_at >= ?');
        baseParams.push(fromDate);
      }
      
      if (toDate) {
        baseConditions.push('AND qa.created_at <= ?');
        baseParams.push(toDate);
      }
      
      // Add question ID filter if provided
      if (questionId) {
        baseConditions.push('AND qa.question_id = ?');
        baseParams.push(parseInt(questionId));
      }
      
      // Combine conditions for query building
      const whereClause = baseConditions.join(' ');
      
      // Store query details if showing calculations
      const calculationDetails = showCalculations ? {
        filters: {
          itineraryId: parseInt(itineraryId),
          schoolType: schoolType || 'all',
          districtId: districtId ? parseInt(districtId) : null,
          regionId: regionId ? parseInt(regionId) : null,
          fromDate: fromDate || null,
          toDate: toDate || null,
          questionId: questionId ? parseInt(questionId) : null,
          dataSource: dataSource || 'all'
        },
        queries: {}
      } : null;
      
      // 1. Get summary statistics
      const summary = await getSummaryData(connection, whereClause, baseParams, calculationDetails);
      
      // 2. Get school-level indicators
      const schoolOutputs = await getSchoolOutputIndicators(connection, whereClause, baseParams, viewMode, calculationDetails);
      
      // 3. Get district-level indicators from the district responses table
      const districtOutputs = await getDistrictOutputIndicators(connection, whereClause, baseParams, calculationDetails);
      
      // 3.1 Get consolidated checklist indicators
      const consolidatedChecklistOutputs = await getConsolidatedChecklistIndicators(connection, itineraryId, calculationDetails);
      
      // 3.2 Get partners in play indicators
      const pipOutputs = await getPartnersInPlayIndicators(connection, itineraryId, calculationDetails);
      
      // Filter data sources if requested
      if (dataSource) {
        if (dataSource === 'school') {
          // Only include school output data
          consolidatedChecklistOutputs = null;
          districtOutputs = null;
          pipOutputs = null;
          if (calculationDetails) {
            calculationDetails.activeDataSources = ['right_to_play_question_answers'];
          }
        } else if (dataSource === 'district') {
          // Only include district output data
          schoolOutputs = null;
          consolidatedChecklistOutputs = null;
          pipOutputs = null;
          if (calculationDetails) {
            calculationDetails.activeDataSources = ['right_to_play_district_responses'];
          }
        } else if (dataSource === 'checklist') {
          // Only include consolidated checklist data
          schoolOutputs = null;
          districtOutputs = null;
          pipOutputs = null;
          if (calculationDetails) {
            calculationDetails.activeDataSources = ['right_to_play_consolidated_checklist_responses'];
          }
        } else if (dataSource === 'pip') {
          // Only include partners in play data
          schoolOutputs = null;
          districtOutputs = null;
          consolidatedChecklistOutputs = null;
          if (calculationDetails) {
            calculationDetails.activeDataSources = ['right_to_play_pip_responses'];
          }
        }
      } else if (calculationDetails) {
        calculationDetails.activeDataSources = [
          'right_to_play_question_answers',
          'right_to_play_district_responses',
          'right_to_play_consolidated_checklist_responses',
          'right_to_play_pip_responses'
        ];
      }
      
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
          districtLevel: districtOutputs,
          consolidatedChecklist: consolidatedChecklistOutputs,
          partnersInPlay: pipOutputs
        },
        schoolTypeBreakdown,
        districtSubmissions,
        genderAnalysis: genderAnalysis || undefined
      };
      
      // Add calculation details if requested
      if (showCalculations) {
        dashboardData.calculationDetails = calculationDetails;
      }
      
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
async function getSummaryData(connection, whereClause, params, calculationDetails = null) {
  try {
    // Store the query for calculation transparency if needed
    const summaryQuery = `
      SELECT COUNT(DISTINCT qa.school_id) as total_schools
      FROM right_to_play_question_answers qa
      JOIN schools s ON qa.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      WHERE 1=1 ${whereClause}
    `;
    
    if (calculationDetails) {
      calculationDetails.queries.summaryData = {
        query: summaryQuery,
        params: [...params]
      };
    }
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
async function getSchoolOutputIndicators(connection, whereClause, params, viewMode, calculationDetails = null) {
  try {
    // Store the query for calculation transparency if needed
    const indicatorsQuery = `
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
    `;
    
    if (calculationDetails) {
      calculationDetails.queries.schoolOutputIndicators = {
        query: indicatorsQuery,
        params: [...params],
        questionMappings: {
          '1': 'Male Teacher Champions',
          '2': 'Female Teacher Champions',
          '3': 'INSET Trainings',
          '4': 'Male Teachers PBL',
          '5': 'Female Teachers PBL',
          '6': 'Male Teachers ECE',
          '7': 'Female Teachers ECE',
          '8': 'Male Teachers Other',
          '9': 'Female Teachers Other',
          '10': 'Male Teachers No Training',
          '11': 'Female Teachers No Training',
          '12': 'Boys Enrolled',
          '13': 'Girls Enrolled',
          '14': 'Boys Special Needs',
          '15': 'Girls Special Needs',
          '16': 'Mentoring Visits',
          '17': 'Male Teacher Transfers',
          '18': 'Female Teacher Transfers'
        }
      };
    }
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
 * Get district-level output indicators
 */
async function getDistrictOutputIndicators(connection, whereClause, params, calculationDetails = null) {
  try {
    // Create a modified where clause for district responses
    // Remove school-specific conditions and replace qa with dr
    const modifiedWhereClause = whereClause
      .replace(/qa\./g, 'dr.')
      .replace('AND s.district_id = ?', 'AND dr.district_id = ?');
    
    // Store the query for calculation transparency if needed
    const districtQuery = `
      SELECT
        # Planning meetings
        SUM(CASE WHEN dr.question_id = 1 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as planning_meetings,
        
        # Planning meeting attendees
        SUM(CASE WHEN dr.question_id = 2 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as male_planning_attendees,
        SUM(CASE WHEN dr.question_id = 3 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as female_planning_attendees,
        
        # Schools visited
        SUM(CASE WHEN dr.question_id = 4 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as schools_visited,
        
        # Trainers from DST
        SUM(CASE WHEN dr.question_id = 5 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as male_trainers,
        SUM(CASE WHEN dr.question_id = 6 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as female_trainers,
        
        # National level meetings
        SUM(CASE WHEN dr.question_id = 7 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as national_meetings,
        
        # National meeting attendees
        SUM(CASE WHEN dr.question_id = 8 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as male_national_attendees,
        SUM(CASE WHEN dr.question_id = 9 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as female_national_attendees
      FROM right_to_play_district_responses dr
      WHERE dr.deleted_at IS NULL AND dr.itinerary_id = ?
    `;
    
    if (calculationDetails) {
      calculationDetails.queries.districtOutputIndicators = {
        query: districtQuery,
        params: [params[0]],
        questionMappings: {
          '1': 'Planning Meetings',
          '2': 'Male Planning Attendees',
          '3': 'Female Planning Attendees',
          '4': 'Schools Visited',
          '5': 'Male Trainers',
          '6': 'Female Trainers',
          '7': 'National Meetings',
          '8': 'Male National Attendees',
          '9': 'Female National Attendees'
        },
        dataSource: 'right_to_play_district_responses'
      };
    }
    // We already have modifiedWhereClause from earlier in the function
    // Extract the itinerary ID from params (first parameter)
    const itineraryId = params[0];
    const otherParams = params.slice(1);
    
    // Query the district responses table
    const [districtData] = await connection.execute(`
      SELECT
        # Planning meetings
        SUM(CASE WHEN dr.question_id = 1 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as planning_meetings,
        
        # Planning meeting attendees
        SUM(CASE WHEN dr.question_id = 2 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as male_planning_attendees,
        SUM(CASE WHEN dr.question_id = 3 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as female_planning_attendees,
        
        # Schools visited
        SUM(CASE WHEN dr.question_id = 4 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as schools_visited,
        
        # Trainers from DST
        SUM(CASE WHEN dr.question_id = 5 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as male_trainers,
        SUM(CASE WHEN dr.question_id = 6 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as female_trainers,
        
        # National level meetings
        SUM(CASE WHEN dr.question_id = 7 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as national_meetings,
        
        # National meeting attendees
        SUM(CASE WHEN dr.question_id = 8 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as male_national_attendees,
        SUM(CASE WHEN dr.question_id = 9 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as female_national_attendees
      FROM right_to_play_district_responses dr
      WHERE dr.deleted_at IS NULL AND dr.itinerary_id = ?
    `, [itineraryId]);
    
    const totals = districtData[0] || {};
    
    // Get district breakdown if needed
    let districtBreakdown = null;
    
    // Format the results
    return {
      planningMeetings: parseInt(totals.planning_meetings || 0),
      planningAttendees: {
        total: parseInt(totals.male_planning_attendees || 0) + parseInt(totals.female_planning_attendees || 0),
        male: parseInt(totals.male_planning_attendees || 0),
        female: parseInt(totals.female_planning_attendees || 0)
      },
      schoolsVisited: parseInt(totals.schools_visited || 0),
      trainersFromDST: {
        total: parseInt(totals.male_trainers || 0) + parseInt(totals.female_trainers || 0),
        male: parseInt(totals.male_trainers || 0),
        female: parseInt(totals.female_trainers || 0)
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
    return {
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
 * Get consolidated checklist indicators
 */
async function getConsolidatedChecklistIndicators(connection, itineraryId) {
  try {
    // Query the consolidated checklist responses table
    const [checklistData] = await connection.execute(`
      SELECT
        # School environment
        AVG(CASE WHEN ccr.question_id = 1 THEN CAST(ccr.answer AS UNSIGNED) ELSE NULL END) as avg_school_environment,
        
        # Teacher performance
        AVG(CASE WHEN ccr.question_id = 2 THEN CAST(ccr.answer AS UNSIGNED) ELSE NULL END) as avg_teacher_performance,
        
        # Student engagement
        AVG(CASE WHEN ccr.question_id = 3 THEN CAST(ccr.answer AS UNSIGNED) ELSE NULL END) as avg_student_engagement,
        
        # Community involvement
        AVG(CASE WHEN ccr.question_id = 4 THEN CAST(ccr.answer AS UNSIGNED) ELSE NULL END) as avg_community_involvement,
        
        # Overall program implementation
        AVG(CASE WHEN ccr.question_id = 5 THEN CAST(ccr.answer AS UNSIGNED) ELSE NULL END) as avg_program_implementation,
        
        # Count of responses
        COUNT(DISTINCT ccr.id) as total_responses
      FROM right_to_play_consolidated_checklist_responses ccr
      WHERE ccr.deleted_at IS NULL AND ccr.itinerary_id = ?
    `, [itineraryId]);
    
    const totals = checklistData[0] || {};
    
    // Format the results with scores out of 5
    return {
      schoolEnvironment: parseFloat(totals.avg_school_environment || 0).toFixed(1),
      teacherPerformance: parseFloat(totals.avg_teacher_performance || 0).toFixed(1),
      studentEngagement: parseFloat(totals.avg_student_engagement || 0).toFixed(1),
      communityInvolvement: parseFloat(totals.avg_community_involvement || 0).toFixed(1),
      programImplementation: parseFloat(totals.avg_program_implementation || 0).toFixed(1),
      totalResponses: parseInt(totals.total_responses || 0)
    };
  } catch (error) {
    console.error('Error getting consolidated checklist indicators:', error);
    return {
      schoolEnvironment: '0.0',
      teacherPerformance: '0.0',
      studentEngagement: '0.0',
      communityInvolvement: '0.0',
      programImplementation: '0.0',
      totalResponses: 0
    };
  }
}

/**
 * Get district gender gaps
 */
async function getDistrictGenderGaps(connection, itineraryId) {
  try {
    // Query the district responses table for gender data
    const [genderData] = await connection.execute(`
      SELECT
        # Planning meeting attendees
        SUM(CASE WHEN dr.question_id = 2 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as male_planning_attendees,
        SUM(CASE WHEN dr.question_id = 3 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as female_planning_attendees,
        
        # Trainers from DST
        SUM(CASE WHEN dr.question_id = 5 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as male_trainers,
        SUM(CASE WHEN dr.question_id = 6 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as female_trainers,
        
        # National meeting attendees
        SUM(CASE WHEN dr.question_id = 8 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as male_national_attendees,
        SUM(CASE WHEN dr.question_id = 9 THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as female_national_attendees
      FROM right_to_play_district_responses dr
      WHERE dr.deleted_at IS NULL AND dr.itinerary_id = ?
    `, [itineraryId]);
    
    const data = genderData[0] || {};
    
    // Calculate gender gaps and percentages
    const malePlanningAttendees = parseInt(data.male_planning_attendees || 0);
    const femalePlanningAttendees = parseInt(data.female_planning_attendees || 0);
    const planningGap = femalePlanningAttendees - malePlanningAttendees;
    const planningGapPercentage = malePlanningAttendees > 0 
      ? (planningGap / malePlanningAttendees) * 100 : 0;
    
    const maleTrainers = parseInt(data.male_trainers || 0);
    const femaleTrainers = parseInt(data.female_trainers || 0);
    const trainersGap = femaleTrainers - maleTrainers;
    const trainersGapPercentage = maleTrainers > 0 
      ? (trainersGap / maleTrainers) * 100 : 0;
    
    const maleNationalAttendees = parseInt(data.male_national_attendees || 0);
    const femaleNationalAttendees = parseInt(data.female_national_attendees || 0);
    const nationalGap = femaleNationalAttendees - maleNationalAttendees;
    const nationalGapPercentage = maleNationalAttendees > 0 
      ? (nationalGap / maleNationalAttendees) * 100 : 0;
    
    // Format the results
    return {
      teamMembers: {
        male: maleNationalAttendees,
        female: femaleNationalAttendees,
        gap: nationalGap,
        gapPercentage: parseFloat(nationalGapPercentage.toFixed(1))
      },
      planningAttendees: {
        male: malePlanningAttendees,
        female: femalePlanningAttendees,
        gap: planningGap,
        gapPercentage: parseFloat(planningGapPercentage.toFixed(1))
      },
      trainers: {
        male: maleTrainers,
        female: femaleTrainers,
        gap: trainersGap,
        gapPercentage: parseFloat(trainersGapPercentage.toFixed(1))
      }
    };
  } catch (error) {
    console.error('Error getting district gender gaps:', error);
    return {
      teamMembers: { male: 0, female: 0, gap: 0, gapPercentage: 0 },
      planningAttendees: { male: 0, female: 0, gap: 0, gapPercentage: 0 },
      trainers: { male: 0, female: 0, gap: 0, gapPercentage: 0 }
    };
  }
}

/**
 * Get partners in play indicators
 */
async function getPartnersInPlayIndicators(connection, itineraryId) {
  try {
    // Query the partners in play responses table
    const [pipData] = await connection.execute(`
      SELECT
        # Funding partners
        SUM(CASE WHEN pip.question_id = 1 THEN CAST(pip.answer AS UNSIGNED) ELSE 0 END) as funding_partners,
        
        # Implementation partners
        SUM(CASE WHEN pip.question_id = 2 THEN CAST(pip.answer AS UNSIGNED) ELSE 0 END) as implementation_partners,
        
        # Technical partners
        SUM(CASE WHEN pip.question_id = 3 THEN CAST(pip.answer AS UNSIGNED) ELSE 0 END) as technical_partners,
        
        # Advocacy partners
        SUM(CASE WHEN pip.question_id = 4 THEN CAST(pip.answer AS UNSIGNED) ELSE 0 END) as advocacy_partners,
        
        # Research partners
        SUM(CASE WHEN pip.question_id = 5 THEN CAST(pip.answer AS UNSIGNED) ELSE 0 END) as research_partners,
        
        # Count of responses
        COUNT(DISTINCT pip.id) as total_responses
      FROM right_to_play_pip_responses pip
      WHERE pip.deleted_at IS NULL AND pip.itinerary_id = ?
    `, [itineraryId]);
    
    const totals = pipData[0] || {};
    
    // Format the results
    return {
      fundingPartners: parseInt(totals.funding_partners || 0),
      implementationPartners: parseInt(totals.implementation_partners || 0),
      technicalPartners: parseInt(totals.technical_partners || 0),
      advocacyPartners: parseInt(totals.advocacy_partners || 0),
      researchPartners: parseInt(totals.research_partners || 0),
      totalPartners: parseInt(totals.funding_partners || 0) + 
                    parseInt(totals.implementation_partners || 0) + 
                    parseInt(totals.technical_partners || 0) + 
                    parseInt(totals.advocacy_partners || 0) + 
                    parseInt(totals.research_partners || 0),
      totalResponses: parseInt(totals.total_responses || 0)
    };
  } catch (error) {
    console.error('Error getting partners in play indicators:', error);
    return {
      fundingPartners: 0,
      implementationPartners: 0,
      technicalPartners: 0,
      advocacyPartners: 0,
      researchPartners: 0,
      totalPartners: 0,
      totalResponses: 0
    };
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
      // District level gender gaps from the district responses table
      districtLevelGaps: await getDistrictGenderGaps(connection, params[0]),
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
        trainers: { male: 0, female: 0, gap: 0, gapPercentage: 0 },
        districtResponses: { male: 0, female: 0, gap: 0, gapPercentage: 0 }
      },
      performanceComparison: {
        lessonPlans: { male: 0, female: 0, gap: 0 },
        teachingSkills: { male: 0, female: 0, gap: 0 }
      }
    };
  }
}

// New functions to get district-level data
async function getDistrictTeamMembers(connection, districtId) {
  try {
    const [teamMembersData] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN dr.team_member_gender = 'male' THEN 1 ELSE NULL END) as male,
        COUNT(CASE WHEN dr.team_member_gender = 'female' THEN 1 ELSE NULL END) as female
      FROM right_to_play_district_responses dr
      WHERE dr.district_id = ?
    `, [districtId]);
    
    const teamMembers = teamMembersData[0] || {};
    
    return {
      male: parseInt(teamMembers.male || 0),
      female: parseInt(teamMembers.female || 0),
      gap: parseInt(teamMembers.female || 0) - parseInt(teamMembers.male || 0),
      gapPercentage: parseInt(teamMembers.male || 0) > 0 
        ? ((parseInt(teamMembers.female || 0) - parseInt(teamMembers.male || 0)) / parseInt(teamMembers.male || 0)) * 100
        : 0
    };
  } catch (error) {
    console.error('Error getting district team members:', error);
    return { male: 0, female: 0, gap: 0, gapPercentage: 0 };
  }
}

async function getDistrictPlanningAttendees(connection, districtId) {
  try {
    const [planningAttendeesData] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN dr.planning_attendee_gender = 'male' THEN 1 ELSE NULL END) as male,
        COUNT(CASE WHEN dr.planning_attendee_gender = 'female' THEN 1 ELSE NULL END) as female
      FROM right_to_play_district_responses dr
      WHERE dr.district_id = ?
    `, [districtId]);
    
    const planningAttendees = planningAttendeesData[0] || {};
    
    return {
      male: parseInt(planningAttendees.male || 0),
      female: parseInt(planningAttendees.female || 0),
      gap: parseInt(planningAttendees.female || 0) - parseInt(planningAttendees.male || 0),
      gapPercentage: parseInt(planningAttendees.male || 0) > 0 
        ? ((parseInt(planningAttendees.female || 0) - parseInt(planningAttendees.male || 0)) / parseInt(planningAttendees.male || 0)) * 100
        : 0
    };
  } catch (error) {
    console.error('Error getting district planning attendees:', error);
    return { male: 0, female: 0, gap: 0, gapPercentage: 0 };
  }
}

async function getDistrictTrainers(connection, districtId) {
  try {
    const [trainersData] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN dr.trainer_gender = 'male' THEN 1 ELSE NULL END) as male,
        COUNT(CASE WHEN dr.trainer_gender = 'female' THEN 1 ELSE NULL END) as female
      FROM right_to_play_district_responses dr
      WHERE dr.district_id = ?
    `, [districtId]);
    
    const trainers = trainersData[0] || {};
    
    return {
      male: parseInt(trainers.male || 0),
      female: parseInt(trainers.female || 0),
      gap: parseInt(trainers.female || 0) - parseInt(trainers.male || 0),
      gapPercentage: parseInt(trainers.male || 0) > 0 
        ? ((parseInt(trainers.female || 0) - parseInt(trainers.male || 0)) / parseInt(trainers.male || 0)) * 100
        : 0
    };
  } catch (error) {
    console.error('Error getting district trainers:', error);
    return { male: 0, female: 0, gap: 0, gapPercentage: 0 };
  }
}

async function getDistrictResponses(connection, districtId) {
  try {
    const [districtResponsesData] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN dr.response_gender = 'male' THEN 1 ELSE NULL END) as male,
        COUNT(CASE WHEN dr.response_gender = 'female' THEN 1 ELSE NULL END) as female
      FROM right_to_play_district_responses dr
      WHERE dr.district_id = ?
    `, [districtId]);
    
    const districtResponses = districtResponsesData[0] || {};
    
    return {
      male: parseInt(districtResponses.male || 0),
      female: parseInt(districtResponses.female || 0),
      gap: parseInt(districtResponses.female || 0) - parseInt(districtResponses.male || 0),
      gapPercentage: parseInt(districtResponses.male || 0) > 0 
        ? ((parseInt(districtResponses.female || 0) - parseInt(districtResponses.male || 0)) / parseInt(districtResponses.male || 0)) * 100
        : 0
    };
  } catch (error) {
    console.error('Error getting district responses:', error);
    return { male: 0, female: 0, gap: 0, gapPercentage: 0 };
  }
}