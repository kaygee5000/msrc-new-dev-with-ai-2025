import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/utils/db';
import nodemailer from 'nodemailer';

// Configure your SMTP transport here
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    // Find user by email
    const [users] = await pool.query('SELECT id, email, first_name FROM users WHERE email = ?', [email]);
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
    // Send email
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@msrc.edu',
      to: user.email,
      subject: 'MSRC Password Reset',
      text: `Hello ${user.first_name ? ' ' + user.last_name : ''},\n\nTo reset your password, click the link below:\n${resetUrl}\n\nIf you did not request this, ignore this email.\n\nThis link will expire in 1 hour.`,
    });
    return NextResponse.json({ message: 'If your email is registered, you will receive a reset link.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
