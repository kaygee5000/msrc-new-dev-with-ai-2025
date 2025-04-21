import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET: List all questions (optionally by category)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category_id');
    const itineraryId = searchParams.get('itinerary_id');
    const surveyType = searchParams.get('survey_type'); // 'school-output', 'district-output', 'consolidated-checklist', 'partners-in-play'
    let questions = [];
    
    if (itineraryId) {
      // Get questions assigned to this itinerary, with overrides if any
      const [rows] = await db.query(`
        SELECT 
          q.*, 
          iq.id as itinerary_question_id, 
          iq.override_text, 
          iq.override_options,
          qsc.score_value,
          qsc.scoring_logic,
          qsc.scoring_formula,
          qsc.score_min,
          qsc.score_max,
          qc.name as category_name
        FROM right_to_play_itinerary_questions iq
        JOIN right_to_play_questions q ON iq.question_id = q.id
        JOIN right_to_play_question_categories qc ON q.category_id = qc.id
        LEFT JOIN right_to_play_question_scoring qsc ON q.id = qsc.question_id
        WHERE iq.itinerary_id = ?
        ${categoryId ? 'AND q.category_id = ?' : ''}
        ${surveyType ? 'AND qc.survey_type = ?' : ''}
        AND q.deleted_at IS NULL
        ORDER BY q.display_order ASC, q.id ASC
      `, 
      surveyType 
        ? (categoryId ? [itineraryId, categoryId, surveyType] : [itineraryId, surveyType]) 
        : (categoryId ? [itineraryId, categoryId] : [itineraryId]));
      
      questions = rows.map(q => ({
        ...q,
        question: q.override_text || q.question,
        options: q.override_options || q.close_ended_answer_form || q.open_ended_answer_form,
        hasScoring: !!q.score_value || !!q.scoring_logic || !!q.scoring_formula
      }));
    } else {
      // Get all questions (optionally by category or survey type)
      const [rows] = await db.query(`
        SELECT 
          q.*,
          qsc.score_value,
          qsc.scoring_logic,
          qsc.scoring_formula,
          qsc.score_min,
          qsc.score_max,
          qc.name as category_name,
          qc.survey_type
        FROM right_to_play_questions q
        JOIN right_to_play_question_categories qc ON q.category_id = qc.id
        LEFT JOIN right_to_play_question_scoring qsc ON q.id = qsc.question_id
        WHERE q.deleted_at IS NULL
        ${categoryId ? 'AND q.category_id = ?' : ''}
        ${surveyType ? 'AND qc.survey_type = ?' : ''}
        ORDER BY q.display_order ASC, q.id ASC
      `, 
      surveyType 
        ? (categoryId ? [categoryId, surveyType] : [surveyType]) 
        : (categoryId ? [categoryId] : []));
      
      questions = rows.map(q => ({
        ...q,
        hasScoring: !!q.score_value || !!q.scoring_logic || !!q.scoring_formula
      }));
    }
    
    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch questions', details: error.message }, { status: 500 });
  }
}

// POST: Add a new question (global or for a specific itinerary)
export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      question, 
      question_form, 
      close_ended_answer_form, 
      open_ended_answer_form, 
      target, 
      indicator_type, 
      is_required = 1, 
      category_id, 
      itinerary_id, 
      override_text, 
      override_options,
      display_order = 0,
      // New scoring fields
      score_value,
      scoring_logic,
      scoring_formula,
      score_min,
      score_max
    } = body;
    
    if (!question_form || !question || !category_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    let questionId = null;
    
    // Begin transaction
    await db.query('START TRANSACTION');
    
    try {
      // If adding globally (no itinerary_id), insert into master list
      if (!itinerary_id) {
        const [result] = await db.query(
          `INSERT INTO right_to_play_questions 
           (question, question_form, close_ended_answer_form, open_ended_answer_form, 
            target, indicator_type, is_required, category_id, display_order, is_valid, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
          [question, question_form, close_ended_answer_form, open_ended_answer_form, 
           target, indicator_type, is_required, category_id, display_order]
        );
        questionId = result.insertId;
        
        // Add scoring information if provided
        if (score_value || scoring_logic || scoring_formula) {
          await db.query(
            `INSERT INTO right_to_play_question_scoring 
             (question_id, score_value, scoring_logic, scoring_formula, score_min, score_max, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [questionId, score_value, scoring_logic, scoring_formula, score_min, score_max]
          );
        }
      } else {
        // If adding for a specific itinerary, must reference an existing question or create new, then assign
        if (!body.question_id) {
          // Create new question in master list first
          const [result] = await db.query(
            `INSERT INTO right_to_play_questions 
             (question, question_form, close_ended_answer_form, open_ended_answer_form, 
              target, indicator_type, is_required, category_id, display_order, is_valid, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [question, question_form, close_ended_answer_form, open_ended_answer_form, 
             target, indicator_type, is_required, category_id, display_order]
          );
          questionId = result.insertId;
          
          // Add scoring information if provided
          if (score_value || scoring_logic || scoring_formula) {
            await db.query(
              `INSERT INTO right_to_play_question_scoring 
               (question_id, score_value, scoring_logic, scoring_formula, score_min, score_max, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [questionId, score_value, scoring_logic, scoring_formula, score_min, score_max]
            );
          }
        } else {
          questionId = body.question_id;
        }
        
        // Assign to itinerary with optional override
        await db.query(
          `INSERT INTO right_to_play_itinerary_questions 
           (itinerary_id, question_id, override_text, override_options, created_at, updated_at)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [itinerary_id, questionId, override_text || null, override_options || null]
        );
      }
      
      // Commit the transaction
      await db.query('COMMIT');
      
      return NextResponse.json({ success: true, question_id: questionId });
    } catch (error) {
      // Rollback in case of error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add question', details: error.message }, { status: 500 });
  }
}

// PUT: Edit a question (global or for a specific itinerary)
export async function PUT(req) {
  try {
    const body = await req.json();
    const { 
      id, 
      question, 
      question_form, 
      close_ended_answer_form, 
      open_ended_answer_form, 
      target, 
      indicator_type, 
      is_required, 
      category_id, 
      itinerary_id, 
      override_text, 
      override_options,
      display_order,
      // Scoring fields
      score_value,
      scoring_logic,
      scoring_formula,
      score_min,
      score_max
    } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing question id' }, { status: 400 });
    }
    
    // Begin transaction
    await db.query('START TRANSACTION');
    
    try {
      if (itinerary_id) {
        // Edit override for this itinerary
        await db.query(
          `UPDATE right_to_play_itinerary_questions 
           SET override_text=?, override_options=?, updated_at=NOW() 
           WHERE itinerary_id=? AND question_id=?`,
          [override_text, override_options, itinerary_id, id]
        );
      } else {
        // Edit master question
        await db.query(
          `UPDATE right_to_play_questions 
           SET question=?, question_form=?, close_ended_answer_form=?, open_ended_answer_form=?, 
               target=?, indicator_type=?, is_required=?, category_id=?, 
               display_order=?, updated_at=NOW() 
           WHERE id=?`,
          [question, question_form, close_ended_answer_form, open_ended_answer_form, 
           target, indicator_type, is_required, category_id, display_order, id]
        );
        
        // Check if scoring exists
        const [existingScoring] = await db.query(
          `SELECT id FROM right_to_play_question_scoring WHERE question_id = ?`,
          [id]
        );
        
        if (existingScoring.length > 0) {
          // Update existing scoring
          await db.query(
            `UPDATE right_to_play_question_scoring 
             SET score_value=?, scoring_logic=?, scoring_formula=?, 
                 score_min=?, score_max=?, updated_at=NOW() 
             WHERE question_id=?`,
            [score_value, scoring_logic, scoring_formula, score_min, score_max, id]
          );
        } else if (score_value || scoring_logic || scoring_formula) {
          // Insert new scoring
          await db.query(
            `INSERT INTO right_to_play_question_scoring 
             (question_id, score_value, scoring_logic, scoring_formula, score_min, score_max, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [id, score_value, scoring_logic, scoring_formula, score_min, score_max]
          );
        }
      }
      
      // Commit the transaction
      await db.query('COMMIT');
      
      return NextResponse.json({ success: true });
    } catch (error) {
      // Rollback in case of error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update question', details: error.message }, { status: 500 });
  }
}

// DELETE: Remove a question (global or from an itinerary)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const itineraryId = searchParams.get('itinerary_id');
    if (!id) {
      return NextResponse.json({ error: 'Missing question id' }, { status: 400 });
    }
    if (itineraryId) {
      // Unassign question from itinerary (delete link/override only)
      await db.query(
        `DELETE FROM right_to_play_itinerary_questions WHERE itinerary_id=? AND question_id=?`,
        [itineraryId, id]
      );
    } else {
      // Soft delete question globally
      await db.query(
        `UPDATE right_to_play_questions SET deleted_at=NOW() WHERE id=?`,
        [id]
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete question', details: error.message }, { status: 500 });
  }
}