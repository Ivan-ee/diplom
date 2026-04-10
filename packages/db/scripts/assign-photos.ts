import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface MinioPhoto {
  minioUrl: string;
  width: number;
}

interface Product {
  slug: string;
  imageKey: string;
  imageIndex: number;
  imageUrl?: string;
  images?: string[];
  [key: string]: unknown;
}

const SEED_DIR = join(__dirname, '..', 'seed-data');

// Load files
const photos: Record<string, MinioPhoto[]> = JSON.parse(
  readFileSync(join(SEED_DIR, 'vk-photos.json'), 'utf-8')
);
const products: Product[] = JSON.parse(
  readFileSync(join(SEED_DIR, 'products.json'), 'utf-8')
);

let assigned = 0;
let missing = 0;

for (const product of products) {
  const categoryPhotos = photos[product.imageKey];
  if (!categoryPhotos) {
    console.error(`No photos for category '${product.imageKey}' (product: ${product.slug})`);
    missing++;
    continue;
  }

  // Primary image from imageIndex
  const primaryIdx = product.imageIndex;
  if (primaryIdx < categoryPhotos.length) {
    product.imageUrl = categoryPhotos[primaryIdx].minioUrl;
  } else {
    // Fallback: wrap around
    product.imageUrl = categoryPhotos[primaryIdx % categoryPhotos.length].minioUrl;
    console.warn(`imageIndex ${primaryIdx} exceeds ${product.imageKey} photos (${categoryPhotos.length}), wrapped`);
  }

  // Additional images for gallery (up to 3 more from same category, cycling)
  const additionalCount = Math.min(3, categoryPhotos.length - 1);
  const additionalImages: string[] = [];
  for (let i = 1; i <= additionalCount; i++) {
    const idx = (primaryIdx + i) % categoryPhotos.length;
    additionalImages.push(categoryPhotos[idx].minioUrl);
  }
  product.images = additionalImages;

  assigned++;
  console.log(`${product.slug}: imageUrl=${product.imageUrl.split('/').pop()}, +${additionalImages.length} gallery`);
}

// Write back
writeFileSync(
  join(SEED_DIR, 'products.json'),
  JSON.stringify(products, null, 2) + '\n',
  'utf-8'
);

console.log(`\n=== DONE: ${assigned} assigned, ${missing} missing ===`);
if (missing > 0) process.exit(1);
