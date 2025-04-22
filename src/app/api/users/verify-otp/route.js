import { NextResponse } from 'next/server';
import { getUserById } from '@/utils/db';
import jwt from 'jsonwebtoken';
import redisClient from '@/utils/redis'; // Use Redis for OTP storage
import pool from '@/utils/db';

/**
 * Verify a one-time password and authenticate user
 */
export async function POST(req) {
  try {
    const { recipient, type, code } = await req.json();

    if (!recipient || !code) {
      return NextResponse.json(
        { success: false, message: 'Recipient and code are required' }, 
        { status: 400 }
      );
    }
    // Get stored OTP data from Redis
    const otpDataRaw = await redisClient.get(`otp:${recipient}`);
    if (!otpDataRaw) {
      return NextResponse.json(
        { success: false, message: 'No verification code found. Please request a new code.' }, 
        { status: 400 }
      );
    }
    const storedData = JSON.parse(otpDataRaw);
    // Check if OTP is expired
    if (Date.now() > storedData.expiresAt) {
      await redisClient.del(`otp:${recipient}`);
      return NextResponse.json(
        { success: false, message: 'Verification code has expired. Please request a new code.' }, 
        { status: 400 }
      );
    }
    // Increment attempts
    storedData.attempts = (storedData.attempts || 0) + 1;
    // Check if max attempts reached (5 attempts)
    if (storedData.attempts > 5) {
      await redisClient.del(`otp:${recipient}`);
      return NextResponse.json(
        { success: false, message: 'Too many failed attempts. Please request a new code.' }, 
        { status: 400 }
      );
    }
    // Verify OTP
    if (storedData.otp !== code) {
      // Update attempts in Redis
      await redisClient.set(`otp:${recipient}`,
        JSON.stringify(storedData),
        'PX', storedData.expiresAt - Date.now()
      );
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid verification code',
          attemptsLeft: 5 - storedData.attempts
        }, 
        { status: 400 }
      );
    }
    // OTP is valid, get the user
    const user = await getUserById(storedData.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' }, 
        { status: 404 }
      );
    }

    // Remove password from user object
    const { password: _pw, ...userInfo } = user;

    // Clean up used OTP
    await redisClient.del(`otp:${recipient}`);
    
    // Construct full name from first_name and last_name
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    
    // Generate JWT token
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
    
    // Update last login timestamp in the database
      // Update last login timestamp. use the birth date column for this purpose
        await pool.query(
          'UPDATE users SET birth_date = NOW() WHERE id = ?',
          [user.id]
        );
    
    // Return user info with proper name fields
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        name: fullName || user.name, // Keep name for backward compatibility
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        type: user.type
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify code' }, 
      { status: 500 }
    );
  }
}