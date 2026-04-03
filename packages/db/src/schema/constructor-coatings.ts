import { pgTable, uuid, varchar, integer, numeric, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const coatingTypeEnum = pgEnum('coating_type', ['cream', 'fondant']);

export const constructorCoatings = pgTable('constructor_coatings', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  type: coatingTypeEnum('type').notNull(),
  pricePerKg: integer('price_per_kg').notNull(),
  roughness: numeric('roughness', { precision: 3, scale: 2 }).notNull().default('0.40'),
  sortOrder: integer('sort_order').notNull().default(0),
  isAvailable: boolean('is_available').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
