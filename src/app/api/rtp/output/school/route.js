import { NextResponse } from 'next/server';
import db from '@/utils/db';

/**
 * GET /api/rtp/output/school
 * Fetches school output indicators, optionally filtered by itineraryId and schoolId
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const itineraryId = searchParams.get('itineraryId');
    const schoolId = searchParams.get('schoolId');
    
    // Build query with optional filters
    let query = `
      SELECT r.*, s.name as school_name, d.name as district_name, 
             u.name as submitted_by_name, i.title as itinerary_title
      FROM right_to_play_school_responses r
      JOIN right_to_play_itineraries i ON r.itinerary_id = i.id
      JOIN schools s ON r.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      LEFT JOIN users u ON r.submitted_by = u.id
      WHERE r.deleted_at IS NULL
    `;
    
    const queryParams = [];
    
    if (itineraryId) {
      query += ` AND r.itinerary_id = ?`;
      queryParams.push(parseInt(itineraryId));
    }
    
    if (schoolId) {
      query += ` AND r.school_id = ?`;
      queryParams.push(parseInt(schoolId));
    }
    
    query += ` ORDER BY r.submitted_at DESC`;
    
    const [responses] = await db.query(query, queryParams);
    
    // For each response, get the detailed answers
    for (let i = 0; i < responses.length; i++) {
      const [answers] = await db.query(`
        SELECT a.*, q.question, q.target, q.indicator_type
        FROM right_to_play_school_response_answers a
        JOIN right_to_play_questions q ON a.question_id = q.id
        WHERE a.response_id = ?
        ORDER BY q.display_order ASC, q.id ASC
      `, [responses[i].id]);
      
      responses[i].answers = answers;
    }
    
    return NextResponse.json({
      status: 'success',
      data: responses
    });
  } catch (error) {
    console.error('Error fetching school output data:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch data', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rtp/output/school
 * Saves school output indicators
 */
export async function POST(req) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.itineraryId || !data.schoolId || !data.submittedBy) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields: itineraryId, schoolId, submittedBy' },
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
      // Check if there's an existing submission to update
      let responseId;
      const [existingSubmission] = await db.query(
        `SELECT id FROM right_to_play_school_responses 
         WHERE itinerary_id = ? AND school_id = ? AND deleted_at IS NULL
         LIMIT 1`,
        [data.itineraryId, data.schoolId]
      );
      
      if (existingSubmission.length > 0) {
        // Update existing submission
        responseId = existingSubmission[0].id;
        await db.query(
          `UPDATE right_to_play_school_responses 
           SET submitted_by = ?, updated_at = NOW() 
           WHERE id = ?`,
          [data.submittedBy, responseId]
        );
        
        // Delete old answers
        await db.query(
          `DELETE FROM right_to_play_school_response_answers WHERE response_id = ?`,
          [responseId]
        );
      } else {
        // Create new submission
        const [result] = await db.query(
          `INSERT INTO right_to_play_school_responses 
           (itinerary_id, school_id, submitted_by, submitted_at, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW(), NOW())`,
          [data.itineraryId, data.schoolId, data.submittedBy]
        );
        responseId = result.insertId;
      }
      
      // Insert all answers
      const answerValues = [];
      const answerParams = [];
      
      for (const answer of data.answers) {
        if (!answer.questionId || answer.value === undefined) {
          continue; // Skip invalid answers
        }
        
        answerValues.push('(?, ?, ?, NOW(), NOW())');
        answerParams.push(
          responseId,
          answer.questionId,
          answer.value
        );
      }
      
      if (answerValues.length > 0) {
        await db.query(
          `INSERT INTO right_to_play_school_response_answers 
           (response_id, question_id, answer_value, created_at, updated_at)
           VALUES ${answerValues.join(', ')}`,
          answerParams
        );
      }
      
      // Commit transaction
      await db.query('COMMIT');
      
      return NextResponse.json({
        status: 'success',
        data: {
          responseId,
          itineraryId: data.itineraryId,
          schoolId: data.schoolId,
          submittedBy: data.submittedBy,
          submittedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      // Rollback in case of error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error saving school output data:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to save data', details: error.message },
      { status: 500 }
    );
  }
}