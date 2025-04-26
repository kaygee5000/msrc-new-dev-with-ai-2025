import { NextResponse } from 'next/server';
import db from '@/utils/db';

/**
 * GET /api/rtp/output/district
 * Fetches district output indicators, optionally filtered by itineraryId and districtId
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const itineraryId = searchParams.get('itineraryId');
    const districtId = searchParams.get('districtId');
    
    // Build query with optional filters
    let query = `
      SELECT 
        dr.id, 
        dr.itinerary_id, 
        dr.district_id, 
        dr.submitted_by, 
        dr.submitted_at, 
        dr.created_at, 
        dr.updated_at,
        d.name as district_name, 
        reg.name as region_name, 
        CONCAT(u.first_name, ' ', u.last_name) as submitted_by_name, 
        i.title as itinerary_title
      FROM right_to_play_district_responses dr
      JOIN right_to_play_itineraries i ON dr.itinerary_id = i.id
      JOIN districts d ON dr.district_id = d.id
      JOIN regions reg ON d.region_id = reg.id
      JOIN users u ON dr.submitted_by = u.id
      WHERE dr.deleted_at IS NULL
    `;
    
    const queryParams = [];
    
    if (itineraryId) {
      query += ` AND dr.itinerary_id = ?`;
      queryParams.push(parseInt(itineraryId));
    }
    
    if (districtId) {
      query += ` AND dr.district_id = ?`;
      queryParams.push(parseInt(districtId));
    }
    
    query += ` ORDER BY dr.submitted_at DESC`;
    
    const [responses] = await db.query(query, queryParams);
    
    // For each response, get the detailed answers
    for (let i = 0; i < responses.length; i++) {
      const [answers] = await db.query(`
        SELECT 
          a.id,
          a.response_id,
          a.question_id, 
          a.answer_value,
          a.created_at,
          a.updated_at,
          q.question, 
          q.indicator_type,
          q.is_required
        FROM right_to_play_district_response_answers a
        JOIN right_to_play_questions q ON a.question_id = q.id
        WHERE a.response_id = ?
        ORDER BY q.id ASC
      `, [responses[i].id]);
      
      responses[i].answers = answers;
    }
    
    return NextResponse.json({
      status: 'success',
      data: responses
    });
  } catch (error) {
    console.error('Error fetching district output data:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch data', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rtp/output/district
 * Saves district output indicators
 */
export async function POST(req) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.itineraryId || !data.districtId || !data.submittedBy) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields: itineraryId, districtId, submittedBy' },
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
        `SELECT id FROM right_to_play_district_responses 
         WHERE itinerary_id = ? AND district_id = ? AND deleted_at IS NULL
         LIMIT 1`,
        [data.itineraryId, data.districtId]
      );
      
      if (existingSubmission.length > 0) {
        // Update existing submission
        responseId = existingSubmission[0].id;
        await db.query(
          `UPDATE right_to_play_district_responses 
           SET submitted_by = ?, updated_at = NOW() 
           WHERE id = ?`,
          [data.submittedBy, responseId]
        );
        
        // Delete old answers
        await db.query(
          `DELETE FROM right_to_play_district_response_answers WHERE response_id = ?`,
          [responseId]
        );
      } else {
        // Create new submission
        const [result] = await db.query(
          `INSERT INTO right_to_play_district_responses 
           (itinerary_id, district_id, submitted_by, submitted_at, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW(), NOW())`,
          [data.itineraryId, data.districtId, data.submittedBy]
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
          `INSERT INTO right_to_play_district_response_answers 
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
          districtId: data.districtId,
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
    console.error('Error saving district output data:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to save data', details: error.message },
      { status: 500 }
    );
  }
}