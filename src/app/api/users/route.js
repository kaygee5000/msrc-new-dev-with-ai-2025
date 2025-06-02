import { NextResponse } from 'next/server';
import pool from '@/utils/db';
import { hashPassword, generatePassword } from '@/utils/password';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination params with defaults
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // Parse filter params
    const query = searchParams.get('query') || searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    // Removed status parameter as it doesn't exist in the database
    const includeProgramRoles = searchParams.get('includeProgramRoles') === 'true';
    
    // Build SQL WHERE clause for filters
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (query) {
      whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR id LIKE ?)';
      params.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
    }
    
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    
    // Removed status filter condition
    
    // Get total count for pagination
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // Get users with pagination
    const [users] = await pool.query(
      `SELECT 
        id, first_name, last_name, email, phone_number, type, 
        created_at, updated_at, birth_date
       FROM users 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    // If program roles are requested, fetch them for all users in the result
    if (includeProgramRoles && users.length > 0) {
      const userIds = users.map(user => user.id);
      const placeholders = userIds.map(() => '?').join(',');
      
      const [programRoles] = await pool.query(
        `SELECT upr.*, p.name as program_name, p.code as program_code
         FROM user_program_roles upr
         LEFT JOIN programs p ON upr.program_id = p.id
         WHERE upr.user_id IN (${placeholders})`,
        userIds
      );
      
      // Group program roles by user id
      const rolesByUser = {};
      programRoles.forEach(role => {
        if (!rolesByUser[role.user_id]) {
          rolesByUser[role.user_id] = [];
        }
        rolesByUser[role.user_id].push(role);
      });
      
      // Add program roles to each user
      users.forEach(user => {
        user.program_roles = rolesByUser[user.id] || [];
      });
    }
    
    return NextResponse.json({
      success: true,
      users,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error retrieving users:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while retrieving users' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const userData = await request.json();
    
    // Validate required fields
    if (!userData.email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [userData.email]
    );
    
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Generate password if not provided
    let password = userData.password;
    if (!password) {
      password = generatePassword(10);
    }
    
    // Hash password using our utility
    const hashedPassword = await hashPassword(password);
    
    // Prepare user data for insertion
    const {
      first_name = '',
      last_name = '',
      email,
      phone_number = '',
      type = 'standard',
      gender,
      other_names,
      identification_number,
      birth_date,
      avatar,
      scope_id,
      scope
    } = userData;
    
    // Insert new user
    const [result] = await pool.query(
      `INSERT INTO users (
        first_name, 
        last_name,
        email, 
        password, 
        phone_number, 
        type,
        gender,
        other_names,
        identification_number,
        birth_date,
        avatar,
        scope_id,
        scope,
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        first_name, 
        last_name,
        email, 
        hashedPassword, 
        phone_number, 
        type,
        gender || null,
        other_names || null,
        identification_number || null,
        birth_date || null,
        avatar || null,
        scope_id || null,
        scope || null
      ]
    );
    
    const userId = result.insertId;
    
    // Retrieve the newly created user
    const [newUsers] = await pool.query(
      `SELECT 
        id, first_name, last_name, email, phone_number, type, 
        gender, other_names, identification_number, birth_date, scope_id, scope,
        created_at 
       FROM users WHERE id = ?`,
      [userId]
    );
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUsers[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while creating the user' },
      { status: 500 }
    );
  }
}