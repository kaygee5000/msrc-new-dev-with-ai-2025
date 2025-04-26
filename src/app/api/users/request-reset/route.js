import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/utils/db';
import { sendPasswordResetEmail } from '@/utils/emailSmsNotifier';

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Find user by email
    const [users] = await pool.query('SELECT id, email, first_name, last_name, name FROM users WHERE email = ?', [email]);
    
    if (!users.length) {
      // For security, do not reveal if email is not found
      return NextResponse.json({ message: 'If your email is registered, you will receive a reset link.' });
    }
    
    const user = users[0];
    
    // Generate token and expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60).toISOString().slice(0, 19).replace('T', ' '); // 1 hour
    
    // Save token and expiry to user
    await pool.query('UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?', [token, expires, user.id]);
    
    // Prepare name for email
    const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || 'mSRC Ghana User';
    
    // Use the proper email utility instead of raw nodemailer
    await sendPasswordResetEmail({
      email: user.email,
      name: userName,
      resetToken: token
    });
    
    return NextResponse.json({ message: 'If your email is registered, you will receive a reset link.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
