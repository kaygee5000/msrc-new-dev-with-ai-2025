/*
 * API Route: /api/teachers
 * Description: API for teacher management with CRUD operations
 * Query Parameters:
 *   - schoolId: Filter teachers by school ID
 *   - status: Filter by status (active, inactive)
 *   - isHeadteacher: Filter by headteacher status (1 for headteacher, 0 for regular teacher)
 */

import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET - List all teachers with optional filtering
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId');
    const status = searchParams.get('status');
    const isHeadteacher = searchParams.get('isHeadteacher');
    
    // Build base query
    let query = `
      SELECT 
        t.id, 
        t.first_name,
        t.last_name, 
        t.other_names,
        t.gender,
        t.email,
        t.phone_number,
        t.staff_number,
        t.rank,
        t.academic_qualification,
        t.professional_qualification, 
        t.avatar,
        t.status,
        t.is_headteacher,
        t.qualification,
        t.current_school_id,
        t.year_posted_to_school,
        s.name as school_name,
        d.id as district_id,
        d.name as district_name,
        c.id as circuit_id,
        c.name as circuit_name
      FROM 
        teachers t
      LEFT JOIN schools s ON t.current_school_id = s.id
      LEFT JOIN circuits c ON s.circuit_id = c.id
      LEFT JOIN districts d ON s.district_id = d.id
      WHERE t.deleted_at IS NULL
    `;
    
    // Add filters
    const queryParams = [];
    
    if (schoolId) {
      query += ` AND t.current_school_id = ?`;
      queryParams.push(parseInt(schoolId));
    }
    
    if (status) {
      query += ` AND t.status = ?`;
      queryParams.push(status);
    }
    
    if (isHeadteacher !== null && isHeadteacher !== undefined) {
      query += ` AND t.is_headteacher = ?`;
      queryParams.push(parseInt(isHeadteacher));
    }
    
    // Order by
    query += ` ORDER BY t.last_name, t.first_name`;
    
    // Execute query
    const [teachers] = await db.query(query, queryParams);
    
    return NextResponse.json({
      status: 'success',
      count: teachers.length,
      teachers: teachers
    });
    
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch teachers', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new teacher
export async function POST(req) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'gender'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { status: 'error', message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Set default values for optional fields
    const teacherData = {
      first_name: body.first_name,
      last_name: body.last_name,
      other_names: body.other_names || null,
      gender: body.gender,
      email: body.email || null,
      phone_number: body.phone_number || null,
      staff_number: body.staff_number || null,
      rank: body.rank || null,
      academic_qualification: body.academic_qualification || null,
      professional_qualification: body.professional_qualification || null,
      status: body.status || 'active',
      is_headteacher: body.is_headteacher || 0,
      qualification: body.qualification || null,
      current_school_id: body.current_school_id || null,
      year_posted_to_school: body.year_posted_to_school || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Insert teacher into database
    const [result] = await db.query('INSERT INTO teachers SET ?', [teacherData]);
    
    // Fetch the newly created teacher to return
    const [newTeacher] = await db.query('SELECT * FROM teachers WHERE id = ?', [result.insertId]);
    
    return NextResponse.json({
      status: 'success',
      message: 'Teacher created successfully',
      teacher: newTeacher[0]
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to create teacher', details: error.message },
      { status: 500 }
    );
  }
}