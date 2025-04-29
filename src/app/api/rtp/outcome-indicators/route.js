import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getConnectionConfig } from '@/utils/db';

// Question ID mappings based on the database
const QUESTION_MAPPINGS = {
  // School Output questions - Primary school enrollment
  boysEnrolledQuestion: 12,
  girlsEnrolledQuestion: 13,
  boysSpecialNeedsQuestion: 14,
  girlsSpecialNeedsQuestion: 15,
  
  // Teacher transfer questions - for dropout rate calculation
  maleTeacherTransfersQuestion: 17,
  femaleTeacherTransfersQuestion: 18,
  
  // Consolidated Checklist questions
  implementationPlanQuestion: 53,  // 'Does the school have an implementation plan?'
  developmentPlanQuestion: 67,     // 'Does the school have written plans for LtP?'
  lessonPlanQuestion: 55,          // 'Does the school have lesson plans that include LtP?'
  
  // District officials PBL test scores
  districtOfficialsPBLQuestion: 28, // District officials trained in coaching and mentoring
  
  // Learning environment indicators
  friendlyToneQuestion: 43,
  acknowledgingEffortQuestion: 44,
  pupilParticipationQuestion: 45,
  
  // Teacher facilitation skills indicators
  teacherSkillQ29: 29,
  teacherSkillQ30: 30,
  teacherSkillQ31: 31,
  teacherSkillQ32: 32,
  teacherSkillQ33: 33,
  teacherSkillQ39: 39,
  teacherSkillQ45: 45,
  teacherSkillQ46: 46,
  teacherSkillQ48: 48,
  teacherSkillQ49: 49
};

// District Output question IDs
const DISTRICT_QUESTION_MAPPINGS = {
  // Planning meetings
  planningMeetingsQuestion: 1,
  
  // Planning meeting attendees
  malePlanningAttendeesQuestion: 2,
  femalePlanningAttendeesQuestion: 3,
  
  // Schools visited
  schoolsVisitedQuestion: 4,
  
  // Trainers from DST
  maleTrainersQuestion: 5,
  femaleTrainersQuestion: 6,
  
  // National level meetings
  nationalMeetingsQuestion: 7,
  
  // National meeting attendees
  maleNationalAttendeesQuestion: 8,
  femaleNationalAttendeesQuestion: 9
};

// Consolidated Checklist question IDs
const CHECKLIST_QUESTION_MAPPINGS = {
  // School environment
  schoolEnvironmentQuestion: 1,
  
  // Teacher performance
  teacherPerformanceQuestion: 2,
  
  // Student engagement
  studentEngagementQuestion: 3,
  
  // Community involvement
  communityInvolvementQuestion: 4,
  
  // Overall program implementation
  programImplementationQuestion: 5
};

// Partners in Play question IDs
const PIP_QUESTION_MAPPINGS = {
  // Funding partners
  fundingPartnersQuestion: 1,
  
  // Implementation partners
  implementationPartnersQuestion: 2,
  
  // Technical partners
  technicalPartnersQuestion: 3,
  
  // Advocacy partners
  advocacyPartnersQuestion: 4,
  
  // Research partners
  researchPartnersQuestion: 5
};

/**
 * Calculate outcome indicators for a specific itinerary based on the PRD requirements
 * 
 * @param {Object} req - The request object
 * @returns {NextResponse} - The response with calculated indicators
 */
export async function GET(req) {
  try {
    // Extract itinerary ID and optional filters from the request URL
    const url = new URL(req.url);
    const itineraryId = url.searchParams.get('itineraryId');
    const schoolType = url.searchParams.get('schoolType'); // 'all', 'galop', or 'non-galop'
    const districtId = url.searchParams.get('districtId'); // optional district filter
    const regionId = url.searchParams.get('regionId'); // optional region filter
    const showCalculations = url.searchParams.get('showCalculations') === 'true'; // show calculation details
    const dataSource = url.searchParams.get('dataSource'); // filter by data source: 'school', 'district', 'checklist', 'pip'
    const questionId = url.searchParams.get('questionId'); // filter by specific question ID
    const fromDate = url.searchParams.get('fromDate'); // filter by date range
    const toDate = url.searchParams.get('toDate'); // filter by date range
    const indicatorType = url.searchParams.get('indicatorType'); // filter by indicator type
    
    if (!itineraryId) {
      return NextResponse.json(
        { error: 'Missing required parameter: itineraryId' },
        { status: 400 }
      );
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
          dataSource: dataSource || 'all',
          indicatorType: indicatorType || 'all'
        },
        queries: {},
        questionMappings: QUESTION_MAPPINGS,
        districtQuestionMappings: DISTRICT_QUESTION_MAPPINGS,
        checklistQuestionMappings: CHECKLIST_QUESTION_MAPPINGS,
        pipQuestionMappings: PIP_QUESTION_MAPPINGS
      } : null;
      
      // Calculate the 9 outcome indicators as specified in the PRD
      
      // 1. Total primary school enrollment
      const [[enrollmentData]] = await connection.execute(`
        SELECT 
          SUM(CASE WHEN qa.question_id = ? THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) AS boysEnrollment,
          SUM(CASE WHEN qa.question_id = ? THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) AS girlsEnrollment,
          SUM(CASE WHEN qa.question_id = ? THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) AS boysSpecialNeeds,
          SUM(CASE WHEN qa.question_id = ? THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) AS girlsSpecialNeeds
        FROM right_to_play_question_answers qa
        JOIN schools s ON qa.school_id = s.id
        JOIN districts d ON s.district_id = d.id
        WHERE qa.question_id IN (?, ?, ?, ?) ${whereClause}
      `, [
        QUESTION_MAPPINGS.boysEnrolledQuestion,
        QUESTION_MAPPINGS.girlsEnrolledQuestion,
        QUESTION_MAPPINGS.boysSpecialNeedsQuestion,
        QUESTION_MAPPINGS.girlsSpecialNeedsQuestion,
        QUESTION_MAPPINGS.boysEnrolledQuestion,
        QUESTION_MAPPINGS.girlsEnrolledQuestion,
        QUESTION_MAPPINGS.boysSpecialNeedsQuestion,
        QUESTION_MAPPINGS.girlsSpecialNeedsQuestion,
        ...baseParams
      ]);
      
      const boysEnrollment = parseInt(enrollmentData?.boysEnrollment || 0);
      const girlsEnrollment = parseInt(enrollmentData?.girlsEnrollment || 0);
      const boysSpecialNeeds = parseInt(enrollmentData?.boysSpecialNeeds || 0);
      const girlsSpecialNeeds = parseInt(enrollmentData?.girlsSpecialNeeds || 0);
      const totalEnrollment = boysEnrollment + girlsEnrollment;
      const totalSpecialNeeds = boysSpecialNeeds + girlsSpecialNeeds;
      
      // 2. Primary school dropout rate (using teacher transfers as proxy)
      const [[transferData]] = await connection.execute(`
        SELECT 
          SUM(CASE WHEN qa.question_id = ? THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) AS maleTransfers,
          SUM(CASE WHEN qa.question_id = ? THEN CAST(qa.answer AS UNSIGNED) ELSE 0 END) AS femaleTransfers
        FROM right_to_play_question_answers qa
        JOIN schools s ON qa.school_id = s.id
        JOIN districts d ON s.district_id = d.id
        WHERE qa.question_id IN (?, ?) ${whereClause}
      `, [
        QUESTION_MAPPINGS.maleTeacherTransfersQuestion,
        QUESTION_MAPPINGS.femaleTeacherTransfersQuestion,
        QUESTION_MAPPINGS.maleTeacherTransfersQuestion,
        QUESTION_MAPPINGS.femaleTeacherTransfersQuestion,
        ...baseParams
      ]);
      
      const maleTransfers = parseInt(transferData?.maleTransfers || 0);
      const femaleTransfers = parseInt(transferData?.femaleTransfers || 0);
      const totalTransfers = maleTransfers + femaleTransfers;
      
      // 3. Percentage of schools with implementation plans
      const [[{ totalSchools }]] = await connection.execute(`
        SELECT COUNT(DISTINCT qa.school_id) AS totalSchools 
        FROM right_to_play_question_answers qa
        JOIN schools s ON qa.school_id = s.id
        JOIN districts d ON s.district_id = d.id
        WHERE 1=1 ${whereClause}
      `, baseParams);
      
      const [[{ schoolsWithPlans }]] = await connection.execute(`
        SELECT COUNT(DISTINCT qa.school_id) AS schoolsWithPlans 
        FROM right_to_play_question_answers qa
        JOIN schools s ON qa.school_id = s.id
        JOIN districts d ON s.district_id = d.id
        WHERE qa.question_id = ? AND qa.answer = 'Yes' ${whereClause}
      `, [QUESTION_MAPPINGS.implementationPlanQuestion, ...baseParams]);
      
      // 4. Percentage of schools with development plans including LtP
      const [[{ schoolsWithLtPDevelopmentPlans }]] = await connection.execute(`
        SELECT COUNT(DISTINCT qa.school_id) AS schoolsWithLtPDevelopmentPlans 
        FROM right_to_play_question_answers qa
        JOIN schools s ON qa.school_id = s.id
        JOIN districts d ON s.district_id = d.id
        WHERE qa.question_id = ? AND qa.answer = 'Yes' ${whereClause}
      `, [QUESTION_MAPPINGS.developmentPlanQuestion, ...baseParams]);
      
      // 5. Number of schools reached
      const [[{ schoolsReached }]] = await connection.execute(`
        SELECT COUNT(DISTINCT qa.school_id) AS schoolsReached 
        FROM right_to_play_question_answers qa
        JOIN schools s ON qa.school_id = s.id
        JOIN districts d ON s.district_id = d.id
        WHERE 1=1 ${whereClause}
      `, baseParams);
      
      // 6. Percentage of district officials scoring satisfactorily on PBL tests
      const [[{ districtOfficialsTrained }]] = await connection.execute(`
        SELECT COUNT(DISTINCT qa.district_id) AS districtOfficialsTrained 
        FROM right_to_play_question_answers qa
        JOIN schools s ON qa.school_id = s.id
        JOIN districts d ON s.district_id = d.id
        WHERE qa.question_id = ? AND CAST(qa.answer AS UNSIGNED) > 0 ${whereClause}
      `, [QUESTION_MAPPINGS.districtOfficialsPBLQuestion, ...baseParams]);
      
      const [[{ totalDistricts }]] = await connection.execute(`
        SELECT COUNT(DISTINCT d.id) AS totalDistricts 
        FROM districts d
        JOIN schools s ON s.district_id = d.id
        WHERE s.deleted_at IS NULL
      `);
      
      // 7. Percentage of teachers with lesson plans that include LtP
      const [[{ teachersWithLtPPlans }]] = await connection.execute(`
        SELECT COUNT(DISTINCT qa.school_id) AS teachersWithLtPPlans 
        FROM right_to_play_question_answers qa
        JOIN schools s ON qa.school_id = s.id
        JOIN districts d ON s.district_id = d.id
        WHERE qa.question_id = ? AND qa.answer = 'Yes' ${whereClause}
      `, [QUESTION_MAPPINGS.lessonPlanQuestion, ...baseParams]);
      
      // 8. Percentage of learning environments showing LtP methods
      const [[learningEnvironmentData]] = await connection.execute(`
        SELECT 
          AVG(CASE WHEN qa.question_id = ? THEN CAST(qa.answer AS UNSIGNED) ELSE NULL END) AS avgTone,
          AVG(CASE WHEN qa.question_id = ? THEN CAST(qa.answer AS UNSIGNED) ELSE NULL END) AS avgEffort,
          AVG(CASE WHEN qa.question_id = ? THEN CAST(qa.answer AS UNSIGNED) ELSE NULL END) AS avgParticipation
        FROM right_to_play_question_answers qa
        JOIN schools s ON qa.school_id = s.id
        JOIN districts d ON s.district_id = d.id
        WHERE qa.question_id IN (?, ?, ?) ${whereClause}
      `, [
        QUESTION_MAPPINGS.friendlyToneQuestion,
        QUESTION_MAPPINGS.acknowledgingEffortQuestion,
        QUESTION_MAPPINGS.pupilParticipationQuestion,
        QUESTION_MAPPINGS.friendlyToneQuestion,
        QUESTION_MAPPINGS.acknowledgingEffortQuestion,
        QUESTION_MAPPINGS.pupilParticipationQuestion,
        ...baseParams
      ]);
      
      const avgTone = parseFloat(learningEnvironmentData?.avgTone || 0);
      const avgEffort = parseFloat(learningEnvironmentData?.avgEffort || 0);
      const avgParticipation = parseFloat(learningEnvironmentData?.avgParticipation || 0);
      const averageEnvScore = (avgTone + avgEffort + avgParticipation) / 3;
      
      // 9. Percentage of teachers with LtP facilitation skills
      const skillIds = [
        QUESTION_MAPPINGS.teacherSkillQ29,
        QUESTION_MAPPINGS.teacherSkillQ30,
        QUESTION_MAPPINGS.teacherSkillQ31,
        QUESTION_MAPPINGS.teacherSkillQ32,
        QUESTION_MAPPINGS.teacherSkillQ33,
        QUESTION_MAPPINGS.teacherSkillQ39,
        QUESTION_MAPPINGS.teacherSkillQ45,
        QUESTION_MAPPINGS.teacherSkillQ46,
        QUESTION_MAPPINGS.teacherSkillQ48,
        QUESTION_MAPPINGS.teacherSkillQ49
      ];
      
      const placeholders = skillIds.map(() => '?').join(',');
      const [[{ avgSkillScore }]] = await connection.execute(`
        SELECT AVG(CAST(qa.answer AS UNSIGNED)) AS avgSkillScore 
        FROM right_to_play_question_answers qa
        JOIN schools s ON qa.school_id = s.id
        JOIN districts d ON s.district_id = d.id
        WHERE qa.question_id IN (${placeholders}) ${whereClause}
      `, [...skillIds, ...baseParams]);
      
      // Get district output indicators
      const districtOutputData = await getDistrictOutputIndicators(connection, itineraryId, calculationDetails);
      
      // Get consolidated checklist indicators
      const checklistData = await getConsolidatedChecklistIndicators(connection, itineraryId, calculationDetails);
      
      // Get partners in play indicators
      const pipData = await getPartnersInPlayIndicators(connection, itineraryId, calculationDetails);
      
      // Format the results according to the PRD requirements
      const data = {
        // 1. Total primary school enrollment
        enrollment: {
          boysEnrollment,
          girlsEnrollment,
          totalEnrollment,
          boysSpecialNeeds,
          girlsSpecialNeeds,
          totalSpecialNeeds,
          percentageSpecialNeeds: totalEnrollment ? Math.round((totalSpecialNeeds / totalEnrollment) * 100) : 0
        },
        
        // 2. Primary school dropout rate (using teacher transfers as proxy)
        dropoutRate: {
          maleTransfers,
          femaleTransfers,
          totalTransfers,
          rate: totalSchools ? Math.round((totalTransfers / totalSchools) * 100) / 100 : 0 // As a decimal
        },
        
        // 3. Percentage of schools with implementation plans
        implementationPlans: {
          schoolsWithPlans: parseInt(schoolsWithPlans || 0),
          totalSchools: parseInt(totalSchools || 0),
          percentage: totalSchools ? Math.round((schoolsWithPlans / totalSchools) * 100) : 0
        },
        
        // 4. Percentage of schools with development plans including LtP
        developmentPlans: {
          schoolsWithLtPDevelopmentPlans: parseInt(schoolsWithLtPDevelopmentPlans || 0),
          totalSchools: parseInt(totalSchools || 0),
          percentage: totalSchools ? Math.round((schoolsWithLtPDevelopmentPlans / totalSchools) * 100) : 0
        },
        
        // 5. Number of schools reached
        schoolsReached: parseInt(schoolsReached || 0),
        
        // 6. Percentage of district officials scoring satisfactorily on PBL tests
        districtOfficials: {
          districtOfficialsTrained: parseInt(districtOfficialsTrained || 0),
          totalDistricts: parseInt(totalDistricts || 0),
          percentage: totalDistricts ? Math.round((districtOfficialsTrained / totalDistricts) * 100) : 0
        },
        
        // 7. Percentage of teachers with lesson plans that include LtP
        lessonPlans: {
          teachersWithLtPPlans: parseInt(teachersWithLtPPlans || 0),
          totalSchools: parseInt(totalSchools || 0), // Using schools as proxy for teachers
          percentage: totalSchools ? Math.round((teachersWithLtPPlans / totalSchools) * 100) : 0
        },
        
        // 8. Percentage of learning environments showing LtP methods
        learningEnvironments: {
          averageScore: parseFloat(averageEnvScore.toFixed(2)),
          friendlyToneScore: parseFloat(avgTone.toFixed(2)),
          acknowledgingEffortScore: parseFloat(avgEffort.toFixed(2)),
          pupilParticipationScore: parseFloat(avgParticipation.toFixed(2)),
          percentage: Math.round((averageEnvScore / 5) * 100) // Scale is 1-5
        },
        
        // 9. Percentage of teachers with LtP facilitation skills
        teacherSkills: {
          averageScore: parseFloat(Number(avgSkillScore || 0).toFixed(2)),
          percentage: Math.round((Number(avgSkillScore || 0) / 5) * 100) // Scale is 1-5
        },
        
        // District output indicators
        districtOutput: districtOutputData,
        
        // Consolidated checklist indicators
        consolidatedChecklist: checklistData,
        
        // Partners in play indicators
        partnersInPlay: pipData
      };
      
      // Filter data sources if requested
      let filteredData = {
        enrollment: data.enrollment,
        dropoutRate: data.dropoutRate,
        implementationPlans: data.implementationPlans,
        developmentPlans: data.developmentPlans,
        schoolsReached: data.schoolsReached,
        districtOfficials: data.districtOfficials,
        lessonPlans: data.lessonPlans,
        learningEnvironments: data.learningEnvironments,
        teacherSkills: data.teacherSkills,
        districtOutput: districtOutputData,
        consolidatedChecklist: checklistData,
        partnersInPlay: pipData
      };
      
      if (dataSource) {
        if (dataSource === 'school') {
          // Only include school output data
          filteredData.districtOutput = null;
          filteredData.consolidatedChecklist = null;
          filteredData.partnersInPlay = null;
          if (calculationDetails) {
            calculationDetails.activeDataSources = ['right_to_play_question_answers'];
          }
        } else if (dataSource === 'district') {
          // Only include district output data
          filteredData = {
            districtOutput: districtOutputData
          };
          if (calculationDetails) {
            calculationDetails.activeDataSources = ['right_to_play_district_responses'];
          }
        } else if (dataSource === 'checklist') {
          // Only include consolidated checklist data
          filteredData = {
            consolidatedChecklist: checklistData
          };
          if (calculationDetails) {
            calculationDetails.activeDataSources = ['right_to_play_consolidated_checklist_responses'];
          }
        } else if (dataSource === 'pip') {
          // Only include partners in play data
          filteredData = {
            partnersInPlay: pipData
          };
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
      
      // Filter by indicator type if requested
      if (indicatorType) {
        const indicatorMap = {
          'enrollment': ['enrollment'],
          'dropout': ['dropoutRate'],
          'plans': ['implementationPlans', 'developmentPlans', 'lessonPlans'],
          'schools': ['schoolsReached'],
          'district': ['districtOfficials', 'districtOutput'],
          'learning': ['learningEnvironments'],
          'teachers': ['teacherSkills'],
          'checklist': ['consolidatedChecklist'],
          'partners': ['partnersInPlay']
        };
        
        const allowedKeys = indicatorMap[indicatorType] || [];
        if (allowedKeys.length > 0) {
          const filteredByType = {};
          allowedKeys.forEach(key => {
            if (filteredData[key] !== undefined) {
              filteredByType[key] = filteredData[key];
            }
          });
          filteredData = filteredByType;
          
          if (calculationDetails) {
            calculationDetails.filteredIndicatorType = indicatorType;
            calculationDetails.includedIndicators = allowedKeys;
          }
        }
      }
      


      // Add calculation details if requested
      const responseData = showCalculations ? {
        data: filteredData,
        calculationDetails: calculationDetails
      } : { data: filteredData };
      
      return NextResponse.json({ success: true, ...responseData });
    } finally {
      // Always close the connection
      await connection.end();
    }
  } catch (error) {
    console.error('Error calculating outcome indicators:', error);
    return NextResponse.json(
      { error: 'Failed to calculate outcome indicators', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get district output indicators from the right_to_play_district_responses table
 */
async function getDistrictOutputIndicators(connection, itineraryId, calculationDetails = null) {
  try {
    // Store the query for calculation transparency if needed
    const districtQuery = `
      SELECT
        # Planning meetings
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as planning_meetings,
        
        # Planning meeting attendees
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as male_planning_attendees,
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as female_planning_attendees,
        
        # Schools visited
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as schools_visited,
        
        # Trainers from DST
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as male_trainers,
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as female_trainers,
        
        # National level meetings
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as national_meetings,
        
        # National meeting attendees
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as male_national_attendees,
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as female_national_attendees,
        
        # Count of responses
        COUNT(DISTINCT dr.id) as total_responses
      FROM right_to_play_district_responses dr
      WHERE dr.deleted_at IS NULL AND dr.itinerary_id = ?
    `;
    
    if (calculationDetails) {
      calculationDetails.queries.districtOutputIndicators = {
        query: districtQuery,
        params: [
          DISTRICT_QUESTION_MAPPINGS.planningMeetingsQuestion,
          DISTRICT_QUESTION_MAPPINGS.malePlanningAttendeesQuestion,
          DISTRICT_QUESTION_MAPPINGS.femalePlanningAttendeesQuestion,
          DISTRICT_QUESTION_MAPPINGS.schoolsVisitedQuestion,
          DISTRICT_QUESTION_MAPPINGS.maleTrainersQuestion,
          DISTRICT_QUESTION_MAPPINGS.femaleTrainersQuestion,
          DISTRICT_QUESTION_MAPPINGS.nationalMeetingsQuestion,
          DISTRICT_QUESTION_MAPPINGS.maleNationalAttendeesQuestion,
          DISTRICT_QUESTION_MAPPINGS.femaleNationalAttendeesQuestion,
          itineraryId
        ],
        dataSource: 'right_to_play_district_responses'
      };
    }
    
    // Query the district responses table
    const [districtData] = await connection.execute(`
      SELECT
        # Planning meetings
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as planning_meetings,
        
        # Planning meeting attendees
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as male_planning_attendees,
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as female_planning_attendees,
        
        # Schools visited
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as schools_visited,
        
        # Trainers from DST
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as male_trainers,
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as female_trainers,
        
        # National level meetings
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as national_meetings,
        
        # National meeting attendees
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as male_national_attendees,
        SUM(CASE WHEN dr.question_id = ? THEN CAST(dr.answer AS UNSIGNED) ELSE 0 END) as female_national_attendees,
        
        # Count of responses
        COUNT(DISTINCT dr.id) as total_responses
      FROM right_to_play_district_responses dr
      WHERE dr.deleted_at IS NULL AND dr.itinerary_id = ?
    `, [
      DISTRICT_QUESTION_MAPPINGS.planningMeetingsQuestion,
      DISTRICT_QUESTION_MAPPINGS.malePlanningAttendeesQuestion,
      DISTRICT_QUESTION_MAPPINGS.femalePlanningAttendeesQuestion,
      DISTRICT_QUESTION_MAPPINGS.schoolsVisitedQuestion,
      DISTRICT_QUESTION_MAPPINGS.maleTrainersQuestion,
      DISTRICT_QUESTION_MAPPINGS.femaleTrainersQuestion,
      DISTRICT_QUESTION_MAPPINGS.nationalMeetingsQuestion,
      DISTRICT_QUESTION_MAPPINGS.maleNationalAttendeesQuestion,
      DISTRICT_QUESTION_MAPPINGS.femaleNationalAttendeesQuestion,
      itineraryId
    ]);
    
    const totals = districtData[0] || {};
    const malePlanningAttendees = parseInt(totals.male_planning_attendees || 0);
    const femalePlanningAttendees = parseInt(totals.female_planning_attendees || 0);
    const maleTrainers = parseInt(totals.male_trainers || 0);
    const femaleTrainers = parseInt(totals.female_trainers || 0);
    const maleNationalAttendees = parseInt(totals.male_national_attendees || 0);
    const femaleNationalAttendees = parseInt(totals.female_national_attendees || 0);
    
    // Calculate gender ratios
    const planningAttendeeRatio = malePlanningAttendees + femalePlanningAttendees > 0 
      ? (femalePlanningAttendees / (malePlanningAttendees + femalePlanningAttendees)) * 100 : 0;
    
    const trainerRatio = maleTrainers + femaleTrainers > 0 
      ? (femaleTrainers / (maleTrainers + femaleTrainers)) * 100 : 0;
    
    const nationalAttendeeRatio = maleNationalAttendees + femaleNationalAttendees > 0 
      ? (femaleNationalAttendees / (maleNationalAttendees + femaleNationalAttendees)) * 100 : 0;
    
    // Format the results
    return {
      planningMeetings: parseInt(totals.planning_meetings || 0),
      planningAttendees: {
        total: malePlanningAttendees + femalePlanningAttendees,
        male: malePlanningAttendees,
        female: femalePlanningAttendees,
        femaleRatio: parseFloat(planningAttendeeRatio.toFixed(1))
      },
      schoolsVisited: parseInt(totals.schools_visited || 0),
      trainersFromDST: {
        total: maleTrainers + femaleTrainers,
        male: maleTrainers,
        female: femaleTrainers,
        femaleRatio: parseFloat(trainerRatio.toFixed(1))
      },
      nationalMeetings: parseInt(totals.national_meetings || 0),
      nationalAttendees: {
        total: maleNationalAttendees + femaleNationalAttendees,
        male: maleNationalAttendees,
        female: femaleNationalAttendees,
        femaleRatio: parseFloat(nationalAttendeeRatio.toFixed(1))
      },
      totalResponses: parseInt(totals.total_responses || 0)
    };
  } catch (error) {
    console.error('Error getting district output indicators:', error);
    return {
      planningMeetings: 0,
      planningAttendees: { total: 0, male: 0, female: 0, femaleRatio: 0 },
      schoolsVisited: 0,
      trainersFromDST: { total: 0, male: 0, female: 0, femaleRatio: 0 },
      nationalMeetings: 0,
      nationalAttendees: { total: 0, male: 0, female: 0, femaleRatio: 0 },
      totalResponses: 0
    };
  }
}

/**
 * Get consolidated checklist indicators from the right_to_play_consolidated_checklist_responses table
 */
async function getConsolidatedChecklistIndicators(connection, itineraryId, calculationDetails = null) {
  try {
    // Store the query for calculation transparency if needed
    const checklistQuery = `
      SELECT
        # School environment
        AVG(CASE WHEN ccr.question_id = ? THEN CAST(ccr.answer AS UNSIGNED) ELSE NULL END) as avg_school_environment,
        
        # Teacher performance
        AVG(CASE WHEN ccr.question_id = ? THEN CAST(ccr.answer AS UNSIGNED) ELSE NULL END) as avg_teacher_performance,
        
        # Student engagement
        AVG(CASE WHEN ccr.question_id = ? THEN CAST(ccr.answer AS UNSIGNED) ELSE NULL END) as avg_student_engagement,
        
        # Community involvement
        AVG(CASE WHEN ccr.question_id = ? THEN CAST(ccr.answer AS UNSIGNED) ELSE NULL END) as avg_community_involvement,
        
        # Overall program implementation
        AVG(CASE WHEN ccr.question_id = ? THEN CAST(ccr.answer AS UNSIGNED) ELSE NULL END) as avg_program_implementation,
        
        # Count of responses
        COUNT(DISTINCT ccr.id) as total_responses
      FROM right_to_play_consolidated_checklist_responses ccr
      WHERE ccr.deleted_at IS NULL AND ccr.itinerary_id = ?
    `;
    
    if (calculationDetails) {
      calculationDetails.queries.consolidatedChecklistIndicators = {
        query: checklistQuery,
        params: [
          CHECKLIST_QUESTION_MAPPINGS.schoolEnvironmentQuestion,
          CHECKLIST_QUESTION_MAPPINGS.teacherPerformanceQuestion,
          CHECKLIST_QUESTION_MAPPINGS.studentEngagementQuestion,
          CHECKLIST_QUESTION_MAPPINGS.communityInvolvementQuestion,
          CHECKLIST_QUESTION_MAPPINGS.programImplementationQuestion,
          itineraryId
        ],
        dataSource: 'right_to_play_consolidated_checklist_responses'
      };
    }
    
    // Query the consolidated checklist responses table
    const [checklistData] = await connection.execute(`
      SELECT
        # School environment
        AVG(CASE WHEN ccr.question_id = ? THEN CAST(ccr.answer AS UNSIGNED) ELSE NULL END) as avg_school_environment,
        
        # Teacher performance
        AVG(CASE WHEN ccr.question_id = ? THEN CAST(ccr.answer AS UNSIGNED) ELSE NULL END) as avg_teacher_performance,
        
        # Student engagement
        AVG(CASE WHEN ccr.question_id = ? THEN CAST(ccr.answer AS UNSIGNED) ELSE NULL END) as avg_student_engagement,
        
        # Community involvement
        AVG(CASE WHEN ccr.question_id = ? THEN CAST(ccr.answer AS UNSIGNED) ELSE NULL END) as avg_community_involvement,
        
        # Overall program implementation
        AVG(CASE WHEN ccr.question_id = ? THEN CAST(ccr.answer AS UNSIGNED) ELSE NULL END) as avg_program_implementation,
        
        # Count of responses
        COUNT(DISTINCT ccr.id) as total_responses
      FROM right_to_play_consolidated_checklist_responses ccr
      WHERE ccr.deleted_at IS NULL AND ccr.itinerary_id = ?
    `, [
      CHECKLIST_QUESTION_MAPPINGS.schoolEnvironmentQuestion,
      CHECKLIST_QUESTION_MAPPINGS.teacherPerformanceQuestion,
      CHECKLIST_QUESTION_MAPPINGS.studentEngagementQuestion,
      CHECKLIST_QUESTION_MAPPINGS.communityInvolvementQuestion,
      CHECKLIST_QUESTION_MAPPINGS.programImplementationQuestion,
      itineraryId
    ]);
    
    const totals = checklistData[0] || {};
    const avgSchoolEnvironment = parseFloat(totals.avg_school_environment || 0);
    const avgTeacherPerformance = parseFloat(totals.avg_teacher_performance || 0);
    const avgStudentEngagement = parseFloat(totals.avg_student_engagement || 0);
    const avgCommunityInvolvement = parseFloat(totals.avg_community_involvement || 0);
    const avgProgramImplementation = parseFloat(totals.avg_program_implementation || 0);
    
    // Calculate overall average
    const overallAverage = [
      avgSchoolEnvironment, 
      avgTeacherPerformance, 
      avgStudentEngagement, 
      avgCommunityInvolvement, 
      avgProgramImplementation
    ].filter(Boolean).reduce((sum, val) => sum + val, 0) / [
      avgSchoolEnvironment, 
      avgTeacherPerformance, 
      avgStudentEngagement, 
      avgCommunityInvolvement, 
      avgProgramImplementation
    ].filter(Boolean).length || 0;
    
    // Format the results with scores out of 5
    return {
      schoolEnvironment: parseFloat(avgSchoolEnvironment.toFixed(1)),
      teacherPerformance: parseFloat(avgTeacherPerformance.toFixed(1)),
      studentEngagement: parseFloat(avgStudentEngagement.toFixed(1)),
      communityInvolvement: parseFloat(avgCommunityInvolvement.toFixed(1)),
      programImplementation: parseFloat(avgProgramImplementation.toFixed(1)),
      overallAverage: parseFloat(overallAverage.toFixed(1)),
      percentageScore: Math.round((overallAverage / 5) * 100),
      totalResponses: parseInt(totals.total_responses || 0)
    };
  } catch (error) {
    console.error('Error getting consolidated checklist indicators:', error);
    return {
      schoolEnvironment: 0,
      teacherPerformance: 0,
      studentEngagement: 0,
      communityInvolvement: 0,
      programImplementation: 0,
      overallAverage: 0,
      percentageScore: 0,
      totalResponses: 0
    };
  }
}

/**
 * Get partners in play indicators from the right_to_play_pip_responses table
 */
async function getPartnersInPlayIndicators(connection, itineraryId, calculationDetails = null) {
  try {
    // Store the query for calculation transparency if needed
    const pipQuery = `
      SELECT
        # Funding partners
        SUM(CASE WHEN pip.question_id = ? THEN CAST(pip.answer AS UNSIGNED) ELSE 0 END) as funding_partners,
        
        # Implementation partners
        SUM(CASE WHEN pip.question_id = ? THEN CAST(pip.answer AS UNSIGNED) ELSE 0 END) as implementation_partners,
        
        # Technical partners
        SUM(CASE WHEN pip.question_id = ? THEN CAST(pip.answer AS UNSIGNED) ELSE 0 END) as technical_partners,
        
        # Advocacy partners
        SUM(CASE WHEN pip.question_id = ? THEN CAST(pip.answer AS UNSIGNED) ELSE 0 END) as advocacy_partners,
        
        # Research partners
        SUM(CASE WHEN pip.question_id = ? THEN CAST(pip.answer AS UNSIGNED) ELSE 0 END) as research_partners,
        
        # Count of responses
        COUNT(DISTINCT pip.id) as total_responses
      FROM right_to_play_pip_responses pip
      WHERE pip.deleted_at IS NULL AND pip.itinerary_id = ?
    `;
    
    if (calculationDetails) {
      calculationDetails.queries.partnersInPlayIndicators = {
        query: pipQuery,
        params: [
          PIP_QUESTION_MAPPINGS.fundingPartnersQuestion,
          PIP_QUESTION_MAPPINGS.implementationPartnersQuestion,
          PIP_QUESTION_MAPPINGS.technicalPartnersQuestion,
          PIP_QUESTION_MAPPINGS.advocacyPartnersQuestion,
          PIP_QUESTION_MAPPINGS.researchPartnersQuestion,
          itineraryId
        ],
        dataSource: 'right_to_play_pip_responses'
      };
    }
    
    // Query the partners in play responses table
    const [pipData] = await connection.execute(`
      SELECT
        # Funding partners
        SUM(CASE WHEN pip.question_id = ? THEN CAST(pip.answer AS UNSIGNED) ELSE 0 END) as funding_partners,
        
        # Implementation partners
        SUM(CASE WHEN pip.question_id = ? THEN CAST(pip.answer AS UNSIGNED) ELSE 0 END) as implementation_partners,
        
        # Technical partners
        SUM(CASE WHEN pip.question_id = ? THEN CAST(pip.answer AS UNSIGNED) ELSE 0 END) as technical_partners,
        
        # Advocacy partners
        SUM(CASE WHEN pip.question_id = ? THEN CAST(pip.answer AS UNSIGNED) ELSE 0 END) as advocacy_partners,
        
        # Research partners
        SUM(CASE WHEN pip.question_id = ? THEN CAST(pip.answer AS UNSIGNED) ELSE 0 END) as research_partners,
        
        # Count of responses
        COUNT(DISTINCT pip.id) as total_responses
      FROM right_to_play_pip_responses pip
      WHERE pip.deleted_at IS NULL AND pip.itinerary_id = ?
    `, [
      PIP_QUESTION_MAPPINGS.fundingPartnersQuestion,
      PIP_QUESTION_MAPPINGS.implementationPartnersQuestion,
      PIP_QUESTION_MAPPINGS.technicalPartnersQuestion,
      PIP_QUESTION_MAPPINGS.advocacyPartnersQuestion,
      PIP_QUESTION_MAPPINGS.researchPartnersQuestion,
      itineraryId
    ]);
    
    const totals = pipData[0] || {};
    const fundingPartners = parseInt(totals.funding_partners || 0);
    const implementationPartners = parseInt(totals.implementation_partners || 0);
    const technicalPartners = parseInt(totals.technical_partners || 0);
    const advocacyPartners = parseInt(totals.advocacy_partners || 0);
    const researchPartners = parseInt(totals.research_partners || 0);
    const totalPartners = fundingPartners + implementationPartners + technicalPartners + advocacyPartners + researchPartners;
    
    // Format the results
    return {
      fundingPartners,
      implementationPartners,
      technicalPartners,
      advocacyPartners,
      researchPartners,
      totalPartners,
      partnerDistribution: {
        funding: totalPartners > 0 ? Math.round((fundingPartners / totalPartners) * 100) : 0,
        implementation: totalPartners > 0 ? Math.round((implementationPartners / totalPartners) * 100) : 0,
        technical: totalPartners > 0 ? Math.round((technicalPartners / totalPartners) * 100) : 0,
        advocacy: totalPartners > 0 ? Math.round((advocacyPartners / totalPartners) * 100) : 0,
        research: totalPartners > 0 ? Math.round((researchPartners / totalPartners) * 100) : 0
      },
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
      partnerDistribution: {
        funding: 0,
        implementation: 0,
        technical: 0,
        advocacy: 0,
        research: 0
      },
      totalResponses: 0
    };
  }
}