import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { PresignDto } from './dto/presign.dto';

const PRESIGN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
const PUBLIC_READ_BUCKETS = ['screenshots', 'products', 'models'] as const;

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private client!: Minio.Client;
  private publicUrl!: string;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.client = new Minio.Client({
      endPoint: this.config.getOrThrow<string>('MINIO_ENDPOINT'),
      port: this.config.get<number>('MINIO_PORT', 9000),
      useSSL: this.config.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.config.getOrThrow<string>('MINIO_ACCESS_KEY'),
      secretKey: this.config.getOrThrow<string>('MINIO_SECRET_KEY'),
    });

    this.publicUrl = this.config.get<string>(
      'MINIO_PUBLIC_URL',
      'http://localhost:9000',
    );

    for (const bucket of PUBLIC_READ_BUCKETS) {
      await this.ensureBucketExists(bucket);
      await this.ensurePublicReadPolicy(bucket);
    }
  }

  async presignUrl(dto: PresignDto): Promise<{
    uploadUrl: string;
    fileUrl: string;
    objectName: string;
    bucket: string;
    expiresIn: number;
  }> {
    const bucket = dto.bucket ?? 'screenshots';
    const ext = extname(dto.filename) || '';
    const objectName = `${randomUUID()}${ext}`;

    let uploadUrl: string;
    try {
      uploadUrl = await this.client.presignedPutObject(
        bucket,
        objectName,
        PRESIGN_EXPIRY_SECONDS,
      );
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error('MinIO presign failed', { bucket, objectName, error: error.message });
      throw new InternalServerErrorException('Failed to generate upload URL');
    }

    const fileUrl = `${this.publicUrl}/${bucket}/${objectName}`;

    return {
      uploadUrl,
      fileUrl,
      objectName,
      bucket,
      expiresIn: PRESIGN_EXPIRY_SECONDS,
    };
  }

  private async ensureBucketExists(bucket: string): Promise<void> {
    const exists = await this.client.bucketExists(bucket);
    if (!exists) {
      this.logger.warn('Bucket does not exist, creating', { bucket });
      await this.client.makeBucket(bucket, 'us-east-1');
    }
  }

  private async ensurePublicReadPolicy(bucket: string): Promise<void> {
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    });

    try {
      await this.client.setBucketPolicy(bucket, policy);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error('MinIO public-read policy setup failed', {
        bucket,
        error: error.message,
      });
      throw new InternalServerErrorException('Failed to configure upload bucket');
    }
  }
}
