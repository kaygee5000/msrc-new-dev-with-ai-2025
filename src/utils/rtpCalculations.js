/**
 * Utility functions for Right to Play (RTP) outcome indicator calculations
 */

/**
 * Calculate percentage of schools with implementation plans
 * Source: Consolidated Checklist Q17
 * Formula: (Number of YES responses / Total responses) × 100
 * 
 * @param {Array} responses - Array of consolidated checklist responses
 * @param {Number} questionId - The ID of Q17 about implementation plans
 * @returns {Object} - Calculation results with percentage and counts
 */
export async function calculateSchoolsWithImplementationPlans(responses, questionId) {
  if (!responses || !responses.length) {
    return {
      percentage: 0,
      schoolsWithPlans: 0,
      totalSchools: 0
    };
  }

  // Count schools with implementation plans (YES responses)
  const schoolsWithPlans = responses.filter(response => {
    const answer = response.answers.find(a => a.question_id === questionId);
    return answer && answer.answer_value.toLowerCase() === 'yes';
  }).length;

  const totalSchools = responses.length;
  const percentage = totalSchools > 0 ? (schoolsWithPlans / totalSchools) * 100 : 0;

  return {
    percentage: parseFloat(percentage.toFixed(2)),
    schoolsWithPlans,
    totalSchools
  };
}

/**
 * Calculate percentage of schools with LtP development plans
 * Source: Consolidated Checklist Q18 (with file upload)
 * Formula: (Number of uploads / Total responses) × 100
 * 
 * @param {Array} responses - Array of consolidated checklist responses
 * @param {Number} questionId - The ID of Q18 about development plans
 * @returns {Object} - Calculation results with percentage and counts
 */
export async function calculateSchoolsWithLtPDevelopmentPlans(responses, questionId) {
  if (!responses || !responses.length) {
    return {
      percentage: 0,
      schoolsWithUploads: 0,
      totalSchools: 0
    };
  }

  // Count schools with uploaded development plans
  const schoolsWithUploads = responses.filter(response => {
    const answer = response.answers.find(a => a.question_id === questionId);
    return answer && answer.upload_file_path;
  }).length;

  const totalSchools = responses.length;
  const percentage = totalSchools > 0 ? (schoolsWithUploads / totalSchools) * 100 : 0;

  return {
    percentage: parseFloat(percentage.toFixed(2)),
    schoolsWithUploads,
    totalSchools
  };
}

/**
 * Calculate percentage of teachers with LtP lesson plans
 * Source: Consolidated Checklist Q19
 * Formula: (Number of YES responses / Total responses) × 100
 * 
 * @param {Array} responses - Array of consolidated checklist responses
 * @param {Number} questionId - The ID of Q19 about lesson plans
 * @returns {Object} - Calculation results with percentage and counts
 */
export async function calculateTeachersWithLtPLessonPlans(responses, questionId) {
  if (!responses || !responses.length) {
    return {
      percentage: 0,
      teachersWithLtPPlans: 0,
      totalTeachers: 0
    };
  }

  // Count teachers with LtP lesson plans (YES responses)
  const teachersWithLtPPlans = responses.filter(response => {
    const answer = response.answers.find(a => a.question_id === questionId);
    return answer && answer.answer_value.toLowerCase() === 'yes';
  }).length;

  const totalTeachers = responses.length;
  const percentage = totalTeachers > 0 ? (teachersWithLtPPlans / totalTeachers) * 100 : 0;

  return {
    percentage: parseFloat(percentage.toFixed(2)),
    teachersWithLtPPlans,
    totalTeachers
  };
}

/**
 * Calculate percentage of learning environments with LtP methods
 * Sources: Partners in Play Q43, Q44, Q45
 * Scoring:
 *   - Q43 (friendly tone): Frequently=5, Sometimes=4, Only boys/girls=3, Not at all=0
 *   - Q44 (acknowledging effort): Frequently=5, Sometimes=4, Only boys/girls=3, Not at all=0
 *   - Q45 (pupil participation): Rated 1-5 as specified
 * Formula: Calculate weighted average score, compare to threshold
 * 
 * @param {Array} pipResponses - Array of Partners in Play responses
 * @param {Object} questionIds - Object with IDs for Q43, Q44, Q45
 * @param {Number} threshold - Threshold score to qualify as "using LtP methods"
 * @returns {Object} - Calculation results with percentage and counts
 */
export async function calculateLearningEnvironmentsWithLtPMethods(pipResponses, questionIds, threshold = 3.5) {
  if (!pipResponses || !pipResponses.length) {
    return {
      percentage: 0,
      environmentsWithLtP: 0,
      totalEnvironments: 0,
      averageScore: 0,
      detailedScores: []
    };
  }

  // Define scoring mappings for Q43 and Q44
  const toneScoring = {
    'frequently': 5,
    'sometimes': 4,
    'only boys': 3,
    'only girls': 3,
    'not at all': 0
  };

  const effortScoring = {
    'frequently': 5,
    'sometimes': 4,
    'only boys': 3,
    'only girls': 3,
    'not at all': 0
  };

  // Calculate scores for each learning environment
  const scores = pipResponses.map(response => {
    // Find answers for each question
    const toneAnswer = response.answers.find(a => a.question_id === questionIds.q43);
    const effortAnswer = response.answers.find(a => a.question_id === questionIds.q44);
    const participationAnswer = response.answers.find(a => a.question_id === questionIds.q45);

    // Calculate scores using the provided weightings
    const toneScore = toneAnswer ? (toneScoring[toneAnswer.answer_value.toLowerCase()] || 0) : 0;
    const effortScore = effortAnswer ? (effortScoring[effortAnswer.answer_value.toLowerCase()] || 0) : 0;
    const participationScore = participationAnswer ? parseFloat(participationAnswer.answer_value) || 0 : 0;

    // Calculate weighted score: 30% tone, 30% effort, 40% participation
    const weightedScore = (toneScore * 0.3) + (effortScore * 0.3) + (participationScore * 0.4);

    return {
      responseId: response.id,
      schoolId: response.school_id,
      schoolName: response.school_name || 'Unknown',
      teacherId: response.teacher_id,
      teacherName: response.teacher_name || 'Unknown',
      toneScore,
      effortScore,
      participationScore,
      weightedScore: parseFloat(weightedScore.toFixed(2)),
      usesLtPMethods: weightedScore >= threshold
    };
  });

  // Count environments using LtP methods (score above threshold)
  const environmentsWithLtP = scores.filter(score => score.usesLtPMethods).length;
  const totalEnvironments = scores.length;
  const percentage = totalEnvironments > 0 ? (environmentsWithLtP / totalEnvironments) * 100 : 0;
  
  // Calculate average score across all environments
  const totalScore = scores.reduce((sum, score) => sum + score.weightedScore, 0);
  const averageScore = totalEnvironments > 0 ? totalScore / totalEnvironments : 0;

  return {
    percentage: parseFloat(percentage.toFixed(2)),
    environmentsWithLtP,
    totalEnvironments,
    averageScore: parseFloat(averageScore.toFixed(2)),
    detailedScores: scores
  };
}

/**
 * Calculate percentage of teachers with LtP skills
 * Sources: Partners in Play Q29, Q30, Q31, Q32, Q33, Q39, Q45, Q46, Q48, Q49
 * Scoring: As specified in documentation for each question
 * Formula: Calculate weighted average score, compare to threshold
 * 
 * @param {Array} pipResponses - Array of Partners in Play responses
 * @param {Object} questionIds - Object with IDs for the required questions
 * @param {Number} threshold - Threshold score to qualify as "having LtP skills"
 * @returns {Object} - Calculation results with percentage and counts
 */
export async function calculateTeachersWithLtPSkills(pipResponses, questionIds, threshold = 3.5) {
  if (!pipResponses || !pipResponses.length) {
    return {
      percentage: 0,
      teachersWithSkills: 0,
      totalTeachers: 0,
      averageScore: 0,
      detailedScores: []
    };
  }

  // Calculate scores for each teacher
  const scores = pipResponses.map(response => {
    // Extract scores for each question (either from the score field or answer_value)
    const questionScores = Object.keys(questionIds).map(key => {
      const questionId = questionIds[key];
      const answer = response.answers.find(a => a.question_id === questionId);
      
      if (!answer) return 0;
      
      // Use the score field if available, otherwise try to parse the answer_value
      return answer.score ? parseFloat(answer.score) : parseFloat(answer.answer_value) || 0;
    });
    
    // Calculate average score across all questions (equal weighting)
    const totalScore = questionScores.reduce((sum, score) => sum + score, 0);
    const avgScore = questionScores.length > 0 ? totalScore / questionScores.length : 0;
    
    return {
      responseId: response.id,
      schoolId: response.school_id,
      schoolName: response.school_name || 'Unknown',
      teacherId: response.teacher_id,
      teacherName: response.teacher_name || 'Unknown',
      questionScores,
      avgScore: parseFloat(avgScore.toFixed(2)),
      hasLtPSkills: avgScore >= threshold
    };
  });

  // Count teachers with LtP skills (score above threshold)
  const teachersWithSkills = scores.filter(score => score.hasLtPSkills).length;
  const totalTeachers = scores.length;
  const percentage = totalTeachers > 0 ? (teachersWithSkills / totalTeachers) * 100 : 0;
  
  // Calculate average score across all teachers
  const totalScore = scores.reduce((sum, score) => sum + score.avgScore, 0);
  const averageScore = totalTeachers > 0 ? totalScore / totalTeachers : 0;

  return {
    percentage: parseFloat(percentage.toFixed(2)),
    teachersWithSkills,
    totalTeachers,
    averageScore: parseFloat(averageScore.toFixed(2)),
    detailedScores: scores
  };
}

/**
 * Calculate total primary school enrollment (from School Output Indicators)
 * Sources: School output indicators Q12 (boys enrolled), Q13 (girls enrolled)
 * 
 * @param {Array} schoolResponses - Array of school output responses
 * @param {Object} questionIds - Object with IDs for Q12 and Q13
 * @returns {Object} - Calculation results with totals and breakdown
 */
export async function calculateTotalPrimaryEnrollment(schoolResponses, questionIds) {
  if (!schoolResponses || !schoolResponses.length) {
    return {
      totalEnrollment: 0,
      boysEnrollment: 0,
      girlsEnrollment: 0,
      schoolCount: 0
    };
  }

  let boysEnrollment = 0;
  let girlsEnrollment = 0;

  // Calculate total enrollment from all schools
  schoolResponses.forEach(response => {
    const boysAnswer = response.answers.find(a => a.question_id === questionIds.boysEnrolled);
    const girlsAnswer = response.answers.find(a => a.question_id === questionIds.girlsEnrolled);
    
    // Add to totals (convert to number, default to 0 if not valid)
    boysEnrollment += boysAnswer ? (parseInt(boysAnswer.answer_value) || 0) : 0;
    girlsEnrollment += girlsAnswer ? (parseInt(girlsAnswer.answer_value) || 0) : 0;
  });

  return {
    totalEnrollment: boysEnrollment + girlsEnrollment,
    boysEnrollment,
    girlsEnrollment,
    schoolCount: schoolResponses.length
  };
}

/**
 * Calculate the number of schools reached (count of unique schools with any submission)
 * 
 * @param {Array} schoolResponses - Array of school output responses
 * @param {Array} consolidatedResponses - Array of consolidated checklist responses
 * @param {Array} pipResponses - Array of partners in play responses
 * @returns {Object} - Calculation results with counts
 */
export async function calculateSchoolsReached(schoolResponses = [], consolidatedResponses = [], pipResponses = []) {
  // Get unique school IDs from all response types
  const schoolIds = new Set();
  
  schoolResponses.forEach(response => {
    if (response.school_id) schoolIds.add(response.school_id);
  });
  
  consolidatedResponses.forEach(response => {
    if (response.school_id) schoolIds.add(response.school_id);
  });
  
  pipResponses.forEach(response => {
    if (response.school_id) schoolIds.add(response.school_id);
  });

  return {
    schoolsReached: schoolIds.size
  };
}

/**
 * Calculate all outcome indicators for a given itinerary or time period
 * 
 * @param {Number} itineraryId - The itinerary ID to calculate indicators for
 * @param {Object} questionMappings - Mapping of question descriptions to IDs
 * @returns {Object} - Complete set of calculated outcome indicators
 */
export async function calculateAllOutcomeIndicators(itineraryId, questionMappings) {
  try {
    // Fetch all necessary data
    const schoolResponses = await fetchSchoolResponses(itineraryId);
    const consolidatedResponses = await fetchConsolidatedChecklistResponses(itineraryId);
    const pipResponses = await fetchPartnersInPlayResponses(itineraryId);

    // Calculate each indicator
    const implementationPlans = await calculateSchoolsWithImplementationPlans(
      consolidatedResponses, 
      questionMappings.implementationPlanQuestion
    );
    
    const developmentPlans = await calculateSchoolsWithLtPDevelopmentPlans(
      consolidatedResponses, 
      questionMappings.developmentPlanQuestion
    );
    
    const lessonPlans = await calculateTeachersWithLtPLessonPlans(
      consolidatedResponses, 
      questionMappings.lessonPlanQuestion
    );
    
    const learningEnvironments = await calculateLearningEnvironmentsWithLtPMethods(
      pipResponses, 
      {
        q43: questionMappings.friendlyToneQuestion,
        q44: questionMappings.acknowledgingEffortQuestion,
        q45: questionMappings.pupilParticipationQuestion
      }
    );
    
    const teacherSkills = await calculateTeachersWithLtPSkills(
      pipResponses, 
      {
        q29: questionMappings.teacherSkillQ29,
        q30: questionMappings.teacherSkillQ30,
        q31: questionMappings.teacherSkillQ31,
        q32: questionMappings.teacherSkillQ32,
        q33: questionMappings.teacherSkillQ33,
        q39: questionMappings.teacherSkillQ39,
        q45: questionMappings.teacherSkillQ45,
        q46: questionMappings.teacherSkillQ46,
        q48: questionMappings.teacherSkillQ48,
        q49: questionMappings.teacherSkillQ49
      }
    );
    
    const enrollment = await calculateTotalPrimaryEnrollment(
      schoolResponses, 
      {
        boysEnrolled: questionMappings.boysEnrolledQuestion,
        girlsEnrolled: questionMappings.girlsEnrolledQuestion
      }
    );
    
    const schoolsReached = await calculateSchoolsReached(
      schoolResponses,
      consolidatedResponses,
      pipResponses
    );

    // Combine all indicators into a single results object
    return {
      itineraryId,
      implementationPlans,
      developmentPlans,
      lessonPlans,
      learningEnvironments,
      teacherSkills,
      enrollment,
      schoolsReached
    };
  } catch (error) {
    console.error('Error calculating outcome indicators:', error);
    throw error;
  }
}

// Helper functions to fetch data (these would connect to your API or database)
async function fetchSchoolResponses(itineraryId) {
  // TODO: Implement API call to fetch school responses
  const response = await fetch(`/api/rtp/school-responses?itineraryId=${itineraryId}`);
  return response.json();
}

async function fetchConsolidatedChecklistResponses(itineraryId) {
  // TODO: Implement API call to fetch consolidated checklist responses
  const response = await fetch(`/api/rtp/consolidated-checklist?itineraryId=${itineraryId}`);
  return response.json();
}

async function fetchPartnersInPlayResponses(itineraryId) {
  // TODO: Implement API call to fetch partners in play responses
  const response = await fetch(`/api/rtp/partners-in-play?itineraryId=${itineraryId}`);
  return response.json();
}