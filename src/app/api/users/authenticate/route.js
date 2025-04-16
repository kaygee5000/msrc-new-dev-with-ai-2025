import { NextResponse } from 'next/server';
import db from '@/utils/db';
import hashPassword from '../../../../../hash.js';

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
    
    // Check if user exists
    if (!user) {
      return NextResponse.json({ 
        message: 'Invalid email or password' 
      }, { status: 401 });
    }
    
    // Verify the password hash using the same hashing as the old implementation
    const hashedInput = hashPassword(password, user.password_salt);
    if (hashedInput !== user.password_hash) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
    
    // Get user's jurisdiction info
    const [jurisdictions] = await db.query(`
      SELECT 
        j.user_id,
        j.region_id,
        j.district_id,
        j.circuit_id,
        r.name as region_name,
        d.name as district_name,
        c.name as circuit_name
      FROM 
        field_msrcghana_db.user_jurisdictions j
        LEFT JOIN field_msrcghana_db.regions r ON j.region_id = r.id
        LEFT JOIN field_msrcghana_db.districts d ON j.district_id = d.id
        LEFT JOIN field_msrcghana_db.circuits c ON j.circuit_id = c.id
      WHERE 
        j.user_id = ?
    `, [user.id]);
    
    const jurisdiction = jurisdictions[0] || {};
    
    // Create a clean user object (without password) to return
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type, // maintain type for RBAC
      role: user.role, // keep for legacy compatibility if needed
      regionId: jurisdiction.region_id || null,
      districtId: jurisdiction.district_id || null,
      circuitId: jurisdiction.circuit_id || null,
      regionName: jurisdiction.region_name || null,
      districtName: jurisdiction.district_name || null,
      circuitName: jurisdiction.circuit_name || null,
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