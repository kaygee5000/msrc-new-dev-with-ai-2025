import { NextResponse } from 'next/server';
import db from '@/utils/db';

/**
 * GET - Fetch data for a specific entity (school, circuit, district, region)
 * Route parameters:
 * - entityType: 'school', 'circuit', 'district', or 'region'
 * - entityId: The ID of the entity
 * 
 * Optional query parameters:
 * - year: Filter by academic year (e.g., 2024)
 * - term: Filter by term (e.g., 1, 2, 3)
 * - week: Filter by week number
 * - level: Filter by class level (primary, jhs, shs, tvet)
 */
export async function GET(request, { params }) {
  try {
    const { entityType, entityId } = params;
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const term = searchParams.get('term');
    const week = searchParams.get('week');
    const level = searchParams.get('level');

    // Validate entity type
    if (!['school', 'circuit', 'district', 'region'].includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type. Must be school, circuit, district, or region' },
        { status: 400 }
      );
    }

    // Build query conditions based on filters
    const whereConditions = [`s.${entityType}_id = ?`];
    const queryParams = [entityId];

    if (year) {
      whereConditions.push('ptr.year = ?');
      queryParams.push(year);
    }

    if (term) {
      whereConditions.push('ptr.term = ?');
      queryParams.push(term);
    }

    if (week) {
      whereConditions.push('ptr.week = ?');
      queryParams.push(week);
    }

    if (level) {
      whereConditions.push('ptr.level = ?');
      queryParams.push(level.toLowerCase());
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Get entity details
    const entityQuery = `
      SELECT * FROM ${entityType}s WHERE id = ?
    `;

    // First, let's get the relevant question IDs
    // Based on the actual database, we have these question codes:
    // - PGISA: Girls pregnant and in school
    // - PGDOS: Girls pregnant and dropped out of school
    // - GDRTS/PGRTS: Girls who returned to school after childbirth
    
    const pregnancyQuestionsQuery = `
      SELECT id, code, question 
      FROM pregnancy_tracker_questions 
      WHERE code IN ('PGISA', 'PGDOS', 'GDRTS', 'PGRTS')
    `;
    
    const pregnancyQuestions = await db.query(pregnancyQuestionsQuery);
    
    if (!pregnancyQuestions || pregnancyQuestions.length === 0) {
      return NextResponse.json(
        { error: 'Pregnancy tracking questions not found in the database' },
        { status: 500 }
      );
    }
    
    // Map question codes to IDs
    const questionMap = {};
    pregnancyQuestions.forEach(q => {
      questionMap[q.code] = q.id;
    });

    // Query for summary metrics using the question IDs
    const summaryQuery = `
      SELECT 
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) +
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS total_pregnant_students,
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS in_school,
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS out_of_school,
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) +
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS returned,
        ROUND(
          (SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) +
           SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END)) * 100.0 / 
          NULLIF(SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END), 0), 
          1
        ) AS reentry_rate
      FROM pregnancy_tracker_responses ptr
      JOIN schools s ON ptr.school_id = s.id
      ${whereClause}
    `;
    
    // Add question IDs to query params
    const summaryParams = [
      questionMap['PGISA'] || 0,
      questionMap['PGDOS'] || 0,
      questionMap['PGISA'] || 0,
      questionMap['PGDOS'] || 0,
      questionMap['GDRTS'] || 0,
      questionMap['PGRTS'] || 0,
      questionMap['GDRTS'] || 0,
      questionMap['PGRTS'] || 0,
      questionMap['PGDOS'] || 0,
      ...queryParams
    ];

    // Query for trend data (last 6 terms)
    const trendQuery = `
      SELECT 
        ptr.year,
        ptr.term,
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) +
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS total_pregnant_students,
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS in_school,
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS out_of_school,
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) +
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS returned,
        ROUND(
          (SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) +
           SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END)) * 100.0 / 
          NULLIF(SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END), 0), 
          1
        ) AS reentry_rate
      FROM pregnancy_tracker_responses ptr
      JOIN schools s ON ptr.school_id = s.id
      ${whereClause} AND ptr.question_id IN (?, ?, ?, ?)
      GROUP BY ptr.year, ptr.term
      ORDER BY ptr.year DESC, ptr.term DESC
      LIMIT 6
    `;
    
    // Add question IDs to trend params
    const trendParams = [
      questionMap['PGISA'] || 0,
      questionMap['PGDOS'] || 0,
      questionMap['PGISA'] || 0,
      questionMap['PGDOS'] || 0,
      questionMap['GDRTS'] || 0,
      questionMap['PGRTS'] || 0,
      questionMap['GDRTS'] || 0,
      questionMap['PGRTS'] || 0,
      questionMap['PGDOS'] || 0,
      ...queryParams,
      questionMap['PGISA'] || 0,
      questionMap['PGDOS'] || 0,
      questionMap['GDRTS'] || 0,
      questionMap['PGRTS'] || 0
    ];

    // Query for submissions data
    const submissionsQuery = `
      SELECT 
        s.id AS school_id,
        s.name AS school_name,
        ptr.year,
        ptr.term,
        ptr.week,
        ptr.level,
        MAX(ptr.created_at) AS submission_date,
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) +
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS total_students,
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS in_school,
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS out_of_school,
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) +
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS returned
      FROM pregnancy_tracker_responses ptr
      JOIN schools s ON ptr.school_id = s.id
      ${whereClause} AND ptr.question_id IN (?, ?, ?, ?)
      GROUP BY s.id, ptr.year, ptr.term, ptr.week, ptr.level
      ORDER BY submission_date DESC
      LIMIT 20
    `;
    
    // Add question IDs to submissions params
    const submissionsParams = [
      questionMap['PGISA'] || 0,
      questionMap['PGDOS'] || 0,
      questionMap['PGISA'] || 0,
      questionMap['PGDOS'] || 0,
      questionMap['GDRTS'] || 0,
      questionMap['PGRTS'] || 0,
      ...queryParams,
      questionMap['PGISA'] || 0,
      questionMap['PGDOS'] || 0,
      questionMap['GDRTS'] || 0,
      questionMap['PGRTS'] || 0
    ];

    // Execute queries
    const [entityDetails, summaryResults, trendResults, submissions] = await Promise.all([
      db.query(entityQuery, [entityId]),
      db.query(summaryQuery, summaryParams),
      db.query(trendQuery, trendParams),
      db.query(submissionsQuery, submissionsParams)
    ]);

    if (!entityDetails || entityDetails.length === 0) {
      return NextResponse.json(
        { error: `${entityType} not found` },
        { status: 404 }
      );
    }

    // Format the response
    const response = {
      entity: entityDetails[0],
      summary: summaryResults[0] || {
        total_pregnant_students: 0,
        in_school: 0,
        out_of_school: 0,
        returned: 0,
        reentry_rate: 0
      },
      trends: trendResults,
      submissions: submissions
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Error fetching ${params.entityType} data:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${params.entityType} data` },
      { status: 500 }
    );
  }
}
