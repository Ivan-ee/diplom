import { pgTable, uuid, varchar, integer, text, timestamp, pgEnum, boolean, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { orders } from './orders';

export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'fixed']);

export const promoCodes = pgTable('promo_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  discountType: discountTypeEnum('discount_type').notNull(),
  /** Percentage (1-100) or fixed amount in kopecks */
  discountValue: integer('discount_value').notNull(),
  /** Minimum order amount in kopecks */
  minOrderAmount: integer('min_order_amount'),
  /** Maximum discount cap for percentage-based codes, in kopecks */
  maxDiscountAmount: integer('max_discount_amount'),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  /** Total usage limit across all users */
  usageLimit: integer('usage_limit'),
  /** Per-user usage limit */
  usageLimitPerUser: integer('usage_limit_per_user'),
  usageCount: integer('usage_count').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('promo_codes_code_idx').on(table.code),
  index('promo_codes_is_active_idx').on(table.isActive),
]);

export const promoCodeUsages = pgTable('promo_code_usages', {
  id: uuid('id').primaryKey().defaultRandom(),
  promoCodeId: uuid('promo_code_id')
    .notNull()
    .references(() => promoCodes.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id),
  /** Applied discount amount in kopecks */
  discountAmount: integer('discount_amount').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('promo_code_usages_promo_code_id_idx').on(table.promoCodeId),
  index('promo_code_usages_user_id_idx').on(table.userId),
  index('promo_code_usages_order_id_idx').on(table.orderId),
]);
