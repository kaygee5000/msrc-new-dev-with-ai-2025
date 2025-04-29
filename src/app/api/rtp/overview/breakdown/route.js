import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getConnectionConfig } from '@/utils/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const itineraryId = searchParams.get('itineraryId');
    const type = searchParams.get('type');
    if (!itineraryId || !type) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }
    const conn = await mysql.createConnection(getConnectionConfig());
    try {
      let rows = [];
      if (type === 'activeSchools' || type === 'school-output') {
        // list all school-output submissions from right_to_play_question_answers
        const [data] = await conn.execute(
          `SELECT a.school_id AS entityId,
                  s.name AS entityName,
                  'School Output' AS area,
                  a.created_at AS date,
                  u.name AS submittedBy
           FROM right_to_play_question_answers a
           JOIN schools s ON a.school_id = s.id
           LEFT JOIN users u ON a.user_id = u.id
           WHERE a.itinerary_id = ?`,
          [itineraryId]
        );
        rows = data;
      } else if (type === 'district-output') {
        // list all district-output submissions from right_to_play_district_responses
        const [data] = await conn.execute(
          `SELECT r.district_id AS entityId,
                  d.name AS entityName,
                  'District Output' AS area,
                  r.submitted_at AS date,
                  u.name AS submittedBy
           FROM right_to_play_district_responses r
           JOIN districts d ON r.district_id = d.id
           LEFT JOIN users u ON r.submitted_by = u.id
           WHERE r.itinerary_id = ?`,
          [itineraryId]
        );
        rows = data;
      } else if (type === 'consolidated-checklist') {
        // list all consolidated-checklist submissions from right_to_play_consolidated_checklist_responses
        const [data] = await conn.execute(
          `SELECT r.school_id AS entityId,
                  s.name AS entityName,
                  'Consolidated Checklist' AS area,
                  r.submitted_at AS date,
                  u.name AS submittedBy
           FROM right_to_play_consolidated_checklist_responses r
           JOIN schools s ON r.school_id = s.id
           LEFT JOIN users u ON r.submitted_by = u.id
           WHERE r.itinerary_id = ?`,
          [itineraryId]
        );
        rows = data;
      } else if (type === 'partners-in-play') {
        // list all partners-in-play submissions from right_to_play_pip_responses
        const [data] = await conn.execute(
          `SELECT r.school_id AS entityId,
                  s.name AS entityName,
                  'Partners in Play' AS area,
                  r.submitted_at AS date,
                  u.name AS submittedBy
           FROM right_to_play_pip_responses r
           JOIN schools s ON r.school_id = s.id
           LEFT JOIN users u ON r.submitted_by = u.id
           WHERE r.itinerary_id = ?`,
          [itineraryId]
        );
        rows = data;
      } else {
        return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: rows });
    } finally {
      await conn.end();
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to load breakdown data' }, { status: 500 });
  }
}