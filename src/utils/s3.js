// S3 Storage Service for AWS
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.AWS_BUCKET;

/**
 * Upload a file to S3
 * @param {Buffer} fileContent - File content as buffer
 * @param {string} fileName - Name to save the file as
 * @param {string} contentType - MIME type of the file
 * @param {string} folder - Optional folder path (without trailing slash)
 * @returns {Promise<string>} - URL of the uploaded file
 */
export async function uploadToS3(fileContent, fileName, contentType, folder = 'rtp') {
  const key = folder ? `${folder}/${fileName}` : fileName;
  
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return `${process.env.AWS_URL}${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

/**
 * Generate pre-signed URL for downloading a file
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiry time in seconds
 * @returns {Promise<string>} - Pre-signed URL
 */
export async function getS3DownloadUrl(key, expiresIn = 3600) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    const command = new GetObjectCommand(params);
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    throw error;
  }
}

/**
 * Delete a file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
export async function deleteFromS3(key) {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw error;
  }
}