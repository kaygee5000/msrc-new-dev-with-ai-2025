import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getConnectionConfig } from '@/utils/db';

/**
 * Get district-level breakdown of outcome indicators for comparison
 * 
 * @param {Object} req - The request object
 * @returns {NextResponse} - The response with district-level breakdown
 */
export async function GET(req) {
  try {
    // Extract parameters from the request URL
    const url = new URL(req.url);
    const itineraryId = url.searchParams.get('itineraryId');
    const indicatorType = url.searchParams.get('indicatorType');
    
    if (!itineraryId || !indicatorType) {
      return NextResponse.json(
        { error: 'Missing required parameters: itineraryId and indicatorType' },
        { status: 400 }
      );
    }

    // Create database connection
    const connection = await mysql.createConnection(getConnectionConfig());

    try {
      let districtBreakdown = [];
      
      // Get list of districts that have schools with responses
      const [districts] = await connection.execute(`
        SELECT DISTINCT 
          d.id AS district_id, 
          d.name AS district_name,
          r.name AS region_name
        FROM 
          districts d
        JOIN 
          schools s ON s.district_id = d.id
        JOIN 
          right_to_play_school_responses sr ON sr.school_id = s.id
        JOIN 
          regions r ON d.region_id = r.id
        WHERE 
          sr.itinerary_id = ?
          AND sr.deleted_at IS NULL
        ORDER BY 
          r.name, d.name
      `, [itineraryId]);

      // Calculate indicator values for each district based on indicator type
      districtBreakdown = await Promise.all(districts.map(async (district) => {
        const districtData = {
          districtId: district.district_id,
          districtName: district.district_name,
          regionName: district.region_name
        };

        switch (indicatorType) {
          case 'implementationPlans':
            Object.assign(districtData, await calculateImplementationPlans(connection, itineraryId, district.district_id));
            break;
          case 'developmentPlans':
            Object.assign(districtData, await calculateDevelopmentPlans(connection, itineraryId, district.district_id));
            break;
          case 'lessonPlans':
            Object.assign(districtData, await calculateLessonPlans(connection, itineraryId, district.district_id));
            break;
          case 'learningEnvironments':
            Object.assign(districtData, await calculateLearningEnvironments(connection, itineraryId, district.district_id));
            break;
          case 'teacherSkills':
            Object.assign(districtData, await calculateTeacherSkills(connection, itineraryId, district.district_id));
            break;
          case 'enrollment':
            Object.assign(districtData, await calculateEnrollment(connection, itineraryId, district.district_id));
            break;
          case 'schoolsReached':
            Object.assign(districtData, await calculateSchoolsReached(connection, itineraryId, district.district_id));
            break;
          default:
            // Default to empty values if indicator type not recognized
            Object.assign(districtData, { percentage: 0, count: 0, total: 0 });
        }

        return districtData;
      }));

      return NextResponse.json(districtBreakdown);
    } finally {
      // Always close the connection
      await connection.end();
    }
  } catch (error) {
    console.error('Error fetching district breakdown:', error);
    return NextResponse.json(
      { error: 'Failed to fetch district breakdown' },
      { status: 500 }
    );
  }
}

/**
 * Calculate schools with implementation plans for a district
 */
async function calculateImplementationPlans(connection, itineraryId, districtId) {
  // Get schools with implementation plans (YES responses to Q17)
  const [result] = await connection.execute(`
    SELECT 
      COUNT(DISTINCT CASE WHEN cca.answer_value = 'Yes' THEN ccr.school_id END) AS schools_with_plans,
      COUNT(DISTINCT ccr.school_id) AS total_schools
    FROM 
      right_to_play_consolidated_checklist_responses ccr
    JOIN 
      schools s ON ccr.school_id = s.id
    LEFT JOIN 
      right_to_play_consolidated_checklist_answers cca ON 
        cca.response_id = ccr.id AND cca.question_id = 17
    WHERE 
      ccr.itinerary_id = ?
      AND s.district_id = ?
      AND ccr.deleted_at IS NULL
  `, [itineraryId, districtId]);

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
 * Calculate schools with LtP development plans for a district
 */
async function calculateDevelopmentPlans(connection, itineraryId, districtId) {
  // Get schools with uploaded development plans (uploaded files for Q18)
  const [result] = await connection.execute(`
    SELECT 
      COUNT(DISTINCT CASE WHEN cca.upload_file_path IS NOT NULL THEN ccr.school_id END) AS schools_with_uploads,
      COUNT(DISTINCT ccr.school_id) AS total_schools
    FROM 
      right_to_play_consolidated_checklist_responses ccr
    JOIN 
      schools s ON ccr.school_id = s.id
    LEFT JOIN 
      right_to_play_consolidated_checklist_answers cca ON 
        cca.response_id = ccr.id AND cca.question_id = 18
    WHERE 
      ccr.itinerary_id = ?
      AND s.district_id = ?
      AND ccr.deleted_at IS NULL
  `, [itineraryId, districtId]);

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
 * Calculate teachers with LtP lesson plans for a district
 */
async function calculateLessonPlans(connection, itineraryId, districtId) {
  // Get teachers with LtP lesson plans (YES responses to Q19)
  const [result] = await connection.execute(`
    SELECT 
      COUNT(DISTINCT CASE WHEN cca.answer_value = 'Yes' THEN ccr.teacher_id END) AS teachers_with_plans,
      COUNT(DISTINCT ccr.teacher_id) AS total_teachers
    FROM 
      right_to_play_consolidated_checklist_responses ccr
    JOIN 
      schools s ON ccr.school_id = s.id
    LEFT JOIN 
      right_to_play_consolidated_checklist_answers cca ON 
        cca.response_id = ccr.id AND cca.question_id = 19
    WHERE 
      ccr.itinerary_id = ?
      AND s.district_id = ?
      AND ccr.deleted_at IS NULL
      AND ccr.teacher_id IS NOT NULL
  `, [itineraryId, districtId]);

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
 * Calculate learning environments with LtP methods for a district
 */
async function calculateLearningEnvironments(connection, itineraryId, districtId) {
  // Get PiP responses for schools in the district
  const [responses] = await connection.execute(`
    SELECT 
      pip.id,
      pip.friendly_tone_score,
      pip.acknowledging_effort_score,
      pip.pupil_participation_score,
      pip.learning_environment_score
    FROM 
      right_to_play_pip_responses pip
    JOIN 
      schools s ON pip.school_id = s.id
    WHERE 
      pip.itinerary_id = ?
      AND s.district_id = ?
      AND pip.deleted_at IS NULL
  `, [itineraryId, districtId]);

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
 * Calculate teachers with LtP facilitation skills for a district
 */
async function calculateTeacherSkills(connection, itineraryId, districtId) {
  // Get PiP responses for schools in the district
  const [responses] = await connection.execute(`
    SELECT 
      pip.id,
      pip.ltp_skills_score
    FROM 
      right_to_play_pip_responses pip
    JOIN 
      schools s ON pip.school_id = s.id
    WHERE 
      pip.itinerary_id = ?
      AND s.district_id = ?
      AND pip.deleted_at IS NULL
  `, [itineraryId, districtId]);

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
 * Calculate total primary enrollment for a district
 */
async function calculateEnrollment(connection, itineraryId, districtId) {
  // Get total enrollment from school output indicators (Q12 for boys, Q13 for girls)
  const [result] = await connection.execute(`
    SELECT 
      SUM(CASE WHEN sra.question_id = 12 THEN CAST(sra.answer_value AS UNSIGNED) ELSE 0 END) AS boys_enrollment,
      SUM(CASE WHEN sra.question_id = 13 THEN CAST(sra.answer_value AS UNSIGNED) ELSE 0 END) AS girls_enrollment,
      COUNT(DISTINCT sr.school_id) AS school_count
    FROM 
      right_to_play_school_responses sr
    JOIN 
      schools s ON sr.school_id = s.id
    JOIN 
      right_to_play_school_response_answers sra ON sra.response_id = sr.id
    WHERE 
      sr.itinerary_id = ?
      AND s.district_id = ?
      AND sr.deleted_at IS NULL
      AND sra.question_id IN (12, 13)
  `, [itineraryId, districtId]);

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
 * Calculate schools reached for a district
 */
async function calculateSchoolsReached(connection, itineraryId, districtId) {
  // Count unique schools with any submission
  const [result] = await connection.execute(`
    SELECT 
      COUNT(DISTINCT school_id) AS schools_reached
    FROM (
      SELECT sr.school_id FROM right_to_play_school_responses sr
      JOIN schools s ON sr.school_id = s.id
      WHERE sr.itinerary_id = ? AND s.district_id = ? AND sr.deleted_at IS NULL
      
      UNION
      
      SELECT ccr.school_id FROM right_to_play_consolidated_checklist_responses ccr
      JOIN schools s ON ccr.school_id = s.id
      WHERE ccr.itinerary_id = ? AND s.district_id = ? AND ccr.deleted_at IS NULL
      
      UNION
      
      SELECT pip.school_id FROM right_to_play_pip_responses pip
      JOIN schools s ON pip.school_id = s.id
      WHERE pip.itinerary_id = ? AND s.district_id = ? AND pip.deleted_at IS NULL
    ) AS all_schools
  `, [itineraryId, districtId, itineraryId, districtId, itineraryId, districtId]);

  const schoolsReached = result[0].schools_reached || 0;

  return {
    schoolsReached
  };
}