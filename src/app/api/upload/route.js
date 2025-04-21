export const config = {
  api: {
    bodyParser: false,
  },
};

import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import { uploadToS3 } from '@/utils/s3';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // Parse the multipart form data
    const data = await new Promise((resolve, reject) => {
      const form = new IncomingForm({
        keepExtensions: true,
        multiples: true,
      });
      
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const { files } = data;
    
    // If no file was uploaded
    if (!files.file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    // Get folder from request if provided, default to 'rtp'
    const folder = data.fields.folder?.[0] || 'rtp';
    
    // Generate unique filename with timestamp
    const fileExtension = file.originalFilename.split('.').pop();
    const uniqueFilename = `${Date.now()}-${file.originalFilename.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
    
    // Read file content
    const fileContent = await fs.readFile(file.filepath);
    
    // Upload to S3
    const fileUrl = await uploadToS3(
      fileContent,
      uniqueFilename,
      file.mimetype,
      folder
    );
    
    // Return the URL to the uploaded file
    return NextResponse.json({ 
      url: fileUrl,
      key: `${folder}/${uniqueFilename}`,
      filename: uniqueFilename,
      originalFilename: file.originalFilename,
      mimetype: file.mimetype,
      size: file.size
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'File upload failed', message: error.message },
      { status: 500 }
    );
  }
}