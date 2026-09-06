import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

export const S3_CLIENT = Symbol('S3_CLIENT');

export function crearS3Client(): S3Client {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
    throw new Error(
      'AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY deben configurarse juntas.',
    );
  }

  const config: S3ClientConfig = {
    region: process.env.AWS_REGION?.trim() || 'us-east-1',
  };

  if (accessKeyId && secretAccessKey) {
    config.credentials = {
      accessKeyId,
      secretAccessKey,
      sessionToken: process.env.AWS_SESSION_TOKEN?.trim() || undefined,
    };
  }

  return new S3Client(config);
}
