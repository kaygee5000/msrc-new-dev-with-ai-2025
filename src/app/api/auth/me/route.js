import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getConnection } from '@/utils/db';

export async function GET(request) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('msrc_session')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Connect to database
    const db = await getConnection();
    
    // Check if token exists and is valid
    const [sessions] = await db.execute(
      'SELECT user_id FROM sessions WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    
    if (sessions.length === 0) {
      // Clear invalid cookie
      const cookieStore = await cookies();
      cookieStore.delete('msrc_session');
      
      return NextResponse.json(
        { success: false, message: 'Session expired or invalid' },
        { status: 401 }
      );
    }
    
    const userId = sessions[0].user_id;
    
    // Get user information
    const [users] = await db.execute(
      'SELECT id, first_name, last_name, email, phone_number, type FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      // Clear cookie if user not found
      const cookieStore = await cookies();
      await cookieStore.delete('msrc_session');
      
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = users[0];
    
    // Fetch user's program roles
    const [programRoles] = await db.execute(
      `SELECT upr.*, p.name as program_name, p.code as program_code,
        CASE 
          WHEN upr.scope_type = 'region' THEN r.name
          WHEN upr.scope_type = 'district' THEN d.name
          WHEN upr.scope_type = 'school' THEN s.name
          ELSE NULL
        END as scope_name
      FROM user_program_roles upr
      LEFT JOIN programs p ON upr.program_id = p.id
      LEFT JOIN regions r ON upr.scope_type = 'region' AND upr.scope_id = r.id
      LEFT JOIN districts d ON upr.scope_type = 'district' AND upr.scope_id = d.id
      LEFT JOIN schools s ON upr.scope_type = 'school' AND upr.scope_id = s.id
      WHERE upr.user_id = ?`,
      [userId]
    );
    
    // Add program roles to user object
    user.programRoles = programRoles;
    
    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while verifying authentication' },
      { status: 500 }
    );
  }
}