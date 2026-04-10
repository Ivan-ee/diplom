import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env') });

import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { hash } from 'bcrypt';
import { sql, notInArray } from 'drizzle-orm';
import * as schema from './schema/index';
import {
  categorySchema,
  occasionSchema,
  constructorBaseSchema,
  constructorFillingSchema,
  constructorCoatingSchema,
  constructorDecorationSchema,
  reviewSchema,
  productSchema,
} from '../seed-data/schemas';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadJson<T>(schema: z.ZodType<T>, relativePath: string): T {
  const filePath = resolve(dirname(fileURLToPath(import.meta.url)), '..', relativePath);
  const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as unknown;
  const result = z.array(schema).safeParse(raw);
  if (!result.success) {
    throw new Error(`Validation failed for ${relativePath}:\n${result.error.toString()}`);
  }
  return result.data as T;
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  // ── Admin password guard ─────────────────────────────────────────────────
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD env var must be set in production');
  }

  console.log('🌱 Loading JSON seed data...');

  // ── Load & validate JSON files ───────────────────────────────────────────
  const categoriesData  = loadJson(categorySchema,              'seed-data/categories.json');
  const occasionsData   = loadJson(occasionSchema,              'seed-data/occasions.json');
  const basesData       = loadJson(constructorBaseSchema,       'seed-data/constructor-bases.json');
  const fillingsData    = loadJson(constructorFillingSchema,    'seed-data/constructor-fillings.json');
  const coatingsData    = loadJson(constructorCoatingSchema,    'seed-data/constructor-coatings.json');
  const decorationsData = loadJson(constructorDecorationSchema, 'seed-data/constructor-decorations.json');
  const reviewsData     = loadJson(reviewSchema,                'seed-data/reviews.json');
  const productsData    = loadJson(productSchema,               'seed-data/products.json');

  console.log('✓ JSON validated — starting transaction');

  await db.transaction(async (tx) => {
    // ── 1. Categories ──────────────────────────────────────────────────────
    const insertedCategories = await tx
      .insert(schema.categories)
      .values(categoriesData.map((c) => ({ slug: c.slug, name: c.name })))
      .onConflictDoUpdate({
        target: schema.categories.slug,
        set: { name: sql`excluded.name` },
      })
      .returning({ id: schema.categories.id, slug: schema.categories.slug });

    const categoryMap = new Map(insertedCategories.map((c) => [c.slug, c.id]));
    console.log(`✓ ${insertedCategories.length} categories upserted`);

    // ── 2. Occasions ───────────────────────────────────────────────────────
    const insertedOccasions = await tx
      .insert(schema.occasions)
      .values(occasionsData.map((o) => ({ slug: o.slug, name: o.name })))
      .onConflictDoUpdate({
        target: schema.occasions.slug,
        set: { name: sql`excluded.name` },
      })
      .returning({ id: schema.occasions.id, slug: schema.occasions.slug });

    const occasionMap = new Map(insertedOccasions.map((o) => [o.slug, o.id]));
    console.log(`✓ ${insertedOccasions.length} occasions upserted`);

    // ── 3. Constructor bases (no unique on name → delete+re-insert) ────────
    await tx.delete(schema.constructorBases);
    const insertedBases = await tx
      .insert(schema.constructorBases)
      .values(
        basesData.map((b) => ({
          name:        b.name,
          description: b.description,
          pricePerKg:  b.pricePerKg,
          color:       b.color,
          textureUrl:  b.textureUrl,
          sortOrder:   b.sortOrder,
          isAvailable: b.isAvailable,
        })),
      )
      .returning({ id: schema.constructorBases.id });

    console.log(`✓ ${insertedBases.length} constructor bases`);

    // ── 4. Constructor fillings (no unique on name → delete+re-insert) ─────
    await tx.delete(schema.constructorFillings);
    const insertedFillings = await tx
      .insert(schema.constructorFillings)
      .values(
        fillingsData.map((f) => ({
          name:        f.name,
          description: f.description,
          pricePerKg:  f.pricePerKg,
          category:    f.category as typeof schema.constructorFillings.$inferInsert['category'],
          sortOrder:   f.sortOrder,
          isAvailable: f.isAvailable,
        })),
      )
      .returning({ id: schema.constructorFillings.id });

    console.log(`✓ ${insertedFillings.length} constructor fillings`);

    // ── 5. Constructor coatings (no unique on name → delete+re-insert) ─────
    await tx.delete(schema.constructorCoatings);
    const insertedCoatings = await tx
      .insert(schema.constructorCoatings)
      .values(
        coatingsData.map((c) => ({
          name:        c.name,
          type:        c.type as typeof schema.constructorCoatings.$inferInsert['type'],
          pricePerKg:  c.pricePerKg,
          roughness:   c.roughness,
          sortOrder:   c.sortOrder,
          isAvailable: c.isAvailable,
        })),
      )
      .returning({ id: schema.constructorCoatings.id });

    console.log(`✓ ${insertedCoatings.length} constructor coatings`);

    // ── 6. Constructor decorations (no unique on name → delete+re-insert) ──
    await tx.delete(schema.constructorDecorations);
    const insertedDecorations = await tx
      .insert(schema.constructorDecorations)
      .values(
        decorationsData.map((d) => ({
          name:         d.name,
          category:     d.category as typeof schema.constructorDecorations.$inferInsert['category'],
          pricePerUnit: d.pricePerUnit,
          modelUrl:     d.modelUrl,
          thumbnailUrl: d.thumbnailUrl,
          sortOrder:    d.sortOrder,
          isAvailable:  d.isAvailable,
        })),
      )
      .returning({ id: schema.constructorDecorations.id });

    console.log(`✓ ${insertedDecorations.length} constructor decorations`);

    // ── 7. Products ────────────────────────────────────────────────────────
    const productRows = productsData.map((p) => {
      const categoryId = categoryMap.get(p.categorySlug);
      if (!categoryId) {
        throw new Error(`Unknown categorySlug "${p.categorySlug}" for product "${p.slug}"`);
      }

      return {
        slug:        p.slug,
        name:        p.name,
        description: p.description,
        composition: p.composition,
        imageUrl:    p.imageUrl ?? null,
        images:      p.images ?? [],
        priceType:   p.priceType as typeof schema.products.$inferInsert['priceType'],
        pricePerKg:  p.priceType === 'per_kg'   ? p.pricePerKg   : null,
        pricePerUnit: p.priceType === 'per_unit' ? p.pricePerUnit : null,
        minWeight:   p.minWeight,
        maxWeight:   p.maxWeight,
        weightStep:  p.weightStep,
        categoryId,
        isAvailable: p.isAvailable,
        isDeleted:   false,
      };
    });

    const insertedProducts = await tx
      .insert(schema.products)
      .values(productRows)
      .onConflictDoUpdate({
        target: schema.products.slug,
        set: {
          name:         sql`excluded.name`,
          description:  sql`excluded.description`,
          composition:  sql`excluded.composition`,
          imageUrl:     sql`excluded.image_url`,
          images:       sql`excluded.images`,
          priceType:    sql`excluded.price_type`,
          pricePerKg:   sql`excluded.price_per_kg`,
          pricePerUnit: sql`excluded.price_per_unit`,
          minWeight:    sql`excluded.min_weight`,
          maxWeight:    sql`excluded.max_weight`,
          weightStep:   sql`excluded.weight_step`,
          categoryId:   sql`excluded.category_id`,
          isAvailable:  sql`excluded.is_available`,
          isDeleted:    sql`false`,
          updatedAt:    sql`now()`,
        },
      })
      .returning({ id: schema.products.id, slug: schema.products.slug });

    const productIdMap = new Map(insertedProducts.map((p) => [p.slug, p.id]));
    console.log(`✓ ${insertedProducts.length} products`);

    // ── 8. Product-occasions junction ──────────────────────────────────────
    const junctionRows: { productId: string; occasionId: string }[] = [];

    for (const p of productsData) {
      const productId = productIdMap.get(p.slug);
      if (!productId) continue;

      for (const occSlug of p.occasionSlugs ?? []) {
        const occasionId = occasionMap.get(occSlug);
        if (!occasionId) {
          throw new Error(`Unknown occasionSlug "${occSlug}" for product "${p.slug}"`);
        }
        junctionRows.push({ productId, occasionId });
      }
    }

    if (junctionRows.length > 0) {
      await tx
        .insert(schema.productOccasions)
        .values(junctionRows)
        .onConflictDoNothing();
    }
    console.log(`✓ ${junctionRows.length} product-occasion links`);

    // ── 9. Remove stale products (hard-delete — no orders on a seed DB) ──────
    // Must hard-delete so the FK from products.category_id is released,
    // allowing stale categories to be cleaned up in the next step.
    const newSlugs = productsData.map((p) => p.slug);
    await tx
      .delete(schema.products)
      .where(notInArray(schema.products.slug, newSlugs));

    // ── 9b. Remove stale categories and occasions ──────────────────────────
    // Safe now: no products reference the stale category rows.
    // product_occasions rows for stale occasions are cascade-deleted by the DB.
    const newCategorySlugs = categoriesData.map((c) => c.slug);
    await tx
      .delete(schema.categories)
      .where(notInArray(schema.categories.slug, newCategorySlugs));

    const newOccasionSlugs = occasionsData.map((o) => o.slug);
    await tx
      .delete(schema.occasions)
      .where(notInArray(schema.occasions.slug, newOccasionSlugs));

    console.log(`✓ ${insertedCategories.length} categories`);
    console.log(`✓ ${insertedOccasions.length} occasions`);

    // ── 10. Users ──────────────────────────────────────────────────────────
    const testPasswordHash = await hash('test123', 10);
    await tx
      .insert(schema.users)
      .values({
        name:         'Тестовый покупатель',
        email:        'test@bakery.ru',
        phone:        '+79009876543',
        passwordHash: testPasswordHash,
        role:         'user',
      })
      .onConflictDoNothing();
    console.log('✓ test user (test@bakery.ru / test123)');

    const adminPasswordHash = await hash(adminPassword, 10);
    await tx
      .insert(schema.users)
      .values({
        name:         'Администратор',
        email:        'admin@bakery.ru',
        phone:        '+79001234567',
        passwordHash: adminPasswordHash,
        role:         'admin',
      })
      .onConflictDoNothing();
    console.log('✓ admin user (admin@bakery.ru)');

    // ── 11. Reviews — clear and re-insert (no unique key) ─────────────────
    await tx.delete(schema.reviews);
    await tx
      .insert(schema.reviews)
      .values(
        reviewsData.map((r) => ({
          authorName:  r.authorName,
          text:        r.text,
          rating:      r.rating,
          isPublished: r.isPublished,
        })),
      );
    console.log(`✓ ${reviewsData.length} reviews`);
  });

  console.log('\n🎉 Seeding complete!');
  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
