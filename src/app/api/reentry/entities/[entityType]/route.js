import { NextResponse } from 'next/server';
import db from '@/utils/db';

/**
 * GET - Fetch a list of entities (schools, circuits, districts, regions) with their summary metrics
 * Route parameters:
 * - entityType: 'schools', 'circuits', 'districts', or 'regions'
 * 
 * Optional query parameters:
 * - year: Filter by academic year (e.g., 2024)
 * - term: Filter by term (e.g., 1, 2, 3)
 * - week: Filter by week number
 * - level: Filter by class level (primary, jhs, shs, tvet)
 * - search: Search term to filter entities by name
 * - page: Page number for pagination (default: 1)
 * - limit: Number of items per page (default: 20)
 * - sortBy: Field to sort by (default: 'name')
 * - sortOrder: 'asc' or 'desc' (default: 'asc')
 * - parentId: ID of parent entity (e.g., districtId when fetching schools)
 */
export async function GET(request, { params }) {
  try {
    const { entityType } = params;
    const { searchParams } = new URL(request.url);
    
    // Validate entity type (remove trailing 's' to get singular form)
    const singularEntityType = entityType.endsWith('s') 
      ? entityType.slice(0, -1) 
      : entityType;
    
    if (!['school', 'circuit', 'district', 'region'].includes(singularEntityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type. Must be schools, circuits, districts, or regions' },
        { status: 400 }
      );
    }

    // Get query parameters
    const year = searchParams.get('year');
    const term = searchParams.get('term');
    const week = searchParams.get('week');
    const level = searchParams.get('level');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') || 'asc').toUpperCase();
    const parentId = searchParams.get('parentId');

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query conditions based on filters
    const entityWhereConditions = [];
    const entityQueryParams = [];

    // Add search condition if provided
    if (search) {
      entityWhereConditions.push(`e.name LIKE ?`);
      entityQueryParams.push(`%${search}%`);
    }

    // Add parent entity filter if provided
    if (parentId) {
      const parentEntityMap = {
        school: 'district_id',
        district: 'circuit_id',
        circuit: 'region_id'
      };
      
      const parentField = parentEntityMap[singularEntityType];
      if (parentField) {
        entityWhereConditions.push(`e.${parentField} = ?`);
        entityQueryParams.push(parentId);
      }
    }

    // Build the entity where clause
    const entityWhereClause = entityWhereConditions.length > 0 
      ? `WHERE ${entityWhereConditions.join(' AND ')}` 
      : '';

    // First, let's get the relevant question IDs
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

    // Build metric filter conditions
    const metricWhereConditions = [];
    const metricQueryParams = [];

    if (year) {
      metricWhereConditions.push('ptr.year = ?');
      metricQueryParams.push(year);
    }

    if (term) {
      metricWhereConditions.push('ptr.term = ?');
      metricQueryParams.push(term);
    }

    if (week) {
      metricWhereConditions.push('ptr.week = ?');
      metricQueryParams.push(week);
    }

    if (level) {
      metricWhereConditions.push('ptr.level = ?');
      metricQueryParams.push(level.toLowerCase());
    }

    // Build metric where clause
    const metricWhereClause = metricWhereConditions.length > 0 
      ? `WHERE ${metricWhereConditions.join(' AND ')}` 
      : '';

    // Count total entities for pagination
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM ${entityType} e
      ${entityWhereClause}
    `;

    // Query for entities with their metrics
    const entitiesQuery = `
      SELECT 
        e.*,
        COALESCE(metrics.total_pregnant_students, 0) AS total_pregnant_students,
        COALESCE(metrics.in_school, 0) AS in_school,
        COALESCE(metrics.out_of_school, 0) AS out_of_school,
        COALESCE(metrics.returned, 0) AS returned,
        COALESCE(metrics.reentry_rate, 0) AS reentry_rate
      FROM ${entityType} e
      LEFT JOIN (
        SELECT 
          s.${singularEntityType}_id,
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
        ${metricWhereClause}
        GROUP BY s.${singularEntityType}_id
      ) metrics ON e.id = metrics.${singularEntityType}_id
      ${entityWhereClause}
      ORDER BY ${sortBy === 'reentry_rate' ? 'metrics.reentry_rate' : `e.${sortBy}`} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    // Add question IDs and pagination params to query params
    const entitiesQueryParams = [
      questionMap['PGISA'] || 0,
      questionMap['PGDOS'] || 0,
      questionMap['PGISA'] || 0,
      questionMap['PGDOS'] || 0,
      questionMap['GDRTS'] || 0,
      questionMap['PGRTS'] || 0,
      questionMap['GDRTS'] || 0,
      questionMap['PGRTS'] || 0,
      questionMap['PGDOS'] || 0,
      ...metricQueryParams,
      ...entityQueryParams,
      limit,
      offset
    ];

    // Execute queries
    const [countResult, entities] = await Promise.all([
      db.query(countQuery, entityQueryParams),
      db.query(entitiesQuery, entitiesQueryParams)
    ]);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Format the response
    const response = {
      entities,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Error fetching ${params.entityType} list:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${params.entityType} list` },
      { status: 500 }
    );
  }
}
