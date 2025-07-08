import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// Configure S3 client from environment variables
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET;

/**
 * Downloads a resume file from S3 by resumeId.
 * @param {string} resumeId - The resume ID (e.g., "12345")
 * @returns {Promise<string>} - Local file path to the downloaded resume
 */
export async function getResumeFileFromS3(resumeId) {
  if (!BUCKET) throw new Error('AWS_S3_BUCKET not set');
  if (!resumeId) throw new Error('resumeId is required');

  // S3 key format: resume_id.pdf
  const s3Key = `resume_${resumeId}.pdf`;
  const localPath = path.join('/tmp', `resume_${resumeId}.pdf`);
  
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
  });

  try {
    const data = await s3.send(command);
    const writeStream = fs.createWriteStream(localPath);
    await new Promise((resolve, reject) => {
      data.Body.pipe(writeStream);
      data.Body.on('error', reject);
      writeStream.on('finish', resolve);
    });
    return localPath;
  } catch (err) {
    // TODO: Add better error handling/logging
    throw new Error(`Failed to download resume from S3: ${err.message}`);
  }
} 