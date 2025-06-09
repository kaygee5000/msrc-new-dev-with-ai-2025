import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import db from '@/utils/db';

// GET handler for facilitators data
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('school_id');
    const circuitId = searchParams.get('circuit_id');
    const districtId = searchParams.get('district_id');
    const regionId = searchParams.get('region_id');
    const staffNumber = searchParams.get('staff_number');
    const teacherId = searchParams.get('teacher_id');
    const firstName = searchParams.get('first_name');
    const lastName = searchParams.get('last_name');
    const searchTerm = searchParams.get('search');
    const year = searchParams.get('year');
    const term = searchParams.get('term');

    // Check if this is a direct teacher lookup by ID, staff number, or name search
    if (teacherId || staffNumber || firstName || lastName || searchTerm) {
      let query = `
        SELECT 
          t.id,
          t.first_name,
          t.last_name,
          t.other_names,
          t.gender,
          t.email,
          t.phone_number,
          t.staff_number,
          t.rank,
          t.academic_qualification,
          t.professional_qualification,
          t.avatar,
          t.category,
          t.status,
          t.date_started_headteacher,
          t.date_started_teacher,
          t.is_headteacher,
          t.qualification,
          t.year_posted_to_school,
          t.current_school_id,
          s.name as school_name,
          c.id as circuit_id,
          c.name as circuit_name,
          d.id as district_id,
          d.name as district_name,
          r.id as region_id,
          r.name as region_name,
          t.created_at,
          t.updated_at
        FROM teachers t
        LEFT JOIN schools s ON t.current_school_id = s.id
        LEFT JOIN circuits c ON s.circuit_id = c.id
        LEFT JOIN districts d ON c.district_id = d.id
        LEFT JOIN regions r ON d.region_id = r.id
        WHERE t.deleted_at IS NULL
      `;

      const queryParams = [];

      // Add filters based on provided parameters
      if (teacherId) {
        query += ' AND t.id = ?';
        queryParams.push(teacherId);
      } 
      
      if (staffNumber) {
        query += ' AND t.staff_number = ?';
        queryParams.push(staffNumber);
      }
      
      if (firstName) {
        query += ' AND t.first_name LIKE ?';
        queryParams.push(`%${firstName}%`);
      }
      
      if (lastName) {
        query += ' AND t.last_name LIKE ?';
        queryParams.push(`%${lastName}%`);
      }
      
      if (searchTerm) {
        query += ' AND (t.first_name LIKE ? OR t.last_name LIKE ? OR t.staff_number LIKE ?)';
        queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
      }
      
      // Add location filters if provided
      if (schoolId) {
        query += ' AND t.current_school_id = ?';
        queryParams.push(schoolId);
      } else if (circuitId) {
        query += ' AND c.id = ?';
        queryParams.push(circuitId);
      } else if (districtId) {
        query += ' AND d.id = ?';
        queryParams.push(districtId);
      } else if (regionId) {
        query += ' AND r.id = ?';
        queryParams.push(regionId);
      }

      query += ' ORDER BY t.last_name, t.first_name';
      query += ' LIMIT 100'; // Limit results for performance

      const [results] = await db.query(query, queryParams);
      return NextResponse.json(results);
    }

    // Lookup facilitators with strands covered data (for curriculum coverage)
    if (year && term) {
      // Build query based on provided filters
      let query = `
        SELECT 
          f.id as facilitator_id,
          f.first_name,
          f.last_name,
          f.other_names,
          f.gender,
          f.phone_number,
          f.email,
          f.staff_number,
          f.rank,
          f.academic_qualification,
          f.professional_qualification,
          f.avatar,
          f.category,
          f.status,
          f.date_started_teacher,
          f.date_started_headteacher,
          f.is_headteacher,
          f.qualification,
          f.year_posted_to_school,
          s.id as school_id,
          s.name as school_name,
          c.id as circuit_id,
          c.name as circuit_name,
          d.id as district_id,
          d.name as district_name,
          r.id as region_id,
          r.name as region_name,
          sc.year,
          sc.term,
          sc.created_at,
          sc.updated_at
        FROM teachers f
        JOIN strands_covered sc ON f.id = sc.teacher_id
        JOIN schools s ON sc.school_id = s.id
        JOIN circuits c ON s.circuit_id = c.id
        JOIN districts d ON c.district_id = d.id
        JOIN regions r ON d.region_id = r.id
        WHERE sc.year = ? AND sc.term = ?
      `;

      const queryParams = [year, term];

      // Add filters based on provided parameters
      if (schoolId) {
        query += ' AND s.id = ?';
        queryParams.push(schoolId);
      } else if (circuitId) {
        query += ' AND c.id = ?';
        queryParams.push(circuitId);
      } else if (districtId) {
        query += ' AND d.id = ?';
        queryParams.push(districtId);
      } else if (regionId) {
        query += ' AND r.id = ?';
        queryParams.push(regionId);
      }

      query += ' ORDER BY r.name, d.name, c.name, s.name, f.last_name, f.first_name';

      // Execute query
      const [results] = await db.query(query, queryParams);

      return NextResponse.json(results);
    }
    
    // If no specific lookup type is requested, return all teachers with location filters
    let query = `
      SELECT 
        t.id,
        t.first_name,
        t.last_name,
        t.other_names,
        t.gender,
        t.email,
        t.phone_number,
        t.staff_number,
        t.rank,
        t.academic_qualification,
        t.professional_qualification,
        t.avatar,
        t.category,
        t.status,
        t.date_started_headteacher,
        t.date_started_teacher,
        t.is_headteacher,
        t.qualification,
        t.year_posted_to_school,
        t.current_school_id,
        s.name as school_name,
        c.id as circuit_id,
        c.name as circuit_name,
        d.id as district_id,
        d.name as district_name,
        r.id as region_id,
        r.name as region_name,
        t.created_at,
        t.updated_at
      FROM teachers t
      LEFT JOIN schools s ON t.current_school_id = s.id
      LEFT JOIN circuits c ON s.circuit_id = c.id
      LEFT JOIN districts d ON c.district_id = d.id
      LEFT JOIN regions r ON d.region_id = r.id
      WHERE t.deleted_at IS NULL
    `;

    const queryParams = [];
    
    // Add location filters
    if (schoolId) {
      query += ' AND t.current_school_id = ?';
      queryParams.push(schoolId);
    } else if (circuitId) {
      query += ' AND c.id = ?';
      queryParams.push(circuitId);
    } else if (districtId) {
      query += ' AND d.id = ?';
      queryParams.push(districtId);
    } else if (regionId) {
      query += ' AND r.id = ?';
      queryParams.push(regionId);
    }

    query += ' ORDER BY r.name, d.name, c.name, s.name, t.last_name, t.first_name';
    query += ' LIMIT 500'; // Limit results for performance

    const [results] = await db.query(query, queryParams);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching facilitators data:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// POST handler for creating/updating teachers (facilitators)
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.first_name || !data.last_name || !data.staff_number) {
      return NextResponse.json({ 
        message: 'Missing required fields: first_name, last_name, and staff_number are required' 
      }, { status: 400 });
    }

    // Check if staff_number is unique
    const [existingStaffNumber] = await db.query(
      'SELECT id FROM teachers WHERE staff_number = ? AND id != ?',
      [data.staff_number, data.id || 0]
    );

    if (existingStaffNumber && existingStaffNumber.length > 0) {
      return NextResponse.json({ 
        message: 'Staff number must be unique across the country' 
      }, { status: 400 });
    }

    // Check if record exists
    let result;
    if (data.id) {
      // Update existing teacher
      const updateFields = [];
      const updateValues = [];

      // Build dynamic update query
      Object.keys(data).forEach(key => {
        if (key !== 'id') {
          updateFields.push(`${key} = ?`);
          updateValues.push(data[key]);
        }
      });

      if (updateFields.length === 0) {
        return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
      }

      updateFields.push('updated_at = NOW()');
      
      const updateQuery = `
        UPDATE teachers 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `;
      
      result = await db.query(updateQuery, [...updateValues, data.id]);

      return NextResponse.json({ 
        message: 'Teacher updated successfully',
        id: data.id
      });
    } else {
      // Insert new teacher
      const insertData = {
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      };

      const fields = Object.keys(insertData);
      const placeholders = fields.map(() => '?').join(', ');
      const values = Object.values(insertData);

      const insertQuery = `
        INSERT INTO teachers (${fields.join(', ')})
        VALUES (${placeholders})
      `;

      result = await db.query(insertQuery, values);

      return NextResponse.json({ 
        message: 'Teacher created successfully',
        id: result[0].insertId
      });
    }
  } catch (error) {
    console.error('Error saving teacher data:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// DELETE handler for teachers (soft delete)
export async function DELETE(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Teacher ID is required' }, { status: 400 });
    }

    // Soft delete by setting deleted_at timestamp
    const result = await db.query(
      'UPDATE teachers SET deleted_at = NOW() WHERE id = ?',
      [id]
    );

    if (result[0].affectedRows === 0) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
