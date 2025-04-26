import { NextResponse } from 'next/server';
import pool from '@/utils/db';

export async function PUT(request) {
  try {
    const userData = await request.json();
    const { id, first_name, last_name, email, phone_number } = userData;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Update user information
    await pool.query(
      `UPDATE users SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        email = COALESCE(?, email),
        phone_number = COALESCE(?, phone_number),
        updated_at = NOW()
       WHERE id = ?`,
      [
        first_name,
        last_name,
        email,
        phone_number,
        id
      ]
    );
    
    // Return updated user data
    const [updatedUsers] = await pool.query(
      'SELECT id, first_name, last_name, email, phone_number, type FROM users WHERE id = ?',
      [id]
    );
    
    return NextResponse.json({
      success: true,
      message: 'User profile updated successfully',
      user: updatedUsers[0]
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating the user profile' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get user data
    const [users] = await pool.query(
      'SELECT id, first_name, last_name, email, phone_number, type, gender, other_names, birth_date, avatar FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = users[0];
    
    // Get regions, districts, and other organizational units the user has access to
    const [userRegions] = await pool.query(
      'SELECT r.id, r.name FROM user_regions ur JOIN regions r ON ur.region_id = r.id WHERE ur.user_id = ?',
      [userId]
    );
    
    const [userDistricts] = await pool.query(
      'SELECT d.id, d.name FROM user_districts ud JOIN districts d ON ud.district_id = d.id WHERE ud.user_id = ?',
      [userId]
    );
    
    const [userCircuits] = await pool.query(
      'SELECT c.id, c.name FROM user_circuits uc JOIN circuits c ON uc.circuit_id = c.id WHERE uc.user_id = ?',
      [userId]
    );
    
    // Get program assignments
    const [programRoles] = await pool.query(
      `SELECT 
        upr.id, 
        p.id as program_id, 
        p.code as program_code, 
        p.name as program_name,
        r.id as role_id,
        r.code as role_code,
        r.name as role_name,
        upr.scope_type,
        upr.scope_id
      FROM user_program_roles upr 
      JOIN programs p ON upr.program_id = p.id
      JOIN roles r ON upr.role_id = r.id
      WHERE upr.user_id = ?`,
      [userId]
    );
    
    return NextResponse.json({
      success: true,
      user: {
        ...user,
        regions: userRegions,
        districts: userDistricts,
        circuits: userCircuits,
        programRoles: programRoles
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while getting the user profile' },
      { status: 500 }
    );
  }
}