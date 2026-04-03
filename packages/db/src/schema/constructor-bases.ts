import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const constructorBases = pgTable('constructor_bases', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  pricePerKg: integer('price_per_kg').notNull(),
  textureUrl: text('texture_url'),
  color: varchar('color', { length: 7 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
