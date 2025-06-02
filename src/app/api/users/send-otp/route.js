import { NextResponse } from 'next/server';
import pool from '@/utils/db';
import TokenService from '@/utils/tokenService';
import EmailService from '@/utils/emailService';
import SMSService from '@/utils/smsService';
import { generatePassword } from '@/utils/password';

/**
 * Generate a 6-digit OTP code
 * @returns {string} 6-digit OTP code
 */
function generateOTP() {
  // Use the first 6 digits of a random number
  return generatePassword(6).replace(/\D/g, '').padStart(6, '0').substring(0, 6);
}

/**
 * Normalize a phone number to a standard format for comparison
 * @param {string} phoneNumber - The phone number to normalize
 * @returns {string} - The normalized phone number
 */
function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  let digits = phoneNumber.replace(/\D/g, '');
  
  // Ghana specific handling
  // If it starts with 0, remove the 0 as it's a local prefix
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  
  // If it doesn't have the country code and is 9 digits (typical mobile number length in Ghana)
  // add the country code
  if (digits.length === 9) {
    digits = '233' + digits;
  }
  
  return digits;
}

/**
 * Send OTP to user via email or SMS
 */
export async function POST(request) {
  try {
    const { phoneOrEmail } = await request.json();
    
    if (!phoneOrEmail) {
      return NextResponse.json(
        { success: false, message: 'Phone number or email is required' },
        { status: 400 }
      );
    }
    
    // Check if it's an email or phone number
    const isEmail = phoneOrEmail.includes('@');
    
    // Find user by email or phone
    const [users] = await pool.query(
      isEmail 
        ? 'SELECT * FROM users WHERE email = ? LIMIT 1' 
        : 'SELECT * FROM users WHERE phone_number LIKE ? LIMIT 1',
      [isEmail ? phoneOrEmail : `%${normalizePhoneNumber(phoneOrEmail)}%`]
    );
    
    if (!users.length) {
      // For security, don't reveal if user exists or not
      return NextResponse.json(
        { success: true, message: 'If your contact information is registered, you will receive a verification code.' }
      );
    }
    
    const user = users[0];
    
    // Generate 6-digit OTP
    const otp = generateOTP();
    
    // Store OTP in TokenService with 10-minute expiry
    await TokenService.createToken(
      'OTP', 
      phoneOrEmail, 
      { 
        otp,
        userId: user.id,
        attempts: 0,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      }, 
      10 * 60 // 10 minutes in seconds
    );
    
    // Prepare user name for notifications
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || user.email;
    
    // Send OTP via email or SMS
    if (isEmail) {
      await EmailService.sendOTPEmail({
        email: phoneOrEmail,
        name: userName,
        code: otp
      });
    } else {
      await SMSService.sendOTPSMS({
        phoneNumber: phoneOrEmail,
        code: otp
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${isEmail ? 'email' : 'phone number'}`
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}