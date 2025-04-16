import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
    const { id } = params;
    
    // Get basic user info
    const userResponse = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `
          SELECT id, type, super_admin, first_name, last_name, other_names, 
                 email, phone_number, gender, identification_number, 
                 birth_date, avatar, scope_id, created_at, updated_at
          FROM users
          WHERE id = ${id} AND deleted_at IS NULL
        `
      }),
    });

    const userData = await userResponse.json();
    
    if (!userData.rows || userData.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userData.rows[0];
    
    // Add scope information based on user type
    if (user.scope_id) {
      if (user.type === 'admin') {
        // Admin scope is a region
        const regionResponse = await fetch('http://localhost:3010/sql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sql: `SELECT * FROM regions WHERE id = ${user.scope_id}`
          }),
        });
        const regionData = await regionResponse.json();
        if (regionData.rows && regionData.rows.length > 0) {
          user.scope = regionData.rows[0];
        }
      } else if (user.type === 'circuit_supervisor') {
        // SISO scope is a district
        const districtResponse = await fetch('http://localhost:3010/sql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sql: `
              SELECT d.*, r.name as region_name, r.id as region_id
              FROM districts d
              JOIN regions r ON d.region_id = r.id
              WHERE d.id = ${user.scope_id}
            `
          }),
        });
        const districtData = await districtResponse.json();
        if (districtData.rows && districtData.rows.length > 0) {
          user.scope = districtData.rows[0];
        }
      } else if (user.type === 'head_facilitator') {
        // Head facilitator scope is a school
        const schoolResponse = await fetch('http://localhost:3010/sql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sql: `
              SELECT s.*, c.name as circuit_name, c.id as circuit_id,
                    d.name as district_name, d.id as district_id,
                    r.name as region_name, r.id as region_id
              FROM schools s
              JOIN circuits c ON s.circuit_id = c.id
              JOIN districts d ON c.district_id = d.id
              JOIN regions r ON d.region_id = r.id
              WHERE s.id = ${user.scope_id}
            `
          }),
        });
        const schoolData = await schoolResponse.json();
        if (schoolData.rows && schoolData.rows.length > 0) {
          user.scope = schoolData.rows[0];
        }
      }
    }
    
    // For facilitators, get associated schools
    if (user.type === 'facilitator') {
      const schoolsResponse = await fetch('http://localhost:3010/sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `
            SELECT s.id, s.name, s.code, s.address, s.circuit_id,
                  c.name as circuit_name,
                  d.name as district_name, d.id as district_id,
                  r.name as region_name, r.id as region_id
            FROM schools_teachers st
            JOIN schools s ON st.school_id = s.id
            JOIN circuits c ON s.circuit_id = c.id
            JOIN districts d ON c.district_id = d.id
            JOIN regions r ON d.region_id = r.id
            WHERE st.teacher_id = ${id}
          `
        }),
      });
      const schoolsData = await schoolsResponse.json();
      if (schoolsData.rows && schoolsData.rows.length > 0) {
        user.schools = schoolsData.rows;
      } else {
        user.schools = [];
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a user
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { 
      first_name, 
      last_name, 
      other_names, 
      email, 
      phone_number, 
      gender,
      identification_number,
      birth_date,
      scope_id,
      schools = [], // For facilitators only
      resetPassword = false
    } = body;

    // Verify user exists
    const userCheckResponse = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `SELECT id, type, email, phone_number FROM users WHERE id = ${id} AND deleted_at IS NULL`
      }),
    });

    const userCheckData = await userCheckResponse.json();
    if (!userCheckData.rows || userCheckData.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const existingUser = userCheckData.rows[0];
    const userType = existingUser.type;

    // Validate required fields
    if (!first_name || !last_name || !email || !phone_number) {
      return NextResponse.json(
        { error: 'First name, last name, email, and phone number are required' },
        { status: 400 }
      );
    }

    // Check for email/phone uniqueness (only if changed)
    if (email !== existingUser.email || phone_number !== existingUser.phone_number) {
      const checkExistingResponse = await fetch('http://localhost:3010/sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `
            SELECT id FROM users 
            WHERE (email = '${email}' OR phone_number = '${phone_number}') 
            AND id != ${id}
          `
        }),
      });

      const checkExistingData = await checkExistingResponse.json();
      if (checkExistingData.rows && checkExistingData.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email or phone number already in use by another user' },
          { status: 400 }
        );
      }
    }

    // Validate scope based on user type
    if ((userType === 'admin' || userType === 'circuit_supervisor' || userType === 'head_facilitator') && !scope_id) {
      return NextResponse.json(
        { error: `Scope ID is required for ${userType} users` },
        { status: 400 }
      );
    }

    if (userType === 'facilitator' && (!schools || schools.length === 0)) {
      return NextResponse.json(
        { error: 'At least one school must be assigned to a facilitator' },
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

      const scopeCheckResponse = await fetch('http://localhost:3010/sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `SELECT id FROM ${scopeTable} WHERE id = ${scope_id}`
        }),
      });

      const scopeCheckData = await scopeCheckResponse.json();
      if (!scopeCheckData.rows || scopeCheckData.rows.length === 0) {
        return NextResponse.json(
          { error: `Invalid scope for ${userType}` },
          { status: 400 }
        );
      }
    }

    // For facilitators, verify all schools exist
    if (userType === 'facilitator' && schools.length > 0) {
      for (const schoolId of schools) {
        const schoolCheckResponse = await fetch('http://localhost:3010/sql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sql: `SELECT id FROM schools WHERE id = ${schoolId}`
          }),
        });

        const schoolCheckData = await schoolCheckResponse.json();
        if (!schoolCheckData.rows || schoolCheckData.rows.length === 0) {
          return NextResponse.json(
            { error: `School with ID ${schoolId} not found` },
            { status: 400 }
          );
        }
      }
    }

    // Prepare update query
    let setClause = `
      first_name = '${first_name}',
      last_name = '${last_name}',
      other_names = ${other_names ? `'${other_names}'` : 'NULL'},
      email = '${email}',
      phone_number = '${phone_number}',
      gender = ${gender ? `'${gender}'` : 'NULL'},
      identification_number = ${identification_number ? `'${identification_number}'` : 'NULL'},
      birth_date = ${birth_date ? `'${birth_date}'` : 'NULL'},
      updated_at = NOW()
    `;

    if ((userType === 'admin' || userType === 'circuit_supervisor' || userType === 'head_facilitator') && scope_id) {
      setClause += `, scope_id = ${scope_id}`;
    }

    let passwordReset = false;
    let newPassword = null;

    // Handle password reset if requested
    if (resetPassword) {
      // Generate a new random password
      newPassword = generatePassword(12);
      
      // Hash password using crypto instead of bcrypt
      const hashedPassword = hashPassword(newPassword);
      
      setClause += `, password = '${hashedPassword}'`;
      passwordReset = true;
    }

    // Update user
    const updateUserResponse = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `
          UPDATE users SET ${setClause} WHERE id = ${id}
        `
      }),
    });

    const updateUserData = await updateUserResponse.json();
    
    if (!updateUserData.success) {
      throw new Error(updateUserData.error || 'Failed to update user');
    }

    // For facilitators, update school associations
    if (userType === 'facilitator' && schools.length > 0) {
      // First, delete existing associations
      await fetch('http://localhost:3010/sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `DELETE FROM schools_teachers WHERE teacher_id = ${id}`
        }),
      });

      // Then create new associations
      for (const schoolId of schools) {
        await fetch('http://localhost:3010/sql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sql: `
              INSERT INTO schools_teachers (school_id, teacher_id, created_at, updated_at)
              VALUES (${schoolId}, ${id}, NOW(), NOW())
            `
          }),
        });
      }
    }

    // Send notification if password was reset
    if (passwordReset) {
      await sendNotification(
        { 
          email, 
          phone_number, 
          first_name, 
          last_name 
        }, 
        newPassword, 
        false
      );
    }

    return NextResponse.json({
      message: 'User updated successfully',
      passwordReset,
      notificationSent: passwordReset ? {
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
 * DELETE handler for soft deleting a user
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if user exists
    const userCheckResponse = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `SELECT id, type FROM users WHERE id = ${id} AND deleted_at IS NULL`
      }),
    });

    const userCheckData = await userCheckResponse.json();
    if (!userCheckData.rows || userCheckData.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userType = userCheckData.rows[0].type;

    // For facilitators, remove school associations
    if (userType === 'facilitator') {
      await fetch('http://localhost:3010/sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `DELETE FROM schools_teachers WHERE teacher_id = ${id}`
        }),
      });
    }

    // Soft delete user (set deleted_at timestamp)
    const deleteUserResponse = await fetch('http://localhost:3010/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: `UPDATE users SET deleted_at = NOW() WHERE id = ${id}`
      }),
    });

    const deleteUserData = await deleteUserResponse.json();
    
    if (!deleteUserData.success) {
      throw new Error(deleteUserData.error || 'Failed to delete user');
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}