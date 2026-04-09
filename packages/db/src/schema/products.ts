import { pgTable, uuid, varchar, text, integer, numeric, boolean, timestamp, json, index, pgEnum } from 'drizzle-orm/pg-core';
import { categories } from './categories';

export const priceTypeEnum = pgEnum('price_type', ['per_kg', 'per_unit']);

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  composition: text('composition'),
  imageUrl: text('image_url'),
  images: json('images').$type<string[]>().default([]),
  priceType: priceTypeEnum('price_type').notNull().default('per_kg'),
  pricePerKg: integer('price_per_kg'),
  pricePerUnit: integer('price_per_unit'),
  minWeight: numeric('min_weight', { precision: 4, scale: 1 }).notNull().default('1.0'),
  maxWeight: numeric('max_weight', { precision: 4, scale: 1 }).notNull().default('5.0'),
  weightStep: numeric('weight_step', { precision: 3, scale: 1 }).notNull().default('0.5'),
  categoryId: uuid('category_id').references(() => categories.id),
  isAvailable: boolean('is_available').notNull().default(true),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('products_category_id_idx').on(table.categoryId),
  index('products_is_available_idx').on(table.isAvailable),
]);
