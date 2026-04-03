import { pgTable, uuid, varchar, text, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const decorCategoryEnum = pgEnum('decor_category', [
  'berries',
  'chocolate',
  'toppers',
  'flowers',
  'figures',
]);

export const constructorDecorations = pgTable('constructor_decorations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  category: decorCategoryEnum('category').notNull(),
  pricePerUnit: integer('price_per_unit').notNull(),
  modelUrl: text('model_url'),
  thumbnailUrl: text('thumbnail_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
