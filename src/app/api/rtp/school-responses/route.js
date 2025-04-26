import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getConnectionConfig } from '@/utils/db';
import logger from '@/utils/logger'

/**
 * Fetch school-level output responses for a specific itinerary
 * 
 * @param {Object} req - The request object
 * @returns {NextResponse} - The response with school responses data
 */
export async function GET(req) {
  try {
    // Extract itinerary ID from the request URL
    const url = new URL(req.url);
    const itineraryId = url.searchParams.get('itineraryId');
    
    if (!itineraryId) {
      return NextResponse.json(
        { error: 'Missing required parameter: itineraryId' },
        { status: 400 }
      );
    }

    // Create database connection
    const connection = await mysql.createConnection(getConnectionConfig());

    try {
      // Query to get school responses grouped by school_id
      // Using right_to_play_question_answers table instead of the non-existent right_to_play_school_responses
      const [responses] = await connection.execute(`
        SELECT 
          s.id AS school_id, 
          s.name AS school_name,
          qa.itinerary_id,
          u.id AS submitted_by,
          CONCAT(u.first_name, ' ', u.last_name) AS submitter_name,
          MIN(qa.created_at) AS first_submission,
          MAX(qa.created_at) AS last_submission,
          COUNT(DISTINCT qa.question_id) AS questions_answered
        FROM 
          right_to_play_question_answers qa
        JOIN 
          schools s ON qa.school_id = s.id
        JOIN 
          users u ON qa.user_id = u.id
        WHERE 
          qa.itinerary_id = ? 
          AND qa.deleted_at IS NULL
        GROUP BY 
          qa.school_id, qa.itinerary_id, qa.user_id
        ORDER BY 
          last_submission DESC
      `, [itineraryId]);

      // For each school response, get the associated answers
      const responsesWithAnswers = await Promise.all(responses.map(async (response) => {
        const [answers] = await connection.execute(`
          SELECT 
            id, 
            question_id, 
            answer, 
            created_at
          FROM 
            right_to_play_question_answers
          WHERE 
            school_id = ?
            AND itinerary_id = ?
            AND user_id = ?
        `, [response.school_id, response.itinerary_id, response.submitted_by]);

        return {
          ...response,
          answers
        };
      }));

      return NextResponse.json(responsesWithAnswers);
    } finally {
      // Always close the connection
      await connection.end();
    }
  } catch (error) {
    console.error('Error fetching school responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school responses' },
      { status: 500 }
    );
  }
}

/**
 * Save school-level question answers for a specific itinerary
 * 
 * @param {Object} req - The request object
 * @returns {NextResponse} - The response indicating success or failure
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { itinerary_id, school_id, user_id, region_id, district_id, circuit_id, answers } 
    = body;

    // Add detailed logging to help diagnose the issue
    logger.info('POST /api/rtp/school-responses request body:', body);
    
    if (!itinerary_id || !school_id || !user_id || !region_id || !district_id || !circuit_id || !Array.isArray(answers)) {
      logger.error('Missing required fields:', { 
        hasItineraryId: !!itinerary_id,
        hasSchoolId: !!school_id,
        hasUserId: !!user_id,
        hasRegionId: !!region_id, 
        hasDistrictId: !!district_id, 
        hasCircuitId: !!circuit_id,
        answersIsArray: Array.isArray(answers)
      });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = await mysql.createConnection(getConnectionConfig());
    try {
      await connection.beginTransaction();
      const now = new Date();
      for (const ans of answers) {
        const { question_id, answer } = ans;
        // Log the answer data
        logger.debug('Processing answer:', { question_id, answer });
        
        // Validate the answer object
        if (!question_id) {
          logger.error('Missing question_id in answer:', ans);
          throw new Error('Missing question_id in answer');
        }
        
        await connection.execute(
          `INSERT INTO right_to_play_question_answers 
            (itinerary_id, question_id, answer, user_id, school_id, circuit_id, district_id, region_id, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [itinerary_id, question_id, answer, user_id, school_id, circuit_id, district_id, region_id]
        );
      }
      await connection.commit();
      return NextResponse.json({ success: true });
    } catch (err) {
      await connection.rollback();
      logger.error('Error saving school question answers:', err);
      return NextResponse.json({ error: 'Failed to save answers: ' + err.message }, { status: 500 });
    } finally {
      await connection.end();
    }
  } catch (error) {
    logger.error('Error in POST /school-responses:', error);
    return NextResponse.json({ error: 'Invalid request: ' + error.message }, { status: 400 });
  }
}