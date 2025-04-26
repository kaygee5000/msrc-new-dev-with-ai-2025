import { NextResponse } from 'next/server';
import db from '@/utils/db';

// API route for /api/rtp/itineraries/[id]
// GET: Get a specific itinerary by ID

export async function GET(req, { params }) {
  try {
    const { id } = params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid itinerary ID' }, { status: 400 });
    }
    
    // Query the database for the specific itinerary
    const [rows] = await db.query(`
      SELECT id, title, type, period, year, from_date, until_date, is_valid, created_at, updated_at
      FROM right_to_play_itineraries
      WHERE id = ? AND deleted_at IS NULL
    `, [id]);
    
    // Check if we found an itinerary
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }
    
    const itinerary = rows[0];
    
    // Get associated questions for this itinerary
    const [questions] = await db.query(`
      SELECT q.id, q.question, q.category_id, qc.name as category_name, 
             q.question_form, q.target, q.indicator_type
      FROM right_to_play_itinerary_questions iq
      JOIN right_to_play_questions q ON iq.question_id = q.id
      LEFT JOIN right_to_play_question_categories qc ON q.category_id = qc.id
      WHERE iq.itinerary_id = ? AND q.deleted_at IS NULL
      ORDER BY q.display_order ASC, q.id ASC
    `, [id]);
    
    // Get statistics for this itinerary (response counts)
    try {
      // Get information about table/view structure
      const [schemaInfo] = await db.query(`
        SELECT TABLE_NAME, TABLE_TYPE 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN (
          'right_to_play_school_responses',
          'right_to_play_district_responses', 
          'right_to_play_consolidated_checklist_responses',
          'right_to_play_pip_responses'
        )
      `);
      
      const tableInfo = {};
      schemaInfo.forEach(item => {
        tableInfo[item.TABLE_NAME] = {
          type: item.TABLE_TYPE,
          // Views don't support the deleted_at column filter
          hasDeletedAt: item.TABLE_TYPE !== 'VIEW'
        };
      });
      
      // Build a stats query that considers whether each object is a view or table
      const statsQueries = [];
      const queryParams = [];
      
      // School output responses
      if (tableInfo['right_to_play_school_responses']) {
        statsQueries.push(`
          (SELECT COUNT(DISTINCT school_id) FROM right_to_play_school_responses 
           WHERE itinerary_id = ?${tableInfo['right_to_play_school_responses'].hasDeletedAt ? ' AND deleted_at IS NULL' : ''}) as school_output_responses
        `);
        queryParams.push(id);
      } else {
        statsQueries.push(`0 as school_output_responses`);
      }
      
      // District output responses
      if (tableInfo['right_to_play_district_responses']) {
        statsQueries.push(`
          (SELECT COUNT(DISTINCT district_id) FROM right_to_play_district_responses 
           WHERE itinerary_id = ?${tableInfo['right_to_play_district_responses'].hasDeletedAt ? ' AND deleted_at IS NULL' : ''}) as district_output_responses
        `);
        queryParams.push(id);
      } else {
        statsQueries.push(`0 as district_output_responses`);
      }
      
      // Consolidated checklist responses
      if (tableInfo['right_to_play_consolidated_checklist_responses']) {
        statsQueries.push(`
          (SELECT COUNT(DISTINCT school_id) FROM right_to_play_consolidated_checklist_responses 
           WHERE itinerary_id = ?${tableInfo['right_to_play_consolidated_checklist_responses'].hasDeletedAt ? ' AND deleted_at IS NULL' : ''}) as checklist_responses
        `);
        queryParams.push(id);
      } else {
        statsQueries.push(`0 as checklist_responses`);
      }
      
      // Partners in play responses
      if (tableInfo['right_to_play_pip_responses']) {
        statsQueries.push(`
          (SELECT COUNT(DISTINCT school_id) FROM right_to_play_pip_responses 
           WHERE itinerary_id = ?${tableInfo['right_to_play_pip_responses'].hasDeletedAt ? ' AND deleted_at IS NULL' : ''}) as pip_responses
        `);
        queryParams.push(id);
      } else {
        statsQueries.push(`0 as pip_responses`);
      }
      
      const statsQuery = `SELECT ${statsQueries.join(', ')}`;
      
      const [stats] = await db.query(statsQuery, queryParams);
      
      // Format the response
      const result = {
        ...itinerary,
        questions,
        stats: stats[0] || {
          school_output_responses: 0,
          district_output_responses: 0,
          checklist_responses: 0,
          pip_responses: 0
        }
      };
      
      return NextResponse.json(result);
    } catch (statsError) {
      console.error('Error fetching statistics:', statsError);
      
      // Even if stats fail, return the itinerary with empty stats
      const result = {
        ...itinerary,
        questions,
        stats: {
          school_output_responses: 0,
          district_output_responses: 0,
          checklist_responses: 0,
          pip_responses: 0,
          error: "Could not fetch statistics"
        }
      };
      
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching itinerary details:', error);
    return NextResponse.json({ error: 'Failed to fetch itinerary details', details: error.message }, { status: 500 });
  }
}