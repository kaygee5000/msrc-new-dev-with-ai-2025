import { NextResponse } from 'next/server';
import db from '@/utils/db';
import { verifyPassword } from '@/utils/hash.js';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ 
        message: 'Email and password are required' 
      }, { status: 400 });
    }

    // Fetch user from database
    const [users] = await db.query(
      'SELECT * FROM field_msrcghana_db.users WHERE email = ? LIMIT 1',
      [email]
    );
    
    const user = users[0];

    console.log(`User fetched: ${JSON.stringify(user)}`);
    
    
    // Check if user exists
    if (!user) {
      return NextResponse.json({ 
        message: 'Invalid email or password' 
      }, { status: 401 });
    }

    // Verify the password using the same hashing as the old implementation
    if (!verifyPassword(password, user.password)) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    
    // Jurisdiction logic based on user.type and user.scope
    let jurisdiction = null;
    switch (user.type) {
      case 'regional_admin':
        jurisdiction = { type: 'region', scopeId: user.scope_id || null };
        break;
      case 'district_admin':
        jurisdiction = { type: 'district', scopeId: user.scope_id || null };
        break;
      case 'circuit_supervisor':
        jurisdiction = { type: 'circuit', scopeId: user.scope_id || null };
        break;
      case 'head_teacher':
        jurisdiction = { type: 'school', scopeId: user.scope_id || null };
        break;
      case 'data_collector':
        jurisdiction = { type: 'data_collector', scopeId: user.scope_id || null };
        break;
      // national_admin and any others: skip
    }

    // Create a clean user object (without password) to return
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type, // maintain type for RBAC
      role: user.role, // keep for legacy compatibility if needed
      jurisdiction,
      createdAt: user.created_at
    };
    
    return NextResponse.json({ 
      message: 'Authentication successful',
      user: userResponse
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ 
      message: 'Authentication failed', 
      error: error.message 
    }, { status: 500 });
  }
}