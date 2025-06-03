import { NextResponse } from 'next/server';
import pool from '@/utils/db';
import TokenService from '@/utils/tokenService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Verify OTP code
 */
export async function POST(request) {
  try {
    const { phoneOrEmail, otp } = await request.json();
    
    if (!phoneOrEmail || !otp) {
      return NextResponse.json(
        { success: false, message: 'Contact information and OTP code are required' },
        { status: 400 }
      );
    }
    
    // Check if it's an email or phone number
    const isEmail = phoneOrEmail.includes('@');
    
    // Get OTP data from TokenService
    const tokenData = await TokenService.verifyToken('OTP', phoneOrEmail);
    
    if (!tokenData) {
      return NextResponse.json(
        { success: false, message: 'No OTP found or it has expired' },
        { status: 400 }
      );
    }
    
    // Increment attempts
    const attempts = (tokenData.attempts || 0) + 1;
    
    // Check if max attempts reached (5 attempts)
    if (attempts >= 5) {
      await TokenService.invalidateToken('OTP', phoneOrEmail);
      return NextResponse.json(
        { success: false, message: 'Too many failed attempts. Please request a new OTP.' },
        { status: 400 }
      );
    }
    
    // Update attempts in cache
    await TokenService.createToken(
      'OTP',
      phoneOrEmail,
      {
        ...tokenData,
        attempts
      },
      Math.floor((tokenData.expiresAt - Date.now()) / 1000) // Remaining TTL in seconds
    );
    
    // Verify OTP
    if (tokenData.otp !== otp) {
      return NextResponse.json(
        { success: false, message: 'Invalid OTP code' },
        { status: 400 }
      );
    }
    
    // Get user from database
    const [users] = await pool.query(
      isEmail 
        ? 'SELECT * FROM users WHERE email = ? LIMIT 1' 
        : 'SELECT * FROM users WHERE phone_number LIKE ? LIMIT 1',
      [isEmail ? phoneOrEmail : `%${phoneOrEmail}%`]
    );
    
    if (!users.length) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = users[0];
    
    // Invalidate OTP after successful verification
    await TokenService.invalidateToken('OTP', phoneOrEmail);
    
    // Format user for response (remove sensitive data)
    const { password, ...userWithoutPassword } = user;
    
    // Get user's program roles
    const [programRoles] = await pool.query(`
      SELECT upr.*, p.name as program_name, p.code as program_code 
      FROM user_program_roles upr
      JOIN programs p ON upr.program_id = p.id
      WHERE upr.user_id = ?
    `, [user.id]);
    
    // Update last login timestamp
    await pool.query(
      'UPDATE users SET birth_date = NOW() WHERE id = ?',
      [user.id]
    );
    
    // Create session with NextAuth
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      user: {
        ...userWithoutPassword,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || user.email,
        programRoles: programRoles || []
      },
      session
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}