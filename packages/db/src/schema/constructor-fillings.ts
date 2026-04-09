import { pgTable, uuid, varchar, text, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const fillingCategoryEnum = pgEnum('filling_category', [
  'white',
  'chocolate',
  'honey',
  'sour_cream',
  'shortcrust',
  'specialty',
]);

export const constructorFillings = pgTable('constructor_fillings', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  pricePerKg: integer('price_per_kg').notNull(),
  category: fillingCategoryEnum('category').notNull().default('specialty'),
  imageUrl: text('image_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
