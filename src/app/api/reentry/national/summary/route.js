import { NextResponse } from 'next/server';
import db from '@/utils/db';

/**
 * GET - Fetch national summary data for the pregnancy reentry dashboard
 * Optional query parameters:
 * - year: Filter by academic year (e.g., 2024)
 * - term: Filter by term (e.g., 1, 2, 3)
 * - week: Filter by week number
 * - level: Filter by class level (Primary, JHS, SHS, TVET)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const term = searchParams.get('term');
    const week = searchParams.get('week');
    const level = searchParams.get('level');

    // Build query conditions based on filters
    const whereConditions = [];
    const queryParams = [];

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
      queryParams.push(level.toLowerCase()); // Database stores levels in lowercase
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

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
    console.log("pregnancyQuestions results:", pregnancyQuestions);

    // The first element contains the actual query results
    const questionsData = Array.isArray(pregnancyQuestions[0]) ? pregnancyQuestions[0] : [];
    console.log("Questions data:", questionsData);

    if (!questionsData || questionsData.length === 0) {
      console.error("No pregnancy questions found in the database");
      return NextResponse.json(
        { 
          error: 'Pregnancy tracking questions not found in the database',
          details: 'No questions found with codes: PGISA, PGDOS, GDRTS, PGRTS'
        },
        { status: 500 }
      );
    }

    // Map question codes to IDs
    const questionMap = {};
    questionsData.forEach(q => {
      if (q && q.code && q.id) {
        questionMap[q.code] = q.id;
        console.log(`Mapped question: ${q.code} -> ${q.id}`);
      } else {
        console.warn('Invalid question format:', q);
      }
    });

    // Verify all required questions are present
    const requiredQuestions = ['PGISA', 'PGDOS', 'GDRTS', 'PGRTS'];
    const missingQuestions = requiredQuestions.filter(q => !questionMap[q]);

    if (missingQuestions.length > 0) {
      console.error("Missing required questions:", missingQuestions);
      return NextResponse.json(
        { 
          error: 'Missing required questions in database',
          missingQuestions: missingQuestions
        },
        { status: 500 }
      );
    }

    // Now we can safely use questionMap
    const questionIds = {
      PGISA: questionMap['PGISA'],
      PGDOS: questionMap['PGDOS'],
      GDRTS: questionMap['GDRTS'],
      PGRTS: questionMap['PGRTS']
    };

    console.log("Question IDs:", questionIds);

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
    LEAST(
      (SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) +
       SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END)) * 100.0 / 
      NULLIF(SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END), 0),
      100
    ), 
    1
  ) AS reentry_rate
FROM pregnancy_tracker_responses ptr
JOIN schools s ON ptr.school_id = s.id
WHERE ptr.question_id IN (?, ?, ?, ?)
${whereClause ? 'AND ' + whereClause.replace('WHERE ', '') : ''}
`;

    // Add question IDs to query params
    const summaryParams = [
      // For the CASE statements
      questionIds.PGISA, questionIds.PGDOS,  // total_pregnant_students
      questionIds.PGISA,                      // in_school
      questionIds.PGDOS,                      // out_of_school
      questionIds.GDRTS, questionIds.PGRTS,  // returned
      questionIds.GDRTS, questionIds.PGRTS,  // reentry_rate numerator
      questionIds.PGDOS,                     // reentry_rate denominator
      // For the WHERE IN clause
      questionIds.PGISA, questionIds.PGDOS, questionIds.GDRTS, questionIds.PGRTS,
      // Add the existing query params (year, term, week, level)
      ...queryParams
    ];

    console.log("summaryQuery", summaryQuery);
    console.log("summaryParams", summaryParams);

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
          LEAST(
            (SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) +
             SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END)) * 100.0 / 
            NULLIF(SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END), 0),
            100
          ), 
          1
        ) AS reentry_rate
      FROM pregnancy_tracker_responses ptr
      JOIN schools s ON ptr.school_id = s.id
      ${whereClause ? whereClause + ' AND' : 'WHERE'} ptr.question_id IN (?, ?, ?, ?)
      GROUP BY ptr.year, ptr.term
      ORDER BY ptr.year DESC, ptr.term DESC
      LIMIT 6
    `;

    // Add question IDs to trend params (same as summaryParams)
    const trendParams = [
      ...summaryParams.slice(0, -queryParams.length - 4), // All but the last 4 + queryParams
      ...queryParams,
      questionIds.PGISA, 
      questionIds.PGDOS, 
      questionIds.GDRTS, 
      questionIds.PGRTS
    ];

    console.log("trendQuery", trendQuery);
    console.log("trendParams", trendParams);

    // Query for recent submissions
    const recentSubmissionsQuery = `
      SELECT 
        s.id AS school_id,
        s.name AS school_name,
        d.id AS district_id,
        d.name AS district_name,
        c.id AS circuit_id,
        c.name AS circuit_name,
        r.id AS region_id,
        r.name AS region_name,
        ptr.year,
        ptr.term,
        ptr.week,
        MAX(ptr.created_at) AS submission_date,
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) +
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS total_students,
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS in_school,
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS out_of_school,
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) +
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS returned
      FROM pregnancy_tracker_responses ptr
      JOIN schools s ON ptr.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      JOIN circuits c ON s.circuit_id = c.id
      JOIN regions r ON s.region_id = r.id
      WHERE ptr.question_id IN (?, ?, ?, ?)
      ${whereClause ? 'AND ' + whereClause.replace('WHERE ', '') : ''}
      GROUP BY s.id, ptr.year, ptr.term, ptr.week
      ORDER BY submission_date DESC
      LIMIT 10
    `;

    // Add question IDs to recent submissions params
    const recentSubmissionsParams = [
      questionIds.PGISA, questionIds.PGDOS,  // total_students
      questionIds.PGISA,                     // in_school
      questionIds.PGDOS,                     // out_of_school
      questionIds.GDRTS, questionIds.PGRTS,  // returned
      questionIds.PGISA, questionIds.PGDOS, questionIds.GDRTS, questionIds.PGRTS,
      // Add the existing query params (year, term, week, level)
      ...queryParams
    ];

    console.log("recentSubmissionsParams", recentSubmissionsParams);

    // Execute queries
    const [summaryResults, trendResults, recentSubmissions] = await Promise.all([
      db.query(summaryQuery, summaryParams),
      db.query(trendQuery, trendParams),
      db.query(recentSubmissionsQuery, recentSubmissionsParams)  
    ]);

    console.log("summaryResults", summaryResults, "trendResults", trendResults, "recentSubmissions", recentSubmissions);

    // MySQL returns results as [rows, fields] where rows is the first element
    // Extract the actual data rows from the results
    const summaryRows = summaryResults[0] || [];
    const trendRows = trendResults[0] || [];
    const recentSubmissionsRows = recentSubmissions[0] || [];

    // Get the first summary row if it exists
    const summaryData = summaryRows.length > 0 ? summaryRows[0] : {};

    // Convert string values to numbers for numeric fields
    const processedSummary = {
      total_pregnant_students: parseInt(summaryData.total_pregnant_students || 0),
      in_school: parseInt(summaryData.in_school || 0),
      out_of_school: parseInt(summaryData.out_of_school || 0),
      returned: parseInt(summaryData.returned || 0),
      reentry_rate: parseFloat(summaryData.reentry_rate || 0)
    };

    // Process trend data
    const processedTrends = trendRows.map(trend => ({
      year: trend.year,
      term: trend.term,
      total_pregnant_students: parseInt(trend.total_pregnant_students || 0),
      in_school: parseInt(trend.in_school || 0),
      out_of_school: parseInt(trend.out_of_school || 0),
      returned: parseInt(trend.returned || 0),
      reentry_rate: parseFloat(trend.reentry_rate || 0)
    }));

    // Process recent submissions
    const processedSubmissions = recentSubmissionsRows.map(submission => ({
      school_id: submission.school_id,
      school_name: submission.school_name,
      district_id: submission.district_id,
      district_name: submission.district_name,
      circuit_id: submission.circuit_id,
      circuit_name: submission.circuit_name,
      region_id: submission.region_id,
      region_name: submission.region_name,
      year: submission.year,
      term: submission.term,
      week: submission.week,
      submission_date: submission.submission_date,
      total_students: parseInt(submission.total_students || 0),
      in_school: parseInt(submission.in_school || 0),
      out_of_school: parseInt(submission.out_of_school || 0),
      returned: parseInt(submission.returned || 0)
    }));

    console.log("Processed response:", {
      summary: processedSummary,
      trends: processedTrends,
      recentSubmissions: processedSubmissions
    });

    // Return the formatted response
    return NextResponse.json({
      summary: processedSummary,
      trends: processedTrends,
      recentSubmissions: processedSubmissions
    });
  } catch (error) {
    console.error('Error fetching national summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch national summary data' },
      { status: 500 }
    );
  }
}
