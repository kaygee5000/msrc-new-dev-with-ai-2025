import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getConnection } from '@/utils/db';

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
 * GET handler for retrieving a single user by ID
 */
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const url = new URL(request.url);
    const includeProgramRoles = url.searchParams.get('includeProgramRoles') === 'true';
    
    const db = await getConnection();
    
    // Get basic user info
    const [userData] = await db.query(`
      SELECT id, type, super_admin, first_name, last_name, other_names, 
             email, phone_number, gender, identification_number, 
             birth_date, avatar, scope_id, created_at, updated_at
      FROM users
      WHERE id = ? AND deleted_at IS NULL
    `, [id]);

    if (!userData || userData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userData[0];
    
    // Add scope information based on user type
    if (user.scope_id) {
      if (user.type === 'regional_admin') {
        // Admin scope is a region
        const [regionData] = await db.query(`
          SELECT * FROM regions WHERE id = ?
        `, [user.scope_id]);
        
        if (regionData && regionData.length > 0) {
          user.scope = regionData[0];
        }
      } 
      else // Check if user is a district_admin and fetch related data
      if (user && user.type === 'district_admin' && user.scope_id) {
        const db = await getConnection();
        
        // Get district with its region
        const [districtData] = await db.query(`
          SELECT d.*, r.name as region_name, r.id as region_id
          FROM districts d
          JOIN regions r ON d.region_id = r.id
          WHERE d.id = ?
        `, [user.scope_id]);
        
        if (districtData && districtData.length > 0) {
          // Store district and region info
          const district = districtData[0];
          
          // Fetch all circuits in this district
          const [circuitsData] = await db.query(`
            SELECT c.id, c.name, c.code 
            FROM circuits c
            WHERE c.district_id = ?
            ORDER BY c.name
          `, [district.id]);
          
          // Now you have the district with region_name and all circuits
          // You can use this data as needed
          user.district = district;
          user.circuits = circuitsData || [];
        }
      }
      
      else if (user && user.type === 'circuit_supervisor' && user.scope_id) {
        const db = await getConnection();
        
        // Get district with its region
        const [circuitData] = await db.query(`
          SELECT c.*, r.name as region_name, r.id as region_id
          d.name as district_name, d.id as district_id
          FROM circuits c
          JOIN regions r ON c.region_id = r.id
          JOIN districts d ON c.district_id = d.id
          WHERE c.id = ?
        `, [user.scope_id]);
        
        if (districtData && districtData.length > 0) {
          // Store district and region info
          const district = districtData[0];
          
          // Fetch all circuits in this district
          const [circuitsData] = await db.query(`
            SELECT c.id, c.name, c.code 
            FROM circuits c
            WHERE c.district_id = ?
            ORDER BY c.name
          `, [district.id]);
          
          // Now you have the district with region_name and all circuits
          // You can use this data as needed
          user.district = district;
          user.circuits = circuitsData || [];
        }
      }
    }
    
  
    
    // Get program roles if requested
    if (includeProgramRoles) {
      const [programRolesData] = await db.query(`
        SELECT upr.id, upr.user_id, upr.program_id, upr.role, upr.scope_type, upr.scope_id,
               p.name as program_name, p.code as program_code
        FROM user_program_roles upr
        JOIN programs p ON upr.program_id = p.id
        WHERE upr.user_id = ?
      `, [id]);
      
      if (programRolesData && programRolesData.length > 0) {
        user.program_roles = programRolesData;
      } else {
        user.program_roles = [];
      }
    }

    return NextResponse.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a user
 */
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const userData = await request.json();
    const { 
      first_name, 
      last_name, 
      email, 
      phone_number,
      gender,
      other_names,
      type,
      identification_number,
      birth_date,
      avatar,
      scope_id,
      scope
    } = userData;
    
    // Validate required fields
    if (!first_name || !last_name || !email || !type || !phone_number) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, email, phone number and type are required' },
        { status: 400 }
      );
    }

    // Check if email already exists (for another user)
    const [existingEmailUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND id != ?', 
      [email, id]
    );
    
    if (existingEmailUsers.length > 0) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists' },
        { status: 409 }
      );
    }
    
    // Check if phone number already exists (for another user)
    const [existingPhoneUsers] = await pool.query(
      'SELECT * FROM users WHERE phone_number = ? AND id != ?', 
      [phone_number, id]
    );
    
    if (existingPhoneUsers.length > 0) {
      return NextResponse.json(
        { success: false, error: 'A user with this phone number already exists' },
        { status: 409 }
      );
    }

    // Update user
    await pool.query(
      `UPDATE users SET 
        first_name = ?, 
        last_name = ?,
        email = ?, 
        phone_number = ?, 
        type = ?,
        gender = ?,
        other_names = ?,
        identification_number = ?,
        birth_date = ?,
        avatar = ?,
        scope_id = ?,
        scope = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
        first_name, 
        last_name,
        email, 
        phone_number, 
        type,
        gender || null,
        other_names || null,
        identification_number || null,
        birth_date || null,
        avatar || null,
        scope_id || null,
        scope || null,
        id
      ]
    );

    // Retrieve the updated user
    const [updatedUsers] = await pool.query(
      `SELECT 
        id, first_name, last_name, email, phone_number, type, 
        gender, other_names, identification_number, birth_date, scope_id, scope,
        created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    if (updatedUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully',
      user: updatedUsers[0] 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for soft deleting a user
 */
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const db = await getConnection();

    // Check if user exists
    const [userCheckData] = await db.query(`
      SELECT id, type FROM users WHERE id = ? AND deleted_at IS NULL
    `, [id]);

    if (!userCheckData || userCheckData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userType = userCheckData[0].type;

    // For facilitators, remove school associations
    if (userType === 'facilitator') {
      await db.query(`
        DELETE FROM schools_teachers WHERE teacher_id = ?
      `, [id]);
    }

    // Soft delete user (set deleted_at timestamp)
    await db.query(`
      UPDATE users SET deleted_at = NOW() WHERE id = ?
    `, [id]);

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}