import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET - Get all responses for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }
    
    // Query to get distinct submissions grouped by school and date
    const query = `
      SELECT 
        MAX(r.id) as id,
        r.school_id AS schoolId,
        MAX(s.name) AS schoolName,
        MAX(r.submitted_at) AS submittedAt,
        MAX(d.name) AS districtName,
        MAX(c.name) AS circuitName,
        MAX(reg.name) AS regionName
      FROM 
        field_msrcghana_db.pregnancy_responses_raw r
        JOIN field_msrcghana_db.schools s ON r.school_id = s.id
        JOIN field_msrcghana_db.districts d ON s.district_id = d.id
        JOIN field_msrcghana_db.circuits c ON s.circuit_id = c.id
        JOIN field_msrcghana_db.regions reg ON d.region_id = reg.id
      WHERE 
        r.user_id = ?
      GROUP BY 
        r.school_id, DATE(r.submitted_at)
      ORDER BY 
        submittedAt DESC
    `;
    
    const [rows] = await db.query(query, [userId]);
    
    // Get academic term from system-config query
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
    
    // Format the response
    const responses = rows.map(row => ({
      id: row.id,
      schoolId: row.schoolId,
      createdAt: row.submittedAt,
      school: {
        name: row.schoolName,
        district: { name: row.districtName },
        circuit: { name: row.circuitName },
        region: { name: row.regionName }
      },
      academicTerm: academicTerm,
      metadata: {
        regionName: row.regionName,
        districtName: row.districtName,
        circuitName: row.circuitName
      }
    }));
    
    return NextResponse.json(responses, { status: 200 });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ message: 'Failed to fetch responses', error: error.message }, { status: 500 });
  }
}

// POST - Create new pregnancy response records
export async function POST(request) {
  try {
    const body = await request.json();
    const { schoolId, userId, responses, classLevel, frequency, academicTerm } = body;
    
    if (!schoolId || !userId || !responses || !classLevel || !frequency || !academicTerm) {
      return NextResponse.json({ 
        message: 'Missing required fields: schoolId, userId, responses, classLevel, frequency, academicTerm' 
      }, { status: 400 });
    }

    // Get current date/time for all records
    const submittedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

    try {
      // Get all pregnancy tracker questions
      const [questions] = await db.query(`
        SELECT id, code FROM field_msrcghana_db.pregnancy_tracker_questions
      `);
      // Create a map of question code to question id
      const questionMap = questions.reduce((map, q) => {
        map[q.code] = q.id;
        return map;
      }, {});
      // Create response records for each question
      const insertPromises = Object.entries(responses).map(async ([questionCode, answer]) => {
        const questionId = questionMap[questionCode];
        if (!questionId) {
          console.warn(`Question code ${questionCode} not found in database`);
          return null;
        }
        // Determine if the answer is numeric or text
        const isNumeric = !isNaN(answer) && answer !== '';
        const responseNumber = isNumeric ? parseFloat(answer) : null;
        const responseText = !isNumeric ? answer : null;
        // Insert into pregnancy_responses_raw table
        const [result] = await db.query(`
          INSERT INTO field_msrcghana_db.pregnancy_responses_raw (
            user_id, 
            school_id, 
            question_id, 
            response_number,
            response_text,
            class_level,
            frequency,
            submitted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          schoolId,
          questionId,
          responseNumber,
          responseText,
          classLevel,
          frequency,
          submittedAt
        ]);
        return result.insertId;
      });
      // Wait for all inserts to complete
      const insertIds = await Promise.all(insertPromises);
      return NextResponse.json({ 
        message: 'Responses submitted successfully',
        responseIds: insertIds.filter(id => id !== null),
        submittedAt
      }, { status: 201 });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error creating responses:', error);
    return NextResponse.json({ 
      message: 'Failed to submit responses', 
      error: error.message 
    }, { status: 500 });
  }
}