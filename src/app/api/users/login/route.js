import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/utils/db';
import jwt from 'jsonwebtoken';

function verifyPassword(password, hashedPassword) {
  const [salt, storedHash] = hashedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return storedHash === hash;
}

export async function POST(request) {
  try {
    const { email, username, password } = await request.json();
    if ((!email && !username) || !password) {
      return NextResponse.json({ success: false, message: 'Email/username and password are required' }, { status: 400 });
    }
    
    // Find user by email or phone number
    const [users] = await pool.query(
      'SELECT * FROM users WHERE (email = ? OR phone_number = ?) AND deleted_at IS NULL LIMIT 1',
      [email || username, email || username]
    );
    
    const user = users[0];
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }
    
    // Update last login timestamp. use the birth date column for this purpose

    await pool.query(
      'UPDATE users SET birth_date = NOW() WHERE id = ?',
      [user.id]
    );
    
    // Remove password from user object
    const { password: _pw, ...userInfo } = user;
    
    // Construct full name from first_name and last_name
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    
    // Generate JWT token (same as in verify-otp)
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        name: fullName || user.name, // Keep name for backward compatibility
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role || 'user',
        type: user.type || 'standard'
      },
      process.env.JWT_SECRET || 'msrc-development-secret',
      { expiresIn: '24h' }
    );
    
    // Return standardized response format (matches OTP verification)
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        ...userInfo,
        name: fullName || user.name, // Keep name for backward compatibility
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Login failed', 
      details: error.message 
    }, { status: 500 });
  }
}
