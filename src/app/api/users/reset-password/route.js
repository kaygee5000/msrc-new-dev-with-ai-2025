import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/utils/db';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export async function POST(request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }
    // Find user by token and check expiry
    const [users] = await pool.query(
      'SELECT id, password_reset_expires FROM users WHERE password_reset_token = ?',
      [token]
    );
    if (!users.length) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    const user = users[0];
    if (!user.password_reset_expires || new Date(user.password_reset_expires) < new Date()) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }
    // Hash new password
    const hashedPassword = hashPassword(password);
    // Update password and clear reset token/expiry
    await pool.query(
      'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );
    return NextResponse.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
