import { NextResponse } from 'next/server';
import { getConnection } from '@/utils/db';
import { verifyServerAuth } from '@/utils/serverAuth';

/**
 * Get user program roles
 */
export async function GET(req) {
  try {
    const authResult = await verifyServerAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: authResult.status }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const programId = searchParams.get('programId');
    
    if (!userId && !programId) {
      return NextResponse.json(
        { success: false, message: 'Either userId or programId is required' },
        { status: 400 }
      );
    }
    
    let query = 'SELECT upr.*, p.name as program_name, p.code as program_code, p.status as program_status,';
    query += ' CONCAT(u.first_name, " ", u.last_name) as user_name, u.email';
    query += ' FROM user_program_roles upr';
    query += ' LEFT JOIN programs p ON upr.program_id = p.id';
    query += ' LEFT JOIN users u ON upr.user_id = u.id';
    query += ' WHERE 1=1';
    
    
    const queryParams = [];
    
    if (userId) {
      query += ' AND upr.user_id = ?';
      queryParams.push(userId);
    }
    
    if (programId) {
      query += ' AND upr.program_id = ?';
      queryParams.push(programId);
    }
    
    // Add ordering
    query += ' ORDER BY p.name, user_name ASC';
    
    const db = await getConnection();
    const [userProgramRoles] = await db.execute(query, queryParams);
    
    return NextResponse.json({
      success: true,
      userProgramRoles
    });
  } catch (error) {
    console.error('Error fetching user program roles:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user program roles' },
      { status: 500 }
    );
  }
}

/**
 * Create or update user program role
 */
export async function POST(req) {
  try {
    const authResult = await verifyServerAuth(req, ['admin']);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: authResult.status }
      );
    }
    
    const { userId, programId, role, scopeType, scopeId } = await req.json();
    
    if (!userId || !programId || !role) {
      return NextResponse.json(
        { success: false, message: 'User ID, program ID, and role are required' },
        { status: 400 }
      );
    }
    
    const db = await getConnection();
    
    // Check if user exists
    const [users] = await db.execute('SELECT id FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if program exists
    const [programs] = await db.execute('SELECT id FROM programs WHERE id = ?', [programId]);
    if (programs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Program not found' },
        { status: 404 }
      );
    }
    
    // Check if assignment already exists
    const [existingRoles] = await db.execute(
      'SELECT id FROM user_program_roles WHERE user_id = ? AND program_id = ?',
      [userId, programId]
    );
    
    let result;
    if (existingRoles.length > 0) {
      // Update existing role
      [result] = await db.execute(
        'UPDATE user_program_roles SET role = ?, scope_type = ?, scope_id = ? WHERE user_id = ? AND program_id = ?',
        [role, scopeType, scopeId, userId, programId]
      );
    } else {
      // Create new role
      [result] = await db.execute(
        'INSERT INTO user_program_roles (user_id, program_id, role, scope_type, scope_id) VALUES (?, ?, ?, ?, ?)',
        [userId, programId, role, scopeType, scopeId]
      );
    }
    
    // Fetch the newly created or updated role with related information
    const [userProgramRoles] = await db.execute(
      `SELECT upr.*, p.name as program_name
       FROM user_program_roles upr
       LEFT JOIN programs p ON upr.program_id = p.id
       WHERE upr.user_id = ? AND upr.program_id = ?`,
      [userId, programId]
    );
    
    const userProgramRole = userProgramRoles.length > 0 ? userProgramRoles[0] : null;
    
    return NextResponse.json({
      success: true,
      message: existingRoles.length > 0 ? 'Role updated' : 'Role assigned',
      id: existingRoles.length > 0 ? existingRoles[0].id : result.insertId,
      userProgramRole
    });
  } catch (error) {
    console.error('Error assigning program role:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to assign program role' },
      { status: 500 }
    );
  }
}

/**
 * Delete user program role
 */
export async function DELETE(req) {
  try {
    const authResult = await verifyServerAuth(req, ['admin']);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: authResult.status }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Role ID is required' },
        { status: 400 }
      );
    }
    
    const db = await getConnection();
    
    // Check if role exists
    const [roles] = await db.execute('SELECT id FROM user_program_roles WHERE id = ?', [id]);
    if (roles.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Role assignment not found' },
        { status: 404 }
      );
    }
    
    await db.execute('DELETE FROM user_program_roles WHERE id = ?', [id]);
    
    return NextResponse.json({
      success: true,
      message: 'Role assignment removed'
    });
  } catch (error) {
    console.error('Error removing program role:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to remove program role' },
      { status: 500 }
    );
  }
}
