import { NextResponse } from 'next/server';
import { getUserByEmail, getUserByPhone } from '@/utils/db';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import redisClient from '@/utils/redis'; // Use Redis for OTP storage

/**
 * Generate a random OTP code
 * @returns {string} 6-digit OTP code
 */
function generateOTP() {
  // Generate a 6-digit number
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Send one-time password to user via email or SMS
 */
export async function POST(req) {
  try {
    const { recipient, type } = await req.json();

    if (!recipient) {
      return NextResponse.json(
        { success: false, message: 'Recipient is required' }, 
        { status: 400 }
      );
    }
    
    if (!['email', 'phone'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Type must be either email or phone' }, 
        { status: 400 }
      );
    }
    
    // Find user by email or phone
    let user;
    if (type === 'email') {
      user = await getUserByEmail(recipient);
    } else {
      user = await getUserByPhone(recipient);
    }
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: `No account found with this ${type}` 
        }, 
        { status: 404 }
      );
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with expiration time (15 minutes) in Redis
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    const otpData = JSON.stringify({
      otp,
      expiresAt,
      userId: user.id,
      attempts: 0
    });
    await redisClient.set(`otp:${recipient}`, otpData, 'PX', 15 * 60 * 1000); // Set with expiry in ms

    console.log('OTP:', otp); // DEBUG: Log OTP for manual inspection
    
    // Send OTP via email or SMS
    if (type === 'email') {
      // Import is inside the if condition to avoid unnecessary imports
      const { sendOTPEmail } = await import('@/utils/emailSmsNotifier');
      await sendOTPEmail({
        name: user.name,
        email: recipient,
        code: otp
      });
    } else {
      // Import is inside the if condition to avoid unnecessary imports
      const { sendOTPSMS } = await import('@/utils/emailSmsNotifier');
      await sendOTPSMS({
        name: user.name,
        phoneNumber: recipient,
        code: otp
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Verification code sent to your ${type}`,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send verification code' }, 
      { status: 500 }
    );
  }
}