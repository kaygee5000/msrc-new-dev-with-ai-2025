// filepath: c:\Users\HP EliteBook\Documents\Projects\mSRC\msrc-enhanced\msrc-app\src\app\api\rtp\consolidated-checklist\route.js
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getConnectionConfig } from '@/utils/db';

/**
 * Fetch consolidated checklist responses for a specific itinerary
 * 
 * @param {Object} req - The request object
 * @returns {NextResponse} - The response with consolidated checklist data
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
      // Query to get consolidated checklist responses with school information
      const [responses] = await connection.execute(`
        SELECT 
          ccr.id, 
          ccr.itinerary_id, 
          ccr.school_id, 
          s.name AS school_name,
          ccr.teacher_id,
          CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
          ccr.submitted_by, 
          CONCAT(u.first_name, ' ', u.last_name) AS submitter_name,
          ccr.submitted_at, 
          ccr.created_at
        FROM 
          right_to_play_consolidated_checklist_responses ccr
        JOIN 
          schools s ON ccr.school_id = s.id
        LEFT JOIN 
          teachers t ON ccr.teacher_id = t.id
        JOIN 
          users u ON ccr.submitted_by = u.id
        WHERE 
          ccr.itinerary_id = ? 
          AND ccr.deleted_at IS NULL
        ORDER BY 
          ccr.submitted_at DESC
      `, [itineraryId]);

      // For each response, get the associated answers including file uploads
      const responsesWithAnswers = await Promise.all(responses.map(async (response) => {
        const [answers] = await connection.execute(`
          SELECT 
            id, 
            response_id, 
            question_id, 
            answer_value, 
            upload_file_path,
            upload_file_name,
            created_at
          FROM 
            right_to_play_consolidated_checklist_answers
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
    console.error('Error fetching consolidated checklist responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consolidated checklist responses' },
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
    
    // Create database connection
    const connection = await mysql.createConnection(getConnectionConfig());
    
    try {
      // Begin transaction
      await connection.beginTransaction();
      
      // Check if there's an existing submission to update
      let responseId;
      const [existingSubmission] = await connection.execute(
        `SELECT id FROM right_to_play_consolidated_checklist_responses 
         WHERE itinerary_id = ? AND school_id = ? AND deleted_at IS NULL
         LIMIT 1`,
        [itineraryId, schoolId]
      );
      
      if (existingSubmission.length > 0) {
        // Update existing submission
        responseId = existingSubmission[0].id;
        await connection.execute(
          `UPDATE right_to_play_consolidated_checklist_responses 
           SET submitted_by = ?, updated_at = NOW() 
           WHERE id = ?`,
          [submittedBy, responseId]
        );
        
        // Delete old answers
        await connection.execute(
          `DELETE FROM right_to_play_consolidated_checklist_answers WHERE response_id = ?`,
          [responseId]
        );
      } else {
        // Create new submission
        const [result] = await connection.execute(
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
        await connection.execute(
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
      await connection.commit();
      
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
      await connection.rollback();
      throw error;
    } finally {
      // Always close the connection
      await connection.end();
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
    // Create database connection
    const connection = await mysql.createConnection(getConnectionConfig());
    
    try {
      const [questions] = await connection.execute(
        `SELECT * FROM right_to_play_questions WHERE id = ? AND deleted_at IS NULL`,
        [questionId]
      );
      
      return questions.length > 0 ? questions[0] : null;
    } finally {
      // Always close the connection
      await connection.end();
    }
  } catch (error) {
    console.error('Error fetching question details:', error);
    return null;
  }
}