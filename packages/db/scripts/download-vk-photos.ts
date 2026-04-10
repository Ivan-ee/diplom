import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as Minio from 'minio';
import 'dotenv/config';

// Types
interface RawPhoto {
  cdnUrl: string;
  approxWidth: number;
}

interface MinioPhoto {
  minioUrl: string;
  width: number;
}

type CategoryPhotos = Record<string, RawPhoto[]>;
type CategoryMinioPhotos = Record<string, MinioPhoto[]>;

async function main() {
  const SEED_DIR = join(__dirname, '..', 'seed-data');

  // Read raw CDN URLs
  const raw: CategoryPhotos = JSON.parse(
    readFileSync(join(SEED_DIR, 'vk-photos-raw.json'), 'utf-8'),
  );

  // MinIO client
  const endpoint = process.env.MINIO_ENDPOINT ?? 'localhost';
  const port = parseInt(process.env.MINIO_PORT ?? '9000', 10);
  const accessKey =
    process.env.MINIO_ROOT_USER ?? process.env.MINIO_ACCESS_KEY ?? 'minioadmin';
  const secretKey =
    process.env.MINIO_ROOT_PASSWORD ?? process.env.MINIO_SECRET_KEY ?? 'minioadmin';
  const bucket = process.env.MINIO_BUCKET_PRODUCTS ?? 'products';
  const publicUrl = process.env.MINIO_PUBLIC_URL ?? `http://${endpoint}:${port}`;

  const minio = new Minio.Client({
    endPoint: endpoint,
    port,
    useSSL: false,
    accessKey,
    secretKey,
  });

  // Ensure bucket exists
  const exists = await minio.bucketExists(bucket);
  if (!exists) {
    await minio.makeBucket(bucket);
    console.log(`Created bucket: ${bucket}`);
  }

  // Set bucket policy to public read
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
  await minio.setBucketPolicy(bucket, JSON.stringify(policy));
  console.log(`Public read policy ensured on bucket: ${bucket}`);

  const result: CategoryMinioPhotos = {};
  let totalUploaded = 0;
  let totalFailed = 0;

  for (const [category, photos] of Object.entries(raw)) {
    result[category] = [];
    console.log(`\n--- ${category} (${photos.length} photos) ---`);

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const objectKey = `vk/${category}/${i}.jpg`;

      try {
        // Download from VK CDN
        const response = await fetch(photo.cdnUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        if (!response.ok) {
          console.error(
            `  [${i}] FAILED download: ${response.status} ${response.statusText} — ${photo.cdnUrl.slice(0, 80)}`,
          );
          totalFailed++;
          continue;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') ?? 'image/jpeg';

        // Upload to MinIO
        await minio.putObject(bucket, objectKey, buffer, buffer.length, {
          'Content-Type': contentType,
        });

        const minioUrl = `${publicUrl}/${bucket}/${objectKey}`;
        result[category].push({
          minioUrl,
          width: photo.approxWidth,
        });

        totalUploaded++;
        console.log(`  [${i}] OK → ${objectKey} (${(buffer.length / 1024).toFixed(0)} KB)`);

        // Rate limiting: 200ms between downloads
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`  [${i}] ERROR:`, (err as Error).message);
        totalFailed++;
      }
    }
  }

  // Write result (even partial — better than nothing)
  writeFileSync(
    join(SEED_DIR, 'vk-photos.json'),
    JSON.stringify(result, null, 2) + '\n',
    'utf-8',
  );

  console.log(`\n=== DONE ===`);
  console.log(`Uploaded: ${totalUploaded}, Failed: ${totalFailed}`);
  console.log(`Output: seed-data/vk-photos.json`);

  if (totalFailed > 0) {
    console.warn(`WARNING: ${totalFailed} photos failed — re-run or manually fix vk-photos.json`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
