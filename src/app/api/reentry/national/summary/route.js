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

    console.log("pregnancyQuestionsQuery", pregnancyQuestionsQuery);
    
    
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
    
    console.log("summaryQuery", summaryQuery);
    
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
      ${whereClause ? whereClause + ' AND' : 'WHERE'} ptr.question_id IN (?, ?, ?, ?)
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
      GROUP BY s.id, ptr.year, ptr.term, ptr.week
      ORDER BY submission_date DESC
      LIMIT 10
    `;
    
    // Add question IDs to recent submissions params
    const recentSubmissionsParams = [
      questionMap['PGISA'] || 0,
      questionMap['PGDOS'] || 0,
      questionMap['PGISA'] || 0,
      questionMap['PGDOS'] || 0,
      questionMap['GDRTS'] || 0,
      questionMap['PGRTS'] || 0,
      questionMap['PGISA'] || 0,
      questionMap['PGDOS'] || 0,
      questionMap['GDRTS'] || 0,
      questionMap['PGRTS'] || 0
    ];

    // Execute queries
    const [summaryResults, trendResults, recentSubmissions] = await Promise.all([
      db.query(summaryQuery, summaryParams),
      db.query(trendQuery, trendParams),
      db.query(recentSubmissionsQuery, recentSubmissionsParams)
    ]);

    console.log("summaryResults",summaryResults,"trendResults", trendResults, "recentSubmissions", recentSubmissions);
    
    // Process the results to clean up the data
    // For summary, extract the first result object
    const summaryData = summaryResults && summaryResults.length > 0 && summaryResults[0] 
      ? {
          total_pregnant_students: summaryResults[0].total_pregnant_students || 0,
          in_school: summaryResults[0].in_school || 0,
          out_of_school: summaryResults[0].out_of_school || 0,
          returned: summaryResults[0].returned || 0,
          reentry_rate: summaryResults[0].reentry_rate || 0
        }
      : {
          total_pregnant_students: 0,
          in_school: 0,
          out_of_school: 0,
          returned: 0,
          reentry_rate: 0
        };

    // For trends, map the array to clean objects
    const trendsData = Array.isArray(trendResults) 
      ? trendResults.map(trend => ({
          year: trend.year,
          term: trend.term,
          total_pregnant_students: trend.total_pregnant_students || 0,
          in_school: trend.in_school || 0,
          out_of_school: trend.out_of_school || 0,
          returned: trend.returned || 0,
          reentry_rate: trend.reentry_rate || 0
        }))
      : [];

    // For recent submissions, map the array to clean objects
    const submissionsData = Array.isArray(recentSubmissions)
      ? recentSubmissions.map(submission => ({
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
          total_students: submission.total_students || 0,
          in_school: submission.in_school || 0,
          out_of_school: submission.out_of_school || 0,
          returned: submission.returned || 0
        }))
      : [];

    // Format the response with clean data
    const response = {
      summary: summaryData,
      trends: trendsData,
      recentSubmissions: submissionsData
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching national summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch national summary data' },
      { status: 500 }
    );
  }
}
