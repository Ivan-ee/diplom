/**
 * Converts a relative photo path to a full MinIO URL.
 * Used by seed.ts to generate imageUrl/images from photoPath/galleryPaths.
 *
 * @example buildImageUrl("wedding/0.jpg", "http://localhost:9000", "products")
 * // → "http://localhost:9000/products/vk/wedding/0.jpg"
 */
export function buildImageUrl(
  photoPath: string,
  minioBase: string,
  bucket: string,
): string {
  const base = minioBase.replace(/\/+$/, '');
  return `${base}/${bucket}/vk/${photoPath}`;
}
