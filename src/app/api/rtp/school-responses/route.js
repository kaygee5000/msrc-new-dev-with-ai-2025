import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getConnectionConfig } from '@/utils/db';

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
      // Query to get school responses with school information
      const [responses] = await connection.execute(`
        SELECT 
          sr.id, 
          sr.itinerary_id, 
          sr.school_id, 
          s.name AS school_name,
          sr.submitted_by, 
          CONCAT(u.first_name, ' ', u.last_name) AS submitter_name,
          sr.submitted_at, 
          sr.created_at
        FROM 
          right_to_play_school_responses sr
        JOIN 
          schools s ON sr.school_id = s.id
        JOIN 
          users u ON sr.submitted_by = u.id
        WHERE 
          sr.itinerary_id = ? 
          AND sr.deleted_at IS NULL
        ORDER BY 
          sr.submitted_at DESC
      `, [itineraryId]);

      // For each response, get the associated answers
      const responsesWithAnswers = await Promise.all(responses.map(async (response) => {
        const [answers] = await connection.execute(`
          SELECT 
            id, 
            response_id, 
            question_id, 
            answer_value, 
            created_at
          FROM 
            right_to_play_school_response_answers
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
    console.error('Error fetching school responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school responses' },
      { status: 500 }
    );
  }
}