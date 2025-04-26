import { NextResponse } from 'next/server';
import pool from '@/utils/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const [users] = await pool.query(
      'SELECT id, name, email, password, type, role, status FROM users WHERE email = ?', 
      [email]
    );
    
    if (!users.length) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    const user = users[0];
    
    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Your account is not active. Please contact an administrator.' },
        { status: 401 }
      );
    }
    
    // Verify password (using bcrypt compare)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Update last login timestamp
    await pool.query(
      'UPDATE users SET birth_date = NOW() WHERE id = ?',
      [user.id]
    );
    
    // Generate a JWT for authentication
    const token = jwt.sign(
      { 
        id: user.id,
        name: user.first_name + ' ' + user.last_name,
        email: user.email,
        type: user.type,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' } // Token expires in 1 day
    );
    
    // Save the token in a secure HTTP-only cookie
    const cookieStore = cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 1 day in seconds
      path: '/'
    });
    
    // Remove sensitive data before returning the user
    const safeUserData = {
      id: user.id,
      name: user.first_name + ' ' + user.last_name,
      email: user.email,
      type: user.type,
      role: user.role
     };
    
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: safeUserData
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}