/*
 * API Route: /api/teachers/[id]/transfer
 * Description: API for transferring teachers between schools
 * POST Method:
 *   - Requires new_school_id in the body
 *   - Moves a teacher from their current school to a new one
 *   - Records the transfer history
 */

import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function POST(req, { params }) {
  try {
    const teacherId = params.id;
    const body = await req.json();
    
    // Validate required field
    if (!body.new_school_id) {
      return NextResponse.json(
        { status: 'error', message: 'New school ID is required' },
        { status: 400 }
      );
    }
    
    // Begin a transaction
    await db.query('START TRANSACTION');
    
    // Check if teacher exists
    const [teachers] = await db.query(
      'SELECT * FROM teachers WHERE id = ? AND deleted_at IS NULL',
      [teacherId]
    );
    
    if (teachers.length === 0) {
      await db.query('ROLLBACK');
      return NextResponse.json(
        { status: 'error', message: 'Teacher not found' },
        { status: 404 }
      );
    }
    
    const teacher = teachers[0];
    const oldSchoolId = teacher.current_school_id;
    const newSchoolId = body.new_school_id;
    
    // Check if new school exists
    const [schools] = await db.query(
      'SELECT * FROM schools WHERE id = ? AND deleted_at IS NULL',
      [newSchoolId]
    );
    
    if (schools.length === 0) {
      await db.query('ROLLBACK');
      return NextResponse.json(
        { status: 'error', message: 'Destination school not found' },
        { status: 404 }
      );
    }
    
    // If teacher is already at the new school, return success without changes
    if (oldSchoolId === parseInt(newSchoolId)) {
      await db.query('ROLLBACK');
      return NextResponse.json({
        status: 'success',
        message: 'Teacher is already assigned to this school',
        teacher: teacher
      });
    }
    
    // Record the transfer in the teacher_transfers table (if exists)
    try {
      const transferData = {
        teacher_id: teacherId,
        from_school_id: oldSchoolId,
        to_school_id: newSchoolId,
        transfer_date: new Date(),
        reason: body.reason || 'Administrative transfer',
        recorded_by: body.user_id || null,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await db.query('INSERT INTO teacher_transfers SET ?', [transferData]);
    } catch (error) {
      // If teacher_transfers table doesn't exist, just continue with the transfer
      console.warn('Could not record teacher transfer history:', error.message);
    }
    
    // Update the teacher's school assignment
    const updateData = {
      current_school_id: newSchoolId,
      year_posted_to_school: body.year_posted_to_school || new Date().getFullYear(),
      updated_at: new Date()
    };
    
    await db.query(
      'UPDATE teachers SET ? WHERE id = ?',
      [updateData, teacherId]
    );
    
    // If teacher was a headteacher in old school and new school already has a headteacher,
    // we may need to update the headteacher status
    if (teacher.is_headteacher === 1) {
      // Check if the new school already has a headteacher
      const [existingHeadteachers] = await db.query(
        'SELECT * FROM teachers WHERE current_school_id = ? AND is_headteacher = 1 AND id != ? AND deleted_at IS NULL',
        [newSchoolId, teacherId]
      );
      
      if (existingHeadteachers.length > 0) {
        // If there's already a headteacher, update this teacher to not be a headteacher
        // unless explicitly specified to keep headteacher status
        if (body.keep_headteacher_status !== true) {
          await db.query(
            'UPDATE teachers SET is_headteacher = 0, updated_at = ? WHERE id = ?',
            [new Date(), teacherId]
          );
        }
      }
    }
    
    // Commit the transaction
    await db.query('COMMIT');
    
    // Fetch the updated teacher
    const [updatedTeachers] = await db.query(`
      SELECT 
        t.*, 
        s.name as new_school_name,
        d.name as new_district_name 
      FROM teachers t
      LEFT JOIN schools s ON t.current_school_id = s.id
      LEFT JOIN districts d ON s.district_id = d.id
      WHERE t.id = ?
    `, [teacherId]);
    
    return NextResponse.json({
      status: 'success',
      message: 'Teacher transferred successfully',
      teacher: updatedTeachers[0]
    });
    
  } catch (error) {
    // Rollback in case of error
    await db.query('ROLLBACK');
    
    console.error('Error transferring teacher:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to transfer teacher', details: error.message },
      { status: 500 }
    );
  }
}