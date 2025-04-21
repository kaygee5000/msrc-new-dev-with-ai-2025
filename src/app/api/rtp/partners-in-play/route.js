// filepath: c:\Users\HP EliteBook\Documents\Projects\mSRC\msrc-enhanced\msrc-app\src\app\api\rtp\partners-in-play\route.js
import { NextResponse } from 'next/server';
import db from '@/utils/db';

/**
 * GET /api/rtp/partners-in-play
 * Fetches Partners in Play survey responses with optional filtering
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const itineraryId = searchParams.get('itineraryId');
    const schoolId = searchParams.get('schoolId');
    const teacherId = searchParams.get('teacherId');
    const id = searchParams.get('id'); // For getting a specific response
    
    // Build query with optional filters
    let query = `
      SELECT r.*, s.name as school_name, d.name as district_name, 
             u.name as submitted_by_name, i.title as itinerary_title,
             t.name as teacher_name, cl.name as class_name
      FROM right_to_play_pip_responses r
      JOIN right_to_play_itineraries i ON r.itinerary_id = i.id
      JOIN schools s ON r.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      LEFT JOIN users u ON r.submitted_by = u.id
      LEFT JOIN teachers t ON r.teacher_id = t.id
      LEFT JOIN classes cl ON r.class_id = cl.id
      WHERE r.deleted_at IS NULL
    `;
    
    const queryParams = [];
    
    if (id) {
      query += ` AND r.id = ?`;
      queryParams.push(parseInt(id));
    }
    
    if (itineraryId) {
      query += ` AND r.itinerary_id = ?`;
      queryParams.push(parseInt(itineraryId));
    }
    
    if (schoolId) {
      query += ` AND r.school_id = ?`;
      queryParams.push(parseInt(schoolId));
    }
    
    if (teacherId) {
      query += ` AND r.teacher_id = ?`;
      queryParams.push(parseInt(teacherId));
    }
    
    query += ` ORDER BY r.submitted_at DESC`;
    
    const [responses] = await db.query(query, queryParams);
    
    // For each response, get the detailed answers with scoring
    for (let i = 0; i < responses.length; i++) {
      const [answers] = await db.query(`
        SELECT 
          a.*,
          q.question,
          q.target,
          q.indicator_type,
          qs.score_value,
          qs.scoring_logic,
          qs.scoring_formula,
          qs.score_min,
          qs.score_max
        FROM right_to_play_pip_answers a
        JOIN right_to_play_questions q ON a.question_id = q.id
        LEFT JOIN right_to_play_question_scoring qs ON q.id = qs.question_id
        WHERE a.response_id = ?
        ORDER BY q.display_order ASC, q.id ASC
      `, [responses[i].id]);
      
      // Calculate scores for each answer
      for (let j = 0; j < answers.length; j++) {
        if (answers[j].score_value || answers[j].scoring_logic || answers[j].scoring_formula) {
          answers[j].calculated_score = calculateScore(answers[j]);
        }
      }
      
      responses[i].answers = answers;
      
      // Calculate overall scores
      responses[i].score_summary = calculateScoreSummary(answers);
    }
    
    return NextResponse.json({
      status: 'success',
      data: responses
    });
  } catch (error) {
    console.error('Error fetching Partners in Play data:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch data', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rtp/partners-in-play
 * Saves Partners in Play survey responses with scoring
 */
export async function POST(req) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.itineraryId || !data.schoolId || !data.submittedBy || !data.teacherId) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields: itineraryId, schoolId, submittedBy, teacherId' },
        { status: 400 }
      );
    }
    
    // Validate class_id if subject is provided (class is required for subject)
    if (data.subject && !data.classId) {
      return NextResponse.json(
        { status: 'error', message: 'Class ID is required when subject is provided' },
        { status: 400 }
      );
    }
    
    // Check for answers array
    if (!data.answers || !Array.isArray(data.answers) || data.answers.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Missing or invalid answers array' },
        { status: 400 }
      );
    }
    
    // Begin transaction
    await db.query('START TRANSACTION');
    
    try {
      // Check if there's an existing submission to update for the same teacher in this itinerary
      let responseId;
      const [existingSubmission] = await db.query(
        `SELECT id FROM right_to_play_pip_responses 
         WHERE itinerary_id = ? AND school_id = ? AND teacher_id = ? AND deleted_at IS NULL
         LIMIT 1`,
        [data.itineraryId, data.schoolId, data.teacherId]
      );
      
      if (existingSubmission.length > 0) {
        // Update existing submission
        responseId = existingSubmission[0].id;
        await db.query(
          `UPDATE right_to_play_pip_responses 
           SET submitted_by = ?, class_id = ?, subject = ?, updated_at = NOW() 
           WHERE id = ?`,
          [data.submittedBy, data.classId || null, data.subject || null, responseId]
        );
        
        // Delete old answers
        await db.query(
          `DELETE FROM right_to_play_pip_answers WHERE response_id = ?`,
          [responseId]
        );
      } else {
        // Create new submission
        const [result] = await db.query(
          `INSERT INTO right_to_play_pip_responses 
           (itinerary_id, school_id, teacher_id, class_id, subject, submitted_by, submitted_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
          [data.itineraryId, data.schoolId, data.teacherId, data.classId || null, data.subject || null, data.submittedBy]
        );
        responseId = result.insertId;
      }
      
      // Fetch scoring information for all questions
      const questionIds = data.answers.map(a => a.questionId).filter(id => id);
      
      if (questionIds.length === 0) {
        throw new Error('No valid question IDs in answers');
      }
      
      const [scoringInfo] = await db.query(`
        SELECT 
          q.id as question_id,
          qs.score_value,
          qs.scoring_logic,
          qs.scoring_formula,
          qs.score_min,
          qs.score_max
        FROM right_to_play_questions q
        LEFT JOIN right_to_play_question_scoring qs ON q.id = qs.question_id
        WHERE q.id IN (${questionIds.map(() => '?').join(',')})
      `, questionIds);
      
      // Create mapping for easy access
      const scoringMap = {};
      scoringInfo.forEach(info => {
        scoringMap[info.question_id] = info;
      });
      
      // Insert all answers and calculate scores
      const answerValues = [];
      const answerParams = [];
      const scores = [];
      
      for (const answer of data.answers) {
        if (!answer.questionId || answer.value === undefined) {
          continue; // Skip invalid answers
        }
        
        // Get scoring info for this question
        const scoring = scoringMap[answer.questionId] || {};
        
        // Calculate score if scoring is available
        let calculatedScore = null;
        if (scoring.score_value || scoring.scoring_logic || scoring.scoring_formula) {
          calculatedScore = calculateAnswerScore(answer.value, scoring);
          scores.push({
            questionId: answer.questionId,
            score: calculatedScore
          });
        }
        
        answerValues.push('(?, ?, ?, ?, NOW(), NOW())');
        answerParams.push(
          responseId,
          answer.questionId,
          answer.value,
          calculatedScore
        );
      }
      
      if (answerValues.length > 0) {
        await db.query(
          `INSERT INTO right_to_play_pip_answers 
           (response_id, question_id, answer_value, score, created_at, updated_at)
           VALUES ${answerValues.join(', ')}`,
          answerParams
        );
      }
      
      // Calculate overall scores and store them
      if (scores.length > 0) {
        // This is where we'd calculate aggregate scores like LTP skills, friendly environment, etc.
        // based on the PRD specifications
        
        // Define indicator groups from PRD
        const indicatorGroups = {
          friendly_tone: [43], // question ID for friendly tone
          acknowledging_effort: [44], // question ID for acknowledging effort
          pupil_participation: [45], // question ID for pupil participation
          ltp_skills: [29, 30, 31, 32, 33, 39, 45, 46, 48, 49] // question IDs for LTP skills assessment
        };
        
        // Calculate scores for each indicator group
        const indicatorScores = {};
        
        for (const [indicator, questionIds] of Object.entries(indicatorGroups)) {
          const relevantScores = scores.filter(s => questionIds.includes(s.questionId));
          if (relevantScores.length > 0) {
            const totalScore = relevantScores.reduce((sum, s) => sum + s.score, 0);
            indicatorScores[indicator] = totalScore / relevantScores.length; // Average score
          }
        }
        
        // Learning Environment score combines friendly tone, acknowledging effort, pupil participation
        if (indicatorScores.friendly_tone && indicatorScores.acknowledging_effort && indicatorScores.pupil_participation) {
          indicatorScores.learning_environment = (
            indicatorScores.friendly_tone + 
            indicatorScores.acknowledging_effort + 
            indicatorScores.pupil_participation
          ) / 3;
        }
        
        // Store these aggregate scores in the database
        if (Object.keys(indicatorScores).length > 0) {
          await db.query(
            `UPDATE right_to_play_pip_responses 
             SET 
               friendly_tone_score = ?,
               acknowledging_effort_score = ?,
               pupil_participation_score = ?,
               learning_environment_score = ?,
               ltp_skills_score = ?,
               updated_at = NOW()
             WHERE id = ?`,
            [
              indicatorScores.friendly_tone || null,
              indicatorScores.acknowledging_effort || null,
              indicatorScores.pupil_participation || null,
              indicatorScores.learning_environment || null,
              indicatorScores.ltp_skills || null,
              responseId
            ]
          );
        }
      }
      
      // Commit transaction
      await db.query('COMMIT');
      
      return NextResponse.json({
        status: 'success',
        data: {
          responseId,
          itineraryId: data.itineraryId,
          schoolId: data.schoolId,
          teacherId: data.teacherId,
          classId: data.classId,
          subject: data.subject,
          submittedBy: data.submittedBy,
          submittedAt: new Date().toISOString(),
          scores: scores.length > 0 ? scores : undefined
        }
      });
    } catch (error) {
      // Rollback in case of error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error saving Partners in Play data:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to save data', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Calculate a score for an answer based on scoring rules
 * @param {string|number} value - The answer value
 * @param {Object} scoring - Scoring information for the question
 * @returns {number|null} - The calculated score or null if no score could be calculated
 */
function calculateAnswerScore(value, scoring) {
  // If there's a direct score value, use it
  if (scoring.score_value !== null && scoring.score_value !== undefined) {
    return parseFloat(scoring.score_value);
  }
  
  // If there's scoring logic (typically a JSON object mapping values to scores)
  if (scoring.scoring_logic) {
    try {
      const logic = JSON.parse(scoring.scoring_logic);
      const valueStr = String(value).toLowerCase();
      
      // Handle exact matches
      if (logic[valueStr] !== undefined) {
        return parseFloat(logic[valueStr]);
      }
      
      // Handle ranges for numeric values
      if (!isNaN(parseFloat(value))) {
        const numValue = parseFloat(value);
        for (const [range, score] of Object.entries(logic)) {
          if (range.includes('-')) {
            const [min, max] = range.split('-').map(parseFloat);
            if (numValue >= min && numValue <= max) {
              return parseFloat(score);
            }
          }
        }
      }
      
      // Handle wildcard or default
      if (logic['*'] !== undefined) {
        return parseFloat(logic['*']);
      }
    } catch (e) {
      console.error('Error parsing scoring logic:', e);
    }
  }
  
  // If there's a scoring formula (e.g., "value * 2" or "value / 5")
  if (scoring.scoring_formula) {
    try {
      // Safely evaluate formula with the answer value
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        // Replace "value" in formula with the actual numeric value
        const formula = scoring.scoring_formula.replace(/value/g, numValue);
        // Use Function constructor to safely evaluate the formula
        const calculate = new Function('return ' + formula);
        let result = calculate();
        
        // Apply min/max constraints if specified
        if (scoring.score_min !== null && result < scoring.score_min) {
          result = scoring.score_min;
        }
        if (scoring.score_max !== null && result > scoring.score_max) {
          result = scoring.score_max;
        }
        
        return result;
      }
    } catch (e) {
      console.error('Error evaluating scoring formula:', e);
    }
  }
  
  // If no score could be calculated
  return null;
}

/**
 * Calculate score for an answer object that already includes scoring info
 * @param {Object} answer - Answer object with scoring information
 * @returns {number|null} - The calculated score
 */
function calculateScore(answer) {
  return calculateAnswerScore(answer.answer_value, {
    score_value: answer.score_value,
    scoring_logic: answer.scoring_logic,
    scoring_formula: answer.scoring_formula,
    score_min: answer.score_min,
    score_max: answer.score_max
  });
}

/**
 * Calculate overall score summary for a set of answers
 * @param {Array} answers - Array of answer objects with scoring info
 * @returns {Object} - Object containing score summaries
 */
function calculateScoreSummary(answers) {
  // Define indicator groups from PRD
  const indicatorGroups = {
    friendly_tone: [43], // question ID for friendly tone
    acknowledging_effort: [44], // question ID for acknowledging effort
    pupil_participation: [45], // question ID for pupil participation
    ltp_skills: [29, 30, 31, 32, 33, 39, 45, 46, 48, 49] // question IDs for LTP skills assessment
  };
  
  // Calculate scores for each indicator group
  const summary = {};
  
  for (const [indicator, questionIds] of Object.entries(indicatorGroups)) {
    const relevantAnswers = answers.filter(a => questionIds.includes(a.question_id) && a.calculated_score !== null);
    
    if (relevantAnswers.length > 0) {
      const totalScore = relevantAnswers.reduce((sum, a) => sum + a.calculated_score, 0);
      summary[indicator] = {
        average: totalScore / relevantAnswers.length,
        total: totalScore,
        count: relevantAnswers.length,
        max_possible: relevantAnswers.length * 5, // Assuming 5 is max score for each question
        percentage: (totalScore / (relevantAnswers.length * 5)) * 100
      };
    }
  }
  
  // Learning Environment score combines friendly tone, acknowledging effort, pupil participation
  if (summary.friendly_tone && summary.acknowledging_effort && summary.pupil_participation) {
    const learningEnvTotal = 
      summary.friendly_tone.total + 
      summary.acknowledging_effort.total + 
      summary.pupil_participation.total;
    
    const learningEnvMaxPossible = 
      summary.friendly_tone.max_possible + 
      summary.acknowledging_effort.max_possible + 
      summary.pupil_participation.max_possible;
    
    summary.learning_environment = {
      average: learningEnvTotal / (summary.friendly_tone.count + summary.acknowledging_effort.count + summary.pupil_participation.count),
      total: learningEnvTotal,
      count: summary.friendly_tone.count + summary.acknowledging_effort.count + summary.pupil_participation.count,
      max_possible: learningEnvMaxPossible,
      percentage: (learningEnvTotal / learningEnvMaxPossible) * 100
    };
  }
  
  return summary;
}