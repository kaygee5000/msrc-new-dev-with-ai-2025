/*
 * API Route: /api/teachers/[id]
 * Description: API for individual teacher management (get, update, delete)
 */

import { NextResponse } from 'next/server';
import db from '@/utils/db';

// GET - Retrieve a single teacher by ID
export async function GET(req, { params }) {
  try {
    const teacherId = params.id;
    
    const query = `
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
        t.date_started_teacher,
        t.date_started_headteacher,
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
      WHERE t.id = ? AND t.deleted_at IS NULL
    `;
    
    const [teachers] = await db.query(query, [teacherId]);
    
    if (teachers.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Teacher not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      status: 'success',
      teacher: teachers[0]
    });
    
  } catch (error) {
    console.error('Error fetching teacher:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch teacher', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update a teacher
export async function PUT(req, { params }) {
  try {
    const teacherId = params.id;
    const body = await req.json();
    
    // Check if teacher exists
    const [existingTeacher] = await db.query(
      'SELECT * FROM teachers WHERE id = ? AND deleted_at IS NULL',
      [teacherId]
    );
    
    if (existingTeacher.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Teacher not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData = {
      first_name: body.first_name,
      last_name: body.last_name,
      other_names: body.other_names,
      gender: body.gender,
      email: body.email,
      phone_number: body.phone_number,
      staff_number: body.staff_number,
      rank: body.rank,
      academic_qualification: body.academic_qualification,
      professional_qualification: body.professional_qualification,
      status: body.status,
      is_headteacher: body.is_headteacher,
      qualification: body.qualification,
      current_school_id: body.current_school_id,
      year_posted_to_school: body.year_posted_to_school,
      date_started_teacher: body.date_started_teacher,
      date_started_headteacher: body.date_started_headteacher,
      updated_at: new Date()
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    // Only proceed if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'No fields to update' },
        { status: 400 }
      );
    }
    
    // Update teacher
    await db.query(
      'UPDATE teachers SET ? WHERE id = ?',
      [updateData, teacherId]
    );
    
    // Fetch updated teacher
    const [updatedTeacher] = await db.query(
      'SELECT * FROM teachers WHERE id = ?',
      [teacherId]
    );
    
    return NextResponse.json({
      status: 'success',
      message: 'Teacher updated successfully',
      teacher: updatedTeacher[0]
    });
    
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to update teacher', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Mark a teacher as deleted (soft delete)
export async function DELETE(req, { params }) {
  try {
    const teacherId = params.id;
    
    // Check if teacher exists
    const [existingTeacher] = await db.query(
      'SELECT * FROM teachers WHERE id = ? AND deleted_at IS NULL',
      [teacherId]
    );
    
    if (existingTeacher.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Teacher not found' },
        { status: 404 }
      );
    }
    
    // Soft delete the teacher
    await db.query(
      'UPDATE teachers SET deleted_at = ?, updated_at = ? WHERE id = ?',
      [new Date(), new Date(), teacherId]
    );
    
    return NextResponse.json({
      status: 'success',
      message: 'Teacher deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to delete teacher', details: error.message },
      { status: 500 }
    );
  }
}