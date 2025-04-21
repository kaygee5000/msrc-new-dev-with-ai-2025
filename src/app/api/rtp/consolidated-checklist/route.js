// filepath: c:\Users\HP EliteBook\Documents\Projects\mSRC\msrc-enhanced\msrc-app\src\app\api\rtp\consolidated-checklist\route.js
import { NextResponse } from 'next/server';
import db from '@/utils/db';

/**
 * GET /api/rtp/consolidated-checklist
 * Fetches Consolidated Checklist responses with optional filtering
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const itineraryId = searchParams.get('itineraryId');
    const schoolId = searchParams.get('schoolId');
    const id = searchParams.get('id'); // For getting a specific response
    
    // Build query with optional filters
    let query = `
      SELECT r.*, s.name as school_name, d.name as district_name, 
             u.name as submitted_by_name, i.title as itinerary_title
      FROM right_to_play_consolidated_checklist_responses r
      JOIN right_to_play_itineraries i ON r.itinerary_id = i.id
      JOIN schools s ON r.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      LEFT JOIN users u ON r.submitted_by = u.id
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
    
    query += ` ORDER BY r.submitted_at DESC`;
    
    const [responses] = await db.query(query, queryParams);
    
    // For each response, get the detailed answers
    for (let i = 0; i < responses.length; i++) {
      const [answers] = await db.query(`
        SELECT 
          a.*,
          q.question,
          q.target,
          q.indicator_type,
          q.is_required,
          q.question_form
        FROM right_to_play_consolidated_checklist_answers a
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
    console.error('Error fetching Consolidated Checklist data:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch data', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rtp/consolidated-checklist
 * Saves Consolidated Checklist responses including file uploads
 */
export async function POST(req) {
  try {
    // Handle form data with potential file uploads
    const formData = await req.formData();
    
    // Extract basic fields
    const itineraryId = formData.get('itineraryId');
    const schoolId = formData.get('schoolId');
    const submittedBy = formData.get('submittedBy');
    const answersJson = formData.get('answers');
    
    // Validate required fields
    if (!itineraryId || !schoolId || !submittedBy) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields: itineraryId, schoolId, submittedBy' },
        { status: 400 }
      );
    }
    
    // Parse answers
    let answers = [];
    try {
      answers = JSON.parse(answersJson);
      if (!Array.isArray(answers) || answers.length === 0) {
        throw new Error('Invalid answers format');
      }
    } catch (error) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid answers format', details: error.message },
        { status: 400 }
      );
    }
    
    // Begin transaction
    await db.query('START TRANSACTION');
    
    try {
      // Check if there's an existing submission to update
      let responseId;
      const [existingSubmission] = await db.query(
        `SELECT id FROM right_to_play_consolidated_checklist_responses 
         WHERE itinerary_id = ? AND school_id = ? AND deleted_at IS NULL
         LIMIT 1`,
        [itineraryId, schoolId]
      );
      
      if (existingSubmission.length > 0) {
        // Update existing submission
        responseId = existingSubmission[0].id;
        await db.query(
          `UPDATE right_to_play_consolidated_checklist_responses 
           SET submitted_by = ?, updated_at = NOW() 
           WHERE id = ?`,
          [submittedBy, responseId]
        );
        
        // Delete old answers
        await db.query(
          `DELETE FROM right_to_play_consolidated_checklist_answers WHERE response_id = ?`,
          [responseId]
        );
      } else {
        // Create new submission
        const [result] = await db.query(
          `INSERT INTO right_to_play_consolidated_checklist_responses 
           (itinerary_id, school_id, submitted_by, submitted_at, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW(), NOW())`,
          [itineraryId, schoolId, submittedBy]
        );
        responseId = result.insertId;
      }
      
      // Insert all answers
      for (const answer of answers) {
        if (!answer.questionId) {
          continue; // Skip invalid answers
        }
        
        let uploadFilePath = null;
        let uploadFileName = null;
        
        // Check if this answer has a file upload
        if (answer.hasFileUpload) {
          const fileKey = `file_${answer.questionId}`;
          const uploadFile = formData.get(fileKey);
          
          if (uploadFile && uploadFile instanceof File && uploadFile.size > 0) {
            // Handle file upload
            // In a real implementation, we would save the file to a storage system
            // For now, we'll just store the file name
            uploadFileName = uploadFile.name;
            uploadFilePath = `/uploads/rtp/consolidated-checklist/${responseId}_${answer.questionId}_${Date.now()}_${uploadFileName}`;
            
            // TODO: Implement actual file saving logic here
            // For example, using a cloud storage service or local file system
          }
        }
        
        // Insert the answer with optional file upload info
        await db.query(
          `INSERT INTO right_to_play_consolidated_checklist_answers 
           (response_id, question_id, answer_value, upload_file_path, upload_file_name, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            responseId,
            answer.questionId,
            answer.value || null,
            uploadFilePath,
            uploadFileName
          ]
        );
      }
      
      // Commit transaction
      await db.query('COMMIT');
      
      return NextResponse.json({
        status: 'success',
        data: {
          responseId,
          itineraryId,
          schoolId,
          submittedBy,
          submittedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      // Rollback in case of error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error saving Consolidated Checklist data:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to save data', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get details of a specific question
 * @param {number} questionId - The ID of the question
 * @returns {Promise<Object|null>} - Question details or null if not found
 */
async function getQuestionDetails(questionId) {
  try {
    const [questions] = await db.query(
      `SELECT * FROM right_to_play_questions WHERE id = ? AND deleted_at IS NULL`,
      [questionId]
    );
    
    return questions.length > 0 ? questions[0] : null;
  } catch (error) {
    console.error('Error fetching question details:', error);
    return null;
  }
}