import { NextResponse } from 'next/server';
import db from '@/utils/db';

/**
 * GET - Fetch detailed breakdown of pregnancy reentry data
 * Required parameters:
 * - metric: Which metric to break down (in_school, out_of_school, returned, reentry_rate)
 * 
 * Optional parameters:
 * - year: Filter by academic year (e.g., 2024)
 * - term: Filter by term (e.g., 1, 2, 3)
 * - week: Filter by week number
 * - level: Filter by class level (Primary, JHS, SHS, TVET)
 * - groupBy: How to group the data (school, district, circuit, region, question)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');
    const year = searchParams.get('year');
    const term = searchParams.get('term');
    const week = searchParams.get('week');
    const level = searchParams.get('level');
    const groupBy = searchParams.get('groupBy') || 'school';

    // Validate required parameters
    if (!metric) {
      return NextResponse.json(
        { error: 'Missing required parameter: metric' },
        { status: 400 }
      );
    }

    // Validate metric parameter
    const validMetrics = ['in_school', 'out_of_school', 'returned', 'reentry_rate'];
    if (!validMetrics.includes(metric)) {
      return NextResponse.json(
        { error: `Invalid metric: ${metric}. Valid options are: ${validMetrics.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate groupBy parameter
    const validGroupings = ['school', 'district', 'circuit', 'region', 'question'];
    if (!validGroupings.includes(groupBy)) {
      return NextResponse.json(
        { error: `Invalid groupBy: ${groupBy}. Valid options are: ${validGroupings.join(', ')}` },
        { status: 400 }
      );
    }

    const questionIds = {
      PGISA: 1, // Pregnant Girls In School - Attending
      PGDOS: 2, // Pregnant Girls Out of School
      GDRTS: 3, // Girls Dropped out Returned To School
      PGRTS: 4, // Pregnant Girls Returned To School (after delivery),
    };

    let selectClause = '';
    let groupByClause = '';

    // Temporary arrays for parameter segments
    const selectCalcParams = [];
    const whereFilterParams = [];
    const whereQuestionParams = [];

    // Determine selectClause and groupByClause based on groupBy parameter
    if (groupBy === 'school') {
      selectClause = `
        s.id AS entity_id,
        s.name AS entity_name,
        'school' AS entity_type,
        c.name AS parent_name,
        'circuit' AS parent_type,
        c.id AS parent_id
      `;
      groupByClause = 'GROUP BY s.id, s.name, c.name, c.id';
    } else if (groupBy === 'district') {
      selectClause = `
        d.id AS entity_id,
        d.name AS entity_name,
        'district' AS entity_type,
        r.name AS parent_name,
        'region' AS parent_type,
        r.id AS parent_id
      `;
      groupByClause = 'GROUP BY d.id, d.name, r.name, r.id';
    } else if (groupBy === 'circuit') {
      selectClause = `
        c.id AS entity_id,
        c.name AS entity_name,
        'circuit' AS entity_type,
        d.name AS parent_name,
        'district' AS parent_type,
        d.id AS parent_id
      `;
      groupByClause = 'GROUP BY c.id, c.name, d.name, d.id';
    } else if (groupBy === 'region') {
      selectClause = `
        r.id AS entity_id,
        r.name AS entity_name,
        'region' AS entity_type,
        'Ghana' AS parent_name, 
        'country' AS parent_type,
        NULL AS parent_id
      `;
      groupByClause = 'GROUP BY r.id, r.name';
    } else if (groupBy === 'question') {
      selectClause = `
        ptr.question_id AS entity_id,
        q.code AS entity_name, 
        'question' AS entity_type,
        q.question AS parent_name, 
        'question_text' AS parent_type,
        NULL AS parent_id
      `;
      groupByClause = 'GROUP BY ptr.question_id, q.code, q.question';
    }

    // Define the metric calculation and its parameters (selectCalcParams)
    let metricCalculation;
    if (metric === 'in_school') {
      metricCalculation = `
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS metric_value
      `;
      selectCalcParams.push(questionIds.PGISA);
    } else if (metric === 'out_of_school') {
      metricCalculation = `
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS metric_value
      `;
      selectCalcParams.push(questionIds.PGDOS);
    } else if (metric === 'returned') {
      metricCalculation = `
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) +
        SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) AS metric_value
      `;
      selectCalcParams.push(questionIds.GDRTS, questionIds.PGRTS);
    } else if (metric === 'reentry_rate') {
      metricCalculation = `
        ROUND(
          LEAST(
            (SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END) + 
             SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END)) * 100.0 / 
            NULLIF(SUM(CASE WHEN ptr.question_id = ? THEN ptr.numeric_response ELSE 0 END), 0),
            100 
          ),
          1
        ) AS metric_value
      `;
      selectCalcParams.push(questionIds.GDRTS, questionIds.PGRTS, questionIds.PGDOS);
    }

    // Build WHERE clauses and their parameters (whereFilterParams, whereQuestionParams)
    const whereClauses = [];
    if (year) {
      whereClauses.push('ptr.year = ?');
      whereFilterParams.push(year);
    }
    if (term) {
      whereClauses.push('ptr.term = ?');
      whereFilterParams.push(term);
    }
    if (week) {
      whereClauses.push('ptr.week = ?');
      whereFilterParams.push(week);
    }
    if (level) {
      whereClauses.push('s.education_level = ?'); 
      whereFilterParams.push(level);
    }

    const relevantQuestionIds = [];
    if (metric === 'in_school') relevantQuestionIds.push(questionIds.PGISA);
    else if (metric === 'out_of_school') relevantQuestionIds.push(questionIds.PGDOS);
    else if (metric === 'returned') relevantQuestionIds.push(questionIds.GDRTS, questionIds.PGRTS);
    else if (metric === 'reentry_rate') relevantQuestionIds.push(questionIds.GDRTS, questionIds.PGRTS, questionIds.PGDOS);

    if (relevantQuestionIds.length > 0) {
      whereClauses.push(`ptr.question_id IN (${relevantQuestionIds.map(() => '?').join(',')})`);
      whereQuestionParams.push(...relevantQuestionIds);
    }
    
    // Combine all query parameters in the correct order for the SQL query
    const queryParams = [...selectCalcParams, ...whereFilterParams, ...whereQuestionParams];

    // Build the complete query
    let query = `
      SELECT 
        ${selectClause},
        ${metricCalculation},
        COUNT(DISTINCT ptr.school_id) AS school_count
      FROM pregnancy_tracker_responses ptr
      JOIN schools s ON ptr.school_id = s.id
      JOIN districts d ON s.district_id = d.id
      JOIN circuits c ON s.circuit_id = c.id
      JOIN regions r ON s.region_id = r.id
    `;
    
    // Add join for question data if grouping by question
    if (groupBy === 'question') {
      query += `JOIN pregnancy_tracker_questions q ON ptr.question_id = q.id`;
    }
    
    // Add where clause
    if (whereClauses.length > 0) {
      query += `\nWHERE ${whereClauses.join(' AND ')}`;
    }
    
    // Add group by and order by
    query += `\n${groupByClause}`;
    query += `\nORDER BY metric_value DESC`;
    query += `\nLIMIT 100`;

    // Execute the query
    const [results] = await db.query(query, queryParams);

    // Process the results
    const processedResults = results.map(item => ({
      id: item.entity_id,
      name: item.entity_name,
      type: item.entity_type,
      parent: {
        name: item.parent_name,
        type: item.parent_type,
        id: item.parent_id
      },
      value: parseFloat(item.metric_value) || 0,
      schoolCount: parseInt(item.school_count) || 0
    }));

    // If grouping by question, add the question text
    if (groupBy === 'question') {
      processedResults.forEach(item => {
        if (questionIds[item.name]) {
          item.question = questionIds[item.name];
        }
      });
    }

    // Return the results
    return NextResponse.json({
      metric,
      groupBy,
      filters: {
        year,
        term,
        week,
        level
      },
      results: processedResults
    });
  } catch (error) {
    console.error('Error fetching breakdown data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch breakdown data' },
      { status: 500 }
    );
  }
}
