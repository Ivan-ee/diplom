import { z } from 'zod';
import { fillingCategoryEnum } from '../src/schema/constructor-fillings';
import { coatingTypeEnum } from '../src/schema/constructor-coatings';
import { decorCategoryEnum } from '../src/schema/constructor-decorations';

// Category
export const categorySchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
});
export type CategorySeed = z.infer<typeof categorySchema>;

// Occasion
export const occasionSchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
});
export type OccasionSeed = z.infer<typeof occasionSchema>;

// Constructor base
export const constructorBaseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  pricePerKg: z.number().int().positive(), // kopecks (₽ * 100)
  visualKey: z.string().min(1).max(64).default('default'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), // hex color #RRGGBB
  textureUrl: z.string().url().nullable(),
  sortOrder: z.number().int().nonnegative(),
  isAvailable: z.boolean().default(true),
});
export type ConstructorBaseSeed = z.infer<typeof constructorBaseSchema>;

// Constructor filling
export const fillingCategorySchema = z.enum(
  [...fillingCategoryEnum.enumValues] as [string, ...string[]]
);
export const constructorFillingSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  pricePerKg: z.number().int().positive(), // kopecks
  category: fillingCategorySchema,
  visualKey: z.string().min(1).max(64).default('cream'),
  sortOrder: z.number().int().nonnegative(),
  isAvailable: z.boolean().default(true),
});
export type ConstructorFillingSeed = z.infer<typeof constructorFillingSchema>;

// Constructor coating
export const coatingTypeSchema = z.enum(
  [...coatingTypeEnum.enumValues] as [string, ...string[]]
);
export const constructorCoatingSchema = z.object({
  name: z.string().min(1).max(100),
  type: coatingTypeSchema,
  pricePerKg: z.number().int().positive(), // kopecks
  visualKey: z.string().min(1).max(64).default('cream'),
  // numeric(3,2) in DB, stored as string in Drizzle (0.00 - 1.00)
  roughness: z.string()
    .regex(/^(0|1)(\.\d{1,2})?$/, 'roughness must be 0-1 with up to 2 decimals')
    .refine((v) => {
      const n = parseFloat(v);
      return n >= 0 && n <= 1;
    }, 'roughness must be in range 0.00-1.00'),
  sortOrder: z.number().int().nonnegative(),
  isAvailable: z.boolean().default(true),
});
export type ConstructorCoatingSeed = z.infer<typeof constructorCoatingSchema>;

// Constructor decoration
export const decorCategorySchema = z.enum(
  [...decorCategoryEnum.enumValues] as [string, ...string[]]
);
export const constructorDecorationSchema = z.object({
  name: z.string().min(1).max(100),
  category: decorCategorySchema,
  pricePerUnit: z.number().int().positive(), // kopecks per unit (штука)
  visualKey: z.string().min(1).max(64).default('cream'),
  modelUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  sortOrder: z.number().int().nonnegative(),
  isAvailable: z.boolean().default(true),
});
export type ConstructorDecorationSeed = z.infer<typeof constructorDecorationSchema>;

// Review
export const reviewSchema = z.object({
  authorName: z.string().min(1).max(100),
  text: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  isPublished: z.boolean().default(true),
});
export type ReviewSeed = z.infer<typeof reviewSchema>;

// Product
export const priceTypeSchema = z.enum(['per_kg', 'per_unit']);

export const productSchema = z.object({
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be lowercase ASCII alphanumeric with hyphens'),
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  composition: z.string().min(1),
  categorySlug: z.string().min(1), // resolved to categoryId at seed time
  occasionSlugs: z.array(z.string()).default([]),
  priceType: priceTypeSchema,
  pricePerKg: z.number().int().positive().nullable(), // kopecks; null for per_unit
  pricePerUnit: z.number().int().positive().nullable(), // kopecks; null for per_kg
  minWeight: z.string().regex(/^\d+(\.\d)?$/), // numeric(4,1) as string, e.g. "1.0", "2.5"
  maxWeight: z.string().regex(/^\d+(\.\d)?$/),
  weightStep: z.string().regex(/^\d+(\.\d)?$/),
  photoPath: z.string().min(1),            // relative path e.g. "wedding/0.jpg"
  galleryPaths: z.array(z.string()).default([]), // relative paths for gallery
  isAvailable: z.boolean().default(true),
}).refine(
  (p) => {
    if (p.priceType === 'per_kg') return p.pricePerKg !== null && p.pricePerUnit === null;
    if (p.priceType === 'per_unit') return p.pricePerUnit !== null && p.pricePerKg === null;
    return false;
  },
  { message: 'price type must match populated price field' }
);

export type ProductSeed = z.infer<typeof productSchema>;

// Full seed dataset
export const seedDatasetSchema = z.object({
  categories: z.array(categorySchema),
  occasions: z.array(occasionSchema),
  bases: z.array(constructorBaseSchema),
  fillings: z.array(constructorFillingSchema),
  coatings: z.array(constructorCoatingSchema),
  decorations: z.array(constructorDecorationSchema),
  reviews: z.array(reviewSchema),
  products: z.array(productSchema),
});
export type SeedDataset = z.infer<typeof seedDatasetSchema>;
