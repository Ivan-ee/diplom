import { describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UploadService } from '../upload.service';

// ---------------------------------------------------------------------------
// MinIO mock — vi.hoisted ensures the instance is available before vi.mock hoisting
// ---------------------------------------------------------------------------

const minioClientInstance = vi.hoisted(() => ({
  presignedPutObject: vi.fn().mockResolvedValue('https://minio.test/presigned-url'),
  bucketExists: vi.fn().mockResolvedValue(true),
  makeBucket: vi.fn(),
}));

vi.mock('minio', () => ({
  Client: function Client() {
    return minioClientInstance;
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MINIO_PUBLIC_URL = 'http://localhost:9000';

function makeConfigService(overrides: Record<string, string | number> = {}): Partial<ConfigService> {
  const defaults: Record<string, string | number> = {
    MINIO_ENDPOINT: 'localhost',
    MINIO_PORT: 9000,
    MINIO_USE_SSL: 'false',
    MINIO_ACCESS_KEY: 'minioadmin',
    MINIO_SECRET_KEY: 'minioadmin',
    MINIO_PUBLIC_URL,
    ...overrides,
  };

  return {
    getOrThrow: vi.fn().mockImplementation((key: string) => {
      if (key in defaults) return defaults[key];
      throw new Error(`Config key not found: ${key}`);
    }),
    get: vi.fn().mockImplementation((key: string, defaultValue?: unknown) => {
      return key in defaults ? defaults[key] : defaultValue;
    }),
  };
}

async function buildService(configOverrides: Record<string, string | number> = {}): Promise<UploadService> {
  const module = await Test.createTestingModule({
    providers: [
      UploadService,
      { provide: ConfigService, useValue: makeConfigService(configOverrides) },
    ],
  }).compile();

  const service = module.get<UploadService>(UploadService);
  await service.onModuleInit();
  return service;
}

// ---------------------------------------------------------------------------
// UploadService.presignUrl
// ---------------------------------------------------------------------------

describe('UploadService.presignUrl', () => {
  it('returns correct shape for bucket "products"', async () => {
    const service = await buildService();

    const result = await service.presignUrl({ filename: 'cake.jpg', bucket: 'products' });

    expect(result).toHaveProperty('uploadUrl');
    expect(result).toHaveProperty('fileUrl');
    expect(result).toHaveProperty('objectName');
    expect(result.bucket).toBe('products');
    expect(result.expiresIn).toBe(900);
  });

  it('defaults bucket to "screenshots" when bucket is omitted', async () => {
    const service = await buildService();

    const result = await service.presignUrl({ filename: 'test.png' });

    expect(result.bucket).toBe('screenshots');
  });

  it('fileUrl has format {publicUrl}/{bucket}/{uuid}.{ext}', async () => {
    const service = await buildService();

    const result = await service.presignUrl({ filename: 'cake.jpg', bucket: 'products' });

    // Format: http://localhost:9000/products/<uuid>.jpg
    const urlPattern = /^http:\/\/localhost:9000\/products\/[0-9a-f-]{36}\.jpg$/;
    expect(result.fileUrl).toMatch(urlPattern);
    // objectName embedded in fileUrl matches result.objectName
    expect(result.fileUrl).toContain(result.objectName);
  });
});
