import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const constructorBases = pgTable('constructor_bases', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  pricePerKg: integer('price_per_kg').notNull(),
  /** Stable visual key used by the web model registry to choose a GLB variant. */
  visualKey: varchar('visual_key', { length: 64 }).notNull().default('default'),
  /** MinIO path to texture image. When set, overrides the color field for 3D rendering */
  textureUrl: text('texture_url'),
  /** Hex color code (#RRGGBB format, e.g. "#8B4513"). Used as fallback when textureUrl is null */
  color: varchar('color', { length: 7 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
