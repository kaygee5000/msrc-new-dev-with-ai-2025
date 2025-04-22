import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateToken, comparePassword } from '@/utils/hash';
import { getConnection } from '@/utils/db';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Connect to database
    const db = await getConnection();
    
    // Find user by email
    const [users] = await db.execute(
      'SELECT id, first_name, last_name, email, phone_number, type, status, password FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const user = users[0];
    
    // Verify password using bcrypt
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check user status
    if (user.status === 'inactive') {
      return NextResponse.json(
        { success: false, message: 'Your account is inactive. Please contact an administrator.' },
        { status: 403 }
      );
    }
    
    // Remove password from user object
    delete user.password;
    
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
      [user.id]
    );
    
    // Add program roles to user object
    user.programRoles = programRoles;
    
    // Generate session token
    const token = generateToken();
    
    // Store token in database with user ID
    await db.execute(
      'INSERT INTO sessions (user_id, token, created_at, expires_at) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR))',
      [user.id, token]
    );
    
    // Set cookie with token
    cookies().set('msrc_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400, // 24 hours
      path: '/'
    });
    
    // Update last login timestamp
    await db.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}