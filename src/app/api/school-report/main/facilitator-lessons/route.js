import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/utils/db';

// GET handler for facilitator lessons data
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('school_id');
    const circuitId = searchParams.get('circuit_id');
    const districtId = searchParams.get('district_id');
    const regionId = searchParams.get('region_id');
    const year = searchParams.get('year');
    const term = searchParams.get('term');

    // Validate required parameters
    if (!year || !term) {
      return NextResponse.json({ message: 'Year and term are required parameters' }, { status: 400 });
    }
    
    // Get optional week parameter
    const week = searchParams.get('week');

    // Build query based on provided filters
    let query = `
      SELECT 
        fl.id as lesson_id,
        f.id as facilitator_id,
        f.first_name,
        f.last_name,
        s.id as school_id,
        s.name as school_name,
        c.id as circuit_id,
        c.name as circuit_name,
        d.id as district_id,
        d.name as district_name,
        r.id as region_id,
        r.name as region_name,
        fl.year,
        fl.term,
        fl.month,
        fl.week,
        fl.subject,
        fl.grade,
        fl.exercises_given,
        fl.exercises_marked,
        fl.lesson_plans_prepared,
        fl.units_covered,
        fl.units_total,
        fl.completion_rate,
        fl.created_at,
        fl.updated_at
      FROM facilitator_lessons fl
      JOIN facilitators f ON fl.facilitator_id = f.id
      JOIN schools s ON fl.school_id = s.id
      JOIN circuits c ON s.circuit_id = c.id
      JOIN districts d ON c.district_id = d.id
      JOIN regions r ON d.region_id = r.id
      WHERE fl.year = ? AND fl.term = ?
    `;

    const queryParams = [year, term];

    // Add filters based on provided parameters
    if (schoolId) {
      query += ' AND s.id = ?';
      queryParams.push(schoolId);
    } else if (circuitId) {
      query += ' AND c.id = ?';
      queryParams.push(circuitId);
    } else if (districtId) {
      query += ' AND d.id = ?';
      queryParams.push(districtId);
    } else if (regionId) {
      query += ' AND r.id = ?';
      queryParams.push(regionId);
    }
    
    // Add week filter if provided
    if (week) {
      query += ' AND fl.week = ?';
      queryParams.push(week);
    }

    query += ' ORDER BY r.name, d.name, c.name, s.name, f.last_name, f.first_name, fl.subject, fl.grade';

    // Execute query
    const [results] = await pool.query(query, queryParams);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching facilitator lessons data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for creating/updating facilitator lessons
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.facilitator_id || !data.school_id || !data.year || !data.term || 
        !data.subject || !data.grade) {
      return NextResponse.json({ 
        message: 'Facilitator ID, school ID, year, term, subject, and grade are required fields' 
      }, { status: 400 });
    }

    // Calculate completion rate
    const unitsCovered = data.units_covered || 0;
    const unitsTotal = data.units_total || 0;
    const completionRate = unitsTotal > 0 ? (unitsCovered / unitsTotal) * 100 : 0;

    // Check if record exists
    const [existing] = await pool.query(
      `SELECT id FROM facilitator_lessons 
       WHERE facilitator_id = ? AND school_id = ? AND year = ? AND term = ? AND subject = ? AND grade = ?`,
      [data.facilitator_id, data.school_id, data.year, data.term, data.subject, data.grade]
    );

    let result;
    
    if (existing && existing.length > 0) {
      // Update existing record
      const [updateResult] = await pool.query(
        `UPDATE facilitator_lessons SET 
          month = ?,
          week = ?,
          exercises_given = ?,
          exercises_marked = ?,
          lesson_plans_prepared = ?,
          units_covered = ?,
          units_total = ?,
          completion_rate = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          data.month || null,
          data.week || null,
          data.exercises_given || 0,
          data.exercises_marked || 0,
          data.lesson_plans_prepared || 0,
          unitsCovered,
          unitsTotal,
          completionRate,
          existing[0].id
        ]
      );
      result = { id: existing[0].id, updated: true };
    } else {
      // Insert new record
      const [insertResult] = await pool.query(
        `INSERT INTO facilitator_lessons (
          facilitator_id, school_id, year, term, month, week,
          subject, grade, exercises_given, exercises_marked,
          lesson_plans_prepared, units_covered, units_total,
          completion_rate, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          data.facilitator_id,
          data.school_id,
          data.year,
          data.term,
          data.month || null,
          data.week || null,
          data.subject,
          data.grade,
          data.exercises_given || 0,
          data.exercises_marked || 0,
          data.lesson_plans_prepared || 0,
          unitsCovered,
          unitsTotal,
          completionRate
        ]
      );
      result = { id: insertResult.insertId, created: true };
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error saving facilitator lessons data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
