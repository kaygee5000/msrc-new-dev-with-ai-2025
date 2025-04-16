import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET - Get a single response by ID with all its details
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ message: 'Response ID is required' }, { status: 400 });
    }
    
    // Query to get response details including related data
    const query = `
      SELECT 
        r.id,
        r.user_id AS userId,
        r.school_id AS schoolId,
        r.class_level AS classLevel,
        r.frequency,
        r.submitted_at AS submittedAt,
        s.name AS schoolName,
        d.name AS districtName,
        c.name AS circuitName,
        reg.name AS regionName,
        q.thematic_areas AS thematicAreas,
        q.code AS questionCode,
        q.question AS questionText,
        COALESCE(r.response_text, r.response_number) AS response
      FROM 
        field_msrcghana_db.pregnancy_responses_raw r
        JOIN field_msrcghana_db.schools s ON r.school_id = s.id
        JOIN field_msrcghana_db.districts d ON s.district_id = d.id
        JOIN field_msrcghana_db.circuits c ON s.circuit_id = c.id
        JOIN field_msrcghana_db.regions reg ON d.region_id = reg.id
        JOIN field_msrcghana_db.pregnancy_tracker_questions q ON r.question_id = q.id
      WHERE 
        r.id = ? OR r.school_id = ? AND submitted_at = (
          SELECT submitted_at FROM field_msrcghana_db.pregnancy_responses_raw WHERE id = ?
        )
      ORDER BY q.id
    `;
    
    const [rows] = await db.query(query, [id, id, id]);
    
    if (rows.length === 0) {
      return NextResponse.json({ message: 'Response not found' }, { status: 404 });
    }
    
    // Get academic term from a system-config query
    const [termRows] = await db.query(`
      SELECT 
        term, 
        week_number,
        year 
      FROM 
        field_msrcghana_db.latest_student_enrolments
      ORDER BY 
        year DESC, 
        term DESC, 
        week_number DESC
      LIMIT 1
    `);
    
    // Format the academic term
    const academicTerm = termRows.length > 0 
      ? `Term ${termRows[0].term} ${termRows[0].week_number ? '(Week ' + termRows[0].week_number + ')' : ''} - ${termRows[0].year}`
      : 'Current Term';
    
    // Assemble the full response object
    const submission = {
      id: rows[0].id,
      userId: rows[0].userId,
      schoolId: rows[0].schoolId,
      classLevel: rows[0].classLevel,
      frequency: rows[0].frequency,
      submittedAt: rows[0].submittedAt,
      createdAt: rows[0].submittedAt,
      academicTerm: academicTerm,
      school: {
        name: rows[0].schoolName,
        district: { name: rows[0].districtName },
        circuit: { name: rows[0].circuitName },
        region: { name: rows[0].regionName }
      },
      responses: {},
      metadata: {
        regionName: rows[0].regionName,
        districtName: rows[0].districtName,
        circuitName: rows[0].circuitName
      }
    };
    
    // Populate responses from all fetched rows
    rows.forEach(row => {
      submission.responses[row.questionCode] = row.response;
    });
    
    return NextResponse.json(submission, { status: 200 });
  } catch (error) {
    console.error('Error fetching response:', error);
    return NextResponse.json({ message: 'Failed to fetch response', error: error.message }, { status: 500 });
  }
}