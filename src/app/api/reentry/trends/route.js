import { NextResponse } from 'next/server';
import db from '@/utils/db'; // Assuming db utility is in this path

const questionIds = {
  PGISA: 1, // Pregnant Girls In School - Attending
  PGDOS: 2, // Pregnant Girls Out of School
  GDRTS: 3, // Girls Dropped out Returned To School
  PGRTS: 4, // Pregnant Girls Returned To School (after delivery)
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const viewBy = searchParams.get('viewBy') || 'terms'; // 'terms' or 'years'
    const currentYear = searchParams.get('year'); // For context, might not be needed for 'last 6 terms'
    const currentTerm = searchParams.get('term'); // For context
    // Add other necessary params like startYear for yearly trends if needed

    let results = [];

    if (viewBy === 'terms') {
      // Step 1: Get the last 6 distinct terms with data
      const distinctTermsQuery = `
        SELECT DISTINCT year, term 
        FROM pregnancy_tracker_responses 
        ORDER BY year DESC, term DESC 
        LIMIT 6;
      `;
      const [distinctTermsData] = await db.query(distinctTermsQuery);

      if (!distinctTermsData || distinctTermsData.length === 0) {
        // No terms found, return empty results
        return NextResponse.json([]);
      }

      // Step 2: Construct the WHERE clause for the main query using these terms
      // Ensure your db utility provides an escape method. If not, adjust parameterization.
      const termConditions = distinctTermsData.map(t => `(ptr.year = ${db.escape(t.year)} AND ptr.term = ${db.escape(t.term)})`).join(' OR ');

      const termTrendQuery = `
        SELECT
          ptr.year, 
          ptr.term,
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
            ), 1
          ) AS reentry_rate
        FROM pregnancy_tracker_responses ptr
        WHERE (${termConditions}) /* Use the constructed OR conditions */
        AND ptr.question_id IN (?, ?, ?, ?)
        GROUP BY ptr.year, ptr.term
        ORDER BY ptr.year ASC, ptr.term ASC;
      `;
      
      const termTrendParams = [
        questionIds.PGISA, // in_school
        questionIds.PGDOS, // out_of_school
        questionIds.GDRTS, questionIds.PGRTS, // returned
        questionIds.GDRTS, questionIds.PGRTS, questionIds.PGDOS, // reentry_rate (GDRTS, PGRTS for numerator, PGDOS for denominator)
        questionIds.PGISA, questionIds.PGDOS, questionIds.GDRTS, questionIds.PGRTS // for the IN clause
      ];
      
      const [termData] = await db.query(termTrendQuery, termTrendParams);
      results = termData;

    } else if (viewBy === 'years') {
      // Logic for fetching annual data (sum for metrics, calculated rate)
      // This will involve querying from a start year (e.g., 2020) up to a target year.
      // Placeholder for now:
      const startYearForTrend = searchParams.get('startYear') || '2020';
      const endYearForTrend = currentYear || new Date().getFullYear().toString();

      const yearTrendQuery = `
        SELECT
          ptr.year,
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
            ), 1
          ) AS reentry_rate
        FROM pregnancy_tracker_responses ptr
        WHERE ptr.year >= ? AND ptr.year <= ?
        AND ptr.question_id IN (?, ?, ?, ?)
        GROUP BY ptr.year
        ORDER BY ptr.year ASC;
      `;
      const yearTrendParams = [
        questionIds.PGISA, // in_school
        questionIds.PGDOS, // out_of_school
        questionIds.GDRTS, questionIds.PGRTS, // returned
        questionIds.GDRTS, questionIds.PGRTS, questionIds.PGDOS, // reentry_rate
        startYearForTrend,
        endYearForTrend,
        questionIds.PGISA, questionIds.PGDOS, questionIds.GDRTS, questionIds.PGRTS // for the IN clause
      ];
      const [yearData] = await db.query(yearTrendQuery, yearTrendParams);
      results = yearData;
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in /api/reentry/trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trend data', details: error.message },
      { status: 500 }
    );
  }
}
