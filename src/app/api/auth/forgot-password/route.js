import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/utils/db';
import TokenService from '@/utils/tokenService';

/**
 * Handle forgot password request
 */
export async function POST(req) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await getUserByEmail(email);
    
    // For security reasons, don't reveal if the email exists or not
    // Just return success even if the email doesn't exist
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json(
        { success: true, message: 'If your email exists in our system, you will receive a password reset link shortly' }
      );
    }
    
    // Generate a reset token using TokenService
    const { token } = await TokenService.createToken(
      'PASSWORD_RESET',
      user.email,
      { userId: user.id }
    );
    
    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;
    
    // Send email with reset link
    const { sendPasswordResetEmail } = await import('@/utils/emailSmsNotifier');
    await sendPasswordResetEmail({
      name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      resetUrl
    });
    
    console.log(`Password reset link sent to: ${email}`);
    
    return NextResponse.json({
      success: true,
      message: 'If your email exists in our system, you will receive a password reset link shortly'
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
