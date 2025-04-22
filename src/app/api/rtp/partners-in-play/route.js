// filepath: c:\Users\HP EliteBook\Documents\Projects\mSRC\msrc-enhanced\msrc-app\src\app\api\rtp\partners-in-play\route.js
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getConnectionConfig } from '@/utils/db';

/**
 * Fetch Partners in Play responses for a specific itinerary
 * 
 * @param {Object} req - The request object
 * @returns {NextResponse} - The response with Partners in Play data
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
      // Query to get Partners in Play responses with school and teacher information
      const [responses] = await connection.execute(`
        SELECT 
          pip.id, 
          pip.itinerary_id, 
          pip.school_id, 
          s.name AS school_name,
          pip.teacher_id,
          CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
          pip.class_id,
          c.name AS class_name,
          pip.subject,
          pip.friendly_tone_score,
          pip.acknowledging_effort_score,
          pip.pupil_participation_score,
          pip.learning_environment_score,
          pip.ltp_skills_score,
          pip.submitted_by, 
          CONCAT(u.first_name, ' ', u.last_name) AS submitter_name,
          pip.submitted_at, 
          pip.created_at
        FROM 
          right_to_play_pip_responses pip
        JOIN 
          schools s ON pip.school_id = s.id
        JOIN 
          teachers t ON pip.teacher_id = t.id
        LEFT JOIN 
          classes c ON pip.class_id = c.id
        JOIN 
          users u ON pip.submitted_by = u.id
        WHERE 
          pip.itinerary_id = ? 
          AND pip.deleted_at IS NULL
        ORDER BY 
          pip.submitted_at DESC
      `, [itineraryId]);

      // For each response, get the associated answers with scores
      const responsesWithAnswers = await Promise.all(responses.map(async (response) => {
        const [answers] = await connection.execute(`
          SELECT 
            id, 
            response_id, 
            question_id, 
            answer_value, 
            score,
            created_at
          FROM 
            right_to_play_pip_answers
          WHERE 
            response_id = ?
        `, [response.id]);

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
    console.error('Error fetching Partners in Play responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Partners in Play responses' },
      { status: 500 }
    );
  }
}