import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET: List all questions (optionally by category)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let categoryIds = searchParams.getAll('category_id');
    // Support comma-separated or multiple category_id params
    if (categoryIds.length === 1 && categoryIds[0]?.includes(',')) {
      categoryIds = categoryIds[0].split(',').map(id => id.trim()).filter(Boolean);
    }
    const surveyType = searchParams.get('survey_type');
    // Always fetch from global questions, ignoring itinerary
    let whereClause = 'q.deleted_at IS NULL';
    const params = [];
    if (categoryIds.length > 0) {
      whereClause += ` AND q.category_id IN (${categoryIds.map(() => '?').join(',')})`;
      params.push(...categoryIds);
    }
    if (surveyType) {
      whereClause += ' AND q.question_form = ?';
      params.push(surveyType);
    }
    const [rows] = await db.query(`
      SELECT
        q.*,
        qsc.score_value,
        qsc.scoring_logic,
        qsc.scoring_formula,
        qsc.score_min,
        qsc.score_max,
        qc.name as category_name
      FROM right_to_play_questions q
      JOIN right_to_play_question_categories qc ON q.category_id = qc.id
      LEFT JOIN right_to_play_question_scoring qsc ON q.id = qsc.question_id
      WHERE ${whereClause}
      ORDER BY q.display_order ASC, q.id ASC
    `, params);

    // Load answer options for these questions
    const questionIds = rows.map(q => q.id);
    let options = [];
    if (questionIds.length) {
      const placeholders = questionIds.map(() => '?').join(',');
      const [optRows] = await db.query(
        `SELECT * FROM right_to_play_question_answer_options WHERE question_id IN (${placeholders}) ORDER BY id ASC`,
        questionIds
      );
      options = optRows;
    }
    const optionsMap = options.reduce((acc, opt) => {
      (acc[opt.question_id] = acc[opt.question_id] || []).push(opt);
      return acc;
    }, {});

    const questions = rows.map(q => ({
      ...q,
      hasScoring: !!q.score_value || !!q.scoring_logic || !!q.scoring_formula,
      answers: optionsMap[q.id] || []
    }));
    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch questions', details: error.message }, { status: 500 });
  }
}

// POST: Add a new question (global only)
export async function POST(req) {
  try {
    const body = await req.json();
    const { question, question_form, close_ended_answer_form, open_ended_answer_form, target, indicator_type, is_required = 1, category_id, display_order = 0,
            score_value, scoring_logic, scoring_formula, score_min, score_max } = body;
    if (!question_form || !question || !category_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    await db.query('START TRANSACTION');
    try {
      const [result] = await db.query(
        `INSERT INTO right_to_play_questions 
         (question, question_form, close_ended_answer_form, open_ended_answer_form, target, indicator_type, is_required, category_id, display_order, is_valid, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [question, question_form, close_ended_answer_form, open_ended_answer_form, target, indicator_type, is_required, category_id, display_order]
      );
      const questionId = result.insertId;
      if (score_value || scoring_logic || scoring_formula) {
        await db.query(
          `INSERT INTO right_to_play_question_scoring 
           (question_id, score_value, scoring_logic, scoring_formula, score_min, score_max, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [questionId, score_value, scoring_logic, scoring_formula, score_min, score_max]
        );
      }
      await db.query('COMMIT');
      return NextResponse.json({ success: true, question_id: questionId });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add question', details: error.message }, { status: 500 });
  }
}

// PUT: Edit a question (global only)
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, question, question_form, close_ended_answer_form, open_ended_answer_form, target, indicator_type, is_required, category_id, display_order,
            score_value, scoring_logic, scoring_formula, score_min, score_max } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing question id' }, { status: 400 });
    }
    await db.query('START TRANSACTION');
    try {
      await db.query(
        `UPDATE right_to_play_questions 
         SET question=?, question_form=?, close_ended_answer_form=?, open_ended_answer_form=?, target=?, indicator_type=?, is_required=?, category_id=?, display_order=?, updated_at=NOW()
         WHERE id=?`,
        [question, question_form, close_ended_answer_form, open_ended_answer_form, target, indicator_type, is_required, category_id, display_order, id]
      );
      const [existing] = await db.query(`SELECT id FROM right_to_play_question_scoring WHERE question_id=?`, [id]);
      if (existing.length) {
        await db.query(
          `UPDATE right_to_play_question_scoring SET score_value=?, scoring_logic=?, scoring_formula=?, score_min=?, score_max=?, updated_at=NOW() WHERE question_id=?`,
          [score_value, scoring_logic, scoring_formula, score_min, score_max, id]
        );
      } else if (score_value || scoring_logic || scoring_formula) {
        await db.query(
          `INSERT INTO right_to_play_question_scoring (question_id, score_value, scoring_logic, scoring_formula, score_min, score_max, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [id, score_value, scoring_logic, scoring_formula, score_min, score_max]
        );
      }
      await db.query('COMMIT');
      return NextResponse.json({ success: true });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update question', details: error.message }, { status: 500 });
  }
}

// DELETE: Remove a question (global only)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing question id' }, { status: 400 });
    }
    await db.query(`UPDATE right_to_play_questions SET deleted_at=NOW() WHERE id=?`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete question', details: error.message }, { status: 500 });
  }
}