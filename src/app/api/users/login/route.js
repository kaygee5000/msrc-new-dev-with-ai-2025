import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/utils/db';

function verifyPassword(password, hashedPassword) {
  const [salt, storedHash] = hashedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return storedHash === hash;
}

export async function POST(request) {
  try {
    const { email, username, password } = await request.json();
    if ((!email && !username) || !password) {
      return NextResponse.json({ error: 'Email/username and password are required' }, { status: 400 });
    }
    const [users] = await pool.query(
      'SELECT * FROM users WHERE (email = ? OR phone_number = ?) AND deleted_at IS NULL LIMIT 1',
      [email || username, email || username]
    );
    const user = users[0];
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const { password: _pw, ...userInfo } = user;
    return NextResponse.json({ user: userInfo });
  } catch (error) {
    return NextResponse.json({ error: 'Login failed', details: error.message }, { status: 500 });
  }
}
