import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.AWS_S3_BUCKET || 'scrum-store-bucket',
  },
}));

