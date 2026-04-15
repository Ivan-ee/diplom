import { readdirSync, createReadStream, statSync } from 'node:fs';
import { join } from 'node:path';
import * as Minio from 'minio';
import 'dotenv/config';

async function main() {
  const PHOTOS_DIR = join(__dirname, '..', 'seed-data', 'photos');

  // MinIO client
  const endpoint = process.env.MINIO_ENDPOINT ?? 'localhost';
  const port = parseInt(process.env.MINIO_PORT ?? '9000', 10);
  const accessKey =
    process.env.MINIO_ROOT_USER ?? process.env.MINIO_ACCESS_KEY ?? 'minioadmin';
  const secretKey =
    process.env.MINIO_ROOT_PASSWORD ?? process.env.MINIO_SECRET_KEY ?? 'minioadmin';
  const bucket = process.env.MINIO_BUCKET_PRODUCTS ?? 'products';

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

  let totalUploaded = 0;
  let totalFailed = 0;

  // Recursively walk seed-data/photos/{category}/{N}.jpg
  const categories = readdirSync(PHOTOS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const category of categories) {
    const categoryDir = join(PHOTOS_DIR, category);
    const files = readdirSync(categoryDir).filter((f) => f.endsWith('.jpg'));

    console.log(`\n--- ${category} (${files.length} photos) ---`);

    for (const filename of files) {
      const filePath = join(categoryDir, filename);
      const objectKey = `vk/${category}/${filename}`;

      try {
        const { size } = statSync(filePath);
        const stream = createReadStream(filePath);

        await minio.putObject(bucket, objectKey, stream, size, {
          'Content-Type': 'image/jpeg',
        });

        totalUploaded++;
        console.log(`  OK → ${objectKey} (${(size / 1024).toFixed(0)} KB)`);
      } catch (err) {
        console.error(`  FAIL → ${objectKey}: ${(err as Error).message}`);
        totalFailed++;
      }
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Uploaded: ${totalUploaded}, Failed: ${totalFailed}`);

  if (totalFailed > 0) {
    console.warn(`WARNING: ${totalFailed} photos failed — re-run the script to retry`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
