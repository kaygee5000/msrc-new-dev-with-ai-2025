import { NextResponse } from 'next/server';
import { parse } from 'papaparse';
import ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/utils/db';
import { hashPassword, generatePassword } from '@/utils/password';
import EmailService from '@/utils/emailService';
import SMSService from '@/utils/smsService';

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
      // Parse Excel using ExcelJS
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      // Get first worksheet
      const worksheet = workbook.getWorksheet(1);
      
      // Get headers from first row
      const headers = [];
      const firstRow = worksheet.getRow(1);
      firstRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString().trim().toLowerCase() || '';
      });
      
      // Convert rows to JSON
      const data = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            rowData[header] = cell.value;
          }
        });
        
        // Only add row if it has data
        if (Object.values(rowData).some(value => value !== null && value !== undefined && value !== '')) {
          data.push(rowData);
        }
      });
      
      records = data;
    } else {
      return NextResponse.json(
        { message: 'Unsupported file format. Please upload a CSV or Excel file.' },
        { status: 400 }
      );
    }
    
    if (records.length === 0) {
      return NextResponse.json(
        { message: 'No records found in the file' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    const requiredFields = ['email'];
    const missingFields = requiredFields.filter(field => 
      !records.every(record => record[field])
    );
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Process user records
    const results = {
      success: [],
      failed: []
    };
    
    // Create connection for transaction
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();
      
      for (const record of records) {
        try {
          // Generate password if not provided
          const password = record.password || generatePassword(10);
          
          // Hash password using our utility
          const hashedPassword = await hashPassword(password);
          
          // Prepare user data
          const userData = {
            id: record.id || uuidv4(),
            first_name: record.first_name || '',
            last_name: record.last_name || '',
            email: record.email,
            phone_number: record.phone_number || '',
            password: hashedPassword,
            type: record.type || 'standard',
            role: record.role || 'user',
            gender: record.gender || null,
            other_names: record.other_names || null,
            identification_number: record.identification_number || null,
            birth_date: record.birth_date || null,
            avatar: record.avatar || null,
            status: record.status || 'active'
          };
          
          // Check if user already exists
          const [existingUsers] = await conn.query(
            'SELECT id FROM users WHERE email = ?',
            [userData.email]
          );
          
          if (existingUsers.length > 0) {
            results.failed.push({
              email: userData.email,
              error: 'User with this email already exists'
            });
            continue;
          }
          
          // Insert user
          const [result] = await conn.query(
            `INSERT INTO users (
              id, first_name, last_name, email, password, phone_number,
              type, role, gender, other_names, identification_number,
              birth_date, avatar, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              userData.id, userData.first_name, userData.last_name,
              userData.email, userData.password, userData.phone_number,
              userData.type, userData.role, userData.gender,
              userData.other_names, userData.identification_number,
              userData.birth_date, userData.avatar, userData.status
            ]
          );
          
          // Send notifications if enabled
          if (sendNotifications) {
            const userName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email;
            
            // Send email notification
            if (userData.email) {
              await EmailService.sendWelcomeEmail({
                email: userData.email,
                name: userName,
                password: password // Send the unhashed password
              });
            }
            
            // Send SMS notification if phone number is provided
            if (userData.phone_number) {
              await SMSService.sendWelcomeSMS({
                phoneNumber: userData.phone_number,
                email: userData.email,
                password: password // Send the unhashed password
              });
            }
          }
          
          results.success.push({
            id: userData.id,
            email: userData.email,
            password: sendNotifications ? password : undefined // Only include password if notifications were sent
          });
        } catch (error) {
          console.error(`Error creating user ${record.email}:`, error);
          results.failed.push({
            email: record.email,
            error: error.message
          });
        }
      }
      
      await conn.commit();
      
      return NextResponse.json({
        message: `Processed ${records.length} records. ${results.success.length} succeeded, ${results.failed.length} failed.`,
        results
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Batch user creation error:', error);
    return NextResponse.json(
      { message: 'Failed to process user batch', error: error.message },
      { status: 500 }
    );
  }
};

// Increase body size limit for file uploads
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '8mb',
  },
};