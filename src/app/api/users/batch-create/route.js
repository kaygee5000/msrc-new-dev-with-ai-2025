import { NextResponse } from 'next/server';
import { parse } from 'papaparse';
import * as XLSX from 'xlsx';
import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { generatePassword } from '@/utils/generate-hash';
import { getConnection } from '@/utils/db';
import { EmailSMSNotifier } from '@/utils/emailSmsNotifier';

export const POST = async (req) => {
  try {
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file');
    const sendNotifications = formData.get('sendNotifications') === 'true';
    
    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Get file extension to determine format
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();
    
    let records = [];
    
    // Parse file based on its format
    if (fileExtension === 'csv') {
      // Parse CSV
      const fileContent = await file.text();
      const result = parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim().toLowerCase()
      });
      
      records = result.data;
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      // Parse Excel
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      // Assume first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      // Normalize headers to lowercase
      records = data.map(row => {
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          normalizedRow[key.trim().toLowerCase()] = row[key];
        });
        return normalizedRow;
      });
    } else {
      return NextResponse.json(
        { message: 'Unsupported file format. Please upload a CSV or Excel file.' },
        { status: 400 }
      );
    }
    
    if (records.length === 0) {
      return NextResponse.json(
        { message: 'No user records found in the file' },
        { status: 400 }
      );
    }
    
    // Validate and create users
    const results = {
      total: records.length,
      created: 0,
      failed: 0,
      users: [],
      errors: []
    };
    
    // Required fields
    const requiredFields = ['name', 'email', 'type'];
    
    // Get database connection
    const db = await getConnection();
    
    // Process each user record
    for (const record of records) {
      try {
        // Validate required fields
        const missingFields = requiredFields.filter(field => !record[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        // Check if user with this email already exists
        const [existingUsers] = await db.execute(
          'SELECT id FROM users WHERE email = ?',
          [record.email]
        );
        
        if (existingUsers.length > 0) {
          throw new Error('A user with this email already exists');
        }
        
        // Generate temporary password
        const tempPassword = generatePassword();
        const hashedPassword = await hash(tempPassword, 10);
        
        // Create the user
        const [result] = await db.execute(
          `INSERT INTO users (
            name, email, phone, type, role, title, password, 
            region_id, district_id, circuit_id, status, first_login
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.name,
            record.email,
            record.phone || null,
            record.type.toLowerCase(),
            record.role || 'user',
            record.title || null,
            hashedPassword,
            record.region_id ? parseInt(record.region_id, 10) : null,
            record.district_id ? parseInt(record.district_id, 10) : null,
            record.circuit_id ? parseInt(record.circuit_id, 10) : null,
            'active',
            1 // first_login = true
          ]
        );
        
        const newUserId = result.insertId;
        
        // Send welcome notifications if enabled
        if (sendNotifications) {
          // Send email
          try {
            await EmailSMSNotifier.sendWelcomeEmail({
              name: record.name,
              email: record.email,
              tempPassword: tempPassword
            });
          } catch (emailError) {
            console.error(`Failed to send welcome email to ${record.email}:`, emailError);
          }
          
          // Send SMS if phone number exists
          if (record.phone) {
            try {
              await EmailSMSNotifier.sendCredentialsSMS({
                name: record.name,
                phoneNumber: record.phone,
                email: record.email,
                password: tempPassword
              });
            } catch (smsError) {
              console.error(`Failed to send welcome SMS to ${record.phone}:`, smsError);
            }
          }
        }
        
        // Add to successful users
        results.users.push({
          id: newUserId,
          name: record.name,
          email: record.email,
          type: record.type
        });
        
        results.created++;
      } catch (error) {
        // Add to failed users
        results.errors.push({
          email: record.email || `Row ${results.failed + results.created + 1}`,
          error: error.message
        });
        
        results.failed++;
      }
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Batch user creation error:', error);
    return NextResponse.json(
      { message: 'Failed to process batch user creation', error: error.message },
      { status: 500 }
    );
  }
};

// Increase body size limit for file uploads
export const config = {
  api: {
    bodyParser: false
  }
};