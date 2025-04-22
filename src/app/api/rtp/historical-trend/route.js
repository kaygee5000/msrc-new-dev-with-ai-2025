import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getConnectionConfig } from '@/utils/db';

/**
 * Get historical data for outcome indicators across different itineraries
 * 
 * @param {Object} req - The request object
 * @returns {NextResponse} - The response with historical data
 */
export async function GET(req) {
  try {
    // Extract parameters from the request URL
    const url = new URL(req.url);
    const indicatorType = url.searchParams.get('indicatorType');
    const limit = parseInt(url.searchParams.get('limit') || '5');
    
    if (!indicatorType) {
      return NextResponse.json(
        { error: 'Missing required parameter: indicatorType' },
        { status: 400 }
      );
    }

    // Create database connection
    const connection = await mysql.createConnection(getConnectionConfig());

    try {
      // Get the last N itineraries
      const [itineraries] = await connection.execute(`
        SELECT 
          id AS itinerary_id, 
          title AS itinerary_name,
          start_date,
          end_date
        FROM 
          right_to_play_itineraries
        WHERE 
          deleted_at IS NULL
        ORDER BY 
          start_date DESC
        LIMIT ?
      `, [limit]);

      // Calculate indicator values for each itinerary based on indicator type
      const historicalData = await Promise.all(itineraries.map(async (itinerary) => {
        const itineraryData = {
          itineraryId: itinerary.itinerary_id,
          itineraryName: itinerary.itinerary_name,
          startDate: itinerary.start_date,
          endDate: itinerary.end_date
        };

        switch (indicatorType) {
          case 'implementationPlans':
            Object.assign(itineraryData, await calculateImplementationPlans(connection, itinerary.itinerary_id));
            break;
          case 'developmentPlans':
            Object.assign(itineraryData, await calculateDevelopmentPlans(connection, itinerary.itinerary_id));
            break;
          case 'lessonPlans':
            Object.assign(itineraryData, await calculateLessonPlans(connection, itinerary.itinerary_id));
            break;
          case 'learningEnvironments':
            Object.assign(itineraryData, await calculateLearningEnvironments(connection, itinerary.itinerary_id));
            break;
          case 'teacherSkills':
            Object.assign(itineraryData, await calculateTeacherSkills(connection, itinerary.itinerary_id));
            break;
          case 'enrollment':
            Object.assign(itineraryData, await calculateEnrollment(connection, itinerary.itinerary_id));
            break;
          case 'schoolsReached':
            Object.assign(itineraryData, await calculateSchoolsReached(connection, itinerary.itinerary_id));
            break;
          default:
            // Default to empty values if indicator type not recognized
            Object.assign(itineraryData, { percentage: 0, count: 0, total: 0 });
        }

        return itineraryData;
      }));

      // Sort by start date ascending (oldest first) for proper trend visualization
      historicalData.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      return NextResponse.json(historicalData);
    } finally {
      // Always close the connection
      await connection.end();
    }
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}

/**
 * Calculate schools with implementation plans for an itinerary
 */
async function calculateImplementationPlans(connection, itineraryId) {
  // Get schools with implementation plans (YES responses to Q17)
  const [result] = await connection.execute(`
    SELECT 
      COUNT(DISTINCT CASE WHEN cca.answer_value = 'Yes' THEN ccr.school_id END) AS schools_with_plans,
      COUNT(DISTINCT ccr.school_id) AS total_schools
    FROM 
      right_to_play_consolidated_checklist_responses ccr
    LEFT JOIN 
      right_to_play_consolidated_checklist_answers cca ON 
        cca.response_id = ccr.id AND cca.question_id = 17
    WHERE 
      ccr.itinerary_id = ?
      AND ccr.deleted_at IS NULL
  `, [itineraryId]);

  const schoolsWithPlans = result[0].schools_with_plans || 0;
  const totalSchools = result[0].total_schools || 0;
  const percentage = totalSchools > 0 ? (schoolsWithPlans / totalSchools) * 100 : 0;

  return {
    percentage: parseFloat(percentage.toFixed(2)),
    schoolsWithPlans,
    totalSchools
  };
}

/**
 * Calculate schools with LtP development plans for an itinerary
 */
async function calculateDevelopmentPlans(connection, itineraryId) {
  // Get schools with uploaded development plans (uploaded files for Q18)
  const [result] = await connection.execute(`
    SELECT 
      COUNT(DISTINCT CASE WHEN cca.upload_file_path IS NOT NULL THEN ccr.school_id END) AS schools_with_uploads,
      COUNT(DISTINCT ccr.school_id) AS total_schools
    FROM 
      right_to_play_consolidated_checklist_responses ccr
    LEFT JOIN 
      right_to_play_consolidated_checklist_answers cca ON 
        cca.response_id = ccr.id AND cca.question_id = 18
    WHERE 
      ccr.itinerary_id = ?
      AND ccr.deleted_at IS NULL
  `, [itineraryId]);

  const schoolsWithUploads = result[0].schools_with_uploads || 0;
  const totalSchools = result[0].total_schools || 0;
  const percentage = totalSchools > 0 ? (schoolsWithUploads / totalSchools) * 100 : 0;

  return {
    percentage: parseFloat(percentage.toFixed(2)),
    schoolsWithUploads,
    totalSchools
  };
}

/**
 * Calculate teachers with LtP lesson plans for an itinerary
 */
async function calculateLessonPlans(connection, itineraryId) {
  // Get teachers with LtP lesson plans (YES responses to Q19)
  const [result] = await connection.execute(`
    SELECT 
      COUNT(DISTINCT CASE WHEN cca.answer_value = 'Yes' THEN ccr.teacher_id END) AS teachers_with_plans,
      COUNT(DISTINCT ccr.teacher_id) AS total_teachers
    FROM 
      right_to_play_consolidated_checklist_responses ccr
    LEFT JOIN 
      right_to_play_consolidated_checklist_answers cca ON 
        cca.response_id = ccr.id AND cca.question_id = 19
    WHERE 
      ccr.itinerary_id = ?
      AND ccr.deleted_at IS NULL
      AND ccr.teacher_id IS NOT NULL
  `, [itineraryId]);

  const teachersWithPlans = result[0].teachers_with_plans || 0;
  const totalTeachers = result[0].total_teachers || 0;
  const percentage = totalTeachers > 0 ? (teachersWithPlans / totalTeachers) * 100 : 0;

  return {
    percentage: parseFloat(percentage.toFixed(2)),
    teachersWithPlans,
    totalTeachers
  };
}

/**
 * Calculate learning environments with LtP methods for an itinerary
 */
async function calculateLearningEnvironments(connection, itineraryId) {
  // Get PiP responses for the itinerary
  const [responses] = await connection.execute(`
    SELECT 
      id,
      friendly_tone_score,
      acknowledging_effort_score,
      pupil_participation_score,
      learning_environment_score
    FROM 
      right_to_play_pip_responses
    WHERE 
      itinerary_id = ?
      AND deleted_at IS NULL
  `, [itineraryId]);

  // Calculate weighted scores and count environments with LtP methods
  let environmentsWithLtP = 0;
  let totalEnvironments = responses.length;
  let totalScore = 0;

  for (const response of responses) {
    const toneScore = response.friendly_tone_score || 0;
    const effortScore = response.acknowledging_effort_score || 0;
    const participationScore = response.pupil_participation_score || 0;
    
    // If scores are already calculated in the database, use them
    let weightedScore = response.learning_environment_score || 0;
    
    // Otherwise calculate manually (fallback)
    if (weightedScore === 0) {
      weightedScore = (toneScore * 0.3) + (effortScore * 0.3) + (participationScore * 0.4);
    }
    
    totalScore += weightedScore;
    
    // Environment uses LtP methods if score is above threshold (3.5)
    if (weightedScore >= 3.5) {
      environmentsWithLtP++;
    }
  }

  const percentage = totalEnvironments > 0 ? (environmentsWithLtP / totalEnvironments) * 100 : 0;
  const averageScore = totalEnvironments > 0 ? totalScore / totalEnvironments : 0;

  return {
    percentage: parseFloat(percentage.toFixed(2)),
    environmentsWithLtP,
    totalEnvironments,
    averageScore: parseFloat(averageScore.toFixed(2))
  };
}

/**
 * Calculate teachers with LtP facilitation skills for an itinerary
 */
async function calculateTeacherSkills(connection, itineraryId) {
  // Get PiP responses for the itinerary
  const [responses] = await connection.execute(`
    SELECT 
      id,
      ltp_skills_score
    FROM 
      right_to_play_pip_responses
    WHERE 
      itinerary_id = ?
      AND deleted_at IS NULL
  `, [itineraryId]);

  // Count teachers with LtP skills
  let teachersWithSkills = 0;
  let totalTeachers = responses.length;
  let totalScore = 0;

  for (const response of responses) {
    const skillsScore = response.ltp_skills_score || 0;
    totalScore += skillsScore;
    
    // Teacher has LtP skills if score is above threshold (3.5)
    if (skillsScore >= 3.5) {
      teachersWithSkills++;
    }
  }

  const percentage = totalTeachers > 0 ? (teachersWithSkills / totalTeachers) * 100 : 0;
  const averageScore = totalTeachers > 0 ? totalScore / totalTeachers : 0;

  return {
    percentage: parseFloat(percentage.toFixed(2)),
    teachersWithSkills,
    totalTeachers,
    averageScore: parseFloat(averageScore.toFixed(2))
  };
}

/**
 * Calculate total primary enrollment for an itinerary
 */
async function calculateEnrollment(connection, itineraryId) {
  // Get total enrollment from school output indicators (Q12 for boys, Q13 for girls)
  const [result] = await connection.execute(`
    SELECT 
      SUM(CASE WHEN sra.question_id = 12 THEN CAST(sra.answer_value AS UNSIGNED) ELSE 0 END) AS boys_enrollment,
      SUM(CASE WHEN sra.question_id = 13 THEN CAST(sra.answer_value AS UNSIGNED) ELSE 0 END) AS girls_enrollment,
      COUNT(DISTINCT sr.school_id) AS school_count
    FROM 
      right_to_play_school_responses sr
    JOIN 
      right_to_play_school_response_answers sra ON sra.response_id = sr.id
    WHERE 
      sr.itinerary_id = ?
      AND sr.deleted_at IS NULL
      AND sra.question_id IN (12, 13)
  `, [itineraryId]);

  const boysEnrollment = parseInt(result[0].boys_enrollment) || 0;
  const girlsEnrollment = parseInt(result[0].girls_enrollment) || 0;
  const totalEnrollment = boysEnrollment + girlsEnrollment;
  const schoolCount = result[0].school_count || 0;

  return {
    totalEnrollment,
    boysEnrollment,
    girlsEnrollment,
    schoolCount
  };
}

/**
 * Calculate schools reached for an itinerary
 */
async function calculateSchoolsReached(connection, itineraryId) {
  // Count unique schools with any submission
  const [result] = await connection.execute(`
    SELECT 
      COUNT(DISTINCT school_id) AS schools_reached
    FROM (
      SELECT school_id FROM right_to_play_school_responses
      WHERE itinerary_id = ? AND deleted_at IS NULL
      
      UNION
      
      SELECT school_id FROM right_to_play_consolidated_checklist_responses
      WHERE itinerary_id = ? AND deleted_at IS NULL
      
      UNION
      
      SELECT school_id FROM right_to_play_pip_responses
      WHERE itinerary_id = ? AND deleted_at IS NULL
    ) AS all_schools
  `, [itineraryId, itineraryId, itineraryId]);

  const schoolsReached = result[0].schools_reached || 0;

  return {
    schoolsReached
  };
}