import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '../../../utils/db';

/**
 * Generate a random password of specified length
 */
function generatePassword(length = 10) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

/**
 * Hash password using Node.js crypto instead of bcrypt
 * @param {string} password - The password to hash
 * @returns {string} - The hashed password
 */
function hashPassword(password) {
  // Generate a random salt
  const salt = crypto.randomBytes(16).toString('hex');
  // Hash the password using the salt
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  // Return the salt + hash combination
  return `${salt}:${hash}`;
}

/**
 * Verify password using Node.js crypto
 * @param {string} password - The password to verify
 * @param {string} hashedPassword - The stored hashed password
 * @returns {boolean} - Whether the password matches
 */
function verifyPassword(password, hashedPassword) {
  const [salt, storedHash] = hashedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return storedHash === hash;
}

/**
 * Send notification to user (email and/or SMS)
 * In production, this would connect to an actual email/SMS service
 */
async function sendNotification(user, password, isNew = true) {
  console.log(`Sending ${isNew ? 'new' : 'updated'} credentials to user:`, user.email, user.phone_number);
  
  // In a real implementation, this would call an email service and SMS gateway
  // For now, we'll just log the notification
  
  // Simulating an API call to notification service
  return {
    email: user.email ? true : false,
    sms: user.phone_number ? true : false,
    message: `Credentials ${isNew ? 'created' : 'updated'} successfully`
  };
}

/**
 * GET handler for retrieving users
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type');
    const regionId = searchParams.get('region_id');
    const districtId = searchParams.get('district_id');
    const circuitId = searchParams.get('circuit_id');
    const schoolId = searchParams.get('school_id');
    
    // Build parameters and conditions for the SQL queries
    const params = [];
    let whereClause = 'WHERE deleted_at IS NULL';
    
    if (search) {
      whereClause += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone_number LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    if (type) {
      whereClause += ` AND type = ?`;
      params.push(type);
    }
    
    // Handle scope filtering
    let scopeJoin = '';
    if (regionId || districtId || circuitId || schoolId) {
      // Different user types have different scope levels
      if (type === 'admin' && regionId) {
        whereClause += ` AND users.scope_id = ? AND users.type = 'admin'`;
        params.push(regionId);
      } else if (type === 'circuit_supervisor' && (districtId || regionId)) {
        if (districtId) {
          whereClause += ` AND users.scope_id = ? AND users.type = 'circuit_supervisor'`;
          params.push(districtId);
        } else if (regionId) {
          scopeJoin = `LEFT JOIN districts d ON users.scope_id = d.id`;
          whereClause += ` AND d.region_id = ? AND users.type = 'circuit_supervisor'`;
          params.push(regionId);
        }
      } else if (type === 'head_facilitator' && (schoolId || circuitId || districtId || regionId)) {
        if (schoolId) {
          whereClause += ` AND users.scope_id = ? AND users.type = 'head_facilitator'`;
          params.push(schoolId);
        } else if (circuitId) {
          scopeJoin = `LEFT JOIN schools s ON users.scope_id = s.id`;
          whereClause += ` AND s.circuit_id = ? AND users.type = 'head_facilitator'`;
          params.push(circuitId);
        } else if (districtId) {
          scopeJoin = `LEFT JOIN schools s ON users.scope_id = s.id LEFT JOIN circuits c ON s.circuit_id = c.id`;
          whereClause += ` AND c.district_id = ? AND users.type = 'head_facilitator'`;
          params.push(districtId);
        } else if (regionId) {
          scopeJoin = `LEFT JOIN schools s ON users.scope_id = s.id 
                      LEFT JOIN circuits c ON s.circuit_id = c.id 
                      LEFT JOIN districts d ON c.district_id = d.id`;
          whereClause += ` AND d.region_id = ? AND users.type = 'head_facilitator'`;
          params.push(regionId);
        }
      } else if (type === 'facilitator' && (schoolId || circuitId || districtId || regionId)) {
        if (schoolId) {
          scopeJoin = `LEFT JOIN schools_teachers st ON users.id = st.teacher_id`;
          whereClause += ` AND st.school_id = ? AND users.type = 'facilitator'`;
          params.push(schoolId);
        } else if (circuitId) {
          scopeJoin = `LEFT JOIN schools_teachers st ON users.id = st.teacher_id 
                      LEFT JOIN schools s ON st.school_id = s.id`;
          whereClause += ` AND s.circuit_id = ? AND users.type = 'facilitator'`;
          params.push(circuitId);
        } else if (districtId) {
          scopeJoin = `LEFT JOIN schools_teachers st ON users.id = st.teacher_id 
                      LEFT JOIN schools s ON st.school_id = s.id 
                      LEFT JOIN circuits c ON s.circuit_id = c.id`;
          whereClause += ` AND c.district_id = ? AND users.type = 'facilitator'`;
          params.push(districtId);
        } else if (regionId) {
          scopeJoin = `LEFT JOIN schools_teachers st ON users.id = st.teacher_id 
                      LEFT JOIN schools s ON st.school_id = s.id 
                      LEFT JOIN circuits c ON s.circuit_id = c.id 
                      LEFT JOIN districts d ON c.district_id = d.id`;
          whereClause += ` AND d.region_id = ? AND users.type = 'facilitator'`;
          params.push(regionId);
        }
      }
    }
    
    // Query users with pagination
    const query = `
      SELECT users.id, users.type, users.first_name, users.last_name, users.other_names, 
            users.email, users.phone_number, users.scope_id, users.created_at 
      FROM users
      ${scopeJoin}
      ${whereClause}
      GROUP BY users.id
      ORDER BY users.created_at DESC
      LIMIT ?, ?
    `;
    
    const [rows] = await pool.query(query, [...params, (page - 1) * limit, limit]);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT users.id) as total 
      FROM users
      ${scopeJoin}
      ${whereClause}
    `;
    
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    // For each user, add appropriate scope information
    const usersWithScope = await Promise.all(rows.map(async (user) => {
      if (user.scope_id) {
        if (user.type === 'admin') {
          // Admin scope is a region
          const [regionRows] = await pool.query('SELECT name FROM regions WHERE id = ?', [user.scope_id]);
          if (regionRows.length > 0) {
            user.scope_name = regionRows[0].name;
          }
        } else if (user.type === 'circuit_supervisor') {
          // SISO scope is a district
          const [districtRows] = await pool.query('SELECT name FROM districts WHERE id = ?', [user.scope_id]);
          if (districtRows.length > 0) {
            user.scope_name = districtRows[0].name;
          }
        } else if (user.type === 'head_facilitator') {
          // Head facilitator scope is a school
          const [schoolRows] = await pool.query('SELECT name FROM schools WHERE id = ?', [user.scope_id]);
          if (schoolRows.length > 0) {
            user.scope_name = schoolRows[0].name;
          }
        }
      }
      
      // Facilitators don't have a direct scope_id, they have schools via schools_teachers table
      if (user.type === 'facilitator') {
        const [schoolRows] = await pool.query(`
          SELECT s.id, s.name 
          FROM schools_teachers st 
          JOIN schools s ON st.school_id = s.id 
          WHERE st.teacher_id = ?
        `, [user.id]);
        
        if (schoolRows.length > 0) {
          user.schools = schoolRows;
        }
      }
      
      return user;
    }));

    return NextResponse.json({
      users: usersWithScope,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new user
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      type, 
      first_name, 
      last_name, 
      other_names = null, 
      email, 
      phone_number, 
      gender = null, 
      scope_id = null, 
      schools = [] // For facilitators only
    } = body;

    // Validate required fields
    if (!type || !first_name || !last_name || !email || !phone_number) {
      return NextResponse.json(
        { error: 'Type, first name, last name, email, and phone number are required' },
        { status: 400 }
      );
    }

    // Validate user type
    const validTypes = ['admin', 'circuit_supervisor', 'head_facilitator', 'facilitator'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      );
    }

    // Check if email or phone number already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR phone_number = ?', 
      [email, phone_number]
    );
    
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email or phone number already exists' },
        { status: 400 }
      );
    }

    // Validate scope based on user type
    if ((type === 'admin' || type === 'circuit_supervisor' || type === 'head_facilitator') && !scope_id) {
      return NextResponse.json(
        { error: `Scope ID is required for ${type} users` },
        { status: 400 }
      );
    }

    if (type === 'facilitator' && (!schools || schools.length === 0)) {
      return NextResponse.json(
        { error: 'At least one school must be assigned to a facilitator' },
        { status: 400 }
      );
    }

    // Verify scope exists based on user type
    if (scope_id) {
      let scopeTable;
      switch (type) {
        case 'admin':
          scopeTable = 'regions';
          break;
        case 'circuit_supervisor':
          scopeTable = 'districts';
          break;
        case 'head_facilitator':
          scopeTable = 'schools';
          break;
      }

      const [scopeRows] = await pool.query(`SELECT id FROM ${scopeTable} WHERE id = ?`, [scope_id]);
      
      if (scopeRows.length === 0) {
        return NextResponse.json(
          { error: `Invalid scope for ${type}` },
          { status: 400 }
        );
      }
    }

    // For facilitators, verify schools exist
    if (type === 'facilitator' && schools.length > 0) {
      for (const schoolId of schools) {
        const [schoolRows] = await pool.query('SELECT id FROM schools WHERE id = ?', [schoolId]);
        
        if (schoolRows.length === 0) {
          return NextResponse.json(
            { error: `School with ID ${schoolId} not found` },
            { status: 400 }
          );
        }
      }
    }

    // Generate a random password
    const rawPassword = generatePassword(12);
    
    // Hash password using crypto instead of bcrypt
    const hashedPassword = hashPassword(rawPassword);

    // Create user
    const [result] = await pool.query(
      `INSERT INTO users (
        type, first_name, last_name, other_names, email, phone_number, 
        gender, scope_id, password, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        type, 
        first_name, 
        last_name, 
        other_names, 
        email, 
        phone_number, 
        gender, 
        scope_id, 
        hashedPassword
      ]
    );
    
    const userId = result.insertId;

    // For facilitators, create school associations
    if (type === 'facilitator' && schools.length > 0) {
      for (const schoolId of schools) {
        await pool.query(
          'INSERT INTO schools_teachers (school_id, teacher_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
          [schoolId, userId]
        );
      }
    }

    // Send credentials via email and/or SMS
    await sendNotification(
      { 
        email, 
        phone_number, 
        first_name, 
        last_name 
      }, 
      rawPassword, 
      true
    );

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        id: userId,
        notificationSent: {
          email: !!email,
          sms: !!phone_number
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a user
 * This would typically be in the [id]/route.js file but adding it here for completeness
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { 
      id,
      first_name, 
      last_name, 
      other_names = null, 
      email, 
      phone_number, 
      gender = null, 
      scope_id = null, 
      schools = [], // For facilitators only
      password = null, // Optional for update
      reset_password = false // Whether to generate a new password
    } = body;

    // Validate required fields
    if (!id || !first_name || !last_name || !email || !phone_number) {
      return NextResponse.json(
        { error: 'ID, first name, last name, email, and phone number are required' },
        { status: 400 }
      );
    }

    // Verify user exists and get current type
    const [userRows] = await pool.query(
      'SELECT type FROM users WHERE id = ? AND deleted_at IS NULL', 
      [id]
    );
    
    if (userRows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userType = userRows[0].type;

    // Check if email or phone number already exists for another user
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE (email = ? OR phone_number = ?) AND id != ?',
      [email, phone_number, id]
    );
    
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email or phone number already exists for another user' },
        { status: 400 }
      );
    }

    // Validate scope based on user type
    if ((userType === 'admin' || userType === 'circuit_supervisor' || userType === 'head_facilitator') && !scope_id) {
      return NextResponse.json(
        { error: `Scope ID is required for ${userType} users` },
        { status: 400 }
      );
    }

    // Verify scope exists based on user type
    if (scope_id) {
      let scopeTable;
      switch (userType) {
        case 'admin':
          scopeTable = 'regions';
          break;
        case 'circuit_supervisor':
          scopeTable = 'districts';
          break;
        case 'head_facilitator':
          scopeTable = 'schools';
          break;
      }

      const [scopeRows] = await pool.query(`SELECT id FROM ${scopeTable} WHERE id = ?`, [scope_id]);
      
      if (scopeRows.length === 0) {
        return NextResponse.json(
          { error: `Invalid scope for ${userType}` },
          { status: 400 }
        );
      }
    }

    // For facilitators, verify schools exist
    if (userType === 'facilitator' && schools && schools.length > 0) {
      for (const schoolId of schools) {
        const [schoolRows] = await pool.query('SELECT id FROM schools WHERE id = ?', [schoolId]);
        
        if (schoolRows.length === 0) {
          return NextResponse.json(
            { error: `School with ID ${schoolId} not found` },
            { status: 400 }
          );
        }
      }
    }

    // Handle password changes if needed
    let hashedPassword = null;
    let rawPassword = null;
    
    if (password) {
      hashedPassword = hashPassword(password);
    } else if (reset_password) {
      rawPassword = generatePassword(12);
      hashedPassword = hashPassword(rawPassword);
    }

    // Build update query
    const updateParams = [
      first_name,
      last_name,
      other_names,
      email,
      phone_number,
      gender,
      scope_id
    ];
    
    let updateSql = `
      UPDATE users SET
        first_name = ?,
        last_name = ?,
        other_names = ?,
        email = ?,
        phone_number = ?,
        gender = ?,
        scope_id = ?,
    `;
    
    if (hashedPassword) {
      updateSql += `password = ?,`;
      updateParams.push(hashedPassword);
    }
    
    updateSql += `
        updated_at = NOW()
      WHERE id = ?
    `;
    
    updateParams.push(id);
    
    // Execute update query
    await pool.query(updateSql, updateParams);

    // For facilitators, update school associations
    if (userType === 'facilitator' && schools) {
      // First delete all existing associations
      await pool.query('DELETE FROM schools_teachers WHERE teacher_id = ?', [id]);
      
      // Then create new associations
      for (const schoolId of schools) {
        await pool.query(
          'INSERT INTO schools_teachers (school_id, teacher_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
          [schoolId, id]
        );
      }
    }

    // Send notification if password was reset
    if (rawPassword) {
      await sendNotification(
        { 
          email, 
          phone_number, 
          first_name, 
          last_name 
        }, 
        rawPassword, 
        false
      );
    }

    return NextResponse.json({
      message: 'User updated successfully',
      notificationSent: rawPassword ? {
        email: !!email,
        sms: !!phone_number
      } : null
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing a user
 * This would typically be in the [id]/route.js file but adding it here for completeness
 * Note: We're performing soft deletes by setting the deleted_at timestamp
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const [userRows] = await pool.query(
      'SELECT id, type FROM users WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    
    if (userRows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Soft delete user (set deleted_at)
    await pool.query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [id]);

    return NextResponse.json(
      { message: 'User deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for user login (authentication)
 * Accepts: { email or username, password }
 * Returns: user info if valid, 401 if not
 */
export async function LOGIN(request) {
  try {
    const body = await request.json();
    const { email, username, password } = body;
    if ((!email && !username) || !password) {
      return NextResponse.json({ error: 'Email/username and password are required' }, { status: 400 });
    }
    // Find user by email or username
    const [users] = await pool.query(
      'SELECT * FROM users WHERE (email = ? OR phone_number = ?) AND deleted_at IS NULL LIMIT 1',
      [email || username, email || username]
    );
    const user = users[0];
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    // Verify password
    if (!verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    // Return user info (omit password)
    const { password: _pw, ...userInfo } = user;
    return NextResponse.json({ user: userInfo });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed', details: error.message }, { status: 500 });
  }
}