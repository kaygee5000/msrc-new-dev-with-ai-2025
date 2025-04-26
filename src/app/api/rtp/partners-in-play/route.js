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
      // Removed the JOIN with the non-existent classes table
      const [responses] = await connection.execute(`
        SELECT 
          pip.id, 
          pip.itinerary_id, 
          pip.school_id, 
          s.name AS school_name,
          pip.teacher_id,
          CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
          pip.class_id,
          pip.class_id AS class_name, /* Using class_id as class_name since classes table doesn't exist */
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

/**
 * Save a new Partners in Play response and its answers
 *
 * Expects JSON body:
 * {
 *   itinerary_id, school_id, teacher_id, class_id, subject, submitted_by, submitted_at, answers: [ { question_id, answer_value, score } ]
 * }
 */
export async function POST(req) {
  let connection;
  try {
    const data = await req.json();
    const {
      itinerary_id,
      school_id,
      teacher_id,
      class_id,
      subject,
      submitted_by,
      submitted_at,
      answers = [],
      friendly_tone_score = null,
      acknowledging_effort_score = null,
      pupil_participation_score = null,
      learning_environment_score = null,
      ltp_skills_score = null
    } = data;

    if (!itinerary_id || !school_id || !teacher_id || !submitted_by || !submitted_at || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    connection = await mysql.createConnection(getConnectionConfig());
    await connection.beginTransaction();

    // Insert into responses table
    const [result] = await connection.execute(
      `INSERT INTO right_to_play_pip_responses (
        itinerary_id, school_id, teacher_id, class_id, subject,
        friendly_tone_score, acknowledging_effort_score, pupil_participation_score, learning_environment_score, ltp_skills_score,
        submitted_by, submitted_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        itinerary_id, school_id, teacher_id, class_id, subject,
        friendly_tone_score, acknowledging_effort_score, pupil_participation_score, learning_environment_score, ltp_skills_score,
        submitted_by, submitted_at
      ]
    );
    const responseId = result.insertId;

    // Insert answers
    for (const ans of answers) {
      await connection.execute(
        `INSERT INTO right_to_play_pip_answers (response_id, question_id, answer_value, score, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [responseId, ans.question_id, ans.answer_value, ans.score ?? null]
      );
    }

    await connection.commit();
    return NextResponse.json({ message: 'Response saved', response_id: responseId }, { status: 201 });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error saving Partners in Play response:', error);
    return NextResponse.json({ error: 'Failed to save response', details: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}