import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { config } from 'dotenv';
import * as Minio from 'minio';
import { z } from 'zod';
import { productSchema } from '../seed-data/schemas';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dbPackageDir = resolve(scriptDir, '..');
const repoRoot = resolve(dbPackageDir, '..', '..');

config({ path: resolve(repoRoot, '.env') });

const photosDir = resolve(dbPackageDir, 'seed-data', 'photos');
const productsPath = resolve(dbPackageDir, 'seed-data', 'products.json');
const modelsDir = resolve(repoRoot, 'apps', 'web', 'public', 'models');

const productSeedSchema = z.array(productSchema);
const windowsDrivePathPattern = /^[A-Za-z]:\//;

interface SeedAssetValidationResult {
  readonly productCount: number;
  readonly referencedPhotoCount: number;
  readonly modelCount: number;
}

interface AssetFile {
  readonly filePath: string;
  readonly objectKey: string;
  readonly contentType: string;
}

interface MinioSettings {
  readonly endpoint: string;
  readonly port: number;
  readonly accessKey: string;
  readonly secretKey: string;
  readonly productsBucket: string;
  readonly modelsBucket: string;
}

function toObjectKey(path: string): string {
  return path.split(sep).join('/');
}

export function assertSafeSeedAssetPath(assetPath: string): string {
  if (assetPath.length === 0) {
    throw new Error('Seed asset path must not be empty');
  }

  if (assetPath.includes('\0')) {
    throw new Error(`Seed asset path contains a null byte: ${assetPath}`);
  }

  if (assetPath.includes('\\')) {
    throw new Error(`Seed asset path must use POSIX "/" separators: ${assetPath}`);
  }

  if (posix.isAbsolute(assetPath) || windowsDrivePathPattern.test(assetPath)) {
    throw new Error(`Seed asset path must be relative: ${assetPath}`);
  }

  const normalized = posix.normalize(assetPath);
  const segments = assetPath.split('/');
  const hasUnsafeSegment = segments.some((segment) => segment === '' || segment === '.' || segment === '..');

  if (normalized !== assetPath || hasUnsafeSegment) {
    throw new Error(`Seed asset path must be canonical and stay inside seed-data/photos: ${assetPath}`);
  }

  return assetPath;
}

function contentTypeFor(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.glb') return 'model/gltf-binary';
  return 'application/octet-stream';
}

function collectFiles(rootDir: string, allowedExtensions: readonly string[]): AssetFile[] {
  if (!existsSync(rootDir)) return [];

  const files: AssetFile[] = [];
  const walk = (dir: string): void => {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      const ext = extname(entry.name).toLowerCase();
      if (!allowedExtensions.includes(ext)) continue;

      files.push({
        filePath: absolutePath,
        objectKey: toObjectKey(relative(rootDir, absolutePath)),
        contentType: contentTypeFor(absolutePath),
      });
    }
  };

  walk(rootDir);
  return files.sort((a, b) => a.objectKey.localeCompare(b.objectKey));
}

function loadProducts(): z.infer<typeof productSeedSchema> {
  const raw = JSON.parse(readFileSync(productsPath, 'utf-8')) as unknown;
  const parsed = productSeedSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Product seed validation failed:\n${parsed.error.toString()}`);
  }
  return parsed.data;
}

export function validateSeedAssets(): SeedAssetValidationResult {
  const products = loadProducts();
  const missingPhotos: string[] = [];
  const referencedPhotos = new Set<string>();

  for (const product of products) {
    referencedPhotos.add(assertSafeSeedAssetPath(product.photoPath));
    for (const galleryPath of product.galleryPaths ?? []) {
      referencedPhotos.add(assertSafeSeedAssetPath(galleryPath));
    }
  }

  for (const photoPath of referencedPhotos) {
    const absolutePath = resolve(photosDir, photoPath);
    if (!existsSync(absolutePath)) {
      missingPhotos.push(photoPath);
    }
  }

  const models = collectFiles(modelsDir, ['.glb']);

  if (missingPhotos.length > 0) {
    throw new Error(`Missing product seed photos:\n${missingPhotos.join('\n')}`);
  }

  if (models.length === 0) {
    throw new Error(`No constructor .glb models found in ${modelsDir}`);
  }

  return {
    productCount: products.length,
    referencedPhotoCount: referencedPhotos.size,
    modelCount: models.length,
  };
}

function minioSettings(): MinioSettings {
  return {
    endpoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: Number.parseInt(process.env.MINIO_PORT ?? '9000', 10),
    accessKey:
      process.env.MINIO_ROOT_USER ??
      process.env.MINIO_ACCESS_KEY ??
      'minioadmin',
    secretKey:
      process.env.MINIO_ROOT_PASSWORD ??
      process.env.MINIO_SECRET_KEY ??
      'minioadmin',
    productsBucket: process.env.MINIO_BUCKET_PRODUCTS ?? 'products',
    modelsBucket: process.env.MINIO_BUCKET_MODELS ?? 'models',
  };
}

function createMinioClient(settings: MinioSettings): Minio.Client {
  return new Minio.Client({
    endPoint: settings.endpoint,
    port: settings.port,
    useSSL: false,
    accessKey: settings.accessKey,
    secretKey: settings.secretKey,
  });
}

async function ensurePublicBucket(client: Minio.Client, bucket: string): Promise<void> {
  const exists = await client.bucketExists(bucket);
  if (!exists) {
    await client.makeBucket(bucket);
    console.log(`Created bucket: ${bucket}`);
  }

  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  };

  await client.setBucketPolicy(bucket, JSON.stringify(policy));
  console.log(`Public read policy ensured on bucket: ${bucket}`);
}

async function uploadFiles(
  client: Minio.Client,
  bucket: string,
  files: readonly AssetFile[],
  keyPrefix = '',
): Promise<void> {
  let uploaded = 0;

  for (const file of files) {
    const size = statSync(file.filePath).size;
    const objectKey = `${keyPrefix}${file.objectKey}`;
    await client.putObject(bucket, objectKey, createReadStream(file.filePath), size, {
      'Content-Type': file.contentType,
    });
    uploaded++;
  }

  console.log(`Uploaded ${uploaded} files to ${bucket}`);
}

async function uploadSeedAssets(): Promise<void> {
  const validation = validateSeedAssets();
  console.log(
    `Validated ${validation.productCount} products, ` +
      `${validation.referencedPhotoCount} referenced photos, ` +
      `${validation.modelCount} constructor models`,
  );

  const settings = minioSettings();
  const client = createMinioClient(settings);

  await ensurePublicBucket(client, settings.productsBucket);
  await ensurePublicBucket(client, settings.modelsBucket);

  const photos = collectFiles(photosDir, ['.jpg', '.jpeg', '.png', '.webp']);
  const models = collectFiles(modelsDir, ['.glb']);

  await uploadFiles(client, settings.productsBucket, photos, 'vk/');
  await uploadFiles(client, settings.modelsBucket, models);
}

async function main(): Promise<void> {
  const isValidateOnly = process.argv.includes('--validate-only');

  if (isValidateOnly) {
    const validation = validateSeedAssets();
    console.log(
      `Seed assets valid: ${validation.productCount} products, ` +
        `${validation.referencedPhotoCount} referenced photos, ` +
        `${validation.modelCount} constructor models`,
    );
    return;
  }

  await uploadSeedAssets();
}

function isDirectExecution(): boolean {
  const entrypoint = process.argv[1];
  return entrypoint !== undefined && import.meta.url === pathToFileURL(resolve(entrypoint)).href;
}

if (isDirectExecution()) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Seed asset upload failed:', message);
    process.exit(1);
  });
}
