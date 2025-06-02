import { NextResponse } from 'next/server';
import { getUserById } from '@/utils/db';
import pool from '@/utils/db';
import TokenService from '@/utils/tokenService';
import { hashPassword } from '@/utils/password';

/**
 * Verify a reset token
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Get token data from TokenService
    const tokenData = await TokenService.verifyToken('PASSWORD_RESET', token);
    
    if (!tokenData) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 400 }
      );
    }
    
    // Token is valid
    return NextResponse.json({
      success: true,
      email: tokenData.identifier
    });
  } catch (error) {
    console.error('Error verifying reset token:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while verifying the token' },
      { status: 500 }
    );
  }
}

/**
 * Reset password with a valid token
 */
export async function POST(req) {
  try {
    const { token, password } = await req.json();
    
    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Token and password are required' },
        { status: 400 }
      );
    }
    
    // Get token data from TokenService
    const tokenData = await TokenService.verifyToken('PASSWORD_RESET', token);
    
    if (!tokenData) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 400 }
      );
    }
    
    // Hash the new password using our utility
    const hashedPassword = await hashPassword(password);
    
    // Update the user's password
    const db = await pool.getConnection();
    try {
      await db.query(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, tokenData.userId]
      );
      
      // Invalidate the token after use
      await TokenService.invalidateToken('PASSWORD_RESET', token);
      
      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully'
      });
    } finally {
      db.release();
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while resetting the password' },
      { status: 500 }
    );
  }
}
