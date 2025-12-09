import { registerAs } from '@nestjs/config';

export default registerAs('s3', () => ({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || process.env.S3_REGION || 'us-east-1',
  bucket: process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME || process.env.PARENT_DOCUMENTS_BUCKET || process.env.S3_BUCKET,
}));
